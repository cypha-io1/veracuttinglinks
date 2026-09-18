import type { PoolClient } from 'pg';
import { getUserBySessionToken, parseCookie } from '@/lib/serverAuth';
import { pool } from '@/lib/db';

type AdminSettings = {
  liveMode: boolean;
  maintenanceReason: string;
  orderNotifications: boolean;
  allowCashOnDelivery: boolean;
  lowStockThreshold: number;
  supportEmail: string;
  smsOrderConfirmationTemplate: string;
  smsOrderStatusTemplate: string;
  smsNewOrderAdminTemplate: string;
};

const DEFAULT_SETTINGS: AdminSettings = {
  liveMode: true,
  maintenanceReason: 'We are performing scheduled maintenance. Please check back shortly.',
  orderNotifications: true,
  allowCashOnDelivery: true,
  lowStockThreshold: 5,
  supportEmail: 'support@zhilakaii.com',
  smsOrderConfirmationTemplate:
    'Zhilakaii: Order {orderNumber} confirmed. Payment received. Total GHc{total}. We will notify you when status changes.',
  smsOrderStatusTemplate: 'Zhilakaii: Your order {orderNumber} status is now {status}.',
  smsNewOrderAdminTemplate:
    'Zhilakaii: New paid order {orderNumber} from {customerName} ({city}). Total GHc{total}.',
};

async function requireAdmin(request: Request) {
  const token = parseCookie(request.headers.get('cookie'), 'wf_session');
  if (!token) return null;

  const user = await getUserBySessionToken(token);
  if (!user || user.role !== 'admin') return null;
  return user;
}

async function ensureSettingsTable(client: PoolClient) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS "AdminSetting" (
      key VARCHAR(120) PRIMARY KEY,
      value JSONB NOT NULL,
      "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

function sanitizeSettings(input: Partial<AdminSettings>): AdminSettings {
  return {
    liveMode: input.liveMode !== false,
    maintenanceReason:
      typeof input.maintenanceReason === 'string' && input.maintenanceReason.trim()
        ? input.maintenanceReason.trim()
        : DEFAULT_SETTINGS.maintenanceReason,
    orderNotifications: Boolean(input.orderNotifications),
    allowCashOnDelivery: Boolean(input.allowCashOnDelivery),
    lowStockThreshold:
      Number.isFinite(Number(input.lowStockThreshold)) && Number(input.lowStockThreshold) >= 0
        ? Number(input.lowStockThreshold)
        : DEFAULT_SETTINGS.lowStockThreshold,
    supportEmail:
      typeof input.supportEmail === 'string' && input.supportEmail.trim()
        ? input.supportEmail.trim()
        : DEFAULT_SETTINGS.supportEmail,
    smsOrderConfirmationTemplate:
      typeof input.smsOrderConfirmationTemplate === 'string' && input.smsOrderConfirmationTemplate.trim()
        ? input.smsOrderConfirmationTemplate.trim()
        : DEFAULT_SETTINGS.smsOrderConfirmationTemplate,
    smsOrderStatusTemplate:
      typeof input.smsOrderStatusTemplate === 'string' && input.smsOrderStatusTemplate.trim()
        ? input.smsOrderStatusTemplate.trim()
        : DEFAULT_SETTINGS.smsOrderStatusTemplate,
    smsNewOrderAdminTemplate:
      typeof input.smsNewOrderAdminTemplate === 'string' && input.smsNewOrderAdminTemplate.trim()
        ? input.smsNewOrderAdminTemplate.trim()
        : DEFAULT_SETTINGS.smsNewOrderAdminTemplate,
  };
}

export async function GET(request: Request) {
  let client;

  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    client = await pool.connect();
    await ensureSettingsTable(client);

    const result = await client.query('SELECT value FROM "AdminSetting" WHERE key = $1 LIMIT 1', ['global']);

    if (result.rows.length === 0) {
      return Response.json(DEFAULT_SETTINGS);
    }

    const settings = sanitizeSettings(result.rows[0].value as Partial<AdminSettings>);
    return Response.json(settings);
  } catch (error) {
    return Response.json(
      { error: 'Failed to fetch settings', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  } finally {
    if (client) client.release();
  }
}

export async function PUT(request: Request) {
  let client;

  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = (await request.json()) as Partial<AdminSettings>;
    const settings = sanitizeSettings(payload);

    client = await pool.connect();
    await ensureSettingsTable(client);

    await client.query(
      `
      INSERT INTO "AdminSetting" (key, value, "updatedAt")
      VALUES ($1, $2::jsonb, CURRENT_TIMESTAMP)
      ON CONFLICT (key)
      DO UPDATE SET value = EXCLUDED.value, "updatedAt" = CURRENT_TIMESTAMP
      `,
      ['global', JSON.stringify(settings)]
    );

    return Response.json(settings);
  } catch (error) {
    return Response.json(
      { error: 'Failed to save settings', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  } finally {
    if (client) client.release();
  }
}
