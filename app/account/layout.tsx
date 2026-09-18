import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getUserBySessionToken } from '@/lib/serverAuth';

export const metadata: Metadata = {
  title: 'My Account',
  description: 'Sign in to your Zhilakaii account to manage orders, addresses, and profile settings.',
};

export default async function Layout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get('wf_session')?.value;

  if (token) {
    const user = await getUserBySessionToken(token);
    if (user) {
      if (user.role === 'admin') {
        redirect('/admin/dashboard');
      }
      redirect('/dashboard');
    }
  }

  return <>{children}</>;
}
