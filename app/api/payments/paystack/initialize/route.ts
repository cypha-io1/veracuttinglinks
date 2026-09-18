import { pool } from '@/lib/db';

type InitializePayload = {
  total: number;
  email?: string;
  fullName?: string;
  phone?: string;
  paymentMethod: 'card' | 'mobile-money' | 'paystack';
  orderId?: number;
  orderNumber?: string;
};

type PaystackInitResponse = {
  status?: boolean;
  message?: string;
  data?: { authorization_url?: string; reference?: string; access_code?: string };
};

function toKobo(amount: number): number {
  return Math.round(Math.max(0, amount) * 100);
}

function isInactiveMerchantMessage(message: string | undefined): boolean {
  if (!message) return false;
  const normalized = message.toLowerCase();
  return normalized.includes('merchant may be inactive') || normalized.includes('merchant is inactive');
}

function normalizeEmail(email: string | undefined, phone: string | undefined): string {
  const trimmed = String(email || '').trim();
  if (trimmed.includes('@')) return trimmed;

  const cleanPhone = String(phone || '').replace(/\D/g, '');
  if (cleanPhone.length >= 7) {
    return `customer-${cleanPhone}@example.com`;
  }

  return `customer-${Date.now()}@example.com`;
}

function getPaystackMode(key: string) {
  if (key.startsWith('sk_live_')) {
    return 'live' as const;
  }

  if (key.startsWith('sk_test_')) {
    return 'test' as const;
  }

  return 'invalid' as const;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as InitializePayload;

    if (!(body.paymentMethod === 'card' || body.paymentMethod === 'mobile-money' || body.paymentMethod === 'paystack')) {
      return Response.json({ error: 'Unsupported payment method for Paystack' }, { status: 400 });
    }

    const key = process.env.PAYSTACK_SECRET_KEY;
    if (!key) {
      return Response.json({ error: 'PAYSTACK_SECRET_KEY is not configured' }, { status: 500 });
    }

    const paystackMode = getPaystackMode(key);
    if (paystackMode === 'invalid') {
      return Response.json({ error: 'PAYSTACK_SECRET_KEY must start with sk_test_ or sk_live_' }, { status: 500 });
    }

    const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || process.env.PAYSTACK_PUBLIC_KEY || '';
    if (paystackMode === 'live' && !publicKey.startsWith('pk_live_')) {
      return Response.json(
        { error: 'NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY (or PAYSTACK_PUBLIC_KEY) must be configured with a pk_live key in production.' },
        { status: 500 }
      );
    }

    if (paystackMode === 'test' && !publicKey.startsWith('pk_test_')) {
      return Response.json(
        { error: 'NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY (or PAYSTACK_PUBLIC_KEY) must be configured with a pk_test key.' },
        { status: 500 }
      );
    }

    const baseAmount = Number(body.total) || 0;
    const amount = toKobo(baseAmount);
    if (amount <= 0) {
      return Response.json({ error: 'Order total must be greater than zero' }, { status: 400 });
    }

    const orderId = body.orderId ? Number(body.orderId) : null;
    const orderNumber = body.orderNumber ? String(body.orderNumber).trim() : null;

    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const callbackUrl = `${origin.replace(/\/$/, '')}/api/payments/paystack/verify?popup=1`;

    const reference = orderId
      ? `wf_${orderId}_pay_${Date.now()}_${Math.floor(Math.random() * 1000)}`
      : `wf_pay_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`;
    const channels =
      body.paymentMethod === 'card'
        ? ['card']
        : body.paymentMethod === 'mobile-money'
        ? ['mobile_money']
        : ['card', 'mobile_money'];

    const paystackBody: Record<string, unknown> = {
      email: normalizeEmail(body.email, body.phone),
      amount,
      currency: 'GHS',
      reference,
      callback_url: callbackUrl,
      channels,
      metadata: {
        orderId,
        orderNumber,
        baseTotal: baseAmount,
        customerName: body.fullName || null,
        phone: body.phone || null,
        paymentMethod: body.paymentMethod,
      },
    };

    if (orderId) {
      await pool.query(
        'UPDATE "Order" SET "paymentReference" = $1 WHERE id = $2',
        [reference, orderId]
      );
    }

    const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paystackBody),
    });

    const payload = (await paystackResponse.json().catch(() => ({}))) as PaystackInitResponse;

    if (!paystackResponse.ok || !payload.status || !payload.data?.authorization_url) {
      // Some test accounts are not fully activated and cannot initialize real transactions.
      // Allow local/dev checkout testing by simulating the provider callback path.
      if (paystackMode === 'test' && isInactiveMerchantMessage(payload.message)) {
        const mockReference = `mock_${reference}`;
        if (orderId) {
          await pool.query(
            'UPDATE "Order" SET "paymentReference" = $1 WHERE id = $2',
            [mockReference, orderId]
          );
        }
        return Response.json(
          {
            authorizationUrl: '',
            accessCode: '',
            publicKey,
            reference: mockReference,
            testMode: true,
            mock: true,
            message: 'Paystack merchant is inactive in test mode; using local mock payment completion.',
          },
          { status: 200 }
        );
      }

      return Response.json(
        { error: payload.message || 'Failed to initialize Paystack transaction' },
        { status: 502 }
      );
    }

    return Response.json(
      {
        authorizationUrl: payload.data.authorization_url,
        accessCode: payload.data.access_code || '',
        publicKey,
        reference: payload.data.reference || reference,
        amount,
        email: normalizeEmail(body.email, body.phone),
        channels,
        testMode: paystackMode === 'test',
      },
      { status: 200 }
    );
  } catch (error) {
    return Response.json(
      { error: 'Failed to initialize payment', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
