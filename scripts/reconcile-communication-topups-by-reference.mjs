import pg from 'pg';

const { Pool } = pg;

async function verifyReference(reference, secretKey) {
  const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${secretKey}` },
    cache: 'no-store',
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload?.status || payload?.data?.status !== 'success') {
    throw new Error(payload?.message || `Failed to verify ${reference}`);
  }

  return payload.data;
}

async function main() {
  const refs = process.argv.slice(2).map(value => value.trim()).filter(Boolean);
  if (refs.length === 0) {
    console.error('Usage: node --env-file=.env.local scripts/reconcile-communication-topups-by-reference.mjs <reference1> <reference2> ...');
    process.exit(1);
  }

  const dbUrl = process.env.DATABASE_URL;
  const paystackKey = process.env.COMM_PAYSTACK_SECRET_KEY;

  if (!dbUrl) throw new Error('DATABASE_URL is missing');
  if (!paystackKey) throw new Error('COMM_PAYSTACK_SECRET_KEY is missing');

  const pool = new Pool({ connectionString: dbUrl });
  let client;

  try {
    client = await pool.connect();
    await client.query('BEGIN');

    let credited = 0;
    let skipped = 0;

    for (const reference of refs) {
      const data = await verifyReference(reference, paystackKey);
      const metadata = data?.metadata || {};
      const kind = String(metadata?.kind || '');
      const channel = String(metadata?.channel || '').trim();
      const adminUserId = Number(metadata?.adminUserId || 0);
      const credits = Number(metadata?.credits || 0);
      const amount = Number((Number(data?.amount || 0) / 100).toFixed(2));

      if (kind !== 'communications_credit_topup' || (channel !== 'sms' && channel !== 'email') || !Number.isInteger(adminUserId) || adminUserId <= 0 || !Number.isInteger(credits) || credits <= 0) {
        skipped += 1;
        continue;
      }

      const inserted = await client.query(
        `
        INSERT INTO "CommunicationCreditTopup" ("userProfileId", reference, channel, amount, credits)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (reference) DO NOTHING
        RETURNING id
        `,
        [adminUserId, reference, channel, amount, credits],
      );

      if ((inserted.rowCount || 0) > 0) {
        const creditColumn = channel === 'email' ? '"emailCredits"' : '"smsCredits"';
        await client.query(
          `UPDATE "UserProfile" SET ${creditColumn} = ${creditColumn} + $1 WHERE id = $2`,
          [credits, adminUserId],
        );
        credited += 1;
      } else {
        skipped += 1;
      }
    }

    await client.query('COMMIT');

    console.log(
      JSON.stringify(
        {
          referencesProcessed: refs.length,
          newlyCredited: credited,
          skippedAlreadyAppliedOrInvalid: skipped,
        },
        null,
        2,
      ),
    );
  } catch (error) {
    if (client) {
      try {
        await client.query('ROLLBACK');
      } catch {
        // Ignore rollback failure.
      }
    }
    throw error;
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
