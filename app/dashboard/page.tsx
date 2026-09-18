'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FiPackage, FiShoppingCart, FiClock } from 'react-icons/fi';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useCart } from '@/hooks/useCart';

type Profile = {
  fullName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
};

type OrderItem = {
  id: number;
  productName: string;
  quantity: number;
};

type Order = {
  id: number;
  orderNumber: string;
  status: 'Pending' | 'In Progress' | 'Delivered' | 'Cancelled';
  total: number;
  createdAt: string;
  items: OrderItem[];
};

function OrdersListSkeleton() {
  return (
    <div className="p-2 sm:p-4 space-y-2" aria-hidden="true">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={`order-skeleton-${index}`} className="animate-pulse flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-slate-50">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-slate-200 flex-shrink-0" />
            <div className="space-y-2 mt-1">
              <div className="h-5 w-32 rounded-lg bg-slate-200" />
              <div className="h-4 w-24 rounded-lg bg-slate-200" />
            </div>
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto mt-2 sm:mt-0">
             <div className="h-6 w-20 rounded-full bg-slate-200" />
             <div className="h-6 w-16 rounded-lg bg-slate-200" />
          </div>
        </div>
      ))}
    </div>
  );
}

const normalizePhoneInput = (value: string) => value.replace(/\D/g, '').slice(0, 10);
const isValidPhone = (value: string) => /^0\d{9}$/.test(value);

