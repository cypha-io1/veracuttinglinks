import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'Our Locations',
  description: 'View Zhilakaii locations and service points for order support and customer assistance.',
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
