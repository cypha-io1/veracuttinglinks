'use client';

import { useEffect, useMemo, useState } from 'react';
import Script from 'next/script';
import { FiMessageSquare, FiSend } from 'react-icons/fi';

type Channel = 'email' | 'sms';
type RecipientSegment = 'all-customers' | 'paid-customers' | 'recent-customers' | 'staff-admins';

type ApiResult = {
  success?: boolean;
  message?: string;
  channel?: Channel;
  sent?: number;
  failed?: number;
  totalRecipients?: number;
  failures?: Array<{ recipient: string; error: string }>;
  error?: string;
  details?: string;
  creditsCharged?: number;
  remainingCredits?: number;
  smsCredits?: number;
  emailCredits?: number;
};

type CreditBalancePayload = {
  channel?: Channel;
  credits?: number;
  smsCredits?: number;
  emailCredits?: number;
  creditPriceGhs?: number;
  plans?: Array<{
    id: string;
    channel: Channel;
    name: string;
    description: string;
    amountGhs: number;
    credits: number;
    rateGhs: number;
    nonExpiry: boolean;
  }>;
  error?: string;
  details?: string;
};

type CreditTopupInitPayload = {
  reference?: string;
  publicKey?: string;
  accessCode?: string;
  email?: string;
  amount?: number;
  amountGhs?: number;
  credits?: number;
  channel?: Channel;
  error?: string;
  details?: string;
};

type PaystackInlineOptions = {
  key: string;
  email?: string;
  amount?: number;
  currency?: 'GHS';
  ref?: string;
  access_code?: string;
  callback: (response: { reference?: string }) => void;
  onClose: () => void;
};

type PaystackInlineHandle = {
  openIframe: () => void;
};

declare global {
  interface Window {
    PaystackPop?: {
      setup: (options: Record<string, unknown>) => { openIframe: () => void };
    };
  }
}

