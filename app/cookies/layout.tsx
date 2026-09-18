import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'Cookie Policy',
  description: 'Understand how Vera Cutting Links uses cookies to improve browsing, shopping, and account experiences.',
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
