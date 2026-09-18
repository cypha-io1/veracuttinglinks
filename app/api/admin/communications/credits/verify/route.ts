import { parseCookie, getUserBySessionToken } from '@/lib/serverAuth';
import { pool } from '@/lib/db';
import { addCommunicationCredits } from '@/lib/communicationCredits';
import { ensureDbInitialized } from '@/lib/dbInit';

async function requireAdmin(request: Request) {
  const token = parseCookie(request.headers.get('cookie'), 'wf_session');
  if (!token) return null;

  const user = await getUserBySessionToken(token);
  if (!user || user.role !== 'admin') return null;

  return user;
}

export async function GET(request: Request) {
  let client;
  let transactionStarted = false;

  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const reference = String(url.searchParams.get('reference') || '').trim();
    if (!reference) {
      return Response.json({ error: 'Missing reference' }, { status: 400 });
    }

    const secretKey = process.env.COMM_PAYSTACK_SECRET_KEY;
    if (!secretKey) {
      return Response.json({ error: 'COMM_PAYSTACK_SECRET_KEY is not configured' }, { status: 500 });
    }

    const verifyResponse = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${secretKey}`,
      },
      cache: 'no-store',
    });

    const verifyPayload = (await verifyResponse.json().catch(() => ({}))) as {
      status?: boolean;
      data?: {
        status?: string;
        amount?: number;
        reference?: string;
        metadata?: {
          kind?: string;
          channel?: 'sms' | 'email';
          adminUserId?: number;
          credits?: number;
          amountGhs?: number;
        };
      };
      message?: string;
    };

    const paid = Boolean(verifyResponse.ok && verifyPayload.status && verifyPayload.data?.status === 'success');
    if (!paid) {
      return Response.json({ error: verifyPayload.message || 'Top-up payment verification failed' }, { status: 402 });
    }

    const metadata = verifyPayload.data?.metadata;
    const channel = String(metadata?.channel || '').trim() as 'sms' | 'email';
    const metadataUserId = Number(metadata?.adminUserId || 0);
    const credits = Number(metadata?.credits || 0);

    if (
      !(channel === 'sms' || channel === 'email') ||
      !Number.isInteger(metadataUserId) ||
      metadataUserId <= 0 ||
      !Number.isInteger(credits) ||
      credits <= 0
    ) {
      return Response.json({ error: 'Invalid top-up metadata' }, { status: 400 });
    }

    if (metadataUserId !== admin.id) {
      return Response.json({ error: 'Top-up does not belong to the signed-in admin' }, { status: 403 });
    }

    await ensureDbInitialized();
    client = await pool.connect();
    await client.query('BEGIN');
    transactionStarted = true;

    const inserted = await client.query(
      `
      INSERT INTO "CommunicationCreditTopup" ("userProfileId", reference, channel, amount, credits)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (reference) DO NOTHING
      RETURNING id
      `,
      [admin.id, reference, channel, Number(((verifyPayload.data?.amount || 0) / 100).toFixed(2)), credits],
    );

    let balance = { smsCredits: 0, emailCredits: 0 };
    if (inserted.rows.length > 0) {
      balance = await addCommunicationCredits(channel, credits, client);
    } else {
      balance = await addCommunicationCredits(channel, 0, client);
    }

    await client.query('COMMIT');
    transactionStarted = false;

    return Response.json({
      success: true,
      credited: inserted.rows.length > 0,
      reference,
      channel,
      credits,
      smsBalance: Number(balance.smsCredits || 0),
      emailBalance: Number(balance.emailCredits || 0),
      balance: channel === 'email'
        ? Number(balance.emailCredits || 0)
        : Number(balance.smsCredits || 0),
    });
  } catch (error) {
    if (client && transactionStarted) {
      try {
        await client.query('ROLLBACK');
      } catch {
        // Ignore rollback failure.
      }
    }
    return Response.json(
      { error: 'Failed to verify credit top-up', details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  } finally {
    if (client) client.release();
  }
}
