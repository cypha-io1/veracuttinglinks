import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'Your Cart',
  description: 'Review your selected Zhilakaii pieces before checkout and complete your order securely.',
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
