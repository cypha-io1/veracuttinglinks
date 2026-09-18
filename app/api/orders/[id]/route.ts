import { getUserBySessionToken, parseCookie } from '@/lib/serverAuth';
import { pool } from '@/lib/db';
import { emitRealtimeEvent } from '@/lib/realtime';
import { sendSms } from '@/lib/sms';

type RouteContext = {
  params: Promise<{ id: string }>;
};

type OrderStatusPayload = {
  status?: 'Pending' | 'In Progress' | 'Delivered' | 'Cancelled';
};

const DEFAULT_STATUS_SMS_TEMPLATE = 'Zhilakaii: Your order {orderNumber} status is now {status}.';

function applySmsTemplate(template: string, values: Record<string, string>) {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? '');
}

async function loadStatusSmsTemplate(): Promise<string> {
  try {
    const result = await pool.query('SELECT value FROM "AdminSetting" WHERE key = $1 LIMIT 1', ['global']);
    if (result.rows.length === 0) return DEFAULT_STATUS_SMS_TEMPLATE;

    const raw = result.rows[0].value as { smsOrderStatusTemplate?: string };
    if (typeof raw.smsOrderStatusTemplate === 'string' && raw.smsOrderStatusTemplate.trim()) {
      return raw.smsOrderStatusTemplate.trim();
    }

    return DEFAULT_STATUS_SMS_TEMPLATE;
  } catch {
    return DEFAULT_STATUS_SMS_TEMPLATE;
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

async function requireAdmin(request: Request) {
  const token = parseCookie(request.headers.get('cookie'), 'wf_session');
  if (!token) return null;

  const user = await getUserBySessionToken(token);
  if (!user || user.role !== 'admin') return null;
  return user;
}

export async function PATCH(request: Request, context: RouteContext) {
  let client;

  try {
    const user = await requireAdmin(request);
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const orderId = Number(id);
    if (!Number.isInteger(orderId) || orderId <= 0) {
      return Response.json({ error: 'Invalid order id' }, { status: 400 });
    }

    const body = (await request.json()) as OrderStatusPayload;
    if (!body.status || !['Pending', 'In Progress', 'Delivered', 'Cancelled'].includes(body.status)) {
      return Response.json({ error: 'Invalid order status' }, { status: 400 });
    }

    client = await pool.connect();
    const currentResult = await client.query(
      'SELECT id, "orderNumber", "customerName", phone, status FROM "Order" WHERE id = $1 LIMIT 1',
      [orderId],
    );

    if (currentResult.rows.length === 0) {
      return Response.json({ error: 'Order not found' }, { status: 404 });
    }

    const currentOrder = currentResult.rows[0] as {
      id: number;
      orderNumber: string;
      customerName: string;
      phone: string | null;
      status: 'Pending' | 'In Progress' | 'Delivered' | 'Cancelled';
    };

    const result = await client.query(
      `
      UPDATE "Order"
      SET status = $1, "updatedAt" = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, "orderNumber", "customerName", phone, status
      `,
      [body.status, orderId]
    );

    if (result.rows.length === 0) {
      return Response.json({ error: 'Order not found' }, { status: 404 });
    }

    const updatedOrder = result.rows[0];
    emitRealtimeEvent({ channel: 'orders', action: 'updated', id: updatedOrder.id });

    if (currentOrder.status !== body.status) {
      const customerPhone = normalizeSmsPhone(String(updatedOrder.phone || ''));
      if (customerPhone) {
        const smsTemplate = await loadStatusSmsTemplate();
        const smsMessage = applySmsTemplate(smsTemplate, {
          orderNumber: String(updatedOrder.orderNumber || ''),
          status: String(updatedOrder.status || ''),
          customerName: String(updatedOrder.customerName || ''),
        });
        try {
          const smsResult = await sendSms({ to: customerPhone, message: smsMessage });
          if (!smsResult.success) {
            console.error('[SMS] Order status update failed', {
              orderId,
              orderNumber: String(updatedOrder.orderNumber || ''),
              phone: customerPhone,
              error: smsResult.error || 'Unknown SMS error',
            });
          }
        } catch {
          // Status update should not fail because SMS delivery failed.
        }
      }
    }

    return Response.json(updatedOrder);
  } catch (error) {
    return Response.json(
      { error: 'Failed to update order', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  } finally {
    if (client) client.release();
  }
}
