import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'About Us',
  description: 'Learn the story of Vera Cutting Links and our elegant style vision of beautiful comfort and elegant designs in every piece.',
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
