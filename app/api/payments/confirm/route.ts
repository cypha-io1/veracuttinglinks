import { NextResponse } from 'next/server';
import { resolveOrderId, markOrderPaid } from '@/lib/paystackPayments';

export async function POST(request: Request) {
  try {
    const { reference } = await request.json();

    if (!reference || typeof reference !== 'string') {
      return NextResponse.json({ error: 'Payment reference is required.' }, { status: 400 });
    }

    const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackSecret) {
      return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
    }

    const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${paystackSecret}`,
        'Content-Type': 'application/json',
      },
    });

    const verifyPayload = await verifyRes.json().catch(() => ({}));

    if (!verifyRes.ok || !verifyPayload.status) {
      return NextResponse.json(
        { error: verifyPayload.message || 'Failed to verify transaction with payment provider.' },
        { status: verifyRes.status === 200 ? 400 : verifyRes.status }
      );
    }

    if (verifyPayload?.data?.status !== 'success') {
      return NextResponse.json({ error: 'Payment was not successful or not found.' }, { status: 400 });
    }

    const orderId = resolveOrderId(null, reference);
    if (!orderId) {
      return NextResponse.json({ error: 'Could not resolve order from payment reference.' }, { status: 404 });
    }

    const wasUpdated = await markOrderPaid(orderId);

    return NextResponse.json({
      success: true,
      message: wasUpdated ? 'Order payment confirmed and updated successfully.' : 'Order was already marked as paid.',
      orderId,
    });
  } catch (error: any) {
    console.error('[API] /api/payments/confirm error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