export default function UserDashboardPage() {
  const router = useRouter();
  const { items, totalItems } = useCart();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile>({
    fullName: '',
    phone: '',
    email: '',
    address: '',
    city: 'Accra',
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  useEffect(() => {
    const loadOrders = async () => {
      try {
        setLoading(true);
        const storedPhone = window.localStorage.getItem('wf-user-phone')?.trim() || '';
        const endpoint = storedPhone
          ? `/api/orders?phone=${encodeURIComponent(storedPhone)}`
          : '/api/orders';
        const response = await fetch(endpoint);
        if (!response.ok) throw new Error('Failed to load orders');
        const data = (await response.json()) as Order[];
        setOrders(data);
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, []);

  useEffect(() => {
    const storedPhone = window.localStorage.getItem('wf-user-phone') || '';
    if (storedPhone) {
      setProfile(prev => ({ ...prev, phone: storedPhone }));
      loadProfile(storedPhone);
    }
  }, []);

  const loadProfile = async (phone: string) => {
    const normalizedPhone = phone.trim();
    if (!normalizedPhone) return;

    try {
      setProfileLoading(true);
      const response = await fetch(`/api/profile?phone=${encodeURIComponent(normalizedPhone)}`);
      if (!response.ok) throw new Error('Failed to fetch profile');
      const data = (await response.json()) as {
        fullName: string;
        phone: string;
        email: string | null;
        address: string | null;
        city: string | null;
      } | null;

      if (data) {
        setProfile({
          fullName: data.fullName || '',
          phone: data.phone || normalizedPhone,
          email: data.email || '',
          address: data.address || '',
          city: data.city || 'Accra',
        });
      }
    } catch {
      setProfileMessage('Could not load saved details. You can still save new details below.');
    } finally {
      setProfileLoading(false);
    }
  };

  const saveProfile = async () => {
    if (!profile.fullName.trim() || !profile.phone.trim()) {
      setProfileMessage('Full name and phone are required.');
      return;
    }

    if (!isValidPhone(profile.phone.trim())) {
      setProfileMessage('Phone number must be 10 digits and start with 0.');
      return;
    }

    try {
      setProfileSaving(true);
      setProfileMessage('');

      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Failed to save profile');
      }

      window.localStorage.setItem('wf-user-phone', profile.phone.trim());
      setProfileMessage('Details updated successfully.');
      setIsEditingProfile(false);
    } catch (error) {
      setProfileMessage(error instanceof Error ? error.message : 'Failed to save profile');
    } finally {
      setProfileSaving(false);
    }
  };

  const activeOrders = useMemo(
    () => orders.filter(order => order.status === 'Pending' || order.status === 'In Progress').length,
    [orders]
  );

  const recentOrders = orders.slice(0, 5);
  const cartTotal = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.price.replace(/[^0-9.]/g, '')) * item.quantity, 0),
    [items]
  );

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      router.push('/account');
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-8 pt-24 sm:px-6 sm:py-12 md:pt-32">
        <div className="mb-10 flex flex-col items-center text-center">
          <span className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-black md:text-sm">Account Area</span>
          <h1 className="text-3xl font-black tracking-tight text-slate-800 sm:text-4xl md:text-5xl">Your Dashboard</h1>
          <p className="mt-4 text-slate-500 max-w-xl">Track your cart, active orders, and recent purchases all in one place.</p>
          <div className="mt-8 h-1.5 w-16 rounded-full bg-gradient-to-r from-black to-gray-900 shadow-sm" />
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          <div className="rounded-[2rem] bg-white p-6 sm:p-8 shadow-sm ring-1 ring-slate-200 transition-all duration-300 hover:shadow-md hover:ring-black relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-bl from-white to-transparent rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500" />
            <div className="flex items-center gap-4 mb-4 relative z-10">
              <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center text-white text-xl shadow-inner group-hover:bg-gray-800 group-hover:text-white transition-colors duration-300">
                <FiShoppingCart />
              </div>
              <p className="text-sm font-black uppercase tracking-wider text-slate-500">Cart Items</p>
            </div>
            <p className="text-4xl font-black text-slate-800 relative z-10">{totalItems}</p>
            <p className="text-sm text-black font-bold mt-2 relative z-10">GH₵{cartTotal.toFixed(2)}</p>
          </div>

          <div className="rounded-[2rem] bg-white p-6 sm:p-8 shadow-sm ring-1 ring-slate-200 transition-all duration-300 hover:shadow-md hover:ring-black relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-bl from-white to-transparent rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500" />
            <div className="flex items-center gap-4 mb-4 relative z-10">
              <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center text-white text-xl shadow-inner group-hover:bg-gray-800 group-hover:text-white transition-colors duration-300">
                <FiPackage />
              </div>
              <p className="text-sm font-black uppercase tracking-wider text-slate-500">Active Orders</p>
            </div>
            <p className="text-4xl font-black text-slate-800 relative z-10">{activeOrders}</p>
            <p className="text-sm text-slate-500 mt-2 font-medium relative z-10">Pending confirmation or delivery</p>
          </div>

          <div className="rounded-[2rem] bg-white p-6 sm:p-8 shadow-sm ring-1 ring-slate-200 transition-all duration-300 hover:shadow-md hover:ring-black sm:col-span-2 lg:col-span-1 relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-bl from-white to-transparent rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500" />
            <div className="flex items-center gap-4 mb-4 relative z-10">
              <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center text-white text-xl shadow-inner group-hover:bg-gray-800 group-hover:text-white transition-colors duration-300">
                <FiClock />
              </div>
              <p className="text-sm font-black uppercase tracking-wider text-slate-500">Total Orders</p>
            </div>
            <p className="text-4xl font-black text-slate-800 relative z-10">{orders.length}</p>
            <p className="text-sm text-slate-500 mt-2 font-medium relative z-10">All-time purchase count</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1.5fr_1fr] gap-8 mb-10">
          <section className="rounded-[2rem] bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
            <div className="px-6 py-6 sm:px-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-800">Recent Orders</h2>
              <Link href="/history" className="text-sm font-bold text-black hover:text-black flex items-center gap-1">
                View All <span aria-hidden="true">&rarr;</span>
              </Link>
            </div>

            <div className="flex-1 p-2 sm:p-4">
              {loading ? (
                <OrdersListSkeleton />
              ) : recentOrders.length === 0 ? (
                <div className="px-6 py-12 text-center text-slate-500 font-medium">No orders yet.</div>
              ) : (
                <div className="space-y-2">
                  {recentOrders.map(order => (
                    <div key={order.id} className="p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:bg-slate-50 group">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center flex-shrink-0 group-hover:bg-white group-hover:shadow-sm transition-all text-slate-400">
                          <FiPackage className="text-xl" />
                        </div>
                        <div className="pt-1">
                          <p className="font-black text-lg text-slate-800">{order.orderNumber}</p>
                          <p className="text-sm text-slate-500 font-medium mt-0.5">{new Date(order.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-5 w-full sm:w-auto mt-2 sm:mt-0">
                        <span className={`px-3 py-1.5 rounded-full text-xs font-black tracking-widest uppercase ${
                          order.status === 'Delivered'
                            ? 'bg-white text-black'
                            : order.status === 'Cancelled'
                              ? 'bg-white text-black'
                              : 'bg-white text-black'
                        }`}>
                          {order.status}
                        </span>
                        <p className="font-black text-lg text-slate-800">GH₵{Number(order.total).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="rounded-[2rem] bg-white p-6 sm:p-8 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-xl font-black text-slate-800 mb-6">Quick Actions</h2>
            <div className="space-y-3">
              <Link href="/products" className="group w-full px-5 py-4 rounded-2xl bg-slate-50 text-slate-700 font-black hover:bg-white hover:text-black transition-all flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FiPackage className="text-xl" />
                  <span>Browse Products</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">→</div>
              </Link>
              
              <Link href="/cart" className="group w-full px-5 py-4 rounded-2xl bg-slate-50 text-slate-700 font-black hover:bg-white hover:text-black transition-all flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FiShoppingCart className="text-xl" />
                  <span>Go to Cart</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">→</div>
              </Link>

              <Link href="/history" className="group w-full px-5 py-4 rounded-2xl bg-slate-50 text-slate-700 font-black hover:bg-white hover:text-black transition-all flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FiClock className="text-xl" />
                  <span>View Order History</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">→</div>
              </Link>

              <button
                type="button"
                onClick={logout}
                className="w-full mt-4 px-5 py-4 rounded-2xl bg-slate-900 text-white font-black hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                Logout Account
              </button>
            </div>
          </section>
        </div>

        <section className="rounded-[2rem] bg-white p-6 sm:p-8 shadow-sm ring-1 ring-slate-200 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-br from-white to-transparent rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />
          
          <div className="flex items-center justify-between gap-3 mb-8 relative z-10">
            <div>
              <h2 className="text-2xl font-black text-slate-800">My Details</h2>
              <p className="text-sm font-medium text-slate-500 mt-1">Update your shipping and contact information.</p>
            </div>
            {profileLoading && <div className="h-4 w-28 rounded-full bg-slate-100 animate-pulse" aria-hidden="true" />}
          </div>

          {!isEditingProfile ? (
            <div className="relative z-10">
              <div className="grid sm:grid-cols-2 gap-y-6 gap-x-8 mb-8">
                 <div>
                   <p className="text-xs font-black uppercase tracking-wider text-slate-500 mb-1">Full Name</p>
                   <p className="font-medium text-slate-800">{profile.fullName || '—'}</p>
                 </div>
                 <div>
                   <p className="text-xs font-black uppercase tracking-wider text-slate-500 mb-1">Phone Number</p>
                   <p className="font-medium text-slate-800">{profile.phone || '—'}</p>
                 </div>
                 <div>
                   <p className="text-xs font-black uppercase tracking-wider text-slate-500 mb-1">Email</p>
                   <p className="font-medium text-slate-800">{profile.email || '—'}</p>
                 </div>
                 <div>
                   <p className="text-xs font-black uppercase tracking-wider text-slate-500 mb-1">Location</p>
                   <p className="font-medium text-slate-800">
                     {[profile.address, profile.city].filter(Boolean).join(', ') || '—'}
                   </p>
                 </div>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-4 border-t border-slate-100 pt-6">
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(true)}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-slate-900 text-white font-black hover:bg-slate-800 transition-all shadow-md hover:shadow-lg"
                >
                  Edit Details
                </button>
                {profileMessage && (
                  <p className={`text-sm font-bold px-4 py-2 rounded-xl ${profileMessage.includes('successfully') ? 'bg-white text-black' : 'bg-white text-black'}`}>
                    {profileMessage}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="grid sm:grid-cols-2 gap-5 relative z-10">
                <div className="space-y-1.5 cursor-text">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-500 ml-1">Full Name</label>
                  <input
                    type="text"
                    value={profile.fullName}
                    onChange={(e) => setProfile(prev => ({ ...prev, fullName: e.target.value }))}
                    placeholder="John Doe"
                    className="w-full bg-slate-50 border-0 ring-1 ring-slate-200 rounded-2xl px-5 py-3.5 font-medium text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-black focus:bg-white transition-all outline-none"
                  />
                </div>

                <div className="space-y-1.5 cursor-text">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-500 ml-1">Phone Number</label>
                  <div className="flex gap-2 relative">
                    <input
                      type="tel"
                      value={profile.phone}
                      onChange={(e) => setProfile(prev => ({ ...prev, phone: normalizePhoneInput(e.target.value) }))}
                      inputMode="numeric"
                      pattern="0[0-9]{9}"
                      maxLength={10}
                      placeholder="0XXXXXXXXX"
                      className="w-full bg-slate-50 border-0 ring-1 ring-slate-200 rounded-2xl pl-5 pr-24 py-3.5 font-medium text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-black focus:bg-white transition-all outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => loadProfile(profile.phone)}
                      className="absolute right-1.5 top-1.5 bottom-1.5 px-4 rounded-xl bg-white shadow-sm text-slate-700 font-bold hover:bg-slate-50 transition-all flex items-center justify-center text-sm"
                    >
                      Load
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 cursor-text">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-500 ml-1">Email</label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="john@example.com"
                    className="w-full bg-slate-50 border-0 ring-1 ring-slate-200 rounded-2xl px-5 py-3.5 font-medium text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-black focus:bg-white transition-all outline-none"
                  />
                </div>

                <div className="space-y-1.5 cursor-text">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-500 ml-1">City</label>
                  <input
                    type="text"
                    value={profile.city}
                    onChange={(e) => setProfile(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="Accra"
                    className="w-full bg-slate-50 border-0 ring-1 ring-slate-200 rounded-2xl px-5 py-3.5 font-medium text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-black focus:bg-white transition-all outline-none"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2 cursor-text">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-500 ml-1">Delivery Address</label>
                  <input
                    type="text"
                    value={profile.address}
                    onChange={(e) => setProfile(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="123 Main St, Apartment 4B"
                    className="w-full bg-slate-50 border-0 ring-1 ring-slate-200 rounded-2xl px-5 py-3.5 font-medium text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-black focus:bg-white transition-all outline-none"
                  />
                </div>
              </div>

              <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 relative z-10 pt-6 border-t border-slate-100">
                <button
                  type="button"
                  onClick={saveProfile}
                  disabled={profileSaving}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-gradient-to-r from-black to-gray-900 text-white font-black hover:scale-[1.02] transition-all shadow-lg shadow-none disabled:opacity-60 disabled:hover:scale-100 flex items-center justify-center gap-2"
                >
                  {profileSaving ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    'Save Details'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingProfile(false);
                    setProfileMessage('');
                  }}
                  disabled={profileSaving}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-slate-100 text-slate-700 font-black hover:bg-slate-200 transition-all disabled:opacity-60"
                >
                  Cancel
                </button>
                {profileMessage && (
                  <p className={`text-sm font-bold px-4 py-2 rounded-xl ${profileMessage.includes('successfully') ? 'bg-white text-black' : 'bg-white text-black'}`}>
                    {profileMessage}
                  </p>
                )}
              </div>
            </>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
