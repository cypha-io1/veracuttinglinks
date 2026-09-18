import { parseCookie, getUserBySessionToken } from '@/lib/serverAuth';

const SESSION_COOKIE = 'wf_session';

export async function GET(request: Request) {
  try {
    const token = parseCookie(request.headers.get('cookie'), SESSION_COOKIE);

    if (!token) {
      return Response.json({ authenticated: false }, { status: 200 });
    }

    const user = await getUserBySessionToken(token);
    if (!user) {
      return Response.json({ authenticated: false }, { status: 200 });
    }

    return Response.json({
      authenticated: true,
      profile: {
        fullName: user.fullName,
        phone: user.phone,
        role: user.role,
        email: user.email || '',
        address: user.address || '',
        city: user.city || '',
      },
    });
  } catch (error) {
    return Response.json(
      { error: 'Failed to fetch session user', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
