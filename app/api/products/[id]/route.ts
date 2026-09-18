import { getUserBySessionToken, parseCookie } from '@/lib/serverAuth';
import { pool } from '@/lib/db';
import { ensureDbInitialized } from '@/lib/dbInit';
import { emitRealtimeEvent } from '@/lib/realtime';
import { ensureCategoryExists } from '@/lib/categories';
import { invalidateApiCacheByPrefix, withApiCache } from '@/lib/apiCache';

type RouteContext = {
  params: Promise<{ id: string }>;
};

type ProductUpdateInput = {
  name?: string;
  price?: string;
  image?: string;
  imageUrls?: string[];
  category?: string;
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
  if (!token) return null;

  const user = await getUserBySessionToken(token);
  if (!user || user.role !== 'admin') return null;
  return user;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    await ensureDbInitialized();
    const { id } = await context.params;
    const numericId = Number(id);

    if (!Number.isInteger(numericId) || numericId <= 0) {
      return Response.json({ error: 'Invalid product id' }, { status: 400 });
    }

    const product = await withApiCache(`products:detail:${numericId}`, 30_000, async () => {
      let client;
      try {
        client = await pool.connect();
        const result = await client.query('SELECT * FROM "Product" WHERE id = $1 LIMIT 1', [numericId]);
        return result.rows[0] ?? null;
      } finally {
        if (client) {
          client.release();
        }
      }
    });

    if (!product) {
      return Response.json({ error: 'Product not found' }, { status: 404 });
    }

    return Response.json(product, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    return Response.json(
      {
        error: 'Failed to fetch product',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, context: RouteContext) {
  let client;

  try {
    await ensureDbInitialized();
    const user = await requireAdmin(request);
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const numericId = Number(id);

    if (!Number.isInteger(numericId) || numericId <= 0) {
      return Response.json({ error: 'Invalid product id' }, { status: 400 });
    }

    const body = (await request.json()) as ProductUpdateInput;

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
        UPDATE "Product"
        SET
          name = $1,
          price = $2,
          image = $3,
          "imageUrls" = $4::jsonb,
          category = $5,
          description = $6,
          "isFeatured" = $7,
          "regularPrice" = $8,
          "salePrice" = $9,
          "hasVariations" = $10,
          variations = $11::jsonb,
          stock = $12,
          "showStockOnProductPage" = $13,
          "updatedAt" = CURRENT_TIMESTAMP
        WHERE id = $14
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
          numericId,
        ]
      );
    } catch (error) {
      if ((error as { code?: string }).code !== '42703') {
        throw error;
      }

      result = await client.query(
        `
        UPDATE "Product"
        SET
          name = $1,
          price = $2,
          image = $3,
          category = $4,
          description = $5,
          "isFeatured" = $6,
          "updatedAt" = CURRENT_TIMESTAMP
        WHERE id = $7
        RETURNING *
        `,
        [
          body.name.trim(),
          finalPrice,
          productImage,
          normalizedCategory,
          body.description?.trim() || null,
          Boolean(body.isFeatured),
          numericId,
        ]
      );
    }

    if (result.rows.length === 0) {
      return Response.json({ error: 'Product not found' }, { status: 404 });
    }

    const updatedProduct = result.rows[0];
    invalidateApiCacheByPrefix('products:');
    invalidateApiCacheByPrefix('categories:');
    invalidateApiCacheByPrefix('variation-presets:');
    emitRealtimeEvent({ channel: 'products', action: 'updated', id: updatedProduct.id });

    return Response.json(updatedProduct);
  } catch (error) {
    const dbError = error as { code?: string };

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
      { error: 'Failed to update product', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  } finally {
    if (client) client.release();
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  let client;

  try {
    await ensureDbInitialized();
    const user = await requireAdmin(request);
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const numericId = Number(id);

    if (!Number.isInteger(numericId) || numericId <= 0) {
      return Response.json({ error: 'Invalid product id' }, { status: 400 });
    }

    client = await pool.connect();
    const result = await client.query('DELETE FROM "Product" WHERE id = $1 RETURNING id', [numericId]);

    if (result.rows.length === 0) {
      return Response.json({ error: 'Product not found' }, { status: 404 });
    }

    invalidateApiCacheByPrefix('products:');
    invalidateApiCacheByPrefix('categories:');
    invalidateApiCacheByPrefix('variation-presets:');
    emitRealtimeEvent({ channel: 'products', action: 'deleted', id: numericId });
    return Response.json({ success: true });
  } catch (error) {
    return Response.json(
      { error: 'Failed to delete product', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  } finally {
    if (client) client.release();
  }
}
