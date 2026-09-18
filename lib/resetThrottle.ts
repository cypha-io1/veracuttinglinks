import { pool } from '@/lib/db';

type LimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
};

const REQUEST_PHONE_LIMIT = 3;
const REQUEST_PHONE_WINDOW_MS = 10 * 60 * 1000;
const REQUEST_IP_LIMIT = 25;
const REQUEST_IP_WINDOW_MS = 15 * 60 * 1000;

const VERIFY_LOCK_AFTER_FAILURES = 5;
const VERIFY_LOCK_MS = 10 * 60 * 1000;
const THROTTLE_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;
const PRUNE_INTERVAL_MS = 60 * 60 * 1000;

const SCOPE_REQUEST_PHONE = 'forgot_request_phone';
const SCOPE_REQUEST_IP = 'forgot_request_ip';
const SCOPE_VERIFY_ATTEMPT = 'forgot_verify_attempt';

let nextPruneAt = 0;
let pruneInFlight: Promise<void> | null = null;

type ThrottleRow = {
  attemptCount: number;
  windowStart: Date;
  lockUntil: Date | null;
};

function formatPhone(phone: string): string {
  return String(phone || '').trim();
}

function formatIp(ip: string): string {
  return String(ip || '').trim() || 'unknown';
}

function toRetrySeconds(retryAtMs: number): number {
  return Math.max(1, Math.ceil((retryAtMs - Date.now()) / 1000));
}

async function pruneOldThrottleRows(): Promise<void> {
  const cutoff = new Date(Date.now() - THROTTLE_RETENTION_MS);

  let client;
  try {
    client = await pool.connect();
    await client.query(
      `
      DELETE FROM "PasswordResetThrottle"
      WHERE "updatedAt" < $1
      `,
      [cutoff]
    );
  } finally {
    if (client) client.release();
  }
}

function maybePruneThrottleRows() {
  const now = Date.now();
  if (pruneInFlight || now < nextPruneAt) {
    return;
  }

  nextPruneAt = now + PRUNE_INTERVAL_MS;
  pruneInFlight = pruneOldThrottleRows()
    .catch(() => {
      // Best-effort cleanup only; request flow should continue on prune failures.
    })
    .finally(() => {
      pruneInFlight = null;
    });
}

async function consumeWindowLimit(scope: string, identifier: string, limit: number, windowMs: number): Promise<LimitResult> {
  let client;

  try {
    client = await pool.connect();
    await client.query('BEGIN');

    const nowMs = Date.now();
    const rowResult = await client.query(
      `
      SELECT "attemptCount" AS "attemptCount", "windowStart" AS "windowStart", "lockUntil" AS "lockUntil"
      FROM "PasswordResetThrottle"
      WHERE scope = $1 AND identifier = $2
      FOR UPDATE
      `,
      [scope, identifier]
    );

    if (rowResult.rows.length === 0) {
      await client.query(
        `
        INSERT INTO "PasswordResetThrottle" (scope, identifier, "attemptCount", "windowStart")
        VALUES ($1, $2, 1, CURRENT_TIMESTAMP)
        `,
        [scope, identifier]
      );

      await client.query('COMMIT');
      return { allowed: true, retryAfterSeconds: 0 };
    }

    const row = rowResult.rows[0] as ThrottleRow;
    const windowStartMs = new Date(row.windowStart).getTime();
    const windowExpired = nowMs - windowStartMs >= windowMs;

    if (windowExpired) {
      await client.query(
        `
        UPDATE "PasswordResetThrottle"
        SET "attemptCount" = 1,
            "windowStart" = CURRENT_TIMESTAMP,
            "updatedAt" = CURRENT_TIMESTAMP
        WHERE scope = $1 AND identifier = $2
        `,
        [scope, identifier]
      );

      await client.query('COMMIT');
      return { allowed: true, retryAfterSeconds: 0 };
    }

    if (row.attemptCount >= limit) {
      await client.query('COMMIT');
      return {
        allowed: false,
        retryAfterSeconds: toRetrySeconds(windowStartMs + windowMs),
      };
    }

    await client.query(
      `
      UPDATE "PasswordResetThrottle"
      SET "attemptCount" = "attemptCount" + 1,
          "updatedAt" = CURRENT_TIMESTAMP
      WHERE scope = $1 AND identifier = $2
      `,
      [scope, identifier]
    );

    await client.query('COMMIT');
    return { allowed: true, retryAfterSeconds: 0 };
  } catch (error) {
    if (client) await client.query('ROLLBACK');
    throw error;
  } finally {
    if (client) client.release();
  }
}

export function getRequestIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const first = forwardedFor.split(',')[0]?.trim();
    if (first) return first;
  }

  const realIp = request.headers.get('x-real-ip')?.trim();
  if (realIp) return realIp;

  const cloudflareIp = request.headers.get('cf-connecting-ip')?.trim();
  if (cloudflareIp) return cloudflareIp;

  return 'unknown';
}

