import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Checkout',
  description: 'Complete your Vera Cutting Links purchase with secure checkout and trusted payment processing.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
