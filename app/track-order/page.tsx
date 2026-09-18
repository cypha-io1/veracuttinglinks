'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

type TrackedOrderItem = {
  id: number;
  productName: string;
  quantity: number;
  lineTotal: number;
};

type TrackedOrder = {
  id: number;
  orderNumber: string;
  customerName: string;
  phone: string;
  status: 'Paid' | 'Pending' | 'In Progress' | 'Delivered' | 'Cancelled';
  total: number;
  createdAt: string;
  paymentMethod: string;
  paymentCompleted: boolean;
  items: TrackedOrderItem[];
};

const normalizePhoneInput = (value: string) => value.replace(/\D/g, '').slice(0, 10);
const isValidPhone = (value: string) => /^0\d{9}$/.test(value);

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [order, setOrder] = useState<TrackedOrder | null>(null);

  const statusBadgeClass = useMemo(() => {
    if (!order) return 'bg-gray-100 text-gray-600';
    if (order.status === 'Delivered') return 'bg-gray-100 text-gray-700';
    if (order.status === 'Cancelled') return 'bg-white text-black';
    if (order.status === 'Paid') return 'bg-gray-100 text-gray-700';
    return 'bg-white text-black';
  }, [order]);

  const statusMessage = useMemo(() => {
    if (!order) return '';
    if (order.status === 'Delivered') return 'Your order has been delivered successfully.';
    if (order.status === 'Cancelled') return 'This order was cancelled. Please contact support if needed.';
    if (order.status === 'Paid') return 'Payment is confirmed. Your order is being prepared.';
    if (order.status === 'In Progress') return 'Your order is currently in progress.';
    return 'Your order is pending confirmation.';
  }, [order]);

  const onTrack = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!orderNumber.trim() || !isValidPhone(phone)) return;

    try {
      setLoading(true);
      setError('');
      setOrder(null);

      const response = await fetch(
        `/api/orders/track?orderNumber=${encodeURIComponent(orderNumber.trim().toUpperCase())}&phone=${encodeURIComponent(phone.trim())}`,
        { cache: 'no-store' },
      );

      const payload = (await response.json().catch(() => ({}))) as TrackedOrder & { error?: string };

      if (!response.ok) {
        throw new Error(payload.error || 'Order not found');
      }

      setOrder(payload);
      if (typeof window !== 'undefined' && isValidPhone(phone.trim())) {
        window.localStorage.setItem('wf-user-phone', phone.trim());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to track order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="mx-auto w-full max-w-4xl px-4 py-10 pt-24 sm:px-6 sm:py-12 md:pt-32">
        <div className="mb-10 flex flex-col items-center">
          <span className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-black md:text-sm">Find Package</span>
          <h1 className="text-3xl font-black tracking-tight text-gray-800 sm:text-4xl md:text-5xl">Track Order</h1>
          <div className="mt-6 h-1.5 w-16 rounded-full bg-gradient-to-r from-black to-gray-900 shadow-sm" />
        </div>

        <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-gray-200 sm:p-8">
          <p className="text-center text-sm font-medium text-gray-500 sm:text-base">
            Enter your order number and phone number to check the latest order status.
          </p>
          <p className="text-center text-xs font-medium text-gray-400 mt-2">
            If your payment was successful but the order didn't update, <Link href="/confirm-payment" className="text-black underline">confirm your payment here</Link>.
          </p>

          <form onSubmit={onTrack} className="mt-6 grid gap-3 sm:grid-cols-3">
            <input
              type="text"
              value={orderNumber}
              onChange={(event) => setOrderNumber(event.target.value.toUpperCase())}
              placeholder="Order Number (e.g. WF-000123)"
              className="sm:col-span-2 rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black"
              required
            />
            <input
              type="tel"
              value={phone}
              onChange={(event) => setPhone(normalizePhoneInput(event.target.value))}
              placeholder="0XXXXXXXXX"
              pattern="0[0-9]{9}"
              inputMode="numeric"
              maxLength={10}
              className="rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black"
              required
            />

            <button
              type="submit"
              disabled={loading || !orderNumber.trim() || !isValidPhone(phone)}
              className="sm:col-span-3 rounded-[2rem] bg-gradient-to-r from-black to-gray-900 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-none transition-all duration-300 hover:scale-[1.02] hover:shadow-none disabled:scale-100 disabled:opacity-50"
            >
              {loading ? 'Checking...' : 'Track Order'}
            </button>
          </form>

          {error ? (
            <div className="mt-4 rounded-xl border border-black bg-white px-4 py-3 text-sm font-semibold text-black">
              {error}
            </div>
          ) : null}
        </section>

        {order ? (
          <section className="mt-6 rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-gray-200 sm:p-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Order Number</p>
                <p className="mt-1 font-mono text-lg font-bold text-gray-900">{order.orderNumber}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusBadgeClass}`}>
                {order.status}
              </span>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Customer</p>
                <p className="mt-1 text-sm font-bold text-gray-900">{order.customerName}</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Placed On</p>
                <p className="mt-1 text-sm font-bold text-gray-900">{new Date(order.createdAt).toLocaleString()}</p>
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Order Status</p>
              <div className="mt-2 flex items-center justify-between gap-3">
                <p className="text-sm font-bold text-gray-900">{order.status}</p>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusBadgeClass}`}>
                  {order.status}
                </span>
              </div>
              <p className="mt-2 text-sm text-gray-600">{statusMessage}</p>
            </div>

            <div className="mt-5 rounded-xl border border-gray-200 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Items</p>
              <div className="mt-3 space-y-2">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-sm">
                    <p className="text-gray-700">{item.productName} x{item.quantity}</p>
                    <p className="font-bold text-gray-900">GH₵{Number(item.lineTotal).toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-2 rounded-xl border border-gray-200 bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-gray-600">Payment: {order.paymentCompleted ? 'Completed' : 'Pending'}</p>
              <p className="text-xl font-black text-black">GH₵{Number(order.total).toFixed(2)}</p>
            </div>

            <div className="mt-5">
              <Link href="/products" className="inline-flex rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-black">
                Continue Shopping
              </Link>
            </div>
          </section>
        ) : null}
      </main>

      <Footer />
    </div>
  );
}
