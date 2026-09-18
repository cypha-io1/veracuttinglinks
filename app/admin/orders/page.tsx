'use client';

import { useEffect, useMemo, useState } from 'react';

type OrderStatus = 'Pending' | 'In Progress' | 'Paid' | 'Delivered' | 'Cancelled';

type OrderItem = {
  id: number;
  productId?: number | null;
  productName: string;
  variationKey?: string | null;
  variationLabel?: string | null;
  quantity: number;
  lineTotal?: number;
};

type Order = {
  id: number;
  orderNumber: string;
  customerName: string;
  phone: string;
  email?: string | null;
  address: string;
  city: string;
  notes?: string | null;
  status: OrderStatus;
  paymentCompleted?: boolean;
  paymentMethod?: string;
  total: number;
  createdAt: string;
  items?: OrderItem[];
};

type SaveMap = Record<number, boolean>;
type Toast = {
  type: 'success' | 'error';
  message: string;
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [originalStatuses, setOriginalStatuses] = useState<Record<number, OrderStatus>>({});
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<Toast | null>(null);
  const [saving, setSaving] = useState<SaveMap>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | OrderStatus>('All');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/orders', { cache: 'no-store' });
        if (!response.ok) throw new Error('Failed to load orders');
        const payload = (await response.json()) as Order[];
        setOrders(payload);

        const statusMap: Record<number, OrderStatus> = {};
        for (const order of payload) {
          statusMap[order.id] = order.status;
        }
        setOriginalStatuses(statusMap);
      } catch (err) {
        setToast({ type: 'error', message: err instanceof Error ? err.message : 'Failed to load orders' });
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const deliveredCount = useMemo(() => orders.filter(order => order.status === 'Delivered').length, [orders]);

  const filteredOrders = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return orders.filter(order => {
      const statusMatches = statusFilter === 'All' || order.status === statusFilter;
      if (!statusMatches) return false;
      if (!query) return true;

      const itemNames = Array.isArray(order.items) ? order.items.map(item => item.productName).join(' ') : '';
      const haystack = [
        order.orderNumber,
        order.customerName,
        order.phone,
        order.email || '',
        order.address,
        order.city,
        order.status,
        itemNames,
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [orders, searchQuery, statusFilter]);

  const isPaymentCompleted = (order: Order) =>
    Boolean(order.paymentCompleted) || order.status === 'Paid' || order.status === 'Delivered' || order.status === 'Cancelled';

  const getItemVariationText = (item: OrderItem) => {
    const label = String(item.variationLabel || '').trim();
    if (label) return label;

    const key = String(item.variationKey || '').trim();
    if (key) {
      return key
        .split('|')
        .map(pair => pair.trim())
        .filter(Boolean)
        .map(pair => {
          const [name, option] = pair.split(':');
          if (!name) return pair;
          return option ? `${name}: ${option}` : name;
        })
        .join(', ');
    }

    const productName = String(item.productName || '').trim();
    if (!productName) return '';

    const parenthesisMatch = productName.match(/\(([^()]*:[^()]*)\)\s*$/);
    if (parenthesisMatch?.[1]) return parenthesisMatch[1].trim();

    const bracketMatch = productName.match(/\[([^\[\]]*:[^\[\]]*)\]\s*$/);
    if (bracketMatch?.[1]) return bracketMatch[1].trim();

    const dashMatch = productName.match(/\s[-–]\s([^\n]*:[^\n]*)$/);
    if (dashMatch?.[1]) return dashMatch[1].trim();

    return '';
  };

  const setRowStatus = (id: number, status: OrderStatus) => {
    setOrders(prev => prev.map(order => (order.id === id ? { ...order, status } : order)));
  };

  const resetRowStatus = (id: number) => {
    const initial = originalStatuses[id];
    if (!initial) return;
    setRowStatus(id, initial);
  };

  const saveStatus = async (order: Order) => {
    try {
      setSaving(prev => ({ ...prev, [order.id]: true }));

      const response = await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: order.status }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error || 'Failed to update order status');
      }

      setOriginalStatuses(prev => ({ ...prev, [order.id]: order.status }));
      setToast({ type: 'success', message: `Order ${order.orderNumber} updated.` });
    } catch (err) {
      setToast({ type: 'error', message: err instanceof Error ? err.message : 'Failed to update order status' });
    } finally {
      setSaving(prev => ({ ...prev, [order.id]: false }));
    }
  };

  const copyText = async (label: string, value: string) => {
    if (!value.trim()) {
      setToast({ type: 'error', message: `${label} is empty.` });
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      setToast({ type: 'success', message: `${label} copied.` });
    } catch {
      setToast({ type: 'error', message: `Failed to copy ${label.toLowerCase()}.` });
    }
  };

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    if (!selectedOrder) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedOrder(null);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedOrder]);

  return (
    <section className="w-full">
      {toast && (
        <div className="fixed right-4 top-4 z-50">
          <div
            className={`rounded-lg px-4 py-3 text-sm font-semibold shadow-lg ${
              toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
            }`}
          >
            {toast.message}
          </div>
        </div>
      )}
      <div className="rounded-[2rem] border-0 bg-white p-6 shadow-sm ring-1 ring-slate-200/50 sm:p-8 lg:p-10 relative overflow-hidden">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900 sm:text-3xl lg:text-4xl">Orders</h1>
            <p className="mt-1 text-sm text-slate-600 sm:text-base">Track orders and update their status.</p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total</p>
            <p className="mt-2 text-2xl font-black text-slate-900">{orders.length}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Delivered</p>
            <p className="mt-2 text-2xl font-black text-slate-900">{deliveredCount}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Pending</p>
            <p className="mt-2 text-2xl font-black text-slate-900">{orders.filter(order => order.status === 'Pending').length}</p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px]">
          <div>
            <label htmlFor="order-search" className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Search Orders
            </label>
            <input
              id="order-search"
              type="search"
              value={searchQuery}
              onChange={event => setSearchQuery(event.target.value)}
              placeholder="Search by order no, customer, phone, address, status, or product"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-black focus:ring-2 focus:ring-black"
            />
          </div>
          <div>
            <label htmlFor="order-status-filter" className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Status Filter
            </label>
            <select
              id="order-status-filter"
              value={statusFilter}
              onChange={event => setStatusFilter(event.target.value as 'All' | OrderStatus)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-black focus:ring-2 focus:ring-black"
            >
              <option value="All">All</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Paid">Paid</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
          <p className="text-xs text-slate-500 sm:col-span-2">
            Showing {filteredOrders.length} of {orders.length} order{orders.length === 1 ? '' : 's'}.
          </p>
        </div>

        <div className="mt-6 space-y-4 md:hidden">
          {loading ? (
            <div className="rounded-xl border border-slate-200 bg-white p-5 text-slate-600">Loading orders...</div>
          ) : filteredOrders.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-5 text-slate-600">No orders found.</div>
          ) : (
            filteredOrders.map(order => (
              <details key={order.id} className="group rounded-xl border border-slate-200 bg-white shadow-sm">
                <summary className="cursor-pointer list-none p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Order</p>
                      <button
                        type="button"
                        onClick={() => setSelectedOrder(order)}
                        className="mt-1 inline-flex rounded-md bg-slate-100 px-2 py-1 font-mono text-xs font-bold text-slate-700 hover:bg-slate-200"
                      >
                        {order.orderNumber}
                      </button>
                      <p className="mt-2 text-sm font-semibold text-slate-900">GH₵{Number(order.total).toFixed(2)}</p>
                      <p className="mt-1 text-xs font-medium text-slate-500">
                        {(order.items?.length ?? 0)} item{(order.items?.length ?? 0) === 1 ? '' : 's'}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          isPaymentCompleted(order)
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-white text-black'
                        }`}
                      >
                        {isPaymentCompleted(order) ? 'Payment Completed' : 'Payment Pending'}
                      </span>
                      <span className="text-xs font-semibold text-slate-500 group-open:hidden">Tap to expand</span>
                      <span className="hidden text-xs font-semibold text-slate-500 group-open:inline">Tap to collapse</span>
                    </div>
                  </div>
                </summary>

                <div className="border-t border-slate-100 p-4 pt-3">
                  <div className="space-y-1 text-sm text-slate-700">
                    <p className="font-bold text-slate-900">{order.customerName}</p>
                    <p>Phone: {order.phone || '-'}</p>
                    <p>Email: {order.email || '-'}</p>
                    <p>Address: {order.address}, {order.city}</p>
                    {order.notes ? <p className="text-slate-500">Notes: {order.notes}</p> : null}
                  </div>

                  <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Products Purchased</p>
                    {Array.isArray(order.items) && order.items.length > 0 ? (
                      <ul className="mt-2 space-y-1">
                        {order.items.map(item => {
                          const variationText = getItemVariationText(item);
                          return (
                            <li key={`${order.id}-${item.id}`} className="text-sm text-slate-700">
                              <span className="font-semibold">{item.quantity}x</span> {item.productName}
                              {variationText ? <p className="text-xs font-medium text-slate-500">{variationText}</p> : null}
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <p className="mt-2 text-sm text-slate-500">No item details available.</p>
                    )}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedOrder(order)}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      View Details
                    </button>
                    <button
                      type="button"
                      onClick={() => void copyText('Phone', order.phone || '')}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Copy Phone
                    </button>
                    <button
                      type="button"
                      onClick={() => void copyText('Address', `${order.address || ''}, ${order.city || ''}`.trim())}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Copy Address
                    </button>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Date</p>
                      <p className="mt-1 text-slate-700">{new Date(order.createdAt).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</p>
                      <p className="mt-1 font-semibold text-slate-900">{order.status}</p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-2">
                    <select
                      value={order.status}
                      onChange={event => setRowStatus(order.id, event.target.value as OrderStatus)}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none focus:border-black focus:ring-2 focus:ring-black"
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => void saveStatus(order)}
                        disabled={saving[order.id] || originalStatuses[order.id] === order.status}
                        className="flex-1 rounded-lg bg-black px-3 py-2 text-xs font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {saving[order.id] ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        type="button"
                        onClick={() => resetRowStatus(order.id)}
                        disabled={saving[order.id] || originalStatuses[order.id] === order.status}
                        className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Reset
                      </button>
                    </div>
                  </div>
                </div>
              </details>
            ))
          )}
        </div>

        <div className="mt-6 hidden overflow-x-auto rounded-xl border border-slate-200 md:block">
          {loading ? (
            <div className="p-5 text-slate-600">Loading orders...</div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-5 text-slate-600">No orders found.</div>
          ) : (
            <table className="w-full min-w-[900px] bg-white">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Customer & Delivery</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map(order => (
                  <tr key={order.id} className="border-t border-slate-100 text-sm transition-colors hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-bold text-slate-900">
                      <button
                        type="button"
                        onClick={() => setSelectedOrder(order)}
                        className="inline-flex rounded-md bg-slate-100 px-2 py-1 font-mono text-xs text-slate-700 hover:bg-slate-200"
                      >
                        {order.orderNumber}
                      </button>
                      <p className="mt-1 text-[11px] font-medium text-slate-500">
                        {(order.items?.length ?? 0)} item{(order.items?.length ?? 0) === 1 ? '' : 's'}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      <p className="font-bold text-slate-900">{order.customerName}</p>
                      <p className="text-xs text-slate-600">Phone: {order.phone || '-'}</p>
                      <p className="text-xs text-slate-600">Email: {order.email || '-'}</p>
                      <p className="mt-1 text-xs text-slate-600">Address: {order.address}, {order.city}</p>
                      {order.notes ? <p className="mt-1 text-xs text-slate-500">Notes: {order.notes}</p> : null}
                      <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-2.5">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Products Purchased</p>
                        {Array.isArray(order.items) && order.items.length > 0 ? (
                          <ul className="mt-1 space-y-0.5">
                            {order.items.slice(0, 3).map(item => {
                              const variationText = getItemVariationText(item);
                              return (
                                <li key={`${order.id}-${item.id}`} className="text-xs text-slate-700">
                                  <span className="font-semibold">{item.quantity}x</span> {item.productName}
                                  {variationText ? <p className="text-[11px] font-medium text-slate-500">{variationText}</p> : null}
                                </li>
                              );
                            })}
                            {order.items.length > 3 ? (
                              <li className="text-[11px] font-medium text-slate-500">+{order.items.length - 3} more item(s)</li>
                            ) : null}
                          </ul>
                        ) : (
                          <p className="mt-1 text-xs text-slate-500">No item details available.</p>
                        )}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => void copyText('Phone', order.phone || '')}
                          className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          Copy Phone
                        </button>
                        <button
                          type="button"
                          onClick={() => void copyText('Address', `${order.address || ''}, ${order.city || ''}`.trim())}
                          className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          Copy Address
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{new Date(order.createdAt).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          isPaymentCompleted(order)
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-white text-black'
                        }`}
                      >
                        {isPaymentCompleted(order) ? 'Completed' : 'Not Completed'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={order.status}
                        onChange={event => setRowStatus(order.id, event.target.value as OrderStatus)}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none focus:border-black focus:ring-2 focus:ring-black"
                      >
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900">GH₵{Number(order.total).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedOrder(order)}
                          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          View
                        </button>
                        <button
                          type="button"
                          onClick={() => void saveStatus(order)}
                          disabled={saving[order.id] || originalStatuses[order.id] === order.status}
                          className="rounded-lg bg-black px-3 py-2 text-xs font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {saving[order.id] ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          type="button"
                          onClick={() => resetRowStatus(order.id)}
                          disabled={saving[order.id] || originalStatuses[order.id] === order.status}
                          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Reset
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {selectedOrder && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-3 sm:p-6"
            onClick={() => setSelectedOrder(null)}
          >
            <div
              className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] bg-white ring-1 ring-slate-200/50 shadow-2xl"
              onClick={event => event.stopPropagation()}
            >
              <div className="sticky top-0 flex items-start justify-between gap-3 border-b border-slate-200 bg-white p-4 sm:p-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Order Details</p>
                  <p className="mt-1 inline-flex rounded-md bg-slate-100 px-2 py-1 font-mono text-xs font-bold text-slate-700">
                    {selectedOrder.orderNumber}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Close
                </button>
              </div>

              <div className="space-y-4 p-4 sm:p-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Customer</p>
                    <p className="mt-2 text-sm font-bold text-slate-900">{selectedOrder.customerName}</p>
                    <p className="mt-1 text-sm text-slate-700">Phone: {selectedOrder.phone || '-'}</p>
                    <p className="text-sm text-slate-700">Email: {selectedOrder.email || '-'}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Delivery</p>
                    <p className="mt-2 text-sm text-slate-700">{selectedOrder.address}</p>
                    <p className="text-sm text-slate-700">{selectedOrder.city}</p>
                    <p className="mt-1 text-sm text-slate-700">Date: {new Date(selectedOrder.createdAt).toLocaleString()}</p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</p>
                    <p className="mt-2 text-sm font-bold text-slate-900">{selectedOrder.status}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Payment</p>
                    <p className="mt-2 text-sm font-bold text-slate-900">
                      {isPaymentCompleted(selectedOrder) ? 'Completed' : 'Pending'}
                    </p>
                    <p className="mt-1 text-xs text-slate-600">Method: {selectedOrder.paymentMethod || '-'}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total</p>
                    <p className="mt-2 text-sm font-bold text-slate-900">GH₵{Number(selectedOrder.total).toFixed(2)}</p>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Products Purchased</p>
                  {Array.isArray(selectedOrder.items) && selectedOrder.items.length > 0 ? (
                    <div className="mt-2 overflow-x-auto rounded-lg border border-slate-200">
                      <table className="w-full min-w-[520px] bg-white">
                        <thead>
                          <tr className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                            <th className="px-3 py-2">Product</th>
                            <th className="px-3 py-2">Qty</th>
                            <th className="px-3 py-2">Line Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedOrder.items.map(item => (
                            <tr key={`modal-${selectedOrder.id}-${item.id}`} className="border-t border-slate-100 text-sm text-slate-700">
                              <td className="px-3 py-2">
                                {item.productId ? (
                                  <a
                                    href={`/admin/products/${item.productId}/edit`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="font-semibold text-black hover:text-black hover:underline"
                                  >
                                    {item.productName}
                                  </a>
                                ) : (
                                  item.productName
                                )}
                                {getItemVariationText(item) ? (
                                  <p className="mt-1 text-xs font-medium text-slate-500">{getItemVariationText(item)}</p>
                                ) : null}
                              </td>
                              <td className="px-3 py-2 font-semibold">{item.quantity}</td>
                              <td className="px-3 py-2">
                                {typeof item.lineTotal === 'number' ? `GH₵${Number(item.lineTotal).toFixed(2)}` : '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-slate-500">No item details available.</p>
                  )}
                </div>

                {selectedOrder.notes ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Customer Note</p>
                    <p className="mt-2 text-sm text-slate-700">{selectedOrder.notes}</p>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
