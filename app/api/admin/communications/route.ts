import { parseCookie, getUserBySessionToken } from '@/lib/serverAuth';
import { sendSms } from '@/lib/sms';
import { pool } from '@/lib/db';
import { getCommunicationCreditBalance } from '@/lib/communicationCredits';
import { ensureDbInitialized } from '@/lib/dbInit';

type CommunicationsPayload = {
  channel?: 'email' | 'sms';
  recipients?: string[];
  subject?: string;
  message?: string;
};

type RecipientChannel = 'email' | 'sms';
type RecipientSegment = 'all-customers' | 'paid-customers' | 'recent-customers' | 'staff-admins';

const COMMUNICATION_CREDIT_COST = 1;

type SendFailure = {
  recipient: string;
  error: string;
};

async function requireAdmin(request: Request) {
  const token = parseCookie(request.headers.get('cookie'), 'wf_session');
  if (!token) return null;

  const user = await getUserBySessionToken(token);
  if (!user || user.role !== 'admin') return null;

  return user;
}

const isLikelyPhone = (value: string) => /^\+?[0-9]{10,15}$/.test(value.replace(/\s+/g, ''));

async function loadPresetRecipients(channel: RecipientChannel, segment: RecipientSegment): Promise<string[]> {
  let client;
  try {
    await ensureDbInitialized();
    client = await pool.connect();

    if (segment === 'all-customers') {
      if (channel === 'email') {
        const result = await client.query(
          `
          SELECT DISTINCT LOWER(TRIM(email)) AS recipient
          FROM (
            SELECT email FROM "Order" WHERE email IS NOT NULL AND TRIM(email) <> ''
            UNION
            SELECT email FROM "UserProfile" WHERE email IS NOT NULL AND TRIM(email) <> ''
          ) src
          ORDER BY recipient ASC
          `,
        );
        return result.rows.map(row => String(row.recipient));
      }

      const result = await client.query(
        `
        SELECT DISTINCT TRIM(phone) AS recipient
        FROM (
          SELECT phone FROM "Order" WHERE phone IS NOT NULL AND TRIM(phone) <> ''
          UNION
          SELECT phone FROM "UserProfile" WHERE phone IS NOT NULL AND TRIM(phone) <> ''
        ) src
        ORDER BY recipient ASC
        `,
      );
      return result.rows.map(row => String(row.recipient));
    }

    if (segment === 'paid-customers') {
      if (channel === 'email') {
        const result = await client.query(
          `
          SELECT DISTINCT LOWER(TRIM(email)) AS recipient
          FROM "Order"
          WHERE email IS NOT NULL
            AND TRIM(email) <> ''
            AND (
              COALESCE("paymentCompleted", FALSE) = TRUE
              OR status IN ('Paid', 'Delivered', 'Cancelled')
            )
          ORDER BY recipient ASC
          `,
        );
        return result.rows.map(row => String(row.recipient));
      }

      const result = await client.query(
        `
        SELECT DISTINCT TRIM(phone) AS recipient
        FROM "Order"
        WHERE phone IS NOT NULL
          AND TRIM(phone) <> ''
          AND (
            COALESCE("paymentCompleted", FALSE) = TRUE
            OR status IN ('Paid', 'Delivered', 'Cancelled')
          )
        ORDER BY recipient ASC
        `,
      );
      return result.rows.map(row => String(row.recipient));
    }

    if (segment === 'recent-customers') {
      if (channel === 'email') {
        const result = await client.query(
          `
          SELECT DISTINCT LOWER(TRIM(email)) AS recipient
          FROM "Order"
          WHERE email IS NOT NULL
            AND TRIM(email) <> ''
            AND "createdAt" >= NOW() - INTERVAL '30 days'
          ORDER BY recipient ASC
          `,
        );
        return result.rows.map(row => String(row.recipient));
      }

      const result = await client.query(
        `
        SELECT DISTINCT TRIM(phone) AS recipient
        FROM "Order"
        WHERE phone IS NOT NULL
          AND TRIM(phone) <> ''
          AND "createdAt" >= NOW() - INTERVAL '30 days'
        ORDER BY recipient ASC
        `,
      );
      return result.rows.map(row => String(row.recipient));
    }

    if (channel === 'email') {
      try {
        const result = await client.query(
          `
          SELECT DISTINCT LOWER(TRIM(email)) AS recipient
          FROM "UserProfile"
          WHERE email IS NOT NULL
            AND TRIM(email) <> ''
            AND COALESCE(role, 'user') = 'admin'
          ORDER BY recipient ASC
          `,
        );
        return result.rows.map(row => String(row.recipient));
      } catch (error) {
        if ((error as { code?: string }).code === '42703') {
          return [];
        }
        throw error;
      }
    }

    try {
      const result = await client.query(
        `
        SELECT DISTINCT TRIM(phone) AS recipient
        FROM "UserProfile"
        WHERE phone IS NOT NULL
          AND TRIM(phone) <> ''
          AND COALESCE(role, 'user') = 'admin'
        ORDER BY recipient ASC
        `,
      );
      return result.rows.map(row => String(row.recipient));
    } catch (error) {
      if ((error as { code?: string }).code === '42703') {
        return [];
      }
      throw error;
    }
  } finally {
    if (client) client.release();
  }
}

