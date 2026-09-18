import { parseCookie, getUserBySessionToken } from '@/lib/serverAuth';
import { evaluatePromotion } from '@/lib/promotions';
import { sendEmail } from '@/lib/email';
import { sendSms } from '@/lib/sms';
import { pool } from '@/lib/db';
import { ensureDbInitialized } from '@/lib/dbInit';
import { emitRealtimeEvent } from '@/lib/realtime';
import { invalidateApiCacheByPrefix } from '@/lib/apiCache';

const SESSION_COOKIE = 'wf_session';

type CheckoutItemInput = {
  id: number;
  name: string;
  price: string;
  quantity: number;
  variationKey?: string;
  variationLabel?: string;
};

type CheckoutPayload = {
  fullName: string;
  phone: string;
  email?: string;
  address: string;
  city: string;
  notes?: string;
  paymentMethod: 'cash' | 'mobile-money' | 'card' | 'paystack';
  subtotal: number;
  delivery: number;
  total: number;
  promoCode?: string | null;
  paymentReference?: string;
  items: CheckoutItemInput[];
  paymentCompleted?: boolean;
};

type VariationSelection = {
  name: string;
  option: string;
};

type VariationRequest = {
  productId: number;
  name: string;
  option: string;
  quantity: number;
};

type ProductInventoryRow = {
  id: number;
  stock: number | null;
  hasVariations: boolean;
  variations: unknown;
};

type PaystackVerifyResponse = {
  status?: boolean;
  data?: {
    status?: string;
    amount?: number;
    currency?: string;
    reference?: string;
  };
};

const isValidPhone = (value: string) => /^0\d{9}$/.test(value);

const parsePrice = (value: string) => {
  const numeric = Number(String(value).replace(/[^0-9.]/g, ''));
  return Number.isFinite(numeric) ? numeric : 0;
};

const roundCurrency = (value: number) => Math.round(Math.max(0, value) * 100) / 100;

type SmsTemplates = {
  smsOrderConfirmationTemplate: string;
  smsOrderStatusTemplate: string;
  smsNewOrderAdminTemplate: string;
};

const DEFAULT_SMS_TEMPLATES: SmsTemplates = {
  smsOrderConfirmationTemplate:
    'Zhilakaii: Order {orderNumber} confirmed. Payment received. Total GHc{total}. We will notify you when status changes.',
  smsOrderStatusTemplate: 'Zhilakaii: Your order {orderNumber} status is now {status}.',
  smsNewOrderAdminTemplate:
    'Zhilakaii: New paid order {orderNumber} from {customerName} ({city}). Total GHc{total}.',
};

function applySmsTemplate(template: string, values: Record<string, string>) {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? '');
}

async function loadSmsTemplates(): Promise<SmsTemplates> {
  try {
    const result = await pool.query('SELECT value FROM "AdminSetting" WHERE key = $1 LIMIT 1', ['global']);
    if (result.rows.length === 0) return DEFAULT_SMS_TEMPLATES;

    const raw = result.rows[0].value as Partial<SmsTemplates>;
    return {
      smsOrderConfirmationTemplate:
        typeof raw.smsOrderConfirmationTemplate === 'string' && raw.smsOrderConfirmationTemplate.trim()
          ? raw.smsOrderConfirmationTemplate.trim()
          : DEFAULT_SMS_TEMPLATES.smsOrderConfirmationTemplate,
      smsOrderStatusTemplate:
        typeof raw.smsOrderStatusTemplate === 'string' && raw.smsOrderStatusTemplate.trim()
          ? raw.smsOrderStatusTemplate.trim()
          : DEFAULT_SMS_TEMPLATES.smsOrderStatusTemplate,
      smsNewOrderAdminTemplate:
        typeof raw.smsNewOrderAdminTemplate === 'string' && raw.smsNewOrderAdminTemplate.trim()
          ? raw.smsNewOrderAdminTemplate.trim()
          : DEFAULT_SMS_TEMPLATES.smsNewOrderAdminTemplate,
    };
  } catch {
    return DEFAULT_SMS_TEMPLATES;
  }
}

