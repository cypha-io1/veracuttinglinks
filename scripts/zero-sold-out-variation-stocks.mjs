import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

function normalizeNumeric(value) {
  const parsed = Number(String(value ?? '').trim());
  return Number.isFinite(parsed) ? parsed : null;
}

function parseSelections(raw, separator) {
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
  const keySelections = parseSelections(variationKey, '|');
  if (keySelections.length > 0) return keySelections;
  return parseSelections(variationLabel, ',');
}

function variationId(productId, name, option) {
  return `${productId}::${name}::${option}`;
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

    const variationRows = [];
    const variationMap = new Map();

    for (const row of productsResult.rows) {
      const variations = Array.isArray(row.variations) ? row.variations : [];
      for (const variation of variations) {
        const stock = normalizeNumeric(variation.stock);
        if (stock === null || stock <= 0) continue;

        const item = {
          productId: row.id,
          productName: row.name,
          productStock: normalizeNumeric(row.stock),
          variationType: String(variation.name || '').trim(),
          variationOption: String(variation.option || '').trim(),
          currentStock: stock,
        };

        variationRows.push(item);
        variationMap.set(variationId(item.productId, item.variationType, item.variationOption), item);
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

    const flagged = variationRows
      .map(item => {
        const soldQty = soldByVariation.get(variationId(item.productId, item.variationType, item.variationOption)) || 0;
        return { ...item, soldQty };
      })
      .filter(item => item.soldQty > 0 && item.soldQty >= item.currentStock)
      .sort((a, b) => a.productId - b.productId);

    let updatedProducts = 0;
    let updatedVariationRows = 0;
    const changes = [];

    const byProduct = new Map();
    for (const item of flagged) {
      const list = byProduct.get(item.productId) || [];
      list.push(item);
      byProduct.set(item.productId, list);
    }

    for (const [productId, items] of byProduct.entries()) {
      const productRow = productsResult.rows.find(row => row.id === productId);
      if (!productRow) continue;

      const nextVariations = (Array.isArray(productRow.variations) ? productRow.variations : []).map(variation => ({ ...variation }));
      let localUpdates = 0;

      for (const item of items) {
        const idx = nextVariations.findIndex(variation =>
          String(variation.name || '').trim() === item.variationType &&
          String(variation.option || '').trim() === item.variationOption,
        );

        if (idx < 0) continue;
        if (normalizeNumeric(nextVariations[idx].stock) === 0) continue;

        nextVariations[idx].stock = 0;
        localUpdates += 1;
      }

      if (localUpdates === 0) continue;

      const nextStockTotal = nextVariations.reduce((sum, variation) => {
        const stock = normalizeNumeric(variation.stock);
        return sum + (stock === null ? 0 : stock);
      }, 0);

      await client.query(
        `
        UPDATE "Product"
        SET variations = $1::jsonb,
            stock = $2,
            "updatedAt" = CURRENT_TIMESTAMP
        WHERE id = $3
        `,
        [JSON.stringify(nextVariations), nextStockTotal, productId],
      );

      updatedProducts += 1;
      updatedVariationRows += localUpdates;
      changes.push({
        productId,
        productName: productRow.name,
        fixedVariationRows: localUpdates,
        nextProductStock: nextStockTotal,
      });
    }

    await client.query('COMMIT');

    console.log('Sold-out variation reconciliation complete.');
    console.log(
      JSON.stringify(
        {
          scannedVariationRows: variationRows.length,
          flaggedCount: flagged.length,
          updatedProducts,
          updatedVariationRows,
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
  console.error('Sold-out variation reconciliation failed:', error instanceof Error ? error.message : String(error));
  process.exit(1);
});
