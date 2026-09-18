import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

function normalizeVariationText(value) {
  return String(value || '')
    .replace(/\s*\|\s*/g, ', ')
    .replace(/\s*;\s*/g, ', ')
    .replace(/\s*,\s*/g, ', ')
    .replace(/\s*:\s*/g, ': ')
    .replace(/\s+/g, ' ')
    .trim();
}

function variationLabelFromKey(key) {
  const normalized = String(key || '').trim();
  if (!normalized) return '';

  const pairs = normalized
    .split('|')
    .map(part => part.trim())
    .filter(Boolean)
    .map(part => {
      const [left, ...rest] = part.split(':');
      if (!left) return '';
      const right = rest.join(':').trim();
      return right ? `${left.trim()}: ${right}` : left.trim();
    })
    .filter(Boolean);

  return normalizeVariationText(pairs.join(', '));
}

function inferVariationFromProductName(productName) {
  const source = String(productName || '').trim();
  if (!source) return '';

  const parenthesisMatch = source.match(/\(([^()]*:[^()]*)\)\s*$/);
  if (parenthesisMatch?.[1]) {
    return normalizeVariationText(parenthesisMatch[1]);
  }

  const bracketMatch = source.match(/\[([^\[\]]*:[^\[\]]*)\]\s*$/);
  if (bracketMatch?.[1]) {
    return normalizeVariationText(bracketMatch[1]);
  }

  const dashMatch = source.match(/\s[-–]\s([^\n]*:[^\n]*)$/);
  if (dashMatch?.[1]) {
    return normalizeVariationText(dashMatch[1]);
  }

  return '';
}

async function run() {
  const client = await pool.connect();
  const fallbackLabel = 'Variation not captured (legacy order)';

  try {
    await client.query('BEGIN');

    await client.query('ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "variationKey" TEXT');
    await client.query('ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "variationLabel" TEXT');

    const rows = await client.query(
      `
      SELECT id, "productName", "variationKey", "variationLabel"
      FROM "OrderItem"
      WHERE "variationLabel" IS NULL OR TRIM("variationLabel") = ''
      ORDER BY id ASC
      `,
    );

    let fromKeyCount = 0;
    let fromNameCount = 0;
    let fallbackCount = 0;

    for (const row of rows.rows) {
      const variationFromKey = variationLabelFromKey(row.variationKey);
      const variationFromName = variationFromKey ? '' : inferVariationFromProductName(row.productName);
      const nextLabel = variationFromKey || variationFromName;

      const finalLabel = nextLabel || fallbackLabel;

      await client.query('UPDATE "OrderItem" SET "variationLabel" = $1 WHERE id = $2', [finalLabel, row.id]);

      if (variationFromKey) {
        fromKeyCount += 1;
      } else if (variationFromName) {
        fromNameCount += 1;
      } else {
        fallbackCount += 1;
      }
    }

    await client.query('COMMIT');

    const resultSummary = await client.query(
      `
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE "variationLabel" IS NOT NULL AND TRIM("variationLabel") <> '')::int AS with_label,
        COUNT(*) FILTER (WHERE "variationLabel" IS NULL OR TRIM("variationLabel") = '')::int AS missing_label
      FROM "OrderItem"
      `,
    );

    const remainingRows = await client.query(
      `
      SELECT oi.id, o."orderNumber", oi."productName", oi."variationKey", oi."variationLabel"
      FROM "OrderItem" oi
      JOIN "Order" o ON o.id = oi."orderId"
      WHERE oi."variationLabel" IS NULL OR TRIM(oi."variationLabel") = ''
      ORDER BY oi.id ASC
      LIMIT 20
      `,
    );

    const summary = resultSummary.rows[0];
    console.log('Backfill complete');
    console.log(`Filled from variationKey: ${fromKeyCount}`);
    console.log(`Filled from productName pattern: ${fromNameCount}`);
    console.log(`Filled with legacy fallback label: ${fallbackCount}`);
    console.log(`Total rows: ${summary.total}`);
    console.log(`Rows with label: ${summary.with_label}`);
    console.log(`Rows still missing label: ${summary.missing_label}`);
    if (remainingRows.rows.length > 0) {
      console.log('Sample rows still missing variation labels:');
      for (const row of remainingRows.rows) {
        console.log(JSON.stringify(row));
      }
    }
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(error => {
  console.error('Backfill failed:', error instanceof Error ? error.message : String(error));
  process.exit(1);
});