export async function checkForgotRequestAllowed(phone: string, ip: string): Promise<LimitResult> {
  maybePruneThrottleRows();

  const byPhone = await consumeWindowLimit(
    SCOPE_REQUEST_PHONE,
    formatPhone(phone),
    REQUEST_PHONE_LIMIT,
    REQUEST_PHONE_WINDOW_MS
  );

  if (!byPhone.allowed) {
    return byPhone;
  }

  return consumeWindowLimit(SCOPE_REQUEST_IP, formatIp(ip), REQUEST_IP_LIMIT, REQUEST_IP_WINDOW_MS);
}

export async function checkResetCodeAttemptAllowed(phone: string, ip: string): Promise<LimitResult> {
  maybePruneThrottleRows();

  let client;

  try {
    client = await pool.connect();

    const result = await client.query(
      `
      SELECT "lockUntil" AS "lockUntil"
      FROM "PasswordResetThrottle"
      WHERE scope = $1 AND identifier = $2
      LIMIT 1
      `,
      [SCOPE_VERIFY_ATTEMPT, `${formatPhone(phone)}:${formatIp(ip)}`]
    );

    if (result.rows.length === 0) {
      return { allowed: true, retryAfterSeconds: 0 };
    }

    const row = result.rows[0] as { lockUntil: Date | null };
    if (!row.lockUntil) {
      return { allowed: true, retryAfterSeconds: 0 };
    }

    const lockUntilMs = new Date(row.lockUntil).getTime();
    if (lockUntilMs <= Date.now()) {
      return { allowed: true, retryAfterSeconds: 0 };
    }

    return {
      allowed: false,
      retryAfterSeconds: toRetrySeconds(lockUntilMs),
    };
  } finally {
    if (client) client.release();
  }
}

export async function registerResetCodeAttempt(phone: string, ip: string, success: boolean): Promise<void> {
  maybePruneThrottleRows();

  const identifier = `${formatPhone(phone)}:${formatIp(ip)}`;
  let client;

  try {
    client = await pool.connect();
    await client.query('BEGIN');

    if (success) {
      await client.query(
        'DELETE FROM "PasswordResetThrottle" WHERE scope = $1 AND identifier = $2',
        [SCOPE_VERIFY_ATTEMPT, identifier]
      );
      await client.query('COMMIT');
      return;
    }

    const rowResult = await client.query(
      `
      SELECT "attemptCount" AS "attemptCount", "lockUntil" AS "lockUntil"
      FROM "PasswordResetThrottle"
      WHERE scope = $1 AND identifier = $2
      FOR UPDATE
      `,
      [SCOPE_VERIFY_ATTEMPT, identifier]
    );

    const now = new Date();
    const lockUntil = new Date(now.getTime() + VERIFY_LOCK_MS);

    if (rowResult.rows.length === 0) {
      await client.query(
        `
        INSERT INTO "PasswordResetThrottle" (scope, identifier, "attemptCount", "windowStart", "lockUntil")
        VALUES ($1, $2, 1, CURRENT_TIMESTAMP, NULL)
        `,
        [SCOPE_VERIFY_ATTEMPT, identifier]
      );
      await client.query('COMMIT');
      return;
    }

    const current = rowResult.rows[0] as { attemptCount: number; lockUntil: Date | null };
    const isCurrentlyLocked = current.lockUntil && new Date(current.lockUntil).getTime() > Date.now();

    if (isCurrentlyLocked) {
      await client.query('COMMIT');
      return;
    }

    const nextFailures = current.attemptCount + 1;

    if (nextFailures >= VERIFY_LOCK_AFTER_FAILURES) {
      await client.query(
        `
        UPDATE "PasswordResetThrottle"
        SET "attemptCount" = 0,
            "lockUntil" = $3,
            "windowStart" = CURRENT_TIMESTAMP,
            "updatedAt" = CURRENT_TIMESTAMP
        WHERE scope = $1 AND identifier = $2
        `,
        [SCOPE_VERIFY_ATTEMPT, identifier, lockUntil]
      );
      await client.query('COMMIT');
      return;
    }

    await client.query(
      `
      UPDATE "PasswordResetThrottle"
      SET "attemptCount" = $3,
          "lockUntil" = NULL,
          "updatedAt" = CURRENT_TIMESTAMP
      WHERE scope = $1 AND identifier = $2
      `,
      [SCOPE_VERIFY_ATTEMPT, identifier, nextFailures]
    );

    await client.query('COMMIT');
  } catch (error) {
    if (client) await client.query('ROLLBACK');
    throw error;
  } finally {
    if (client) client.release();
  }
}
