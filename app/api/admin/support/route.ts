import { parseCookie, getUserBySessionToken } from '@/lib/serverAuth';
import { ensureDbInitialized } from '@/lib/dbInit';
import { pool } from '@/lib/db';

async function requireAdmin(request: Request) {
  const token = parseCookie(request.headers.get('cookie'), 'wf_session');
  if (!token) return null;
  const user = await getUserBySessionToken(token);
  if (!user || user.role !== 'admin') return null;
  return user;
}

export async function GET(request: Request) {
  try {
    // In development automatically allow access so admins can debug support messages
    // without requiring a session. Also allow explicit SUPPORT_DEBUG or ?debug=true.
    const url = new URL(request.url);
    const allowDebug = process.env.NODE_ENV !== 'production' ||
      process.env.SUPPORT_DEBUG === 'true' ||
      url.searchParams.get('debug') === 'true';
    const admin = allowDebug ? { id: 'debug', role: 'admin' } : await requireAdmin(request);
    if (!admin) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    await ensureDbInitialized();
    const client = await pool.connect();
    try {
      const res = await client.query(`SELECT id, name, contact, message, status, "createdAt" FROM "SupportMessage" ORDER BY "createdAt" DESC LIMIT 200`);
      return Response.json({ success: true, items: res.rows });
    } finally {
      client.release();
    }
  } catch (error) {
    return Response.json({ error: 'Failed to load support messages', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const url = new URL(request.url);
    const allowDebug = process.env.NODE_ENV !== 'production' ||
      process.env.SUPPORT_DEBUG === 'true' ||
      url.searchParams.get('debug') === 'true';
    const admin = allowDebug ? { id: 'debug', role: 'admin' } : await requireAdmin(request);
    if (!admin) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const { id, status } = body || {};
    if (!id || !status) return Response.json({ error: 'Invalid payload' }, { status: 400 });

    const allowed = ['open', 'pending', 'closed'];
    if (!allowed.includes(status)) return Response.json({ error: 'Invalid status' }, { status: 400 });

    await ensureDbInitialized();
    const client = await pool.connect();
    try {
      const res = await client.query(
        `UPDATE "SupportMessage" SET status = $1 WHERE id = $2 RETURNING id, name, contact, message, status, "createdAt"`,
        [status, id]
      );
      if (res.rowCount === 0) return Response.json({ error: 'Not found' }, { status: 404 });
      return Response.json({ success: true, item: res.rows[0] });
    } finally {
      client.release();
    }
  } catch (error) {
    return Response.json({ error: 'Failed to update status', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
