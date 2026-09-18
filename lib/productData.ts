import { pool } from '@/lib/db';
import { ensureDbInitialized } from '@/lib/dbInit';
import { withApiCache } from '@/lib/apiCache';
import type { PublicProduct } from '@/lib/productTypes';

type ProductQueryOptions = {
  category?: string;
  featured?: boolean;
  limit?: number;
};

export async function getPublicProducts(options: ProductQueryOptions = {}): Promise<PublicProduct[]> {
  await ensureDbInitialized();

  const { category, featured, limit } = options;
  const cacheKey = `products:public:list:category=${(category || '').toLowerCase()}:featured=${featured ?? ''}:limit=${limit ?? ''}`;

  return withApiCache(cacheKey, 30_000, async () => {
    let client;

    try {
      const where: string[] = [];
      const values: Array<string | boolean | number> = [];

      if (category) {
        values.push(category);
        where.push(`LOWER(category) = LOWER($${values.length})`);
      }

      if (featured !== undefined) {
        values.push(featured);
        where.push(`"isFeatured" = $${values.length}`);
      }

      let query = 'SELECT * FROM "Product"';

      if (where.length > 0) {
        query += ` WHERE ${where.join(' AND ')}`;
      }

      query += ' ORDER BY id';

      if (typeof limit === 'number' && Number.isFinite(limit) && limit > 0) {
        values.push(limit);
        query += ` LIMIT $${values.length}`;
      }

      client = await pool.connect();
      const result = await client.query(query, values);
      return result.rows as PublicProduct[];
    } finally {
      if (client) {
        client.release();
      }
    }
  });
}