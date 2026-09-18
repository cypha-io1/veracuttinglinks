async function inspectIdentifier(key, label, value) {
  const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(value)}`, {
    headers: { Authorization: `Bearer ${key}` },
    cache: 'no-store',
  });
  const verifyPayload = await verifyRes.json().catch(() => ({}));

  const byIdRes = await fetch(`https://api.paystack.co/transaction/${encodeURIComponent(value)}`, {
    headers: { Authorization: `Bearer ${key}` },
    cache: 'no-store',
  });
  const byIdPayload = await byIdRes.json().catch(() => ({}));

  return {
    inputType: label,
    input: value,
    verify: {
      httpStatus: verifyRes.status,
      status: verifyPayload?.status,
      message: verifyPayload?.message,
      txnStatus: verifyPayload?.data?.status,
      reference: verifyPayload?.data?.reference,
      id: verifyPayload?.data?.id,
      metadata: verifyPayload?.data?.metadata || null,
    },
    transactionById: {
      httpStatus: byIdRes.status,
      status: byIdPayload?.status,
      message: byIdPayload?.message,
      txnStatus: byIdPayload?.data?.status,
      reference: byIdPayload?.data?.reference,
      id: byIdPayload?.data?.id,
      metadata: byIdPayload?.data?.metadata || null,
    },
  };
}

async function main() {
  const key = process.env.COMM_PAYSTACK_SECRET_KEY;
  if (!key) throw new Error('COMM_PAYSTACK_SECRET_KEY missing in .env');

  const results = [];
  results.push(await inspectIdentifier(key, 'reference', 'T226658392342504'));
  results.push(await inspectIdentifier(key, 'receipt', '79166783004'));

  console.log(JSON.stringify(results, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
