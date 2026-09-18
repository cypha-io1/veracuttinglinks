type QueryableClient = {
  query: (text: string, values?: unknown[]) => Promise<{ rows: Array<{ [key: string]: unknown }> }>;
};

const CATEGORY_SYNC_COOLDOWN_MS = 30_000;
let lastCategorySyncAt = 0;

export function makeCategorySlug(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function normalizeImageUrl(value: unknown) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed || null;
}

async function findLatestProductImageForCategory(client: QueryableClient, categoryName: string) {
  const normalized = categoryName.trim();
  if (!normalized) return null;

  try {
    const result = await client.query(
      `
      SELECT
        COALESCE(
          NULLIF(
            TRIM(
              CASE
                WHEN jsonb_typeof("imageUrls") = 'array' AND jsonb_array_length("imageUrls") > 0
                THEN "imageUrls"->>0
                ELSE NULL
              END
            ),
            ''
          ),
          NULLIF(TRIM(image), '')
        ) AS "imageUrl"
      FROM "Product"
      WHERE LOWER(category) = LOWER($1)
      ORDER BY id DESC
      LIMIT 1
      `,
      [normalized]
    );

    return normalizeImageUrl(result.rows[0]?.imageUrl);
  } catch (error) {
    if ((error as { code?: string }).code !== '42703') {
      throw error;
    }

    const fallback = await client.query(
      `
      SELECT NULLIF(TRIM(image), '') AS "imageUrl"
      FROM "Product"
      WHERE LOWER(category) = LOWER($1)
      ORDER BY id DESC
      LIMIT 1
      `,
      [normalized]
    );

    return normalizeImageUrl(fallback.rows[0]?.imageUrl);
  }
}

export async function ensureCategoryExists(client: QueryableClient, categoryName: string, preferredImageUrl?: string | null) {
  const name = categoryName.trim();
  if (!name) return;

  const slug = makeCategorySlug(name);
  if (!slug) return;
  const seededImage = normalizeImageUrl(preferredImageUrl) ?? (await findLatestProductImageForCategory(client, name));

  await client.query(
    `
    INSERT INTO "Category" (name, slug, "imageUrl")
    VALUES ($1, $2, $3)
    ON CONFLICT (slug)
    DO UPDATE SET
      name = EXCLUDED.name,
      "imageUrl" = COALESCE("Category"."imageUrl", EXCLUDED."imageUrl"),
      "updatedAt" = CURRENT_TIMESTAMP
    `,
    [name, slug, seededImage]
  );
}

export async function syncCategoriesFromProducts(client: QueryableClient) {
  const now = Date.now();
  if (now - lastCategorySyncAt < CATEGORY_SYNC_COOLDOWN_MS) {
    return;
  }

  try {
    await client.query(
      `
      WITH category_seed AS (
        SELECT DISTINCT ON (LOWER(category))
          TRIM(category) AS name,
          LOWER(
            REGEXP_REPLACE(
              REGEXP_REPLACE(
                REGEXP_REPLACE(TRIM(category), '[^a-zA-Z0-9\\s-]', '', 'g'),
                '\\s+',
                '-',
                'g'
              ),
              '-+',
              '-',
              'g'
            )
          ) AS slug,
          COALESCE(
            NULLIF(
              TRIM(
                CASE
                  WHEN jsonb_typeof("imageUrls") = 'array' AND jsonb_array_length("imageUrls") > 0
                  THEN "imageUrls"->>0
                  ELSE NULL
                END
              ),
              ''
            ),
            NULLIF(TRIM(image), '')
          ) AS "imageUrl"
        FROM "Product"
        WHERE category IS NOT NULL AND TRIM(category) <> ''
        ORDER BY LOWER(category), id DESC
      )
      INSERT INTO "Category" (name, slug, "imageUrl")
      SELECT name, slug, "imageUrl"
      FROM category_seed
      WHERE slug <> ''
      ON CONFLICT (slug)
      DO UPDATE SET
        name = EXCLUDED.name,
        "imageUrl" = COALESCE("Category"."imageUrl", EXCLUDED."imageUrl"),
        "updatedAt" = CURRENT_TIMESTAMP
      `
    );
  } catch (error) {
    if ((error as { code?: string }).code !== '42703') {
      throw error;
    }

    await client.query(
      `
      WITH category_seed AS (
        SELECT DISTINCT ON (LOWER(category))
          TRIM(category) AS name,
          LOWER(
            REGEXP_REPLACE(
              REGEXP_REPLACE(
                REGEXP_REPLACE(TRIM(category), '[^a-zA-Z0-9\\s-]', '', 'g'),
                '\\s+',
                '-',
                'g'
              ),
              '-+',
              '-',
              'g'
            )
          ) AS slug,
          NULLIF(TRIM(image), '') AS "imageUrl"
        FROM "Product"
        WHERE category IS NOT NULL AND TRIM(category) <> ''
        ORDER BY LOWER(category), id DESC
      )
      INSERT INTO "Category" (name, slug, "imageUrl")
      SELECT name, slug, "imageUrl"
      FROM category_seed
      WHERE slug <> ''
      ON CONFLICT (slug)
      DO UPDATE SET
        name = EXCLUDED.name,
        "imageUrl" = COALESCE("Category"."imageUrl", EXCLUDED."imageUrl"),
        "updatedAt" = CURRENT_TIMESTAMP
      `
    );
  }

  lastCategorySyncAt = Date.now();
}