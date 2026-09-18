import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AdminShell from '@/components/admin/AdminShell';
import { getUserBySessionToken } from '@/lib/serverAuth';

export const metadata: Metadata = {
  title: {
    default: 'Admin Dashboard',
    template: '%s | Zhilakaii Admin',
  },
  description: 'Administrative dashboard for managing Zhilakaii products, orders, payments, and operations.',
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get('wf_session')?.value;

  if (!token) {
    redirect('/account');
  }

  const user = await getUserBySessionToken(token);
  if (!user) {
    redirect('/account');
  }

  if (user.role !== 'admin') {
    redirect('/dashboard');
  }

  return <AdminShell userDisplayName={user.fullName || user.phone}>{children}</AdminShell>;
}
