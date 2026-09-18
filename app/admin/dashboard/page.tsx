'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { FiPackage, FiShoppingBag, FiClock } from 'react-icons/fi';

type OrderItem = {
  id: number;
  productName: string;
  quantity: number;
  lineTotal: number;
};

type Order = {
  id: number;
  orderNumber: string;
  customerName: string;
  status: 'Pending' | 'Delivered' | 'Cancelled';
  total: number;
  createdAt: string;
  items: OrderItem[];
};

type Product = { id: number };

const ADMIN_DASHBOARD_CACHE_KEY = 'wf-admin-dashboard-cache-v1';

function readDashboardCache(): { orders: Order[]; products: Product[] } {
  if (typeof window === 'undefined') return { orders: [], products: [] };
  try {
    const raw = window.sessionStorage.getItem(ADMIN_DASHBOARD_CACHE_KEY);
    if (!raw) return { orders: [], products: [] };
    const parsed = JSON.parse(raw) as { orders?: Order[]; products?: Product[] };
    return {
      orders: Array.isArray(parsed.orders) ? parsed.orders : [],
      products: Array.isArray(parsed.products) ? parsed.products : [],
    };
  } catch {
    return { orders: [], products: [] };
  }
}

export default function AdminDashboardPage() {
  const hasInitialCacheRef = useRef(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const cached = readDashboardCache();
        const hasCachedData = cached.orders.length > 0 || cached.products.length > 0;
        hasInitialCacheRef.current = hasCachedData;

        if (hasCachedData) {
          setOrders(cached.orders);
          setProducts(cached.products);
        }

        setLoading(!hasInitialCacheRef.current);
        const [ordersRes, productsRes] = await Promise.all([
          fetch('/api/orders'),
          fetch('/api/products'),
        ]);

        if (!ordersRes.ok || !productsRes.ok) {
          throw new Error('Failed to load dashboard data');
        }

        const ordersData = (await ordersRes.json()) as Order[];
        const productsData = (await productsRes.json()) as Product[];

        setOrders(ordersData);
        setProducts(productsData);
        if (typeof window !== 'undefined') {
          window.sessionStorage.setItem(
            ADMIN_DASHBOARD_CACHE_KEY,
            JSON.stringify({ orders: ordersData, products: productsData })
          );
        }
        setError('');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const totalRevenue = useMemo(
    () => orders.filter(o => o.status !== 'Cancelled').reduce((sum, order) => sum + Number(order.total || 0), 0),
    [orders]
  );

  const totalOrders = orders.length;
  const pendingOrders = orders.filter(order => order.status === 'Pending').length;

  const recentOrders = orders.slice(0, 8);

  return (
    <section className="w-full">
      <div className="rounded-[2rem] border-0 bg-white p-6 shadow-sm ring-1 ring-slate-200/50 sm:p-8 lg:p-10 relative overflow-hidden">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-black text-gray-900 sm:text-3xl lg:text-4xl">Admin Dashboard</h1>
            <p className="mt-1 text-sm text-gray-600 sm:text-base">Monitor sales, orders, and catalog performance.</p>
          </div>
          <Link href="/admin/orders" className="inline-flex items-center justify-center rounded-xl bg-black px-4 py-2 text-sm font-bold text-white hover:bg-gray-800 sm:text-base">
            View Full Orders
          </Link>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-black bg-white p-4">
            <p className="text-sm font-semibold text-black">{error}</p>
          </div>
        )}

        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-[2rem] border-0 bg-white p-6 shadow-sm ring-1 ring-slate-200/50 sm:p-8 relative overflow-hidden group hover:-translate-y-0.5 transition-transform duration-300">
            <div className="absolute right-0 top-0 h-32 w-32 -translate-y-8 translate-x-8 rounded-full bg-slate-50/50 opacity-50 transition-transform duration-500 group-hover:scale-150" />
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 sm:text-sm">Revenue</p>
                <p className="text-xl font-black text-gray-900 sm:text-2xl">GH₵{totalRevenue.toFixed(2)}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-black sm:h-11 sm:w-11">
                <span className="text-base font-black leading-none sm:text-lg">₵</span>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border-0 bg-white p-6 shadow-sm ring-1 ring-slate-200/50 sm:p-8 relative overflow-hidden group hover:-translate-y-0.5 transition-transform duration-300">
            <div className="absolute right-0 top-0 h-32 w-32 -translate-y-8 translate-x-8 rounded-full bg-slate-50/50 opacity-50 transition-transform duration-500 group-hover:scale-150" />
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 sm:text-sm">Total Orders</p>
                <p className="text-xl font-black text-gray-900 sm:text-2xl">{totalOrders}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-black sm:h-11 sm:w-11">
                <FiShoppingBag />
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border-0 bg-white p-6 shadow-sm ring-1 ring-slate-200/50 sm:p-8 relative overflow-hidden group hover:-translate-y-0.5 transition-transform duration-300">
            <div className="absolute right-0 top-0 h-32 w-32 -translate-y-8 translate-x-8 rounded-full bg-slate-50/50 opacity-50 transition-transform duration-500 group-hover:scale-150" />
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 sm:text-sm">Pending</p>
                <p className="text-xl font-black text-gray-900 sm:text-2xl">{pendingOrders}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-black sm:h-11 sm:w-11">
                <FiClock />
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border-0 bg-white p-6 shadow-sm ring-1 ring-slate-200/50 sm:p-8 relative overflow-hidden group hover:-translate-y-0.5 transition-transform duration-300">
            <div className="absolute right-0 top-0 h-32 w-32 -translate-y-8 translate-x-8 rounded-full bg-slate-50/50 opacity-50 transition-transform duration-500 group-hover:scale-150" />
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 sm:text-sm">Products</p>
                <p className="text-xl font-black text-gray-900 sm:text-2xl">{products.length}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-black sm:h-11 sm:w-11">
                <FiPackage />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] border-0 ring-1 ring-slate-200/50 shadow-sm overflow-hidden">
          <div className="border-b border-gray-100 px-4 py-3 sm:px-5 sm:py-4">
            <h2 className="text-lg font-black text-gray-900 sm:text-xl">Recent Orders</h2>
          </div>

          {loading ? (
            <div className="px-5 py-10 text-gray-600">Loading dashboard...</div>
          ) : recentOrders.length === 0 ? (
            <div className="px-5 py-10 text-gray-600">No orders yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr className="text-left text-xs text-gray-500 sm:text-sm">
                    <th className="px-4 py-3 sm:px-5">Order</th>
                    <th className="px-4 py-3 sm:px-5">Customer</th>
                    <th className="px-4 py-3 sm:px-5">Date</th>
                    <th className="px-4 py-3 sm:px-5">Status</th>
                    <th className="px-4 py-3 sm:px-5">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map(order => (
                    <tr key={order.id} className="border-t border-gray-100 text-xs sm:text-sm">
                      <td className="px-4 py-3 font-bold text-gray-900 sm:px-5">{order.orderNumber}</td>
                      <td className="px-4 py-3 text-gray-700 sm:px-5">{order.customerName}</td>
                      <td className="px-4 py-3 text-gray-700 sm:px-5">{new Date(order.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3 sm:px-5">
                        <span className={`rounded-full px-2 py-1 text-[10px] font-bold sm:px-2.5 sm:text-xs ${
                          order.status === 'Delivered'
                            ? 'bg-white text-black'
                            : order.status === 'Cancelled'
                              ? 'bg-white text-black'
                              : 'bg-white text-black'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-bold text-black sm:px-5">GH₵{Number(order.total).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/admin/products" className="inline-flex items-center justify-center rounded-xl bg-gray-900 px-4 py-2 text-sm font-bold text-white hover:bg-black">
            Manage Catalog
          </Link>
          <Link href="/admin/orders" className="inline-flex items-center justify-center rounded-xl bg-gray-100 px-4 py-2 text-sm font-bold text-gray-800 hover:bg-gray-200">
            Manage Orders
          </Link>
        </div>
      </div>
    </section>
  );
}
