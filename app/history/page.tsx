'use client';

import { useEffect, useMemo, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { FiClock, FiCheckCircle, FiXCircle, FiSearch, FiFilter } from 'react-icons/fi';

type OrderItem = {
  id: number;
  productName: string;
  quantity: number;
  lineTotal: number;
};

type Order = {
  id: number;
  orderNumber: string;
  createdAt: string;
  status: 'Pending' | 'In Progress' | 'Delivered' | 'Cancelled';
  total: number;
  items: OrderItem[];
};

function OrderHistorySkeleton() {
  return (
    <div className="space-y-4" aria-hidden="true">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={`history-skeleton-${index}`} className="animate-pulse rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="h-4 w-32 rounded bg-gray-200" />
          <div className="mt-3 h-3 w-24 rounded bg-gray-200" />
          <div className="mt-4 h-4 w-3/4 rounded bg-gray-200" />
          <div className="mt-6 h-6 w-28 rounded bg-gray-200" />
        </div>
      ))}
    </div>
  );
}

export default function HistoryPage() {
  const [statusFilter, setStatusFilter] = useState<'all' | 'Pending' | 'In Progress' | 'Delivered' | 'Cancelled'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadOrders = async () => {
      try {
        setLoading(true);
        const storedPhone = window.localStorage.getItem('wf-user-phone')?.trim() || '';
        const endpoint = storedPhone
          ? `/api/orders?phone=${encodeURIComponent(storedPhone)}`
          : '/api/orders';
        const response = await fetch(endpoint);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = (await response.json()) as Order[];
        setOrders(data);
        setError('');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load orders');
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, []);

  const deliveredCount = useMemo(
    () => orders.filter(order => order.status === 'Delivered').length,
    [orders]
  );

  const pendingCount = useMemo(
    () => orders.filter(order => order.status === 'Pending').length,
    [orders]
  );

  const filteredOrders = orders.filter((order) => {
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const itemNames = order.items.map(item => item.productName).join(', ');
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      itemNames.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="mx-auto max-w-7xl px-4 py-10 pt-24 sm:px-6 sm:py-12 md:pt-32">
        <div className="mb-10 flex flex-col items-center">
          <span className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-black md:text-sm">My Account</span>
          <h1 className="text-3xl font-black tracking-tight text-gray-800 sm:text-4xl md:text-5xl">Order History</h1>
          <div className="mt-6 h-1.5 w-16 rounded-full bg-gradient-to-r from-white to-white shadow-sm" />
          <p className="mt-4 text-gray-500 font-medium text-center">Track, repeat, and manage your previous orders.</p>
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-end gap-4 mb-8">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by order or items"
                className="pl-9 pr-4 py-2.5 rounded-full border border-gray-200 text-sm font-semibold text-gray-700 focus:outline-none focus:border-black"
              />
            </div>
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-full px-3 py-2">
              <FiFilter className="text-gray-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'Pending' | 'In Progress' | 'Delivered' | 'Cancelled')}
                className="text-sm font-semibold text-gray-700 focus:outline-none bg-transparent"
              >
                <option value="all">All</option>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-semibold">Total Orders</p>
                <p className="text-2xl font-black text-gray-900">{orders.length}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white text-black flex items-center justify-center">
                <FiClock size={20} />
              </div>
            </div>
          </div>
          <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-semibold">Delivered</p>
                <p className="text-2xl font-black text-gray-900">{deliveredCount}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white text-black flex items-center justify-center">
                <FiCheckCircle size={20} />
              </div>
            </div>
          </div>
          <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-semibold">Pending</p>
                <p className="text-2xl font-black text-gray-900">{pendingCount}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white text-black flex items-center justify-center">
                <FiXCircle size={20} />
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-white border border-black rounded-xl p-4 mb-6">
            <p className="text-sm font-semibold text-black">Failed to load orders: {error}</p>
          </div>
        )}

        <div className="space-y-4">
          {loading && <OrderHistorySkeleton />}

          {!loading && filteredOrders.map((order) => (
            <div key={order.id} className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-gray-200 transition-all hover:shadow-md hover:ring-black">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-sm font-bold text-gray-500">Order</span>
                    <span className="text-lg font-black text-gray-900">{order.orderNumber}</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      order.status === 'Delivered'
                        ? 'bg-white text-black'
                        : order.status === 'Cancelled'
                          ? 'bg-white text-black'
                          : 'bg-white text-black'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-1">{new Date(order.createdAt).toLocaleDateString()}</p>
                  <p className="text-gray-800 font-medium">
                    {order.items.map(item => `${item.productName} x${item.quantity}`).join(', ')}
                  </p>
                </div>
                <div className="flex flex-col items-start lg:items-end gap-3">
                  <p className="font-black text-2xl text-black">GH₵{Number(order.total).toFixed(2)}</p>
                </div>
              </div>
            </div>
          ))}

          {!loading && filteredOrders.length === 0 && (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
              <p className="text-gray-600">No orders found.</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
