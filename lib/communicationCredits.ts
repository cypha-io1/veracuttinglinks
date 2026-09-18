import { pool } from '@/lib/db';

export type CreditChannel = 'sms' | 'email';

type Queryable = {
  query: (text: string, params?: unknown[]) => Promise<{ rows: Array<Record<string, unknown>> }>;
};

type CreditBalance = {
  smsCredits: number;
  emailCredits: number;
};

function creditColumnForChannel(channel: CreditChannel): '"smsCredits"' | '"emailCredits"' {
  return channel === 'email' ? '"emailCredits"' : '"smsCredits"';
}

async function ensureBalanceRow(queryable: Queryable): Promise<void> {
  await queryable.query(
    `
    INSERT INTO "CommunicationCreditBalance" (id, "smsCredits", "emailCredits", "updatedAt")
    VALUES (1, 0, 0, CURRENT_TIMESTAMP)
    ON CONFLICT (id) DO NOTHING
    `,
  );
}

export async function getCommunicationCreditBalance(queryable: Queryable = pool): Promise<CreditBalance> {
  await ensureBalanceRow(queryable);
  const result = await queryable.query(
    'SELECT COALESCE("smsCredits", 0) AS "smsCredits", COALESCE("emailCredits", 0) AS "emailCredits" FROM "CommunicationCreditBalance" WHERE id = 1 LIMIT 1',
  );

  return {
    smsCredits: Number(result.rows[0]?.smsCredits || 0),
    emailCredits: Number(result.rows[0]?.emailCredits || 0),
  };
}

export async function addCommunicationCredits(
  channel: CreditChannel,
  amount: number,
  queryable: Queryable = pool,
): Promise<CreditBalance> {
  const safeAmount = Math.max(0, Math.floor(Number(amount) || 0));
  await ensureBalanceRow(queryable);

  if (safeAmount > 0) {
    const creditColumn = creditColumnForChannel(channel);
    await queryable.query(
      `
      UPDATE "CommunicationCreditBalance"
      SET ${creditColumn} = ${creditColumn} + $1,
          "updatedAt" = CURRENT_TIMESTAMP
      WHERE id = 1
      `,
      [safeAmount],
    );
  }

  return getCommunicationCreditBalance(queryable);
}

export async function reserveCommunicationCredits(
  channel: CreditChannel,
  amount: number,
  queryable: Queryable = pool,
): Promise<{ success: boolean; balance: CreditBalance }> {
  const safeAmount = Math.max(0, Math.floor(Number(amount) || 0));
  await ensureBalanceRow(queryable);

  if (safeAmount <= 0) {
    return { success: true, balance: await getCommunicationCreditBalance(queryable) };
  }

  const creditColumn = creditColumnForChannel(channel);
  const reserved = await queryable.query(
    `
    UPDATE "CommunicationCreditBalance"
    SET ${creditColumn} = ${creditColumn} - $1,
        "updatedAt" = CURRENT_TIMESTAMP
    WHERE id = 1
      AND ${creditColumn} >= $1
    RETURNING "smsCredits", "emailCredits"
    `,
    [safeAmount],
  );

  if (reserved.rows.length > 0) {
    return {
      success: true,
      balance: {
        smsCredits: Number(reserved.rows[0]?.smsCredits || 0),
        emailCredits: Number(reserved.rows[0]?.emailCredits || 0),
      },
    };
  }

  return {
    success: false,
    balance: await getCommunicationCreditBalance(queryable),
  };
}
