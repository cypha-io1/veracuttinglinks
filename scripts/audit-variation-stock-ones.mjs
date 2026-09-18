import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

function normalizeNumeric(value) {
  const parsed = Number(String(value ?? '').trim());
  return Number.isFinite(parsed) ? parsed : null;
}

function parseVariationSelections(raw, separator) {
  return String(raw || '')
    .split(separator)
    .map(part => part.trim())
    .filter(Boolean)
    .flatMap(part => {
      const idx = part.indexOf(':');
      if (idx <= 0) return [];

      const name = part.slice(0, idx).trim();
      const option = part.slice(idx + 1).trim();
      if (!name || !option) return [];

      return [{ name, option }];
    });
}

function parseOrderItemVariations(variationKey, variationLabel) {
  const keySelections = parseVariationSelections(variationKey, '|');
  if (keySelections.length > 0) return keySelections;
  return parseVariationSelections(variationLabel, ',');
}

function variationId(productId, name, option) {
  return `${productId}::${name}::${option}`;
}

async function run() {
  const client = await pool.connect();

  try {
    const productsResult = await client.query(
      `
      SELECT id, name, stock, variations
      FROM "Product"
      WHERE "hasVariations" = TRUE
      ORDER BY id ASC
      `,
    );

    const variationStockOnes = [];
    for (const row of productsResult.rows) {
      const variations = Array.isArray(row.variations) ? row.variations : [];
      for (const variation of variations) {
        const variationStock = normalizeNumeric(variation.stock);
        if (variationStock !== 1) continue;

        variationStockOnes.push({
          productId: row.id,
          productName: row.name,
          productStock: row.stock,
          variationType: String(variation.name || '').trim(),
          variationOption: String(variation.option || '').trim(),
          variationStock,
        });
      }
    }

    const orderItemsResult = await client.query(
      `
      SELECT "productId", quantity, "variationKey", "variationLabel"
      FROM "OrderItem"
      WHERE "productId" IS NOT NULL
        AND quantity > 0
      `,
    );

    const soldByVariation = new Map();

    for (const row of orderItemsResult.rows) {
      const selections = parseOrderItemVariations(row.variationKey, row.variationLabel);
      for (const selection of selections) {
        const key = variationId(row.productId, selection.name, selection.option);
        soldByVariation.set(key, (soldByVariation.get(key) || 0) + Number(row.quantity || 0));
      }
    }

    const flagged = variationStockOnes
      .map(item => {
        const soldQty = soldByVariation.get(variationId(item.productId, item.variationType, item.variationOption)) || 0;
        return { ...item, soldQty };
      })
      .filter(item => item.soldQty >= item.variationStock)
      .sort((a, b) => a.productId - b.productId);

    console.log(
      JSON.stringify(
        {
          totalVariationStockOnes: variationStockOnes.length,
          flaggedCount: flagged.length,
          flagged,
        },
        null,
        2,
      ),
    );
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(error => {
  console.error('Audit failed:', error instanceof Error ? error.message : String(error));
  process.exit(1);
});
