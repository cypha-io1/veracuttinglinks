import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

function normalizeNumeric(value) {
  const parsed = Number(String(value ?? '').trim());
  return Number.isFinite(parsed) ? parsed : null;
}

async function run() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const productsResult = await client.query(
      `
      SELECT id, name, stock, variations
      FROM "Product"
      WHERE "hasVariations" = TRUE
        AND COALESCE(stock, 0) <= 0
        AND variations IS NOT NULL
      ORDER BY id ASC
      FOR UPDATE
      `,
    );

    let scannedProducts = 0;
    let updatedProducts = 0;
    let fixedVariationRows = 0;
    const changes = [];

    for (const row of productsResult.rows) {
      scannedProducts += 1;

      const variations = Array.isArray(row.variations) ? row.variations.map(v => ({ ...v })) : [];
      if (variations.length === 0) continue;

      let localFixCount = 0;

      for (const variation of variations) {
        const stockValue = normalizeNumeric(variation.stock);
        if (stockValue === 1) {
          variation.stock = 0;
          localFixCount += 1;
        }
      }

      if (localFixCount === 0) continue;

      await client.query(
        `
        UPDATE "Product"
        SET variations = $1::jsonb,
            "updatedAt" = CURRENT_TIMESTAMP
        WHERE id = $2
        `,
        [JSON.stringify(variations), row.id],
      );

      updatedProducts += 1;
      fixedVariationRows += localFixCount;
      changes.push({
        id: row.id,
        name: row.name,
        productStock: row.stock,
        fixedVariations: localFixCount,
      });
    }

    await client.query('COMMIT');

    console.log('Repair complete.');
    console.log(
      JSON.stringify(
        {
          scannedProducts,
          updatedProducts,
          fixedVariationRows,
          changes,
        },
        null,
        2,
      ),
    );
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(error => {
  console.error('Repair failed:', error instanceof Error ? error.message : String(error));
  process.exit(1);
});
