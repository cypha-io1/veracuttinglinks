import pg from 'pg';
import { pool } from '@/lib/db';

export type PromotionType = 'percentage' | 'fixed';

export type PromotionRule = {
  id: number;
  code: string;
  type: PromotionType;
  value: number;
  minOrder: number;
  active: boolean;
  startsAt: string | null;
  endsAt: string | null;
  usageCount: number;
  maxUsage: number | null;
  createdAt: string;
  updatedAt: string;
};

export type PromotionEvaluation = {
  code: string;
  discountAmount: number;
  totalBeforeDiscount: number;
  totalAfterDiscount: number;
};

type CreatePromotionInput = {
  code: string;
  type: PromotionType;
  value: number;
  minOrder?: number;
  active?: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
  maxUsage?: number | null;
};

type UpdatePromotionInput = Partial<CreatePromotionInput>;

const DEFAULT_PROMOTIONS: Array<CreatePromotionInput> = [
  {
    code: 'PIZZA20',
    type: 'percentage',
    value: 20,
    minOrder: 50,
    active: true,
    startsAt: '2024-01-01T00:00:00.000Z',
    endsAt: '2099-12-31T23:59:59.999Z',
    maxUsage: null,
  },
  {
    code: 'SAVE50',
    type: 'fixed',
    value: 50,
    minOrder: 150,
    active: true,
    startsAt: '2024-01-10T00:00:00.000Z',
    endsAt: '2099-12-31T23:59:59.999Z',
    maxUsage: null,
  },
  {
    code: 'WELCOME15',
    type: 'percentage',
    value: 15,
    minOrder: 30,
    active: true,
    startsAt: '2024-01-01T00:00:00.000Z',
    endsAt: '2099-12-31T23:59:59.999Z',
    maxUsage: null,
  },
];

function normalizeCode(code: string) {
  return code.trim().toUpperCase();
}

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toIso(value: string | null | undefined): string | null {
  const parsed = parseDate(value);
  return parsed ? parsed.toISOString() : null;
}

function roundCurrency(value: number) {
  return Math.round(Math.max(0, value) * 100) / 100;
}

function mapRowToPromotion(row: Record<string, unknown>): PromotionRule {
  return {
    id: Number(row.id),
    code: String(row.code),
    type: (String(row.type) as PromotionType) || 'fixed',
    value: Number(row.value) || 0,
    minOrder: Number(row.minOrder) || 0,
    active: Boolean(row.active),
    startsAt: row.startsAt ? new Date(String(row.startsAt)).toISOString() : null,
    endsAt: row.endsAt ? new Date(String(row.endsAt)).toISOString() : null,
    usageCount: Number(row.usageCount) || 0,
    maxUsage: row.maxUsage === null || row.maxUsage === undefined ? null : Number(row.maxUsage),
    createdAt: new Date(String(row.createdAt)).toISOString(),
    updatedAt: new Date(String(row.updatedAt)).toISOString(),
  };
}

async function ensurePromotionTable(client: pg.PoolClient) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS "Promotion" (
      id SERIAL PRIMARY KEY,
      code VARCHAR(64) NOT NULL UNIQUE,
      type VARCHAR(16) NOT NULL CHECK (type IN ('percentage', 'fixed')),
      value NUMERIC(12, 2) NOT NULL,
      "minOrder" NUMERIC(12, 2) NOT NULL DEFAULT 0,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      "startsAt" TIMESTAMP NULL,
      "endsAt" TIMESTAMP NULL,
      "usageCount" INTEGER NOT NULL DEFAULT 0,
      "maxUsage" INTEGER NULL,
      "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  for (const promo of DEFAULT_PROMOTIONS) {
    await client.query(
      `
      INSERT INTO "Promotion" (code, type, value, "minOrder", active, "startsAt", "endsAt", "maxUsage")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (code) DO NOTHING
      `,
      [
        normalizeCode(promo.code),
        promo.type,
        roundCurrency(Number(promo.value) || 0),
        roundCurrency(Number(promo.minOrder || 0)),
        promo.active !== false,
        toIso(promo.startsAt),
        toIso(promo.endsAt),
        promo.maxUsage ?? null,
      ]
    );
  }
}

function isRuleActive(rule: PromotionRule, now = new Date()): boolean {
  if (!rule.active) return false;

  const startsAt = parseDate(rule.startsAt);
  if (startsAt && now < startsAt) return false;

  const endsAt = parseDate(rule.endsAt);
  if (endsAt && now > endsAt) return false;

  if (typeof rule.maxUsage === 'number' && rule.maxUsage >= 0 && rule.usageCount >= rule.maxUsage) {
    return false;
  }

  return true;
}

export async function getPromotionByCode(code: string): Promise<PromotionRule | null> {
  const normalizedCode = normalizeCode(code);
  if (!normalizedCode) return null;

  let client;
  try {
    client = await pool.connect();
    await ensurePromotionTable(client);

    const result = await client.query(
      `
      SELECT id, code, type, value, "minOrder", active, "startsAt", "endsAt", "usageCount", "maxUsage", "createdAt", "updatedAt"
      FROM "Promotion"
      WHERE code = $1
      LIMIT 1
      `,
      [normalizedCode]
    );

    if (result.rows.length === 0) return null;
    return mapRowToPromotion(result.rows[0] as Record<string, unknown>);
  } finally {
    if (client) client.release();
  }
}

