import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'FAQ',
  description: 'Find answers to common questions about Vera Cutting Links products, orders, shipping, and care.',
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