export default function AdminCommunicationsPage() {
  const [channel] = useState<Channel>('sms');
  const [recipientsInput, setRecipientsInput] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loadingSegment, setLoadingSegment] = useState<RecipientSegment | null>(null);
  const [loadingCredits, setLoadingCredits] = useState(true);
  const [toppingUp, setToppingUp] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [creditPlans, setCreditPlans] = useState<
    Array<{
      id: string;
      channel: Channel;
      name: string;
      description: string;
      amountGhs: number;
      credits: number;
      rateGhs: number;
      nonExpiry: boolean;
    }>
  >([]);
  const [smsCredits, setSmsCredits] = useState(0);
  const [emailCredits, setEmailCredits] = useState(0);
  const [creditPriceGhs, setCreditPriceGhs] = useState(0.2);
  const [result, setResult] = useState<ApiResult | null>(null);

  const segmentOptions: Array<{ key: RecipientSegment; label: string; helper: string }> = [
    { key: 'all-customers', label: 'All Customers', helper: 'Orders + profiles' },
    { key: 'paid-customers', label: 'Paid Customers', helper: 'Payment completed only' },
    { key: 'recent-customers', label: 'Recent Customers', helper: 'Last 30 days' },
    { key: 'staff-admins', label: 'Staff/Admin', helper: 'Admin users' },
  ];

  const recipients = useMemo(
    () => recipientsInput
      .split(/[\n,;]+/)
      .map(item => item.trim())
      .filter(Boolean),
    [recipientsInput],
  );

  const sortedCreditPlans = useMemo(
    () => [...creditPlans].sort((a, b) => (a.rateGhs - b.rateGhs) || (a.amountGhs - b.amountGhs)),
    [creditPlans],
  );

  const recommendedPlanId = sortedCreditPlans[0]?.id || '';
  const currentCredits = smsCredits;

  const canSubmit = recipients.length > 0 && message.trim().length > 0;
  const requiredCredits = recipients.length;
  const insufficientCredits = currentCredits < requiredCredits;

  const loadCredits = async (selectedChannel: Channel = channel) => {
    try {
      setLoadingCredits(true);
      const response = await fetch(`/api/admin/communications/credits?channel=${encodeURIComponent(selectedChannel)}`, { cache: 'no-store' });
      const payload = (await response.json().catch(() => ({}))) as CreditBalancePayload;
      if (!response.ok) {
        throw new Error(payload.error || payload.details || 'Failed to load credits');
      }

      setSmsCredits(Number(payload.smsCredits || 0));
      setEmailCredits(Number(payload.emailCredits || 0));
      setCreditPriceGhs(Number(payload.creditPriceGhs || 0.2));
      const plans = Array.isArray(payload.plans) ? payload.plans : [];
      setCreditPlans(plans);
      const sorted = [...plans].sort((a, b) => (a.rateGhs - b.rateGhs) || (a.amountGhs - b.amountGhs));
      setSelectedPlanId(prev => (plans.some(plan => plan.id === prev) ? prev : (sorted[0]?.id || '')));
    } catch (error) {
      setResult({ success: false, error: error instanceof Error ? error.message : 'Failed to load credits' });
    } finally {
      setLoadingCredits(false);
    }
  };

  useEffect(() => {
    void loadCredits(channel);
  }, [channel]);

  const loadSegmentRecipients = async (segment: RecipientSegment) => {
    try {
      setLoadingSegment(segment);
      setResult(null);

      const response = await fetch(
        `/api/admin/communications?channel=${encodeURIComponent(channel)}&segment=${encodeURIComponent(segment)}`,
        { cache: 'no-store' },
      );

      const payload = (await response.json().catch(() => ({}))) as {
        recipients?: string[];
        count?: number;
        error?: string;
        details?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error || payload.details || 'Failed to load recipients');
      }

      const nextRecipients = Array.isArray(payload.recipients) ? payload.recipients : [];
      setRecipientsInput(nextRecipients.join('\n'));
      setResult({
        success: true,
        message: `${nextRecipients.length} recipients loaded from preset.`,
        totalRecipients: nextRecipients.length,
      });
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to load recipients',
      });
    } finally {
      setLoadingSegment(null);
    }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit || submitting || insufficientCredits) return;

    try {
      setSubmitting(true);
      setResult(null);

      const response = await fetch('/api/admin/communications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel,
          recipients,
          subject: '',
          message: message.trim(),
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as ApiResult;
      if (!response.ok) {
        throw new Error(payload.error || payload.details || 'Failed to send communication');
      }

      setResult(payload);
      if (typeof payload.smsCredits === 'number') {
        setSmsCredits(payload.smsCredits);
      }
      if (typeof payload.emailCredits === 'number') {
        setEmailCredits(payload.emailCredits);
      }
      if (typeof payload.remainingCredits === 'number' && payload.channel) {
        if (payload.channel === 'sms') {
          setSmsCredits(payload.remainingCredits);
        } else {
          setEmailCredits(payload.remainingCredits);
        }
      } else {
        await loadCredits();
      }
      if (payload.success) {
        setRecipientsInput('');
        setMessage('');
      }
    } catch (error) {
      setResult({ success: false, error: error instanceof Error ? error.message : 'Failed to send communication' });
    } finally {
      setSubmitting(false);
    }
  };

  const buyCredits = async () => {
    if (!selectedPlanId || toppingUp) return;

    try {
      setToppingUp(true);
      setResult(null);

      const initResponse = await fetch('/api/admin/communications/credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel, planId: selectedPlanId }),
      });

      const initPayload = (await initResponse.json().catch(() => ({}))) as CreditTopupInitPayload;
      if (!initResponse.ok) {
        throw new Error(initPayload.error || initPayload.details || 'Failed to start top-up');
      }

      const publicKey = String(initPayload.publicKey || '');
      const reference = String(initPayload.reference || '');
      const accessCode = String(initPayload.accessCode || '');
      const email = String(initPayload.email || 'admin-topup@zhilakaii.local');
      const amount = Number(initPayload.amount || 0);

      if (!window.PaystackPop || typeof window.PaystackPop.setup !== 'function') {
        throw new Error('Paystack is unavailable. Please refresh and try again.');
      }

      if (!publicKey || !accessCode || !reference || !email || !amount) {
        throw new Error('Invalid top-up initialization data');
      }

      await new Promise<void>((resolve, reject) => {
        const handler = window.PaystackPop!.setup({
          key: publicKey,
          email,
          amount,
          currency: 'GHS',
          access_code: accessCode,
          callback: (responseRef: { reference?: string }) => {
            const paidReference = responseRef.reference || reference;
            void (async () => {
              const verifyResponse = await fetch(
                `/api/admin/communications/credits/verify?reference=${encodeURIComponent(paidReference)}`,
                { cache: 'no-store' },
              );

              const verifyPayload = (await verifyResponse.json().catch(() => ({}))) as {
                success?: boolean;
                channel?: Channel;
                balance?: number;
                smsBalance?: number;
                emailBalance?: number;
                error?: string;
                details?: string;
              };

              if (!verifyResponse.ok || !verifyPayload.success) {
                throw new Error(verifyPayload.error || verifyPayload.details || 'Top-up verification failed');
              }

              if (typeof verifyPayload.smsBalance === 'number') {
                setSmsCredits(verifyPayload.smsBalance);
              }
              if (typeof verifyPayload.emailBalance === 'number') {
                setEmailCredits(verifyPayload.emailBalance);
              }
              if (typeof verifyPayload.balance === 'number' && !Number.isNaN(verifyPayload.balance)) {
                if ((verifyPayload.channel || channel) === 'email') {
                  setEmailCredits(verifyPayload.balance);
                } else {
                  setSmsCredits(verifyPayload.balance);
                }
              }
              setResult({ success: true, message: 'Credits purchased successfully.' });
              resolve();
            })().catch(error => reject(error instanceof Error ? error : new Error('Top-up verification failed')));
          },
          onClose: () => reject(new Error('Top-up payment was cancelled.')),
        });

        handler.openIframe();
      });
    } catch (error) {
      setResult({ success: false, error: error instanceof Error ? error.message : 'Failed to buy credits' });
    } finally {
      setToppingUp(false);
    }
  };

  return (
    <section className="w-full">
      <Script src="https://js.paystack.co/v1/inline.js" strategy="afterInteractive" />
      <div className="w-full rounded-[2rem] border-0 bg-white p-6 shadow-sm ring-1 ring-slate-200/50 sm:p-8 lg:p-10 relative overflow-hidden">
        <h1 className="text-2xl font-black text-slate-900 sm:text-3xl">Communications</h1>
        <p className="mt-1 text-sm text-slate-600 sm:text-base">Send broadcast SMS messages to customers and staff.</p>
        <p className="mt-2 rounded-lg border border-black bg-white px-3 py-2 text-xs font-semibold text-black sm:text-sm">
          Email sending is temporarily disabled.
        </p>

        <div className="mt-5 grid gap-4 rounded-[2rem] border-0 ring-1 ring-slate-200/50 bg-slate-50/50 p-6 sm:grid-cols-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 sm:text-xs">SMS Credits</p>
            <p className="mt-1 text-xl font-black text-slate-900 sm:text-2xl">
              {loadingCredits ? '...' : smsCredits}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 sm:text-xs">Email Credits</p>
            <p className="mt-1 text-xl font-black text-slate-900 sm:text-2xl">{loadingCredits ? '...' : emailCredits}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 sm:text-xs">Rate</p>
            <p className="text-base font-black text-slate-900 sm:text-lg">GH₵{creditPriceGhs.toFixed(2)} / message</p>
            <p className="text-sm font-bold text-slate-900">1 message = 1 credit</p>
            <p className="text-xs text-slate-600">Credits are consumed when communication is sent.</p>
          </div>
        </div>

        <div className="mt-6 rounded-[2rem] border-0 ring-1 ring-slate-200/50 bg-white p-6 sm:p-8">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 sm:text-xs">
            Buy {channel === 'email' ? 'Email' : 'SMS'} Credit Plans
          </p>
          <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {sortedCreditPlans.map(plan => (
              <button
                key={plan.id}
                type="button"
                onClick={() => setSelectedPlanId(plan.id)}
                className={`rounded-[1.5rem] border-0 ring-1 p-5 text-left transition-all relative overflow-hidden group hover:-translate-y-0.5 hover:shadow-md ${
                  selectedPlanId === plan.id
                    ? 'ring-black bg-white shadow-none'
                    : 'ring-slate-200 bg-white hover:ring-slate-300'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-black text-slate-900">{plan.name}</p>
                  {plan.id === recommendedPlanId ? (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                      Recommended
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-xs text-slate-500">{plan.description}</p>
                <p className="mt-2 text-base font-black text-slate-900 sm:text-lg">GH₵{plan.amountGhs.toFixed(2)}</p>
                <p className="text-sm font-bold text-emerald-700">{plan.credits.toLocaleString()} credits</p>
                <p className="text-xs text-slate-500">Rate: {plan.rateGhs.toFixed(4)} GHS per credit</p>
                <p className="text-xs text-slate-500">{plan.nonExpiry ? 'Non Expiry' : 'Expiry applies'}</p>
              </button>
            ))}
          </div>

          <div className="mt-4">
            <button
              type="button"
              onClick={() => void buyCredits()}
              disabled={toppingUp || !selectedPlanId}
              className="rounded-xl bg-gradient-to-r from-black to-gray-900 px-6 py-3 text-sm font-bold text-white shadow-md shadow-none hover:scale-[1.02] transition-all disabled:pointer-events-none disabled:opacity-50 sm:text-base"
            >
              {toppingUp ? 'Processing...' : 'Buy Selected Plan'}
            </button>
          </div>
        </div>

        <form onSubmit={submit} className="mt-6 space-y-5">
          <div className="inline-flex items-center gap-2 rounded-xl border border-black bg-white px-4 py-2.5 text-sm font-bold text-black sm:text-base">
            <FiMessageSquare />
            SMS Channel Active
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-slate-500 sm:text-xs">
              Recipient Presets
            </label>
            <div className="grid gap-2 sm:grid-cols-2">
              {segmentOptions.map(option => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => void loadSegmentRecipients(option.key)}
                  disabled={loadingSegment !== null}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-left hover:bg-slate-50 disabled:opacity-60"
                >
                  <p className="text-sm font-bold text-slate-900">
                    {loadingSegment === option.key ? 'Loading...' : option.label}
                  </p>
                  <p className="text-xs text-slate-500">{option.helper}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-slate-500 sm:text-xs">
              Recipients ({channel === 'email' ? 'emails' : 'phone numbers'})
            </label>
            <textarea
              value={recipientsInput}
              onChange={event => setRecipientsInput(event.target.value)}
              placeholder="0241234567, +233241234567"
              rows={4}
              className="w-full rounded-[1.5rem] border-0 ring-1 ring-slate-200 bg-slate-50/50 px-5 py-4 text-sm outline-none focus:ring-2 focus:ring-black focus:bg-white shadow-sm transition-all sm:text-base"
              required
            />
            <p className="mt-2 text-xs text-slate-500 sm:text-sm">Separate recipients with commas, semicolons, or new lines.</p>
            <p className="mt-1 text-xs font-semibold text-slate-700 sm:text-sm">Detected recipients: {recipients.length}</p>
            <p className={`mt-1 text-xs font-semibold sm:text-sm ${insufficientCredits ? 'text-black' : 'text-slate-700'}`}>
              Required credits: {requiredCredits} • Available: {currentCredits}
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-slate-500 sm:text-xs">Message</label>
            <textarea
              value={message}
              onChange={event => setMessage(event.target.value)}
              placeholder="Type your SMS message here..."
              rows={7}
              className="w-full rounded-[1.5rem] border-0 ring-1 ring-slate-200 bg-slate-50/50 px-5 py-4 text-sm outline-none focus:ring-2 focus:ring-black focus:bg-white shadow-sm transition-all sm:text-base"
              required
            />
          </div>

          <button
            type="submit"
            disabled={!canSubmit || submitting || insufficientCredits}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-black to-gray-900 px-6 py-3.5 text-sm font-bold text-white shadow-md shadow-none hover:scale-[1.02] transition-all disabled:pointer-events-none disabled:opacity-50 sm:text-base"
          >
            <FiSend />
            {submitting ? 'Sending...' : 'Send SMS'}
          </button>
          {insufficientCredits ? (
            <p className="text-sm font-semibold text-black">Insufficient credits. Buy more credits before sending.</p>
          ) : null}
        </form>

        {result ? (
          <div
            className={`mt-6 rounded-xl border px-4 py-3 text-sm ${
              result.success
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-black bg-white text-black'
            }`}
          >
            <p className="font-semibold">{result.message || result.error || 'Operation completed.'}</p>
            {typeof result.sent === 'number' && typeof result.totalRecipients === 'number' ? (
              <p className="mt-1">Sent {result.sent} of {result.totalRecipients} recipients.</p>
            ) : null}
            {Array.isArray(result.failures) && result.failures.length > 0 ? (
              <div className="mt-2">
                <p className="font-semibold">Failed recipients:</p>
                <ul className="mt-1 list-disc space-y-1 pl-5">
                  {result.failures.slice(0, 10).map(failure => (
                    <li key={`${failure.recipient}-${failure.error}`}>
                      {failure.recipient}: {failure.error}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
