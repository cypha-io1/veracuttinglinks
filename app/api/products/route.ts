import { getUserBySessionToken, parseCookie } from '@/lib/serverAuth';
import { pool } from '@/lib/db';
import { ensureDbInitialized } from '@/lib/dbInit';
import { emitRealtimeEvent } from '@/lib/realtime';
import { ensureCategoryExists } from '@/lib/categories';
import { invalidateApiCacheByPrefix, withApiCache } from '@/lib/apiCache';

type ProductInput = {
  name: string;
  price?: string;
  image: string;
  imageUrls?: string[];
  category: string;
  description?: string;
  isFeatured?: boolean;
  regularPrice?: string;
  salePrice?: string;
  stock?: number | null;
  showStockOnProductPage?: boolean;
  hasVariations?: boolean;
  variations?: Array<{
    name: string;
    option?: string;
    options?: string[];
    optionImageMap?: Record<string, string>;
    optionStockMap?: Record<string, number>;
    imageUrl?: string;
    regularPrice?: string;
    salePrice?: string;
    stock?: number | null;
    additionalPrice?: string;
  }>;
};

async function requireAdmin(request: Request) {
  const token = parseCookie(request.headers.get('cookie'), 'wf_session');
  if (!token) {
    return null;
  }

  const user = await getUserBySessionToken(token);
  if (!user || user.role !== 'admin') {
    return null;
  }

  return user;
}

