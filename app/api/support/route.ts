import { ensureDbInitialized } from '@/lib/dbInit';
import { pool } from '@/lib/db';

type Payload = {
  name?: string;
  contact?: string;
  message?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Payload;
    const name = String(body.name || '').trim();
    const contact = String(body.contact || '').trim();
    const message = String(body.message || '').trim();

    if (!name || !contact || !message) {
      return Response.json({ error: 'Name, contact and message are required' }, { status: 400 });
    }

    await ensureDbInitialized();
    const client = await pool.connect();
    try {
      const res = await client.query(
        `INSERT INTO "SupportMessage" (name, contact, message) VALUES ($1, $2, $3) RETURNING id, name, contact, message, status, "createdAt"`,
        [name, contact, message],
      );

      const created = res.rows[0];
      return Response.json({ success: true, message: 'Support request submitted', data: created });
    } finally {
      client.release();
    }
  } catch (error) {
    return Response.json({ error: 'Failed to submit support message', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
