import { evaluatePromotion, getPromotionByCode } from '@/lib/promotions';

type ValidatePromotionPayload = {
  code?: string;
  subtotal?: number;
  delivery?: number;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ValidatePromotionPayload;
    const code = String(body.code || '').trim().toUpperCase();

    if (!code) {
      return Response.json({ error: 'Promo code is required' }, { status: 400 });
    }

    const subtotal = Math.max(0, Number(body.subtotal) || 0);
    const delivery = Math.max(0, Number(body.delivery) || 0);
    const totalBeforeDiscount = Math.round((subtotal + delivery) * 100) / 100;

    const evaluation = await evaluatePromotion(code, totalBeforeDiscount);
    if (!evaluation) {
      const rule = await getPromotionByCode(code);
      if (!rule) {
        return Response.json({ error: 'Invalid promo code' }, { status: 404 });
      }

      return Response.json(
        {
          error: rule.minOrder
            ? `Promo code cannot be applied yet. Minimum order is GH₵${Number(rule.minOrder).toFixed(2)}.`
            : 'Promo code is not active',
        },
        { status: 400 }
      );
    }

    return Response.json(
      {
        code: evaluation.code,
        discountAmount: evaluation.discountAmount,
        totalBeforeDiscount: evaluation.totalBeforeDiscount,
        totalAfterDiscount: evaluation.totalAfterDiscount,
      },
      { status: 200 }
    );
  } catch (error) {
    return Response.json(
      {
        error: 'Failed to validate promo code',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
