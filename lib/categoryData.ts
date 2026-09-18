import { pool } from '@/lib/db';
import { ensureDbInitialized } from '@/lib/dbInit';
import { syncCategoriesFromProducts } from '@/lib/categories';
import { withApiCache } from '@/lib/apiCache';

export type PublicCategory = {
  id: number;
  name: string;
  slug: string;
  imageUrl?: string | null;
};

export async function getPublicCategories(): Promise<PublicCategory[]> {
  await ensureDbInitialized();

  return withApiCache('categories:ssr:home', 30_000, async () => {
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

      return result.rows as PublicCategory[];
    } finally {
      if (client) client.release();
    }
  });
}