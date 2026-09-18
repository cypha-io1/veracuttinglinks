import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'Products',
  description: 'Explore Zhilakaii jewelry collections featuring celestial-inspired rings, necklaces, bracelets, and statement pieces.',
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
