import { createHash } from 'crypto';
import { pool } from '@/lib/db';
import { checkResetCodeAttemptAllowed, getRequestIp, registerResetCodeAttempt } from '@/lib/resetThrottle';
import { ensureDbInitialized } from '@/lib/dbInit';

type VerifyPayload = {
  phone: string;
  code: string;
};

const isValidPhone = (value: string) => /^0\d{9}$/.test(value);
const isValidCode = (value: string) => /^\d{6}$/.test(value);
const hashCode = (code: string) => createHash('sha256').update(code).digest('hex');

export async function POST(request: Request) {
  let client;

  try {
    await ensureDbInitialized();

    const body = (await request.json()) as VerifyPayload;
    const phone = body.phone?.trim();
    const code = body.code?.trim();
    const requesterIp = getRequestIp(request);

    if (!phone || !code) {
      return Response.json({ error: 'Phone and code are required' }, { status: 400 });
    }

    if (!isValidPhone(phone)) {
      return Response.json({ error: 'Phone must be 10 digits and start with 0' }, { status: 400 });
    }

    if (!isValidCode(code)) {
      return Response.json({ error: 'Code must be 6 digits' }, { status: 400 });
    }

    const throttle = await checkResetCodeAttemptAllowed(phone, requesterIp);
    if (!throttle.allowed) {
      return Response.json(
        {
          error: 'Too many incorrect attempts. Please try again later.',
          retryAfterSeconds: throttle.retryAfterSeconds,
        },
        {
          status: 429,
          headers: { 'Retry-After': String(throttle.retryAfterSeconds) },
        }
      );
    }

    client = await pool.connect();

    const userResult = await client.query('SELECT id FROM "UserProfile" WHERE phone = $1 LIMIT 1', [phone]);
    if (userResult.rows.length === 0) {
      await registerResetCodeAttempt(phone, requesterIp, false);
      return Response.json({ error: 'Invalid reset verification' }, { status: 400 });
    }

    const userId = userResult.rows[0].id as number;

    const resetResult = await client.query(
      `
      SELECT id
      FROM "PasswordReset"
      WHERE "userProfileId" = $1
        AND "codeHash" = $2
        AND "usedAt" IS NULL
        AND "expiresAt" > NOW()
      ORDER BY "createdAt" DESC
      LIMIT 1
      `,
      [userId, hashCode(code)]
    );

    if (resetResult.rows.length === 0) {
      await registerResetCodeAttempt(phone, requesterIp, false);
      return Response.json({ error: 'Invalid or expired verification code' }, { status: 400 });
    }

    await registerResetCodeAttempt(phone, requesterIp, true);

    return Response.json({ ok: true, verified: true });
  } catch (error) {
    return Response.json(
      { error: 'Failed to verify reset code', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  } finally {
    if (client) client.release();
  }
}
