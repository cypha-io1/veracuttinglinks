import { parseCookie, getUserBySessionToken } from '@/lib/serverAuth';
import { pool } from '@/lib/db';
import { getCommunicationCreditBalance } from '@/lib/communicationCredits';
import { ensureDbInitialized } from '@/lib/dbInit';

const CREDIT_PRICE_GHS = 0.2;

type TopupPayload = {
  channel?: 'sms' | 'email';
  planId?: string;
};

type CreditPlan = {
  id: string;
  channel: 'sms' | 'email';
  name: string;
  description: string;
  amountGhs: number;
  credits: number;
  rateGhs: number;
  nonExpiry: boolean;
};

const CREDIT_PLANS: CreditPlan[] = [
  {
    id: 'sms-standard-150',
    channel: 'sms',
    name: 'Standard',
    description: 'SMS credit plan',
    amountGhs: 150,
    rateGhs: 3,
    credits: 50,
    nonExpiry: true,
  },
  {
    id: 'sms-premium-250',
    channel: 'sms',
    name: 'Premium',
    description: 'SMS credit plan',
    amountGhs: 250,
    rateGhs: 2.5,
    credits: 100,
    nonExpiry: true,
  },
];

async function requireAdmin(request: Request) {
  const token = parseCookie(request.headers.get('cookie'), 'wf_session');
  if (!token) return null;

  const user = await getUserBySessionToken(token);
  if (!user || user.role !== 'admin') return null;

  return user;
}

function buildUniqueReference(channel: 'sms' | 'email', planId: string, adminId: number) {
  const randomPart =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID().replace(/-/g, '').slice(0, 16)
      : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;

  return `comm_topup_${channel}_${planId}_${adminId}_${Date.now()}_${randomPart}`;
}

function isDuplicateReferenceError(message: string) {
  const normalized = message.toLowerCase();
  return normalized.includes('duplicate') && normalized.includes('reference');
}

export async function GET(request: Request) {
  let client;
  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await ensureDbInitialized();
    const url = new URL(request.url);
    const channel = String(url.searchParams.get('channel') || 'sms').trim() as 'sms' | 'email';
    if (!(channel === 'sms' || channel === 'email')) {
      return Response.json({ error: 'Invalid channel' }, { status: 400 });
    }
    if (channel === 'email') {
      return Response.json({ error: 'Email sending is temporarily disabled' }, { status: 503 });
    }

    client = await pool.connect();
    const balance = await getCommunicationCreditBalance(client);

    const smsCredits = Number(balance.smsCredits || 0);
    const emailCredits = Number(balance.emailCredits || 0);
    const plans = CREDIT_PLANS.filter(plan => plan.channel === channel);

    return Response.json({
      channel,
      smsCredits,
      emailCredits,
      credits: smsCredits,
      creditPriceGhs: CREDIT_PRICE_GHS,
      plans,
    });
  } catch (error) {
    return Response.json(
      { error: 'Failed to load credits', details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  } finally {
    if (client) client.release();
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as TopupPayload;
    const channel = String(body.channel || 'sms').trim() as 'sms' | 'email';
    if (!(channel === 'sms' || channel === 'email')) {
      return Response.json({ error: 'Invalid channel' }, { status: 400 });
    }
    if (channel === 'email') {
      return Response.json({ error: 'Email sending is temporarily disabled' }, { status: 503 });
    }

    const planId = String(body.planId || '').trim();
    const selectedPlan = CREDIT_PLANS.find(plan => plan.id === planId && plan.channel === channel);
    if (!selectedPlan) {
      return Response.json({ error: 'Invalid credit plan' }, { status: 400 });
    }

    const credits = selectedPlan.credits;

    const secretKey = process.env.COMM_PAYSTACK_SECRET_KEY;
    const publicKey = process.env.NEXT_PUBLIC_COMM_PAYSTACK_PUBLIC_KEY || process.env.COMM_PAYSTACK_PUBLIC_KEY || '';
    if (!secretKey || !publicKey) {
      return Response.json(
        {
          error:
            'Communication Paystack is not configured. Set COMM_PAYSTACK_SECRET_KEY and NEXT_PUBLIC_COMM_PAYSTACK_PUBLIC_KEY.',
        },
        { status: 500 },
      );
    }

    const amountGhs = selectedPlan.amountGhs;
    const amountKobo = Math.round(amountGhs * 100);
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const callbackUrl = `${origin.replace(/\/$/, '')}/admin/communications?credit=callback`;
    let initializeResponse: Response | null = null;
    let payload: {
      status?: boolean;
      message?: string;
      data?: { authorization_url?: string; access_code?: string; reference?: string };
    } = {};

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const reference = buildUniqueReference(channel, selectedPlan.id, admin.id);
      initializeResponse = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: admin.email || `admin-${admin.id}@zhilakaii.local`,
          amount: amountKobo,
          currency: 'GHS',
          reference,
          callback_url: callbackUrl,
          metadata: {
            kind: 'communications_credit_topup',
            channel,
            adminUserId: admin.id,
            planId: selectedPlan.id,
            credits,
            amountGhs,
          },
        }),
      });

      payload = (await initializeResponse.json().catch(() => ({}))) as {
        status?: boolean;
        message?: string;
        data?: { authorization_url?: string; access_code?: string; reference?: string };
      };

      if (initializeResponse.ok && payload.status && payload.data?.reference) {
        break;
      }

      const errorMessage = String(payload.message || '');
      if (!isDuplicateReferenceError(errorMessage) || attempt === 2) {
        break;
      }
    }

    if (!initializeResponse || !initializeResponse.ok || !payload.status || !payload.data?.reference) {
      return Response.json(
        { error: payload.message || 'Failed to initialize top-up payment' },
        { status: 502 },
      );
    }

    return Response.json({
      reference: payload.data.reference,
      authorizationUrl: payload.data.authorization_url || '',
      accessCode: payload.data.access_code || '',
      email: admin.email || `admin-${admin.id}@zhilakaii.local`,
      publicKey,
      amount: amountKobo,
      amountGhs,
      credits,
      channel,
      creditPriceGhs: CREDIT_PRICE_GHS,
      plan: selectedPlan,
    });
  } catch (error) {
    return Response.json(
      { error: 'Failed to initialize credit top-up', details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
