import { pool } from '@/lib/db';
import { ensureDbInitialized } from '@/lib/dbInit';

type CartItemInput = {
  id: number;
  quantity: number;
  variationKey?: string;
  variationLabel?: string;
};

type ValidatePayload = {
  items?: CartItemInput[];
};

type VariationSelection = {
  name: string;
  option: string;
};

type ProductInventoryRow = {
  id: number;
  stock: number | null;
  hasVariations: boolean;
  variations: unknown;
};

type CartAdjustment = {
  id: number;
  variationKey?: string;
  action: 'remove' | 'clamp';
  quantity?: number;
  reason: string;
};

function normalizeToken(value: unknown): string {
  return String(value ?? '').trim();
}

function normalizeStockNumber(value: unknown): number | null {
  const parsed = typeof value === 'number' ? value : Number(String(value ?? '').trim());
  if (!Number.isFinite(parsed)) return null;
  return Math.max(parsed, 0);
}

function parseSelections(raw: string, separator: string | RegExp): VariationSelection[] {
  return raw
    .split(separator)
    .map(part => part.trim())
    .filter(Boolean)
    .flatMap(part => {
      const idx = part.indexOf(':');
      if (idx <= 0) return [];

      const name = normalizeToken(part.slice(0, idx));
      const option = normalizeToken(part.slice(idx + 1));
      if (!name || !option) return [];

      return [{ name, option }];
    });
}

function parseVariationKey(variationKey: string): VariationSelection[] {
  return parseSelections(variationKey, '|');
}

function parseVariationLabel(variationLabel: string): VariationSelection[] {
  return parseSelections(variationLabel, ',');
}

function parseVariationRecords(raw: unknown): Array<Record<string, unknown>> {
  if (!Array.isArray(raw)) return [];

  return raw
    .filter((entry): entry is Record<string, unknown> => typeof entry === 'object' && entry !== null)
    .map(entry => ({ ...entry }));
}

function findVariation(variations: Array<Record<string, unknown>>, name: string, option: string): Record<string, unknown> | null {
  const normalizedName = normalizeToken(name);
  const normalizedOption = normalizeToken(option);

  for (const variation of variations) {
    const candidateName = normalizeToken(variation.name);
    const candidateOption = normalizeToken(variation.option);
    if (candidateName === normalizedName && candidateOption === normalizedOption) {
      return variation;
    }
  }

  return null;
}

function variationRequestKey(productId: number, name: string, option: string): string {
  return `${productId}::${name}::${option}`;
}

