import { listActivePromotions } from '@/lib/promotions';

export async function GET() {
  try {
    const promotions = await listActivePromotions();
    return Response.json(
      promotions.map((promo) => ({
        id: promo.id,
        code: promo.code,
        type: promo.type,
        value: promo.value,
        minOrder: promo.minOrder,
      })),
      {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    );
  } catch (error) {
    return Response.json(
      {
        error: 'Failed to fetch active promotions',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
