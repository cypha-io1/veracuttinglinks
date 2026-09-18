import { randomBytes, scryptSync, timingSafeEqual, createHash } from 'crypto';
import { pool } from '@/lib/db';

export type AuthUser = {
  id: number;
  fullName: string;
  phone: string;
  email: string | null;
  address: string | null;
  city: string | null;
  role: string;
};

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const key = scryptSync(password, salt, 64);
  return `${salt.toString('hex')}:${key.toString('hex')}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [saltHex, keyHex] = stored.split(':');
  if (!saltHex || !keyHex) return false;

  const salt = Buffer.from(saltHex, 'hex');
  const key = Buffer.from(keyHex, 'hex');
  const derived = scryptSync(password, salt, key.length);
  return timingSafeEqual(key, derived);
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function parseCookie(cookieHeader: string | null, cookieName: string): string | null {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(';').map(part => part.trim());
  const match = parts.find(part => part.startsWith(`${cookieName}=`));
  if (!match) return null;
  return decodeURIComponent(match.slice(cookieName.length + 1));
}

export async function createSessionForUser(userId: number): Promise<string> {
  const token = randomBytes(32).toString('hex');
  const tokenHash = hashToken(token);

  let client;
  try {
    client = await pool.connect();
    await client.query(
      `
      INSERT INTO "UserSession" ("userProfileId", "tokenHash", "expiresAt")
      VALUES ($1, $2, NOW() + INTERVAL '30 days')
      `,
      [userId, tokenHash]
    );
    return token;
  } finally {
    if (client) client.release();
  }
}

export async function deleteSessionByToken(token: string): Promise<void> {
  const tokenHash = hashToken(token);
  let client;
  try {
    client = await pool.connect();
    await client.query('DELETE FROM "UserSession" WHERE "tokenHash" = $1', [tokenHash]);
  } finally {
    if (client) client.release();
  }
}

export async function getUserBySessionToken(token: string): Promise<AuthUser | null> {
  const tokenHash = hashToken(token);
  let client;

  try {
    client = await pool.connect();
    let result;
    try {
      result = await client.query(
        `
        SELECT
          u.id,
          u."fullName",
          u.phone,
          u.email,
          u.address,
          u.city,
          COALESCE(u.role, 'user') AS role
        FROM "UserSession" s
        JOIN "UserProfile" u ON u.id = s."userProfileId"
        WHERE s."tokenHash" = $1
          AND s."expiresAt" > NOW()
        LIMIT 1
        `,
        [tokenHash]
      );
    } catch (error) {
      if ((error as { code?: string }).code !== '42703') {
        throw error;
      }

      // Backward-compat for environments where role column hasn't been added yet.
      result = await client.query(
        `
        SELECT
          u.id,
          u."fullName",
          u.phone,
          u.email,
          u.address,
          u.city,
          'user' AS role
        FROM "UserSession" s
        JOIN "UserProfile" u ON u.id = s."userProfileId"
        WHERE s."tokenHash" = $1
          AND s."expiresAt" > NOW()
        LIMIT 1
        `,
        [tokenHash]
      );
    }

    if (result.rows.length === 0) {
      return null;
    }

    await client.query(
      'UPDATE "UserSession" SET "lastSeenAt" = CURRENT_TIMESTAMP WHERE "tokenHash" = $1',
      [tokenHash]
    );

    return result.rows[0] as AuthUser;
  } finally {
    if (client) client.release();
  }
}

export async function getUserByPhone(phone: string): Promise<(AuthUser & { passwordHash: string | null }) | null> {
  let client;
  try {
    client = await pool.connect();
    let result;
    try {
      result = await client.query(
        `
        SELECT
          id,
          "fullName",
          phone,
          "passwordHash" AS "passwordHash",
          email,
          address,
          city,
          COALESCE(role, 'user') AS role
        FROM "UserProfile"
        WHERE phone = $1
        LIMIT 1
        `,
        [phone]
      );
    } catch (error) {
      if ((error as { code?: string }).code !== '42703') {
        throw error;
      }

      // Backward-compat for environments where role column hasn't been added yet.
      result = await client.query(
        `
        SELECT
          id,
          "fullName",
          phone,
          "passwordHash" AS "passwordHash",
          email,
          address,
          city,
          'user' AS role
        FROM "UserProfile"
        WHERE phone = $1
        LIMIT 1
        `,
        [phone]
      );
    }

    if (result.rows.length === 0) return null;
    return result.rows[0] as AuthUser & { passwordHash: string | null };
  } finally {
    if (client) client.release();
  }
}
