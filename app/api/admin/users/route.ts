import { getUserBySessionToken, parseCookie } from '@/lib/serverAuth';
import { pool } from '@/lib/db';

type UpdateUserPayload = {
  id?: number;
  fullName?: string;
  role?: 'user' | 'admin';
};

async function requireAdmin(request: Request) {
  const token = parseCookie(request.headers.get('cookie'), 'wf_session');
  if (!token) return null;

  const user = await getUserBySessionToken(token);
  if (!user || user.role !== 'admin') return null;
  return user;
}

export async function GET(request: Request) {
  let client;

  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    client = await pool.connect();
    const result = await client.query(
      `
      SELECT
        id,
        "fullName",
        phone,
        email,
        COALESCE(role, 'user') AS role,
        "createdAt"
      FROM "UserProfile"
      ORDER BY "createdAt" DESC
      `
    );

    return Response.json(result.rows, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    return Response.json(
      { error: 'Failed to fetch users', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  } finally {
    if (client) client.release();
  }
}

export async function PATCH(request: Request) {
  let client;

  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as UpdateUserPayload;
    const userId = Number(body.id);

    if (!Number.isInteger(userId) || userId <= 0) {
      return Response.json({ error: 'Invalid user id' }, { status: 400 });
    }

    if (!body.fullName?.trim() || !body.role || !['user', 'admin'].includes(body.role)) {
      return Response.json({ error: 'Invalid user payload' }, { status: 400 });
    }

    client = await pool.connect();
    const result = await client.query(
      `
      UPDATE "UserProfile"
      SET
        "fullName" = $1,
        role = $2,
        "updatedAt" = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING id, "fullName", phone, email, role
      `,
      [body.fullName.trim(), body.role, userId]
    );

    if (result.rows.length === 0) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    return Response.json(result.rows[0]);
  } catch (error) {
    return Response.json(
      { error: 'Failed to update user', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  } finally {
    if (client) client.release();
  }
}
