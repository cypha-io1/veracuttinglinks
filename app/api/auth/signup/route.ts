import { NextResponse } from 'next/server';
import { createSessionForUser, hashPassword } from '@/lib/serverAuth';
import { sendEmail } from '@/lib/email';
import { pool } from '@/lib/db';

const SESSION_COOKIE = 'wf_session';

type SignupPayload = {
  fullName: string;
  phone: string;
  password: string;
  email?: string;
  address?: string;
  city?: string;
};

const isValidPhone = (value: string) => /^0\d{9}$/.test(value);

export async function POST(request: Request) {
  let client;

  try {
    const body = (await request.json()) as SignupPayload;
    const fullName = body.fullName?.trim();
    const phone = body.phone?.trim();
    const password = body.password || '';

    if (!fullName || !phone || password.length < 6) {
      return Response.json({ error: 'Full name, phone, and password (min 6 chars) are required' }, { status: 400 });
    }

    if (!isValidPhone(phone)) {
      return Response.json({ error: 'Phone must be 10 digits and start with 0' }, { status: 400 });
    }

    const passwordHash = hashPassword(password);

    client = await pool.connect();

    const existing = await client.query(
      'SELECT id, "passwordHash" FROM "UserProfile" WHERE phone = $1 LIMIT 1',
      [phone]
    );

    if (existing.rows.length > 0 && existing.rows[0].passwordHash) {
      return Response.json({ error: 'Account already exists. Please log in.' }, { status: 409 });
    }

    const result = await client.query(
      `
      INSERT INTO "UserProfile" ("fullName", phone, role, "passwordHash", email, address, city)
      VALUES ($1, $2, 'user', $3, $4, $5, $6)
      ON CONFLICT (phone)
      DO UPDATE SET
        "fullName" = EXCLUDED."fullName",
        "passwordHash" = EXCLUDED."passwordHash",
        email = EXCLUDED.email,
        address = EXCLUDED.address,
        city = EXCLUDED.city,
        "updatedAt" = CURRENT_TIMESTAMP
      RETURNING id, "fullName", phone, role, email, address, city
      `,
      [fullName, phone, passwordHash, body.email?.trim() || null, body.address?.trim() || null, body.city?.trim() || null]
    );

    const user = result.rows[0] as {
      id: number;
      fullName: string;
      phone: string;
      role: string;
      email: string | null;
      address: string | null;
      city: string | null;
    };

    const token = await createSessionForUser(user.id);

    if (user.email) {
      await sendEmail({
        to: user.email,
        subject: 'Welcome to Zhilakaii!',
        template: 'signup_welcome',
        data: {
          customerName: user.fullName,
          loginLink: `${new URL(request.url).origin}/account`,
        },
      });
    }

    const response = NextResponse.json({
      ok: true,
      profile: {
        fullName: user.fullName,
        phone: user.phone,
        role: user.role,
        email: user.email || '',
        address: user.address || '',
        city: user.city || '',
      },
    });

    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (error) {
    return Response.json(
      { error: 'Failed to sign up', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  } finally {
    if (client) client.release();
  }
}
