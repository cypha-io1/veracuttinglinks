import { pool } from '@/lib/db';

const DEFAULT_STATUS = {
  liveMode: true,
  maintenanceReason: 'We are performing scheduled maintenance. Please check back shortly.',
};

type RawSettings = {
  liveMode?: unknown;
  maintenanceReason?: unknown;
};

function sanitizeStatus(raw: RawSettings | null | undefined) {
  return {
    liveMode: raw?.liveMode !== false,
    maintenanceReason:
      typeof raw?.maintenanceReason === 'string' && raw.maintenanceReason.trim()
        ? raw.maintenanceReason.trim()
        : DEFAULT_STATUS.maintenanceReason,
  };
}

export async function GET() {
  try {
    const result = await pool.query('SELECT value FROM "AdminSetting" WHERE key = $1 LIMIT 1', ['global']);

    if (result.rows.length === 0) {
      return Response.json(DEFAULT_STATUS, {
        headers: {
          'Cache-Control': 'no-store',
        },
      });
    }

    const status = sanitizeStatus(result.rows[0].value as RawSettings);
    return Response.json(status, {
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  } catch {
    return Response.json(DEFAULT_STATUS, {
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  }
}
