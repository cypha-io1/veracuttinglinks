async function main() {
  const key = process.env.COMM_PAYSTACK_SECRET_KEY;
  if (!key) throw new Error('COMM_PAYSTACK_SECRET_KEY missing');

  const targetRef = 'T226658392342504';
  const targetReceipt = '79166783004';
  const perPage = 100;
  const maxPages = 20;
  const hits = [];
  let pagesChecked = 0;

  for (let page = 1; page <= maxPages; page += 1) {
    const res = await fetch(`https://api.paystack.co/transaction?perPage=${perPage}&page=${page}`, {
      headers: { Authorization: `Bearer ${key}` },
    });

    const payload = await res.json().catch(() => ({}));
    if (!res.ok || !payload?.status || !Array.isArray(payload?.data)) {
      throw new Error(payload?.message || `HTTP ${res.status}`);
    }

    pagesChecked += 1;

    for (const tx of payload.data) {
      const idStr = String(tx?.id ?? '');
      const refStr = String(tx?.reference ?? '');
      const receiptStr = String(tx?.receipt_number ?? '');

      if (idStr === targetReceipt || refStr === targetRef || receiptStr === targetReceipt) {
        hits.push({
          id: tx?.id,
          reference: tx?.reference,
          receipt_number: tx?.receipt_number,
          status: tx?.status,
          amount: tx?.amount,
          paid_at: tx?.paid_at,
          metadata: tx?.metadata || null,
        });
      }
    }

    if (payload.data.length < perPage) {
      break;
    }
  }

  console.log(JSON.stringify({ pagesChecked, hits }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
