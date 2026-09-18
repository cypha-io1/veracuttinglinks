import { NextResponse } from 'next/server';
import { createSessionForUser, getUserByPhone, verifyPassword } from '@/lib/serverAuth';

const SESSION_COOKIE = 'wf_session';

type LoginPayload = {
  phone: string;
  password: string;
};

const isValidPhone = (value: string) => /^0\d{9}$/.test(value);

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as LoginPayload;
    const phone = body.phone?.trim();
    const password = body.password || '';

    if (!phone || !password) {
      return Response.json({ error: 'Phone and password are required' }, { status: 400 });
    }

    if (!isValidPhone(phone)) {
      return Response.json({ error: 'Phone must be 10 digits and start with 0' }, { status: 400 });
    }

    const user = await getUserByPhone(phone);

    if (!user) {
      return Response.json({ error: 'Account not found' }, { status: 404 });
    }

    if (!user.passwordHash || !verifyPassword(password, user.passwordHash)) {
      return Response.json({ error: 'Invalid password' }, { status: 401 });
    }

    const token = await createSessionForUser(user.id);

    const response = NextResponse.json({
      ok: true,
      profile: {
        fullName: user.fullName,
        phone: user.phone,
        email: user.email || '',
        address: user.address || '',
        city: user.city || '',
        role: user.role,
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
      { error: 'Failed to log in', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
