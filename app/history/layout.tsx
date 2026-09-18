import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'Order History',
  description: 'Track your past Vera Cutting Links orders, payment status, and delivery progress in one place.',
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