function normalizeSmsPhone(phone: string): string | null {
  const value = String(phone || '').trim();
  if (!value) return null;

  const digitsOnly = value.replace(/\D/g, '');
  if (/^0\d{9}$/.test(digitsOnly)) {
    return `+233${digitsOnly.slice(1)}`;
  }
  if (/^233\d{9}$/.test(digitsOnly)) {
    return `+${digitsOnly}`;
  }
  if (/^\+233\d{9}$/.test(value)) {
    return value;
  }
  if (/^\+?[0-9]{10,15}$/.test(value)) {
    return value.startsWith('+') ? value : `+${digitsOnly}`;
  }

  return null;
}

function expectedPaystackAmountKobo(orderTotal: number): number {
  return Math.round(Math.max(0, orderTotal) * 100);
}

function normalizeVariationToken(value: unknown): string {
  return String(value ?? '').trim();
}

function normalizeStockNumber(value: unknown): number | null {
  const parsed = typeof value === 'number' ? value : Number(String(value ?? '').trim());
  if (!Number.isFinite(parsed)) {
    return null;
  }

  return Math.max(parsed, 0);
}

function parseVariationSelections(raw: string, separator: string | RegExp): VariationSelection[] {
  return raw
    .split(separator)
    .map(part => part.trim())
    .filter(Boolean)
    .flatMap(part => {
      const separatorIndex = part.indexOf(':');
      if (separatorIndex <= 0) return [];

      const name = normalizeVariationToken(part.slice(0, separatorIndex));
      const option = normalizeVariationToken(part.slice(separatorIndex + 1));
      if (!name || !option) return [];

      return [{ name, option }];
    });
}

function parseVariationKey(variationKey: string): VariationSelection[] {
  return parseVariationSelections(variationKey, '|');
}

function parseVariationLabel(variationLabel: string): VariationSelection[] {
  return parseVariationSelections(variationLabel, ',');
}

function variationRequestKey(productId: number, name: string, option: string): string {
  return `${productId}::${name}::${option}`;
}

function parseVariationRecords(raw: unknown): Array<Record<string, unknown>> {
  if (!Array.isArray(raw)) return [];

  return raw
    .filter((entry): entry is Record<string, unknown> => typeof entry === 'object' && entry !== null)
    .map(entry => ({ ...entry }));
}

function findVariationIndex(
  variations: Array<Record<string, unknown>>,
  targetName: string,
  targetOption: string,
): number {
  return variations.findIndex(variation => {
    const name = normalizeVariationToken(variation.name);
    const option = normalizeVariationToken(variation.option);
    return name === targetName && option === targetOption;
  });
}

function getVariationStockValue(variation: Record<string, unknown>): number | null {
  return normalizeStockNumber(variation.stock);
}

