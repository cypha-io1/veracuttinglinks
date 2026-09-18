import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getUserBySessionToken } from '@/lib/serverAuth';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Manage your Zhilakaii activity, recent orders, and account details from your personal dashboard.',
};

export default async function Layout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get('wf_session')?.value;

  if (!token) {
    redirect('/account');
  }

  const user = await getUserBySessionToken(token);
  if (!user) {
    redirect('/account');
  }

  if (user.role === 'admin') {
    redirect('/admin/dashboard');
  }

  return <>{children}</>;
}