export async function POST(request: Request) {
  let client;

  try {
    await ensureDbInitialized();

    const body = (await request.json().catch(() => ({}))) as ValidatePayload;
    const items = Array.isArray(body.items) ? body.items : [];

    if (items.length === 0) {
      return Response.json({ valid: true, adjustments: [] as CartAdjustment[] });
    }

    const normalizedItems = items.map(item => ({
      id: Number(item.id),
      quantity: Math.max(0, Number(item.quantity) || 0),
      variationKey: normalizeToken(item.variationKey),
      variationLabel: normalizeToken(item.variationLabel),
    }));

    const productIds = Array.from(new Set(normalizedItems.map(item => item.id).filter(id => Number.isInteger(id) && id > 0)));

    client = await pool.connect();

    const productResult =
      productIds.length > 0
        ? await client.query(
            'SELECT id, stock, "hasVariations", variations FROM "Product" WHERE id = ANY($1::int[])',
            [productIds],
          )
        : { rows: [] };

    const productMap = new Map<number, ProductInventoryRow>();
    for (const row of productResult.rows as ProductInventoryRow[]) {
      productMap.set(row.id, {
        id: row.id,
        stock: normalizeStockNumber(row.stock),
        hasVariations: Boolean(row.hasVariations),
        variations: row.variations,
      });
    }

    const remainingProductStock = new Map<number, number | null>();
    const remainingVariationStock = new Map<string, number>();
    const adjustments: CartAdjustment[] = [];

    for (const item of normalizedItems) {
      const product = productMap.get(item.id);

      if (!product || item.quantity <= 0) {
        adjustments.push({
          id: item.id,
          variationKey: item.variationKey || undefined,
          action: 'remove',
          reason: 'Item is no longer available.',
        });
        continue;
      }

      const productRemaining = remainingProductStock.has(product.id)
        ? remainingProductStock.get(product.id)!
        : product.stock;

      let variationRemaining: number | null = null;

      if (product.hasVariations) {
        const keySelections = item.variationKey ? parseVariationKey(item.variationKey) : [];
        const labelSelections = keySelections.length === 0 && item.variationLabel ? parseVariationLabel(item.variationLabel) : [];
        const selections = keySelections.length > 0 ? keySelections : labelSelections;

        if (selections.length === 0) {
          adjustments.push({
            id: item.id,
            variationKey: item.variationKey || undefined,
            action: 'remove',
            reason: 'Variation selection is missing.',
          });
          continue;
        }

        const productVariations = parseVariationRecords(product.variations);

        const selectionStocks: number[] = [];
        let invalidSelection = false;

        for (const selection of selections) {
          const key = variationRequestKey(product.id, selection.name, selection.option);

          if (remainingVariationStock.has(key)) {
            selectionStocks.push(remainingVariationStock.get(key)!);
            continue;
          }

          const variation = findVariation(productVariations, selection.name, selection.option);
          if (!variation) {
            invalidSelection = true;
            break;
          }

          const stock = normalizeStockNumber(variation.stock);
          if (typeof stock !== 'number') {
            invalidSelection = true;
            break;
          }

          remainingVariationStock.set(key, stock);
          selectionStocks.push(stock);
        }

        if (invalidSelection || selectionStocks.length === 0) {
          adjustments.push({
            id: item.id,
            variationKey: item.variationKey || undefined,
            action: 'remove',
            reason: 'Selected variation is unavailable.',
          });
          continue;
        }

        variationRemaining = Math.min(...selectionStocks);
      }

      const limits: number[] = [];
      if (typeof productRemaining === 'number') limits.push(productRemaining);
      if (typeof variationRemaining === 'number') limits.push(variationRemaining);

      const maxAllowed = limits.length > 0 ? Math.max(0, Math.min(...limits)) : item.quantity;

      if (maxAllowed <= 0) {
        adjustments.push({
          id: item.id,
          variationKey: item.variationKey || undefined,
          action: 'remove',
          reason: 'Item is out of stock.',
        });
        continue;
      }

      if (item.quantity > maxAllowed) {
        adjustments.push({
          id: item.id,
          variationKey: item.variationKey || undefined,
          action: 'clamp',
          quantity: maxAllowed,
          reason: 'Requested quantity exceeds current stock.',
        });
      }

      const consumeQty = Math.min(item.quantity, maxAllowed);

      if (typeof productRemaining === 'number') {
        remainingProductStock.set(product.id, Math.max(productRemaining - consumeQty, 0));
      }

      if (product.hasVariations) {
        const keySelections = item.variationKey ? parseVariationKey(item.variationKey) : [];
        const labelSelections = keySelections.length === 0 && item.variationLabel ? parseVariationLabel(item.variationLabel) : [];
        const selections = keySelections.length > 0 ? keySelections : labelSelections;

        for (const selection of selections) {
          const key = variationRequestKey(product.id, selection.name, selection.option);
          const remaining = remainingVariationStock.get(key);
          if (typeof remaining === 'number') {
            remainingVariationStock.set(key, Math.max(remaining - consumeQty, 0));
          }
        }
      }
    }

    return Response.json({
      valid: adjustments.length === 0,
      adjustments,
    });
  } catch (error) {
    return Response.json(
      { error: 'Failed to validate cart stock', details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  } finally {
    if (client) client.release();
  }
}