async function verifyPaystackPayment(reference: string): Promise<PaystackVerifyResponse> {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) {
    throw new Error('PAYSTACK_SECRET_KEY is not configured');
  }

  if (reference.startsWith('mock_') && key.startsWith('sk_test_')) {
    return {
      status: true,
      data: {
        status: 'success',
        reference,
        currency: 'GHS',
      },
    };
  }

  const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${key}`,
    },
    cache: 'no-store',
  });

  const payload = (await response.json().catch(() => ({}))) as PaystackVerifyResponse;
  if (!response.ok || !payload.status) {
    throw new Error('Payment verification failed');
  }

  return payload;
}

export async function GET(request: Request) {
  let client;

  try {
    await ensureDbInitialized();
    const { searchParams } = new URL(request.url);
    const requestedPhone = searchParams.get('phone')?.trim() || '';

    // Try to get authenticated user
    const token = parseCookie(request.headers.get('cookie'), SESSION_COOKIE);
    let userId: number | null = null;
    let userRole: string | null = null;

    if (token) {
      const user = await getUserBySessionToken(token);
      if (user) {
        userId = user.id;
        userRole = user.role;
      }
    }

    // Admins can see all orders.
    // Non-admin users are scoped to their own identity and should only see:
    // - Cash orders (created directly as valid orders)
    // - Online orders with confirmed payment
    const whereValues: Array<number | string> = [];
    let baseScopeClause = '';

    if (userRole !== 'admin') {
      if (userId) {
        whereValues.push(userId);
        baseScopeClause = `o."userProfileId" = $${whereValues.length}`;
      } else if (requestedPhone && isValidPhone(requestedPhone)) {
        whereValues.push(requestedPhone);
        baseScopeClause = `o.phone = $${whereValues.length}`;
      } else {
        baseScopeClause = '1=0';
      }
    }

    const whereClause =
      userRole === 'admin'
        ? `WHERE (COALESCE(o."paymentCompleted", FALSE) = TRUE OR o.status IN ('Paid', 'Delivered', 'Cancelled'))`
        : `WHERE ${baseScopeClause} AND (COALESCE(o."paymentCompleted", FALSE) = TRUE OR o.status IN ('Paid', 'Delivered', 'Cancelled'))`;

    const fallbackWhereClause =
      userRole === 'admin'
        ? `WHERE o.status IN ('Paid', 'Delivered', 'Cancelled')`
        : `WHERE ${baseScopeClause} AND o.status IN ('Paid', 'Delivered', 'Cancelled')`;

    client = await pool.connect();
    let result;
    try {
      result = await client.query(`
        SELECT
          o.id,
          o."orderNumber",
          o."customerName",
          o.phone,
          o.email,
          o.address,
          o.city,
          o.notes,
          o."paymentMethod",
          (
            COALESCE(o."paymentCompleted", FALSE)
            OR o.status IN ('Paid', 'Delivered', 'Cancelled')
          ) AS "paymentCompleted",
          o.status,
          o.subtotal,
          o.delivery,
          o.total,
          o."createdAt",
          COALESCE(
            json_agg(
              json_build_object(
                'id', oi.id,
                'productId', oi."productId",
                'productName', oi."productName",
                'variationKey', oi."variationKey",
                'variationLabel', oi."variationLabel",
                'price', oi.price,
                'quantity', oi.quantity,
                'lineTotal', oi."lineTotal"
              )
            ) FILTER (WHERE oi.id IS NOT NULL),
            '[]'::json
          ) AS items
        FROM "Order" o
        LEFT JOIN "OrderItem" oi ON oi."orderId" = o.id
        ${whereClause}
        GROUP BY o.id
        ORDER BY o."createdAt" DESC
      `, whereValues);
    } catch (error) {
      if ((error as { code?: string }).code !== '42703') {
        throw error;
      }

      result = await client.query(`
        SELECT
          o.id,
          o."orderNumber",
          o."customerName",
          o.phone,
          o.email,
          o.address,
          o.city,
          o.notes,
          o."paymentMethod",
          (o.status IN ('Paid', 'Delivered', 'Cancelled')) AS "paymentCompleted",
          o.status,
          o.subtotal,
          o.delivery,
          o.total,
          o."createdAt",
          COALESCE(
            json_agg(
              json_build_object(
                'id', oi.id,
                'productId', oi."productId",
                'productName', oi."productName",
                'variationKey', oi."variationKey",
                'variationLabel', oi."variationLabel",
                'price', oi.price,
                'quantity', oi.quantity,
                'lineTotal', oi."lineTotal"
              )
            ) FILTER (WHERE oi.id IS NOT NULL),
            '[]'::json
          ) AS items
        FROM "Order" o
        LEFT JOIN "OrderItem" oi ON oi."orderId" = o.id
        ${fallbackWhereClause}
        GROUP BY o.id
        ORDER BY o."createdAt" DESC
      `, whereValues);
    }

    return Response.json(result.rows, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    return Response.json(
      { error: 'Failed to fetch orders', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  } finally {
    if (client) client.release();
  }
}

export async function POST(request: Request) {
  let client;
  let transactionStarted = false;

  try {
    await ensureDbInitialized();
    // Try to get authenticated user
    const token = parseCookie(request.headers.get('cookie'), SESSION_COOKIE);
    let userId: number | null = null;

    if (token) {
      const user = await getUserBySessionToken(token);
      if (user) {
        userId = user.id;
      }
    }

    const body = (await request.json()) as CheckoutPayload;

    if (!body.fullName?.trim() || !body.phone?.trim() || !body.address?.trim() || !body.city?.trim()) {
      return Response.json({ error: 'Missing required customer details' }, { status: 400 });
    }

    if (!isValidPhone(body.phone.trim())) {
      return Response.json({ error: 'Phone must be 10 digits and start with 0' }, { status: 400 });
    }

    if (!Array.isArray(body.items) || body.items.length === 0) {
      return Response.json({ error: 'Cart is empty' }, { status: 400 });
    }

    const computedSubtotal = roundCurrency(
      body.items.reduce((sum, item) => {
        const unitPrice = parsePrice(item.price);
        const quantity = Math.max(1, Number(item.quantity) || 1);
        return sum + unitPrice * quantity;
      }, 0)
    );
    const computedDelivery = 0;
    const totalBeforeDiscount = roundCurrency(computedSubtotal + computedDelivery);

    const promoCode = String(body.promoCode || '').trim().toUpperCase();
    const promoEvaluation = promoCode ? await evaluatePromotion(promoCode, totalBeforeDiscount) : null;
    if (promoCode && !promoEvaluation) {
      return Response.json({ error: 'Invalid or ineligible promo code' }, { status: 400 });
    }

    const discountAmount = promoEvaluation?.discountAmount || 0;
    const computedTotal = roundCurrency(totalBeforeDiscount - discountAmount);
    const baseNotes = body.notes?.trim() || '';
    const resolvedNotes = promoEvaluation
      ? `${baseNotes}${baseNotes ? ' | ' : ''}Promo ${promoEvaluation.code}: -GH₵${promoEvaluation.discountAmount.toFixed(2)}`
      : baseNotes || null;

    if (computedTotal <= 0) {
      return Response.json({ error: 'Order total must be greater than zero' }, { status: 400 });
    }

    const paymentCompleted = body.paymentCompleted !== false;

    if (paymentCompleted) {
      if (body.paymentMethod !== 'paystack') {
        return Response.json({ error: 'Only paid Paystack orders can be created.' }, { status: 400 });
      }

      const paymentReference = String(body.paymentReference || '').trim();
      if (!paymentReference) {
        return Response.json({ error: 'Missing payment reference' }, { status: 400 });
      }

      const verification = await verifyPaystackPayment(paymentReference);
      const paid = verification.data?.status === 'success';
      if (!paid) {
        return Response.json({ error: 'Payment is not successful' }, { status: 402 });
      }

      const expectedAmount = expectedPaystackAmountKobo(computedTotal);
      const actualAmount = Number(verification.data?.amount || 0);

      if (actualAmount > 0 && actualAmount < expectedAmount) {
        return Response.json({ error: 'Payment amount mismatch' }, { status: 400 });
      }

      if (verification.data?.currency && verification.data.currency !== 'GHS') {
        return Response.json({ error: 'Unsupported payment currency' }, { status: 400 });
      }
    }

    const paymentReference = String(body.paymentReference || '').trim();
    if (!paymentReference) {
      return Response.json({ error: 'Missing payment reference' }, { status: 400 });
    }

    client = await pool.connect();

    const duplicateResult = await client.query(
      'SELECT id, "orderNumber", "paymentCompleted", status FROM "Order" WHERE "paymentReference" = $1 LIMIT 1',
      [paymentReference],
    );
    if (duplicateResult.rows.length > 0) {
      const existingOrder = duplicateResult.rows[0];
      if (paymentCompleted && (!existingOrder.paymentCompleted || existingOrder.status !== 'Paid')) {
        const { markOrderPaid } = await import('@/lib/paystackPayments');
        await markOrderPaid(existingOrder.id);
      }
      return Response.json(
        {
          id: existingOrder.id,
          orderNumber: existingOrder.orderNumber,
          status: 'Paid',
          duplicate: true,
        },
        { status: 200 },
      );
    }

    await client.query('BEGIN');
    transactionStarted = true;
    const normalizedItems = body.items.map(item => {
      const unitPrice = parsePrice(item.price);
      const quantity = Math.max(1, Number(item.quantity) || 1);
      const lineTotal = unitPrice * quantity;
      const submittedProductId = Number(item.id);
      const variationKey = typeof item.variationKey === 'string' ? item.variationKey.trim() : '';
      const variationLabel = typeof item.variationLabel === 'string' ? item.variationLabel.trim() : '';

      return {
        item,
        unitPrice,
        quantity,
        lineTotal,
        submittedProductId,
        variationKey,
        variationLabel,
      };
    });

    const submittedProductIds = Array.from(
      new Set(
        normalizedItems
          .map(entry => entry.submittedProductId)
          .filter(id => Number.isInteger(id) && id > 0)
      )
    );

    const validProductIds = new Set<number>();
    const productInventoryMap = new Map<number, ProductInventoryRow>();
    if (submittedProductIds.length > 0) {
      const productIdResult = await client.query(
        'SELECT id, stock, "hasVariations", variations FROM "Product" WHERE id = ANY($1::int[]) FOR UPDATE',
        [submittedProductIds]
      );

      for (const row of productIdResult.rows as ProductInventoryRow[]) {
        validProductIds.add(row.id);
        productInventoryMap.set(row.id, row);
      }
    }

    const requestedQuantityByProduct = new Map<number, number>();
    const requestedVariationQuantityMap = new Map<string, VariationRequest>();
    for (const entry of normalizedItems) {
      if (!validProductIds.has(entry.submittedProductId)) continue;

      const current = requestedQuantityByProduct.get(entry.submittedProductId) || 0;
      requestedQuantityByProduct.set(entry.submittedProductId, current + entry.quantity);

      const productInventory = productInventoryMap.get(entry.submittedProductId);
      const requiresVariationSelection = Boolean(productInventory?.hasVariations);

      const keySelections = entry.variationKey ? parseVariationKey(entry.variationKey) : [];
      const labelSelections =
        keySelections.length === 0 && entry.variationLabel
          ? parseVariationLabel(entry.variationLabel)
          : [];
      const selections = keySelections.length > 0 ? keySelections : labelSelections;

      if (!entry.variationKey && !entry.variationLabel) {
        if (requiresVariationSelection) {
          await client.query('ROLLBACK');
          transactionStarted = false;
          return Response.json({ error: 'A required variation is missing for one or more items.' }, { status: 400 });
        }

        continue;
      }

      if (selections.length === 0) {
        await client.query('ROLLBACK');
        transactionStarted = false;
        return Response.json({ error: 'Invalid variation selected for one or more items.' }, { status: 400 });
      }

      for (const selection of selections) {
        const key = variationRequestKey(entry.submittedProductId, selection.name, selection.option);
        const existingRequest = requestedVariationQuantityMap.get(key);

        if (existingRequest) {
          existingRequest.quantity += entry.quantity;
          continue;
        }

        requestedVariationQuantityMap.set(key, {
          productId: entry.submittedProductId,
          name: selection.name,
          option: selection.option,
          quantity: entry.quantity,
        });
      }
    }

    for (const [productId, requestedQty] of requestedQuantityByProduct.entries()) {
      const availableStock = productInventoryMap.get(productId)?.stock;
      if (typeof availableStock !== 'number') {
        continue;
      }

      if (availableStock <= 0) {
        await client.query('ROLLBACK');
        transactionStarted = false;
        return Response.json({ error: 'One or more items are out of stock.' }, { status: 400 });
      }

      if (requestedQty > availableStock) {
        await client.query('ROLLBACK');
        transactionStarted = false;
        return Response.json({ error: 'Requested quantity exceeds available stock for one or more items.' }, { status: 400 });
      }
    }

    for (const requestEntry of requestedVariationQuantityMap.values()) {
      const productInventory = productInventoryMap.get(requestEntry.productId);
      if (!productInventory) {
        continue;
      }

      const variations = parseVariationRecords(productInventory.variations);
      const variationIndex = findVariationIndex(variations, requestEntry.name, requestEntry.option);

      if (variationIndex < 0) {
        await client.query('ROLLBACK');
        transactionStarted = false;
        return Response.json({ error: 'Selected variation is no longer available.' }, { status: 400 });
      }

      const availableVariationStock = getVariationStockValue(variations[variationIndex]);
      if (typeof availableVariationStock !== 'number') {
        await client.query('ROLLBACK');
        transactionStarted = false;
        return Response.json({ error: 'Variation stock is unavailable for one or more selected items.' }, { status: 400 });
      }

      if (availableVariationStock <= 0) {
        await client.query('ROLLBACK');
        transactionStarted = false;
        return Response.json({ error: 'One or more selected variations are out of stock.' }, { status: 400 });
      }

      if (requestEntry.quantity > availableVariationStock) {
        await client.query('ROLLBACK');
        transactionStarted = false;
        return Response.json({ error: 'Requested quantity exceeds available stock for one or more selected variations.' }, { status: 400 });
      }
    }

    const provisionalOrderNumber = `TMP-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
    const orderInsert = await client.query(
      `
      INSERT INTO "Order"
      ("orderNumber", "customerName", phone, email, address, city, notes, "paymentMethod", "paymentCompleted", "paymentReference", status, subtotal, delivery, total, "userProfileId")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING id
      `,
      [
        provisionalOrderNumber,
        body.fullName.trim(),
        body.phone.trim(),
        body.email?.trim() || null,
        body.address.trim(),
        body.city.trim(),
        resolvedNotes,
        body.paymentMethod,
        paymentCompleted,
        paymentReference,
        paymentCompleted ? 'Paid' : 'Unpaid',
        computedSubtotal,
        computedDelivery,
        computedTotal,
        userId,
      ]
    );

    const orderId = orderInsert.rows[0].id as number;
    const orderNumber = `WF-${String(orderId).padStart(6, '0')}`;

    await client.query('UPDATE "Order" SET "orderNumber" = $1 WHERE id = $2', [orderNumber, orderId]);

    for (const entry of normalizedItems) {
      const { item, unitPrice, quantity, lineTotal, submittedProductId, variationKey, variationLabel } = entry;
      const productId = validProductIds.has(submittedProductId) ? submittedProductId : null;

      await client.query(
        `
        INSERT INTO "OrderItem"
        ("orderId", "productId", "productName", "variationKey", "variationLabel", price, quantity, "lineTotal")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `,
        [
          orderId,
          productId,
          item.name,
          variationKey || null,
          variationLabel || null,
          unitPrice,
          quantity,
          lineTotal,
        ]
      );
    }

    if (paymentCompleted) {
      for (const [productId, requestedQty] of requestedQuantityByProduct.entries()) {
        const availableStock = productInventoryMap.get(productId)?.stock;
        if (typeof availableStock !== 'number') {
          continue;
        }

        await client.query(
          'UPDATE "Product" SET stock = stock - $1, "updatedAt" = CURRENT_TIMESTAMP WHERE id = $2',
          [requestedQty, productId],
        );
      }

      const variationRequestsByProduct = new Map<number, VariationRequest[]>();
      for (const requestEntry of requestedVariationQuantityMap.values()) {
        const list = variationRequestsByProduct.get(requestEntry.productId) || [];
        list.push(requestEntry);
        variationRequestsByProduct.set(requestEntry.productId, list);
      }

      for (const [productId, variationRequests] of variationRequestsByProduct.entries()) {
        const productInventory = productInventoryMap.get(productId);
        if (!productInventory || variationRequests.length === 0) {
          continue;
        }

        const variations = parseVariationRecords(productInventory.variations);
        let hasVariationStockChange = false;

        for (const requestEntry of variationRequests) {
          const variationIndex = findVariationIndex(variations, requestEntry.name, requestEntry.option);
          if (variationIndex < 0) {
            continue;
          }

          const variation = variations[variationIndex];
          const availableStock = getVariationStockValue(variation);
          if (typeof availableStock !== 'number') {
            await client.query('ROLLBACK');
            transactionStarted = false;
            return Response.json({ error: 'Variation stock is unavailable for one or more selected items.' }, { status: 400 });
          }

          variation.stock = Math.max(availableStock - requestEntry.quantity, 0);
          hasVariationStockChange = true;
        }

        if (!hasVariationStockChange) {
          continue;
        }

        await client.query(
          'UPDATE "Product" SET variations = $1::jsonb, "updatedAt" = CURRENT_TIMESTAMP WHERE id = $2',
          [JSON.stringify(variations), productId],
        );
      }
    }

    await client.query('COMMIT');
    transactionStarted = false;

    if (paymentCompleted) {
      invalidateApiCacheByPrefix('products:');
      for (const productId of requestedQuantityByProduct.keys()) {
        emitRealtimeEvent({ channel: 'products', action: 'updated', id: productId });
      }
    }
    emitRealtimeEvent({ channel: 'orders', action: 'created', id: orderId });

    if (paymentCompleted) {
      const smsTemplates = await loadSmsTemplates();

      const customerSmsPhone = normalizeSmsPhone(body.phone);
      if (customerSmsPhone) {
        const confirmationMessage = applySmsTemplate(smsTemplates.smsOrderConfirmationTemplate, {
          orderNumber,
          customerName: body.fullName.trim(),
          total: computedTotal.toFixed(2),
        });
        const smsResult = await sendSms({ to: customerSmsPhone, message: confirmationMessage });
        if (!smsResult.success) {
          console.error('[SMS] Customer order confirmation failed', {
            orderNumber,
            phone: customerSmsPhone,
            error: smsResult.error || 'Unknown SMS error',
          });
        }
      }

      if (body.email) {
        const itemsForEmail = body.items.slice(0, 3).map(item => ({
          name: item.name,
          qty: item.quantity,
          price: `GH₵${item.price}`,
        }));

        await sendEmail({
          to: body.email,
          subject: `Order Confirmed - ${orderNumber}`,
          template: 'order_confirmation',
          data: {
            orderNumber,
            customerName: body.fullName,
            items: itemsForEmail,
            total: `GH₵${computedTotal.toFixed(2)}`,
            orderLink: `${new URL(request.url).origin}/history?orderId=${orderId}`,
          },
        });
      }
    }

    return Response.json(
      { id: orderId, orderNumber, status: paymentCompleted ? 'Paid' : 'Unpaid' },
      { status: 201 }
    );
  } catch (error) {
    if (client && transactionStarted) {
      try {
        await client.query('ROLLBACK');
      } catch {
        // Preserve the original failure response if rollback itself cannot run.
      }
    }
    return Response.json(
      { error: 'Failed to create order', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  } finally {
    if (client) client.release();
  }
}
