import crypto from 'crypto';

import { markOrderPaid, resolveOrderId } from '@/lib/paystackPayments';
import { addCommunicationCredits } from '@/lib/communicationCredits';
import { pool } from '@/lib/db';
import { ensureDbInitialized } from '@/lib/dbInit';

type PaystackWebhookPayload = {
  event?: string;
  data?: {
    status?: string;
    reference?: string;
    metadata?: {
      kind?: string;
      orderId?: number;
      channel?: 'sms' | 'email';
      adminUserId?: number;
      credits?: number;
    };
    amount?: number;
  };
};

function signaturesMatch(signatureHeader: string, computed: string): boolean {
  const provided = signatureHeader.trim().toLowerCase();
  const expected = computed.trim().toLowerCase();

  try {
    const providedBuffer = Buffer.from(provided, 'utf8');
    const expectedBuffer = Buffer.from(expected, 'utf8');
    if (providedBuffer.length !== expectedBuffer.length) return false;
    return crypto.timingSafeEqual(providedBuffer, expectedBuffer);
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const standardSecretKey = process.env.PAYSTACK_SECRET_KEY || '';
  const commSecretKey = process.env.COMM_PAYSTACK_SECRET_KEY || '';
  if (!standardSecretKey && !commSecretKey) {
    return Response.json({ error: 'Paystack webhook keys are not configured' }, { status: 500 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get('x-paystack-signature') || '';
  if (!signature) {
    return Response.json({ error: 'Missing Paystack signature' }, { status: 401 });
  }

  const candidateKeys = [standardSecretKey, commSecretKey].filter(Boolean);
  const hasValidSignature = candidateKeys.some(key => {
    const computed = crypto.createHmac('sha512', key).update(rawBody).digest('hex');
    return signaturesMatch(signature, computed);
  });

  if (!hasValidSignature) {
    return Response.json({ error: 'Invalid Paystack signature' }, { status: 401 });
  }

  let payload: PaystackWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as PaystackWebhookPayload;
  } catch {
    return Response.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  const event = String(payload.event || '');
  const reference = String(payload.data?.reference || '');

  if (event === 'charge.success' && payload.data?.status === 'success') {
    const metadataKind = String(payload.data?.metadata?.kind || '').trim();
    if (metadataKind === 'communications_credit_topup') {
      const channel = payload.data?.metadata?.channel;
      const adminUserId = Number(payload.data?.metadata?.adminUserId || 0);
      const credits = Number(payload.data?.metadata?.credits || 0);

      if (!(channel === 'sms' || channel === 'email') || !Number.isInteger(adminUserId) || adminUserId <= 0 || !Number.isInteger(credits) || credits <= 0 || !reference) {
        return Response.json({ received: true, event, processed: false, reason: 'invalid_credit_topup_metadata' }, { status: 200 });
      }

      let client;
      let transactionStarted = false;
      try {
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
          [adminUserId, reference, channel, Number(((payload.data?.amount || 0) / 100).toFixed(2)), credits]
        );

        let credited = false;
        if (inserted.rows.length > 0) {
          await addCommunicationCredits(channel, credits, client);
          credited = true;
        }

        await client.query('COMMIT');
        transactionStarted = false;
        return Response.json({ received: true, event, processed: true, kind: metadataKind, credited }, { status: 200 });
      } catch {
        if (client && transactionStarted) {
          try {
            await client.query('ROLLBACK');
          } catch {
            // Preserve original webhook error path.
          }
        }
        return Response.json({ received: true, event, processed: false, kind: metadataKind, reason: 'credit_topup_apply_failed' }, { status: 200 });
      } finally {
        if (client) client.release();
      }
    }

    const orderId = resolveOrderId(payload.data?.metadata?.orderId, reference);

    if (orderId) {
      const updated = await markOrderPaid(orderId);
      return Response.json({ received: true, event, processed: true, orderId, updated }, { status: 200 });
    }

    return Response.json({ received: true, event, processed: false, reason: 'missing_order_id' }, { status: 200 });
  }

  return Response.json({ received: true, event, processed: false }, { status: 200 });
}
