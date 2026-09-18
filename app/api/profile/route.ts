import { pool } from '@/lib/db';
import { ensureDbInitialized } from '@/lib/dbInit';

type ProfilePayload = {
  fullName: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
};

const isValidPhone = (value: string) => /^0\d{9}$/.test(value);

export async function GET(request: Request) {
  let client;

  try {
    await ensureDbInitialized();
    const url = new URL(request.url);
    const phone = url.searchParams.get('phone')?.trim();

    if (!phone) {
      return Response.json({ error: 'phone query parameter is required' }, { status: 400 });
    }

    if (!isValidPhone(phone)) {
      return Response.json({ error: 'phone must be 10 digits and start with 0' }, { status: 400 });
    }

    client = await pool.connect();
    const result = await client.query(
      'SELECT id, "fullName", phone, role, email, address, city, "createdAt", "updatedAt" FROM "UserProfile" WHERE phone = $1 LIMIT 1',
      [phone]
    );

    if (result.rows.length === 0) {
      return Response.json(null, { status: 200 });
    }

    return Response.json(result.rows[0], {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    return Response.json(
      { error: 'Failed to fetch profile', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  } finally {
    if (client) client.release();
  }
}

export async function PUT(request: Request) {
  let client;

  try {
    await ensureDbInitialized();
    const body = (await request.json()) as ProfilePayload;
    const fullName = body.fullName?.trim();
    const phone = body.phone?.trim();

    if (!fullName || !phone) {
      return Response.json({ error: 'fullName and phone are required' }, { status: 400 });
    }

    if (!isValidPhone(phone)) {
      return Response.json({ error: 'phone must be 10 digits and start with 0' }, { status: 400 });
    }

    client = await pool.connect();
    const result = await client.query(
      `
      INSERT INTO "UserProfile" ("fullName", phone, email, address, city)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (phone)
      DO UPDATE SET
        "fullName" = EXCLUDED."fullName",
        email = EXCLUDED.email,
        address = EXCLUDED.address,
        city = EXCLUDED.city,
        "updatedAt" = CURRENT_TIMESTAMP
      RETURNING id, "fullName", phone, role, email, address, city, "createdAt", "updatedAt"
      `,
      [fullName, phone, body.email?.trim() || null, body.address?.trim() || null, body.city?.trim() || null]
    );

    return Response.json(result.rows[0], { status: 200 });
  } catch (error) {
    return Response.json(
      { error: 'Failed to update profile', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  } finally {
    if (client) client.release();
  }
}
