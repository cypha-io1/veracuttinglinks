import { getUserBySessionToken, parseCookie } from '@/lib/serverAuth';
import { pool } from '@/lib/db';
import { ensureDbInitialized } from '@/lib/dbInit';
import { emitRealtimeEvent } from '@/lib/realtime';
import { makeCategorySlug, syncCategoriesFromProducts, ensureCategoryExists } from '@/lib/categories';
import { invalidateApiCacheByPrefix, withApiCache } from '@/lib/apiCache';

type CategoryPayload = {
  name?: string;
};

async function requireAdmin(request: Request) {
  const token = parseCookie(request.headers.get('cookie'), 'wf_session');
  if (!token) return null;

  const user = await getUserBySessionToken(token);
  if (!user || user.role !== 'admin') return null;

  return user;
}

export async function GET(request: Request) {
  try {
    await ensureDbInitialized();
    const admin = await requireAdmin(request);
    if (!admin) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resultRows = await withApiCache('categories:admin:list', 20_000, async () => {
      let client;
      try {
        client = await pool.connect();

        await syncCategoriesFromProducts(client);

        const result = await client.query(
          `
          SELECT id, name, slug, "imageUrl", "createdAt"
          FROM "Category"
          ORDER BY name ASC
          `
        );

        return result.rows;
      } finally {
        if (client) client.release();
      }
    });

    return Response.json(resultRows, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'private, max-age=15, stale-while-revalidate=45',
      },
    });
  } catch (error) {
    return Response.json(
      { error: 'Failed to fetch categories', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  let client;

  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as CategoryPayload;
    const name = body.name?.trim() || '';

    if (!name) {
      return Response.json({ error: 'Category name is required' }, { status: 400 });
    }

    const slug = makeCategorySlug(name);
    if (!slug) {
      return Response.json({ error: 'Invalid category name' }, { status: 400 });
    }

    await ensureDbInitialized();
    client = await pool.connect();

    await ensureCategoryExists(client, name);

    const result = await client.query(
      `
      SELECT id, name, slug, "imageUrl", "createdAt"
      FROM "Category"
      WHERE slug = $1
      LIMIT 1
      `,
      [slug]
    );

    const savedCategory = result.rows[0];
    invalidateApiCacheByPrefix('categories:');
    emitRealtimeEvent({ channel: 'categories', action: 'changed', id: savedCategory.id });

    return Response.json(savedCategory, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: 'Failed to save category', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  } finally {
    if (client) client.release();
  }
}

export async function DELETE(request: Request) {
  let client;

  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const id = Number(url.searchParams.get('id'));

    if (!Number.isInteger(id) || id <= 0) {
      return Response.json({ error: 'Invalid category id' }, { status: 400 });
    }

    await ensureDbInitialized();
    client = await pool.connect();

    const result = await client.query('DELETE FROM "Category" WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return Response.json({ error: 'Category not found' }, { status: 404 });
    }

    invalidateApiCacheByPrefix('categories:');
    emitRealtimeEvent({ channel: 'categories', action: 'deleted', id });
    return Response.json({ success: true });
  } catch (error) {
    return Response.json(
      { error: 'Failed to delete category', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  } finally {
    if (client) client.release();
  }
}
