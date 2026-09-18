import { pool } from '@/lib/db';
import { ensureDbInitialized } from '@/lib/dbInit';
import { syncCategoriesFromProducts } from '@/lib/categories';
import { withApiCache } from '@/lib/apiCache';

export async function GET() {
  try {
    await ensureDbInitialized();
    const resultRows = await withApiCache('categories:public:list', 30_000, async () => {
      let client;
      try {
        client = await pool.connect();

        await syncCategoriesFromProducts(client);

        const result = await client.query(
          `
          SELECT id, name, slug, "imageUrl"
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
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=900',
      },
    });
  } catch (error) {
    return Response.json(
      { error: 'Failed to fetch categories', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
