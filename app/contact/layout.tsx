import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Get in touch with Zhilakaii for product support, order help, and personalized guidance on our jewelry collections.',
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