export async function GET(request: Request) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const channel = String(url.searchParams.get('channel') || '').trim() as RecipientChannel;
    const segment = String(url.searchParams.get('segment') || '').trim() as RecipientSegment;

    if (!(channel === 'email' || channel === 'sms')) {
      return Response.json({ error: 'Invalid channel' }, { status: 400 });
    }

    if (channel === 'email') {
      return Response.json({ error: 'Email sending is temporarily disabled' }, { status: 503 });
    }

    if (!['all-customers', 'paid-customers', 'recent-customers', 'staff-admins'].includes(segment)) {
      return Response.json({ error: 'Invalid segment' }, { status: 400 });
    }

    const recipients = await loadPresetRecipients(channel, segment);

    return Response.json({
      channel,
      segment,
      count: recipients.length,
      recipients,
    });
  } catch (error) {
    return Response.json(
      { error: 'Failed to load preset recipients', details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as CommunicationsPayload;
    const channel = body.channel;
    const recipients = Array.isArray(body.recipients)
      ? body.recipients.map(item => String(item || '').trim()).filter(Boolean)
      : [];
    const subject = String(body.subject || '').trim();
    const message = String(body.message || '').trim();

    if (!(channel === 'email' || channel === 'sms')) {
      return Response.json({ error: 'Channel must be email or sms' }, { status: 400 });
    }

    if (channel === 'email') {
      return Response.json({ error: 'Email sending is temporarily disabled' }, { status: 503 });
    }

    if (recipients.length === 0) {
      return Response.json({ error: 'At least one recipient is required' }, { status: 400 });
    }

    if (!message) {
      return Response.json({ error: 'Message is required' }, { status: 400 });
    }

    await ensureDbInitialized();

    const validRecipientsCount = recipients.filter(recipient => isLikelyPhone(recipient)).length;
    const requiredCredits = validRecipientsCount * COMMUNICATION_CREDIT_COST;
    const currentBalance = await getCommunicationCreditBalance();
    if (currentBalance.smsCredits < requiredCredits) {
      return Response.json(
        {
          error: 'Insufficient communication credits',
          channel,
          requiredCredits,
          currentCredits: Number(currentBalance.smsCredits || 0),
          smsCredits: Number(currentBalance.smsCredits || 0),
          emailCredits: Number(currentBalance.emailCredits || 0),
        },
        { status: 402 },
      );
    }

    const failures: SendFailure[] = [];
    let sent = 0;

    for (const recipient of recipients) {
      if (!isLikelyPhone(recipient)) {
        failures.push({ recipient, error: 'Invalid phone format' });
        continue;
      }

      const result = await sendSms({
        to: recipient,
        message,
      });

      if (!result.success) {
        failures.push({ recipient, error: result.error || 'Failed to send SMS' });
        continue;
      }

      sent += 1;
    }

    const finalBalance = await getCommunicationCreditBalance();
    const smsCredits = Number(finalBalance.smsCredits || 0);
    const emailCredits = Number(finalBalance.emailCredits || 0);

    return Response.json({
      success: failures.length === 0,
      channel,
      totalRecipients: recipients.length,
      sent,
      failed: failures.length,
      creditsReserved: 0,
      creditsCharged: sent * COMMUNICATION_CREDIT_COST,
      creditsRefunded: 0,
      remainingCredits: smsCredits,
      smsCredits,
      emailCredits,
      failures,
      message: failures.length === 0 ? 'Message sent successfully.' : 'Message sent with partial failures.',
    });
  } catch (error) {
    return Response.json(
      { error: 'Failed to send communication', details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
