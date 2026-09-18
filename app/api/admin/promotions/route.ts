import { parseCookie, getUserBySessionToken } from '@/lib/serverAuth';
import {
  createPromotion,
  deletePromotion,
  listPromotions,
  PromotionType,
  updatePromotion,
} from '@/lib/promotions';

type PromotionPayload = {
  code?: string;
  type?: PromotionType;
  value?: number;
  minOrder?: number;
  active?: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
  maxUsage?: number | null;
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
    const admin = await requireAdmin(request);
    if (!admin) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const promotions = await listPromotions();
    return Response.json(promotions);
  } catch (error) {
    return Response.json(
      { error: 'Failed to fetch promotions', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as PromotionPayload;

    if (!body.code?.trim()) {
      return Response.json({ error: 'Promo code is required' }, { status: 400 });
    }

    if (!(body.type === 'percentage' || body.type === 'fixed')) {
      return Response.json({ error: 'Promo type must be percentage or fixed' }, { status: 400 });
    }

    const created = await createPromotion({
      code: body.code,
      type: body.type,
      value: Number(body.value || 0),
      minOrder: Number(body.minOrder || 0),
      active: body.active !== false,
      startsAt: body.startsAt || null,
      endsAt: body.endsAt || null,
      maxUsage: typeof body.maxUsage === 'number' ? body.maxUsage : null,
    });

    return Response.json(created, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: 'Failed to create promotion', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const id = Number(url.searchParams.get('id'));

    if (!Number.isInteger(id) || id <= 0) {
      return Response.json({ error: 'Invalid promotion id' }, { status: 400 });
    }

    const body = (await request.json()) as PromotionPayload;
    const updated = await updatePromotion(id, {
      code: body.code,
      type: body.type,
      value: typeof body.value === 'number' ? body.value : undefined,
      minOrder: typeof body.minOrder === 'number' ? body.minOrder : undefined,
      active: typeof body.active === 'boolean' ? body.active : undefined,
      startsAt: Object.prototype.hasOwnProperty.call(body, 'startsAt') ? body.startsAt ?? null : undefined,
      endsAt: Object.prototype.hasOwnProperty.call(body, 'endsAt') ? body.endsAt ?? null : undefined,
      maxUsage: Object.prototype.hasOwnProperty.call(body, 'maxUsage') ? body.maxUsage ?? null : undefined,
    });

    if (!updated) {
      return Response.json({ error: 'Promotion not found or unchanged' }, { status: 404 });
    }

    return Response.json(updated);
  } catch (error) {
    return Response.json(
      { error: 'Failed to update promotion', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const id = Number(url.searchParams.get('id'));

    if (!Number.isInteger(id) || id <= 0) {
      return Response.json({ error: 'Invalid promotion id' }, { status: 400 });
    }

    const deleted = await deletePromotion(id);
    if (!deleted) {
      return Response.json({ error: 'Promotion not found' }, { status: 404 });
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json(
      { error: 'Failed to delete promotion', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
