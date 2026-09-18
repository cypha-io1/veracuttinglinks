import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'Delivery Info',
  description: 'Learn about Zhilakaii delivery timelines, shipping coverage, and order fulfillment details.',
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
