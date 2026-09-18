import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  let client;
  try {
    client = await pool.connect();
    await client.query('BEGIN');

    const adminResult = await client.query(
      `SELECT id, "fullName", phone, COALESCE("smsCredits", 0) AS "smsCredits"
       FROM "UserProfile"
       WHERE role = 'admin'
       ORDER BY id ASC
       LIMIT 1`
    );

    if (adminResult.rows.length === 0) {
      throw new Error('No admin user found to apply package credit');
    }

    const admin = adminResult.rows[0];
    const reference = `manual_ghs250_sms_package_${admin.id}_${Date.now()}`;
    const credits = 100;
    const amount = 250.0;

    await client.query(
      `
      INSERT INTO "CommunicationCreditTopup" ("userProfileId", reference, channel, amount, credits)
      VALUES ($1, $2, 'sms', $3, $4)
      `,
      [admin.id, reference, amount, credits]
    );

    await client.query(
      `
      UPDATE "UserProfile"
      SET "smsCredits" = COALESCE("smsCredits", 0) + $1
      WHERE id = $2
      `,
      [credits, admin.id]
    );

    const updated = await client.query(
      `
      SELECT id, "fullName", phone, COALESCE("smsCredits", 0) AS "smsCredits"
      FROM "UserProfile"
      WHERE id = $1
      LIMIT 1
      `,
      [admin.id]
    );

    await client.query('COMMIT');

    console.log(
      JSON.stringify(
        {
          applied: true,
          package: 'GHS250 SMS Package',
          creditsAdded: credits,
          amountLogged: amount,
          reference,
          admin: updated.rows[0],
        },
        null,
        2
      )
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

main().catch(error => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
