import { createHash, randomInt } from 'crypto';
import { pool } from '@/lib/db';
import { sendSms } from '@/lib/sms';
import { checkForgotRequestAllowed, getRequestIp } from '@/lib/resetThrottle';
import { ensureDbInitialized } from '@/lib/dbInit';

type ForgotRequestPayload = { phone: string };

const hashCode = (code: string) => createHash('sha256').update(code).digest('hex');
const isValidPhone = (value: string) => /^0\d{9}$/.test(value);

export async function POST(request: Request) {
  let client;

  try {
    await ensureDbInitialized();

    const body = (await request.json()) as ForgotRequestPayload;
    const phone = body.phone?.trim();
    const requesterIp = getRequestIp(request);

    if (!phone) {
      return Response.json({ error: 'Phone is required' }, { status: 400 });
    }

    if (!isValidPhone(phone)) {
      return Response.json({ error: 'Phone must be 10 digits and start with 0' }, { status: 400 });
    }

    const rateLimit = await checkForgotRequestAllowed(phone, requesterIp);
    if (!rateLimit.allowed) {
      return Response.json(
        {
          error: 'Too many reset requests. Please try again later.',
          retryAfterSeconds: rateLimit.retryAfterSeconds,
        },
        {
          status: 429,
          headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) },
        }
      );
    }

    client = await pool.connect();
    const userResult = await client.query('SELECT id FROM "UserProfile" WHERE phone = $1 LIMIT 1', [phone]);

    if (userResult.rows.length === 0) {
      return Response.json({ error: 'No account found with this phone number' }, { status: 404 });
    }

    const userId = userResult.rows[0].id as number;
    const code = String(randomInt(100000, 1000000));

    await client.query(
      `
      UPDATE "PasswordReset"
      SET "usedAt" = CURRENT_TIMESTAMP
      WHERE "userProfileId" = $1
        AND "usedAt" IS NULL
      `,
      [userId]
    );

    const insertResult = await client.query(
      `
      INSERT INTO "PasswordReset" ("userProfileId", "codeHash", "expiresAt")
      VALUES ($1, $2, NOW() + INTERVAL '10 minutes')
      RETURNING id
      `,
      [userId, hashCode(code)]
    );

    const resetId = insertResult.rows[0]?.id as number | undefined;

    const smsResult = await sendSms({
      to: phone,
      message: `Your Zhilakaii password reset code is ${code}. It expires in 10 minutes.`,
    });

    if (!smsResult.success) {
      if (resetId) {
        await client.query('UPDATE "PasswordReset" SET "usedAt" = CURRENT_TIMESTAMP WHERE id = $1', [resetId]);
      }
      return Response.json(
        { error: 'Unable to send verification code', details: smsResult.error || 'SMS delivery failed' },
        { status: 502 }
      );
    }

    const payload: Record<string, unknown> = { ok: true };
    if (process.env.NODE_ENV !== 'production') {
      payload.devCode = code;
    }

    return Response.json(payload);
  } catch (error) {
    return Response.json(
      { error: 'Failed to generate reset code', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  } finally {
    if (client) client.release();
  }
}
