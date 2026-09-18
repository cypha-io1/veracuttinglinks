import { addCommunicationCredits, reserveCommunicationCredits } from '@/lib/communicationCredits';
import { ensureDbInitialized } from '@/lib/dbInit';

type SmsSendResult = {
  success: boolean;
  providerMessageId?: string;
  error?: string;
  remainingSmsCredits?: number;
};

const MNOTIFY_V2_URL = 'https://api.mnotify.com/api/sms/quick';
const MNOTIFY_LEGACY_URL = 'https://apps.mnotify.net/smsapi';

async function fetchWithTimeout(input: string, init: RequestInit, timeoutMs = 12000): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal, cache: 'no-store' });
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeSenderId(sender: string): string {
  const cleaned = String(sender || '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 11);
  return cleaned || 'WigFactory';
}

function senderForV2(sender: string): string {
  const value = String(sender || '').trim();
  return value || 'Zhilakaii';
}

function normalizeRecipientForMnotify(to: string): string {
  const digits = String(to || '').replace(/\D/g, '');

  // Ghana local format: 0XXXXXXXXX -> 233XXXXXXXXX
  if (/^0\d{9}$/.test(digits)) {
    return `233${digits.slice(1)}`;
  }

  // Already in Ghana intl format without plus
  if (/^233\d{9}$/.test(digits)) {
    return digits;
  }

  // Generic international numbers: send digits only
  if (digits.length >= 10 && digits.length <= 15) {
    return digits;
  }

  return String(to || '').replace(/\s+/g, '').trim();
}

export async function sendSms(options: { to: string; message: string; deductCredit?: boolean }): Promise<SmsSendResult> {
  const configuredApiUrl = String(process.env.MNOTIFY_API_URL || MNOTIFY_V2_URL).trim();
  const apiKey = String(process.env.MNOTIFY_API_KEY || '').trim();
  const configuredSender = String(process.env.MNOTIFY_SENDER_NAME || 'Zhilakaii').trim();
  const deductCredit = options.deductCredit !== false;

  if (!configuredApiUrl || !apiKey) {
    return { success: false, error: 'mNotify service not configured (MNOTIFY_API_KEY missing)' };
  }

  const to = normalizeRecipientForMnotify(String(options.to || ''));
  const message = String(options.message || '').trim();

  if (!to || !message) {
    return { success: false, error: 'Recipient and message are required' };
  }

  let creditReserved = false;
  let reservedSmsBalance = 0;

  if (deductCredit) {
    await ensureDbInitialized();
    const reservation = await reserveCommunicationCredits('sms', 1);
    if (!reservation.success) {
      return {
        success: false,
        error: 'Insufficient SMS credits',
        remainingSmsCredits: reservation.balance.smsCredits,
      };
    }

    creditReserved = true;
    reservedSmsBalance = reservation.balance.smsCredits;
  }

  const isConfiguredV2 = /api\.mnotify\.com\/api\/sms\/quick/i.test(configuredApiUrl);
  const endpointCandidates = [configuredApiUrl];
  if (isConfiguredV2 && configuredApiUrl !== MNOTIFY_LEGACY_URL) {
    endpointCandidates.push(MNOTIFY_LEGACY_URL);
  }
  if (!isConfiguredV2 && configuredApiUrl !== MNOTIFY_V2_URL) {
    endpointCandidates.push(MNOTIFY_V2_URL);
  }

  const attemptErrors: string[] = [];

  for (const endpoint of endpointCandidates) {
    const isV2Quick = /api\.mnotify\.com\/api\/sms\/quick/i.test(endpoint);

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = isV2Quick
          ? await fetchWithTimeout(`${endpoint}${endpoint.includes('?') ? '&' : '?'}key=${encodeURIComponent(apiKey)}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                recipient: [to],
                sender: senderForV2(configuredSender),
                message,
                is_schedule: false,
              }),
            })
          : await fetchWithTimeout(endpoint, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: new URLSearchParams({
                key: apiKey,
                to,
                msg: message,
                sender_id: normalizeSenderId(configuredSender),
              }).toString(),
            });

        const raw = await response.text();
        let payload: Record<string, unknown> = {};
        try {
          payload = JSON.parse(raw) as Record<string, unknown>;
        } catch {
          // Some mNotify responses are plain text; keep using raw fallback checks below.
        }

        if (!response.ok) {
          const httpError =
            String(payload.error || payload.message || '').trim() ||
            raw ||
            `mNotify error (${response.status})`;
          attemptErrors.push(`${isV2Quick ? 'v2' : 'legacy'} attempt ${attempt}: ${httpError}`);
          if (attempt < 2) continue;
          break;
        }

        const payloadSuccess = payload.success;
        const payloadStatus = String(payload.status || '').toLowerCase();
        const payloadCode = String(payload.code || payload.response_code || '').toLowerCase();
        const rawLower = raw.toLowerCase();
        const ok = isV2Quick
          ? payloadStatus === 'success' || payloadCode === '2000'
          : payloadSuccess !== false &&
            payloadStatus !== 'failed' &&
            payloadCode !== '4000' &&
            payloadCode !== 'error' &&
            !rawLower.includes('error') &&
            !rawLower.includes('invalid') &&
            !rawLower.includes('failed');

        if (!ok) {
          const providerError = String(payload.error || payload.message || '').trim() || raw || 'mNotify reported failure';
          attemptErrors.push(`${isV2Quick ? 'v2' : 'legacy'} attempt ${attempt}: ${providerError}`);
          if (attempt < 2) continue;
          break;
        }

        return {
          success: true,
          remainingSmsCredits: deductCredit ? reservedSmsBalance : undefined,
          providerMessageId:
            String(
              payload.messageId ||
                payload.message_id ||
                payload.id ||
                (payload.summary as { message_id?: string } | undefined)?.message_id ||
                payload.data ||
                ''
            ).trim() || undefined,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        attemptErrors.push(`${isV2Quick ? 'v2' : 'legacy'} attempt ${attempt}: ${message}`);
        if (attempt < 2) continue;
      }
    }
  }

  if (creditReserved) {
    const refunded = await addCommunicationCredits('sms', 1);
    return {
      success: false,
      error: attemptErrors.join(' | ') || 'SMS sending failed for all endpoints',
      remainingSmsCredits: refunded.smsCredits,
    };
  }

  return {
    success: false,
    error: attemptErrors.join(' | ') || 'SMS sending failed for all endpoints',
  };
}
