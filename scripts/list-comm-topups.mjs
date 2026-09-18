async function main() {
  const key = process.env.COMM_PAYSTACK_SECRET_KEY;
  if (!key) throw new Error('COMM_PAYSTACK_SECRET_KEY missing');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);

  try {
    const res = await fetch('https://api.paystack.co/transaction?perPage=50&page=1', {
      headers: { Authorization: `Bearer ${key}` },
      signal: controller.signal,
    });

    const payload = await res.json().catch(() => ({}));
    if (!res.ok || !payload?.status || !Array.isArray(payload?.data)) {
      throw new Error(payload?.message || `HTTP ${res.status}`);
    }

    const topups = payload.data
      .filter(tx => tx?.metadata?.kind === 'communications_credit_topup')
      .map(tx => ({
        reference: tx.reference,
        status: tx.status,
        amount: tx.amount,
        paidAt: tx.paid_at,
        channel: tx?.metadata?.channel,
        adminUserId: tx?.metadata?.adminUserId,
        credits: tx?.metadata?.credits,
      }));

    console.log(JSON.stringify({ count: topups.length, topups }, null, 2));
  } finally {
    clearTimeout(timeout);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
