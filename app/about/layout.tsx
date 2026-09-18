import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'About Us',
  description: 'Learn the story of Zhilakaii and our Sparkling Heaven vision of celestial elegance and radiant beauty in every piece.',
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
