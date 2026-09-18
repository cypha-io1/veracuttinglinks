import { NextResponse } from 'next/server';
import { deleteSessionByToken, parseCookie } from '@/lib/serverAuth';

const SESSION_COOKIE = 'wf_session';

export async function POST(request: Request) {
  try {
    const token = parseCookie(request.headers.get('cookie'), SESSION_COOKIE);
    if (token) {
      await deleteSessionByToken(token);
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set(SESSION_COOKIE, '', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 0,
    });
    return response;
  } catch (error) {
    return Response.json(
      { error: 'Failed to log out', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
