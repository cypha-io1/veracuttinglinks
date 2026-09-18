import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'Order History',
  description: 'Track your past Zhilakaii orders, payment status, and delivery progress in one place.',
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
