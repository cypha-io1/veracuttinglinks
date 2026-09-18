This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Paystack Test Mode

This project uses Paystack in test mode for online checkout payments (card and mobile money).

Add this to your `.env.local`:

```bash
PAYSTACK_SECRET_KEY=sk_test_your_test_secret_key
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_your_test_public_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Notes:

- Only `sk_test_` keys are accepted by the payment initialization API.
- `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` (or `PAYSTACK_PUBLIC_KEY`) must be a `pk_test_` key for inline Paystack popup checkout.
- Live Paystack checkout applies the split; test checkout skips it because the test integration has no split configured.
- Cash on delivery still works without Paystack.
- Online payment callbacks return to checkout and mark payment as completed when verification succeeds.
- If Paystack returns `Merchant may be inactive` in test mode, the app automatically uses a local mock callback so checkout can still be tested end-to-end.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
