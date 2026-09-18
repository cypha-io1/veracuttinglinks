import { pool } from '@/lib/db';
import { emitRealtimeEvent } from '@/lib/realtime';
import { sendEmail } from '@/lib/email';
import { sendSms } from '@/lib/sms';
import { invalidateApiCacheByPrefix } from '@/lib/apiCache';

type OrderData = {
  orderNumber: string;
  customerName: string;
  email: string | null;
  total: string;
  phone: string;
};

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

export function parseOrderIdFromReference(reference: string): number | null {
  const match = String(reference).match(/(?:^|_)wf_(\d+)_/i);
  if (!match) return null;

  const parsed = Number(match[1]);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export function resolveOrderId(candidateOrderId: unknown, reference: string): number | null {
  const explicit = Number(candidateOrderId);
  if (Number.isInteger(explicit) && explicit > 0) {
    return explicit;
  }

  return parseOrderIdFromReference(reference);
}

export async function markOrderPaid(orderId: number): Promise<boolean> {
  let client;
  let wasUpdated = false;
  let orderData: OrderData | null = null;
  const updatedProductIds = new Set<number>();

  try {
    client = await pool.connect();
    await client.query('BEGIN');

    const columnResult = await client.query(
      `
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'Order'
          AND column_name = 'paymentCompleted'
      ) AS "hasPaymentCompleted"
      `,
    );

    const hasPaymentCompleted = Boolean(columnResult.rows[0]?.hasPaymentCompleted);

    const statusQuery = await client.query(
      'SELECT status, COALESCE("paymentCompleted", FALSE) AS "paymentCompleted" FROM "Order" WHERE id = $1 LIMIT 1 FOR UPDATE',
      [orderId],
    );

    if (statusQuery.rows.length === 0) {
      await client.query('ROLLBACK');
      return false;
    }

    const currentStatus = String(statusQuery.rows[0]?.status || '');
    const currentPaymentCompleted = Boolean(statusQuery.rows[0]?.paymentCompleted);

    const orderQuery = await client.query(
      'SELECT "orderNumber", "customerName", email, total, phone FROM "Order" WHERE id = $1 LIMIT 1',
      [orderId],
    );
    orderData = orderQuery.rows[0] as OrderData | null;

    if (hasPaymentCompleted) {
      const updateResult = await client.query(
        `
        UPDATE "Order"
        SET "paymentCompleted" = TRUE, status = $1
        WHERE id = $2
          AND ("paymentCompleted" IS DISTINCT FROM TRUE OR status IS DISTINCT FROM $1)
        `,
        ['Paid', orderId],
      );
      wasUpdated = (updateResult.rowCount ?? 0) > 0;
    } else {
      const updateResult = await client.query(
        'UPDATE "Order" SET status = $1 WHERE id = $2 AND status IS DISTINCT FROM $1',
        ['Paid', orderId],
      );
      wasUpdated = (updateResult.rowCount ?? 0) > 0;
    }

    const transitionedToPaid = hasPaymentCompleted
      ? !currentPaymentCompleted || currentStatus !== 'Paid'
      : currentStatus !== 'Paid';

    if (wasUpdated && transitionedToPaid) {
      const orderItemsResult = await client.query(
        `
        SELECT "productId", quantity, "variationKey", "variationLabel"
        FROM "OrderItem"
        WHERE "orderId" = $1
          AND "productId" IS NOT NULL
          AND quantity > 0
        `,
        [orderId],
      );

      const requestedQuantityByProduct = new Map<number, number>();
      const requestedVariationQuantityMap = new Map<string, VariationRequest>();

      for (const row of orderItemsResult.rows as Array<{ productId: number | null; quantity: number | null; variationKey: string | null; variationLabel: string | null }>) {
        if (!row.productId || !row.quantity || row.quantity <= 0) continue;

        const currentProductQty = requestedQuantityByProduct.get(row.productId) || 0;
        requestedQuantityByProduct.set(row.productId, currentProductQty + row.quantity);

        const rawVariationKey = normalizeVariationToken(row.variationKey);
        const rawVariationLabel = normalizeVariationToken(row.variationLabel);

        if (!rawVariationKey && !rawVariationLabel) {
          continue;
        }

        const keySelections = rawVariationKey ? parseVariationKey(rawVariationKey) : [];
        const labelSelections = keySelections.length === 0 && rawVariationLabel ? parseVariationLabel(rawVariationLabel) : [];
        const selections = keySelections.length > 0 ? keySelections : labelSelections;

        if (selections.length === 0) {
          throw new Error('Invalid variation data found while finalizing payment.');
        }

        for (const selection of selections) {
          const key = variationRequestKey(row.productId, selection.name, selection.option);
          const existingRequest = requestedVariationQuantityMap.get(key);

          if (existingRequest) {
            existingRequest.quantity += row.quantity;
            continue;
          }

          requestedVariationQuantityMap.set(key, {
            productId: row.productId,
            name: selection.name,
            option: selection.option,
            quantity: row.quantity,
          });
        }
      }

      const productIds = Array.from(requestedQuantityByProduct.keys());
      const productInventoryMap = new Map<number, { stock: number | null; hasVariations: boolean; variations: unknown }>();

      if (productIds.length > 0) {
        const productResult = await client.query(
          'SELECT id, stock, "hasVariations", variations FROM "Product" WHERE id = ANY($1::int[]) FOR UPDATE',
          [productIds],
        );

        for (const row of productResult.rows as Array<{ id: number; stock: number | null; hasVariations: boolean; variations: unknown }>) {
          productInventoryMap.set(row.id, { stock: row.stock, hasVariations: Boolean(row.hasVariations), variations: row.variations });
        }
      }

      for (const [productId] of requestedQuantityByProduct.entries()) {
        const inventory = productInventoryMap.get(productId);
        if (!inventory?.hasVariations) {
          continue;
        }

        const hasAnySelection = Array.from(requestedVariationQuantityMap.values()).some(entry => entry.productId === productId);
        if (!hasAnySelection) {
          throw new Error('A required variation is missing while finalizing payment.');
        }
      }

      for (const [productId, requestedQty] of requestedQuantityByProduct.entries()) {
        const availableStock = productInventoryMap.get(productId)?.stock;
        if (typeof availableStock !== 'number') {
          continue;
        }

        if (requestedQty > availableStock) {
          throw new Error('Requested quantity exceeds available stock while finalizing payment.');
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
          throw new Error('Selected variation is no longer available while finalizing payment.');
        }

        const availableVariationStock = getVariationStockValue(variations[variationIndex]);
        if (typeof availableVariationStock !== 'number') {
          throw new Error('Variation stock is unavailable while finalizing payment.');
        }

        if (requestEntry.quantity > availableVariationStock) {
          throw new Error('Requested quantity exceeds available variation stock while finalizing payment.');
        }
      }

      for (const [productId, requestedQty] of requestedQuantityByProduct.entries()) {
        const availableStock = productInventoryMap.get(productId)?.stock;
        if (typeof availableStock !== 'number') {
          continue;
        }

        const updateStock = await client.query(
          'UPDATE "Product" SET stock = GREATEST(stock - $1, 0), "updatedAt" = CURRENT_TIMESTAMP WHERE id = $2 AND stock IS NOT NULL RETURNING id',
          [requestedQty, productId],
        );

        if ((updateStock.rowCount ?? 0) > 0) {
          updatedProductIds.add(productId);
        }
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
            throw new Error('Variation stock is unavailable while finalizing payment.');
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

        updatedProductIds.add(productId);
      }
    }

    await client.query('COMMIT');
  } catch (error) {
    if (client) {
      try {
        await client.query('ROLLBACK');
      } catch {
        // Keep the original payment handling error.
      }
    }
    throw error;
  } finally {
    if (client) client.release();
  }

  if (wasUpdated) {
    if (updatedProductIds.size > 0) {
      invalidateApiCacheByPrefix('products:');
      for (const productId of updatedProductIds) {
        emitRealtimeEvent({ channel: 'products', action: 'updated', id: productId });
      }
    }
    emitRealtimeEvent({ channel: 'orders', action: 'updated', id: orderId });

    if (orderData?.email) {
      await sendEmail({
        to: orderData.email,
        subject: `Payment Confirmed - ${orderData.orderNumber}`,
        template: 'payment_confirmed',
        data: {
          orderNumber: orderData.orderNumber,
          customerName: orderData.customerName,
          amount: `GH₵${orderData.total}`,
          paymentMethod: 'Card (Paystack)',
        },
      });
    }

    const customerSmsPhone = orderData?.phone ? normalizeSmsPhone(orderData.phone) : null;
    if (customerSmsPhone) {
      const smsTemplates = await loadSmsTemplates();
      const confirmationMessage = applySmsTemplate(smsTemplates.smsOrderConfirmationTemplate, {
        orderNumber: orderData?.orderNumber || '',
        customerName: orderData?.customerName.trim() || '',
        total: Number(orderData?.total || 0).toFixed(2),
      });
      const smsResult = await sendSms({ to: customerSmsPhone, message: confirmationMessage });
      if (!smsResult.success) {
        console.error('[SMS] Customer order confirmation failed in markOrderPaid', {
          orderNumber: orderData?.orderNumber,
          phone: customerSmsPhone,
          error: smsResult.error || 'Unknown SMS error',
        });
      }
    }
  }

  return wasUpdated;
}
