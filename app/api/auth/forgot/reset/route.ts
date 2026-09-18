import { createHash } from 'crypto';
import { hashPassword } from '@/lib/serverAuth';
import { sendEmail } from '@/lib/email';
import { pool } from '@/lib/db';
import { checkResetCodeAttemptAllowed, getRequestIp, registerResetCodeAttempt } from '@/lib/resetThrottle';
import { ensureDbInitialized } from '@/lib/dbInit';

type ResetPayload = {
  phone: string;
  code: string;
  newPassword: string;
};

const hashCode = (code: string) => createHash('sha256').update(code).digest('hex');

export async function POST(request: Request) {
  let client;

  try {
    await ensureDbInitialized();

    const body = (await request.json()) as ResetPayload;
    const phone = body.phone?.trim();
    const code = body.code?.trim();
    const newPassword = body.newPassword || '';
    const requesterIp = getRequestIp(request);

    if (!phone || !code || newPassword.length < 6) {
      return Response.json(
        { error: 'Phone, reset code, and new password (min 6 chars) are required' },
        { status: 400 }
      );
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
    await client.query('BEGIN');

    const userResult = await client.query('SELECT id FROM "UserProfile" WHERE phone = $1 LIMIT 1', [phone]);
    if (userResult.rows.length === 0) {
      await client.query('ROLLBACK');
      await registerResetCodeAttempt(phone, requesterIp, false);
      return Response.json({ error: 'Invalid reset request' }, { status: 400 });
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
      await client.query('ROLLBACK');
      await registerResetCodeAttempt(phone, requesterIp, false);
      return Response.json({ error: 'Invalid or expired reset code' }, { status: 400 });
    }

    const resetId = resetResult.rows[0].id as number;
    const userDetails = await client.query('SELECT "fullName", email FROM "UserProfile" WHERE id = $1', [userId]);
    const user = userDetails.rows[0] as { fullName: string; email: string | null };

    await client.query('UPDATE "UserProfile" SET "passwordHash" = $1, "updatedAt" = CURRENT_TIMESTAMP WHERE id = $2', [
      hashPassword(newPassword),
      userId,
    ]);
    await client.query('UPDATE "PasswordReset" SET "usedAt" = CURRENT_TIMESTAMP WHERE id = $1', [resetId]);

    await client.query('COMMIT');
    await registerResetCodeAttempt(phone, requesterIp, true);

    if (user.email) {
      await sendEmail({
        to: user.email,
        subject: 'Password Reset Successful',
        template: 'password_reset',
        data: {
          customerName: user.fullName,
          code: undefined,
        },
      });
    }

    return Response.json({ ok: true });
  } catch (error) {
    if (client) await client.query('ROLLBACK');
    return Response.json(
      { error: 'Failed to reset password', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  } finally {
    if (client) client.release();
  }
}