export async function GET(request: Request) {
  try {
    await ensureDbInitialized();
    const url = new URL(request.url);
    const category = url.searchParams.get('category');
    const featured = url.searchParams.get('featured');
    const limitParam = url.searchParams.get('limit');

    const where: string[] = [];
    const values: Array<string | boolean | number> = [];

    if (category) {
      values.push(category);
      where.push(`LOWER(p.category) = LOWER($${values.length})`);
    }

    if (featured !== null) {
      values.push(featured === 'true');
      where.push(`p."isFeatured" = $${values.length}`);
    }

    const normalizedLimit = limitParam && Number.isInteger(Number(limitParam)) && Number(limitParam) > 0
      ? Number(limitParam)
      : null;
    const cacheKey = `products:list:category=${(category || '').toLowerCase()}:featured=${featured ?? ''}:limit=${normalizedLimit ?? ''}`;

    const products = await withApiCache(cacheKey, 30_000, async () => {
      let client;
      try {
        let query = `
          SELECT
            p.*,
            COALESCE((
              SELECT SUM(oi.quantity)::int
              FROM "OrderItem" oi
              WHERE oi."productId" = p.id
            ), 0) AS "soldQuantity",
            p.stock AS "remainingStock"
          FROM "Product" p
        `;

        if (where.length > 0) {
          query += ` WHERE ${where.join(' AND ')}`;
        }

        query += ' ORDER BY id';

        if (normalizedLimit !== null) {
          values.push(normalizedLimit);
          query += ` LIMIT $${values.length}`;
        }

        client = await pool.connect();
        const result = await client.query(query, values);
        return result.rows;
      } finally {
        if (client) {
          client.release();
        }
      }
    });

    return Response.json(products, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      }
    });
  } catch (error) {
    return Response.json(
      { error: 'Failed to fetch products', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  let client;

  try {
    await ensureDbInitialized();
    const user = await requireAdmin(request);
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as ProductInput;

    const variationHasPrice =
      Boolean(body.hasVariations) &&
      Array.isArray(body.variations) &&
      body.variations.some(variation => Boolean(variation?.regularPrice?.trim()));

    if (!body.name?.trim() || !body.image?.trim() || !body.category?.trim() || (!body.regularPrice?.trim() && !variationHasPrice)) {
      return Response.json({ error: 'Missing required product fields' }, { status: 400 });
    }

    client = await pool.connect();
    const regularPrice = body.regularPrice?.trim() || '';
    const salePrice = body.salePrice?.trim() || null;
    const normalizedCategory = body.category.trim();
    const normalizedImageUrls = Array.isArray(body.imageUrls)
      ? body.imageUrls.map(url => url?.trim()).filter((url): url is string => Boolean(url))
      : [];
    const productImage = normalizedImageUrls[0] || body.image.trim();

    let result;
    const normalizedVariations = Array.isArray(body.variations)
      ? body.variations.flatMap(variation => {
          const variationName = variation?.name?.trim();
          const options = Array.isArray(variation?.options)
            ? variation.options.map(option => option?.trim()).filter((option): option is string => Boolean(option))
            : variation?.option?.trim()
            ? [variation.option.trim()]
            : [];

          if (!variationName || options.length === 0) {
            return [];
          }

          return options.map(option => {
            const mappedStock = variation.optionStockMap?.[option];
            const mappedStockNumber =
              mappedStock !== undefined && mappedStock !== null ? Number(mappedStock) : null;

            return {
              name: variationName,
              option,
              imageUrl: variation.optionImageMap?.[option]?.trim() || variation.imageUrl?.trim() || null,
              regularPrice: variation.regularPrice?.trim() || null,
              salePrice: variation.salePrice?.trim() || null,
              stock:
                mappedStockNumber !== null && Number.isFinite(mappedStockNumber)
                  ? mappedStockNumber
                  : variation.stock !== undefined && variation.stock !== null
                  ? Number(variation.stock)
                  : null,
              additionalPrice: variation.additionalPrice?.trim() || '0',
            };
          });
        })
      : [];

    const firstVariationPrice = normalizedVariations.find(variation => variation.regularPrice)?.regularPrice || '';
    const finalPrice = regularPrice || firstVariationPrice;

    if (!finalPrice) {
      return Response.json({ error: 'A price value is required' }, { status: 400 });
    }

    const stock = body.stock !== undefined && body.stock !== null ? Number(body.stock) : null;
    const totalVariationStock = normalizedVariations.reduce(
      (sum, variation) => sum + (variation.stock !== null && Number.isFinite(variation.stock) ? variation.stock : 0),
      0
    );

    if (Boolean(body.hasVariations) && stock !== null && Number.isFinite(stock) && totalVariationStock > stock) {
      return Response.json(
        { error: 'Variation stock total cannot exceed main stock.' },
        { status: 400 }
      );
    }

    const showStockOnProductPage = Boolean(body.showStockOnProductPage);

    await ensureCategoryExists(client, normalizedCategory, productImage);

    try {
      result = await client.query(
        `
        INSERT INTO "Product" (name, price, image, "imageUrls", category, description, "isFeatured", "regularPrice", "salePrice", "hasVariations", variations, stock, "showStockOnProductPage")
        VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7, $8, $9, $10, $11::jsonb, $12, $13)
        RETURNING *
        `,
        [
          body.name.trim(),
          finalPrice,
          productImage,
          JSON.stringify(normalizedImageUrls.length > 0 ? normalizedImageUrls : [productImage]),
          normalizedCategory,
          body.description?.trim() || null,
          Boolean(body.isFeatured),
          regularPrice,
          salePrice,
          Boolean(body.hasVariations),
          JSON.stringify(normalizedVariations),
          stock,
          showStockOnProductPage,
        ]
      );
    } catch (error) {
      if ((error as { code?: string }).code !== '42703') {
        throw error;
      }

      result = await client.query(
        `
        INSERT INTO "Product" (name, price, image, category, description, "isFeatured")
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
        `,
        [
          body.name.trim(),
          finalPrice,
          productImage,
          normalizedCategory,
          body.description?.trim() || null,
          Boolean(body.isFeatured),
        ]
      );
    }

    const createdProduct = result.rows[0];
    invalidateApiCacheByPrefix('products:');
    invalidateApiCacheByPrefix('categories:');
    invalidateApiCacheByPrefix('variation-presets:');
    emitRealtimeEvent({ channel: 'products', action: 'created', id: createdProduct.id });

    return Response.json(createdProduct, { status: 201 });
  } catch (error) {
    const dbError = error as { code?: string; detail?: string; constraint?: string };

    if (dbError.code === '23505') {
      return Response.json(
        { error: 'A product with this name already exists in this category.' },
        { status: 409 }
      );
    }

    if (dbError.code === '22P02') {
      return Response.json(
        { error: 'Invalid product data format.' },
        { status: 400 }
      );
    }

    return Response.json(
      { error: 'Failed to create product', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  } finally {
    if (client) {
      client.release();
    }
  }
}