export async function listPromotions(): Promise<PromotionRule[]> {
  let client;
  try {
    client = await pool.connect();
    await ensurePromotionTable(client);

    const result = await client.query(
      `
      SELECT id, code, type, value, "minOrder", active, "startsAt", "endsAt", "usageCount", "maxUsage", "createdAt", "updatedAt"
      FROM "Promotion"
      ORDER BY code ASC
      `
    );

    return result.rows.map(row => mapRowToPromotion(row as Record<string, unknown>));
  } finally {
    if (client) client.release();
  }
}

export async function listActivePromotions(): Promise<PromotionRule[]> {
  const all = await listPromotions();
  return all.filter(rule => isRuleActive(rule));
}

export async function createPromotion(input: CreatePromotionInput): Promise<PromotionRule> {
  const code = normalizeCode(input.code);
  if (!code) {
    throw new Error('Promo code is required');
  }

  if (!(input.type === 'percentage' || input.type === 'fixed')) {
    throw new Error('Promotion type must be percentage or fixed');
  }

  const value = roundCurrency(Number(input.value) || 0);
  if (value <= 0) {
    throw new Error('Promotion value must be greater than zero');
  }

  let client;
  try {
    client = await pool.connect();
    await ensurePromotionTable(client);

    const result = await client.query(
      `
      INSERT INTO "Promotion" (code, type, value, "minOrder", active, "startsAt", "endsAt", "maxUsage")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, code, type, value, "minOrder", active, "startsAt", "endsAt", "usageCount", "maxUsage", "createdAt", "updatedAt"
      `,
      [
        code,
        input.type,
        value,
        roundCurrency(Number(input.minOrder || 0)),
        input.active !== false,
        toIso(input.startsAt),
        toIso(input.endsAt),
        input.maxUsage ?? null,
      ]
    );

    return mapRowToPromotion(result.rows[0] as Record<string, unknown>);
  } finally {
    if (client) client.release();
  }
}

export async function updatePromotion(id: number, input: UpdatePromotionInput): Promise<PromotionRule | null> {
  if (!Number.isInteger(id) || id <= 0) return null;

  const updates: string[] = [];
  const values: Array<string | number | boolean | null> = [];

  if (typeof input.code === 'string') {
    updates.push(`code = $${updates.length + 1}`);
    values.push(normalizeCode(input.code));
  }

  if (input.type === 'percentage' || input.type === 'fixed') {
    updates.push(`type = $${updates.length + 1}`);
    values.push(input.type);
  }

  if (typeof input.value === 'number') {
    updates.push(`value = $${updates.length + 1}`);
    values.push(roundCurrency(input.value));
  }

  if (typeof input.minOrder === 'number') {
    updates.push(`"minOrder" = $${updates.length + 1}`);
    values.push(roundCurrency(input.minOrder));
  }

  if (typeof input.active === 'boolean') {
    updates.push(`active = $${updates.length + 1}`);
    values.push(input.active);
  }

  if (Object.prototype.hasOwnProperty.call(input, 'startsAt')) {
    updates.push(`"startsAt" = $${updates.length + 1}`);
    values.push(toIso(input.startsAt ?? null));
  }

  if (Object.prototype.hasOwnProperty.call(input, 'endsAt')) {
    updates.push(`"endsAt" = $${updates.length + 1}`);
    values.push(toIso(input.endsAt ?? null));
  }

  if (Object.prototype.hasOwnProperty.call(input, 'maxUsage')) {
    updates.push(`"maxUsage" = $${updates.length + 1}`);
    values.push(input.maxUsage ?? null);
  }

  if (updates.length === 0) return null;

  let client;
  try {
    client = await pool.connect();
    await ensurePromotionTable(client);

    values.push(id);

    const result = await client.query(
      `
      UPDATE "Promotion"
      SET ${updates.join(', ')}, "updatedAt" = CURRENT_TIMESTAMP
      WHERE id = $${values.length}
      RETURNING id, code, type, value, "minOrder", active, "startsAt", "endsAt", "usageCount", "maxUsage", "createdAt", "updatedAt"
      `,
      values
    );

    if (result.rows.length === 0) return null;
    return mapRowToPromotion(result.rows[0] as Record<string, unknown>);
  } finally {
    if (client) client.release();
  }
}

export async function deletePromotion(id: number): Promise<boolean> {
  if (!Number.isInteger(id) || id <= 0) return false;

  let client;
  try {
    client = await pool.connect();
    await ensurePromotionTable(client);
    const result = await client.query('DELETE FROM "Promotion" WHERE id = $1 RETURNING id', [id]);
    return result.rows.length > 0;
  } finally {
    if (client) client.release();
  }
}

export async function evaluatePromotion(code: string, totalBeforeDiscount: number): Promise<PromotionEvaluation | null> {
  const rule = await getPromotionByCode(code);
  if (!rule || !isRuleActive(rule)) return null;

  const safeTotal = roundCurrency(Number(totalBeforeDiscount) || 0);
  if (safeTotal <= 0) return null;

  const minOrder = roundCurrency(Number(rule.minOrder || 0));
  if (minOrder > 0 && safeTotal < minOrder) return null;

  const rawDiscount =
    rule.type === 'percentage'
      ? (safeTotal * Math.max(0, rule.value)) / 100
      : Math.max(0, rule.value);

  const discountAmount = Math.min(safeTotal, roundCurrency(rawDiscount));
  const totalAfterDiscount = roundCurrency(safeTotal - discountAmount);

  return {
    code: rule.code,
    discountAmount,
    totalBeforeDiscount: safeTotal,
    totalAfterDiscount,
  };
}
