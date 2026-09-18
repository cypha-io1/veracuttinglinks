import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Get in touch with Vera Cutting Links for product support, order help, and personalized guidance on our clothing collections.',
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
