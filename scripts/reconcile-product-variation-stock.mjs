import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

function toNonNegativeNumber(value) {
  const parsed = Number(String(value ?? '').trim());
  if (!Number.isFinite(parsed)) return null;
  return Math.max(parsed, 0);
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
      ORDER BY id ASC
      FOR UPDATE
      `,
    );

    let scannedProducts = 0;
    let updatedProducts = 0;
    let updatedVariationRows = 0;
    let updatedProductStockRows = 0;
    const changes = [];

    for (const row of productsResult.rows) {
      scannedProducts += 1;

      const rawVariations = Array.isArray(row.variations) ? row.variations : [];
      if (rawVariations.length === 0) {
        continue;
      }

      const nextVariations = rawVariations.map(variation => ({ ...variation }));
      let localVariationFixes = 0;
      let variationStockTotal = 0;

      for (const variation of nextVariations) {
        const normalized = toNonNegativeNumber(variation.stock);
        const safeStock = normalized === null ? 0 : normalized;

        if (variation.stock !== safeStock) {
          localVariationFixes += 1;
        }

        variation.stock = safeStock;
        variationStockTotal += safeStock;
      }

      const currentProductStock = toNonNegativeNumber(row.stock) ?? 0;
      const needsProductStockUpdate = currentProductStock !== variationStockTotal;
      const needsVariationUpdate = localVariationFixes > 0;

      if (!needsProductStockUpdate && !needsVariationUpdate) {
        continue;
      }

      await client.query(
        `
        UPDATE "Product"
        SET
          variations = $1::jsonb,
          stock = $2,
          "updatedAt" = CURRENT_TIMESTAMP
        WHERE id = $3
        `,
        [JSON.stringify(nextVariations), variationStockTotal, row.id],
      );

      updatedProducts += 1;
      updatedVariationRows += localVariationFixes;
      if (needsProductStockUpdate) {
        updatedProductStockRows += 1;
      }

      changes.push({
        id: row.id,
        name: row.name,
        previousProductStock: row.stock,
        nextProductStock: variationStockTotal,
        fixedVariationRows: localVariationFixes,
      });
    }

    await client.query('COMMIT');

    console.log('Reconciliation complete.');
    console.log(
      JSON.stringify(
        {
          scannedProducts,
          updatedProducts,
          updatedVariationRows,
          updatedProductStockRows,
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
  console.error('Reconciliation failed:', error instanceof Error ? error.message : String(error));
  process.exit(1);
});
