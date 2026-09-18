import pg from 'pg';

const { Pool } = pg;

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  const paystackKey = process.env.COMM_PAYSTACK_SECRET_KEY;

  if (!dbUrl) throw new Error('DATABASE_URL is missing');
  if (!paystackKey) throw new Error('COMM_PAYSTACK_SECRET_KEY is missing');

  const pool = new Pool({ connectionString: dbUrl });
  let client;

  try {
    const allTopups = [];
    const perPage = 200;
    const maxPages = 20;

    for (let page = 1; page <= maxPages; page += 1) {
      const response = await fetch(`https://api.paystack.co/transaction?perPage=${perPage}&page=${page}`, {
        headers: { Authorization: `Bearer ${paystackKey}` },
      });

      const payload = await response.json();
      if (!response.ok || !payload?.status || !Array.isArray(payload?.data)) {
        throw new Error(`Failed to fetch Paystack transactions: ${payload?.message || response.status}`);
      }

      const pageTopups = payload.data.filter((tx) => {
        const metadata = tx && typeof tx.metadata === 'object' ? tx.metadata : {};
        return tx?.status === 'success' && metadata?.kind === 'communications_credit_topup';
      });

      allTopups.push(...pageTopups);

      if (payload.data.length < perPage) {
        break;
      }
    }

    const topups = allTopups;

    client = await pool.connect();
    await client.query('BEGIN');

    let credited = 0;
    let skipped = 0;

    for (const tx of topups) {
      const metadata = tx && typeof tx.metadata === 'object' ? tx.metadata : {};
      const reference = String(tx?.reference || '').trim();
      const channel = String(metadata?.channel || '').trim();
      const adminUserId = Number(metadata?.adminUserId || 0);
      const credits = Number(metadata?.credits || 0);
      const amount = Number((Number(tx?.amount || 0) / 100).toFixed(2));

      if (!reference || (channel !== 'sms' && channel !== 'email') || !Number.isInteger(adminUserId) || adminUserId <= 0 || !Number.isInteger(credits) || credits <= 0) {
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
          scannedTopups: topups.length,
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
