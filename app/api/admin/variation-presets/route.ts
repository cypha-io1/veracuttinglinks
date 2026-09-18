import { getUserBySessionToken, parseCookie } from '@/lib/serverAuth';
import { pool } from '@/lib/db';
import { ensureDbInitialized } from '@/lib/dbInit';
import { withApiCache } from '@/lib/apiCache';

type VariationPresetResponse = {
  types: string[];
  optionsByType: Record<string, string[]>;
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

    const payload = await withApiCache('variation-presets:admin:list', 20_000, async () => {
      let client;
      try {
        client = await pool.connect();
        const result = await client.query('SELECT variations FROM "Product" WHERE variations IS NOT NULL');

        const typeSet = new Set<string>();
        const optionsMap = new Map<string, Set<string>>();

        for (const row of result.rows) {
          const variations = Array.isArray(row.variations) ? row.variations : [];
          for (const item of variations) {
            const name = typeof item?.name === 'string' ? item.name.trim() : '';
            const option = typeof item?.option === 'string' ? item.option.trim() : '';

            if (!name) continue;

            typeSet.add(name);
            if (!optionsMap.has(name)) {
              optionsMap.set(name, new Set<string>());
            }

            if (option) {
              optionsMap.get(name)!.add(option);
            }
          }
        }

        const optionsByType: Record<string, string[]> = {};
        for (const [name, values] of optionsMap.entries()) {
          optionsByType[name] = Array.from(values).sort((a, b) => a.localeCompare(b));
        }

        const response: VariationPresetResponse = {
          types: Array.from(typeSet).sort((a, b) => a.localeCompare(b)),
          optionsByType,
        };

        return response;
      } catch (error) {
        if ((error as { code?: string }).code === '42703') {
          return { types: [], optionsByType: {} } as VariationPresetResponse;
        }
        throw error;
      } finally {
        if (client) client.release();
      }
    });

    return Response.json(payload, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'private, max-age=15, stale-while-revalidate=45',
      },
    });
  } catch (error) {
    return Response.json(
      { error: 'Failed to fetch variation presets', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
