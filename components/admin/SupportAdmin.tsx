'use client';

import React, { useEffect, useState } from 'react';
import { FiMail, FiCheckCircle, FiClipboard, FiEye } from 'react-icons/fi';
import Toast from '@/components/ui/Toast';

export type SupportMessage = {
  id: number;
  name: string;
  contact: string;
  message: string;
  createdAt: string;
  status?: 'open' | 'closed' | 'pending';
};

export default function SupportAdmin() {
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'pending' | 'closed'>('all');
  const [query, setQuery] = useState('');
  const [confirmChange, setConfirmChange] = useState<{ id: number; status: 'open' | 'pending' | 'closed' } | null>(null);
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type?: 'info' | 'success' | 'error' }>>([]);
  const [successIds, setSuccessIds] = useState<number[]>([]);
  const [expandedIds, setExpandedIds] = useState<number[]>([]);

  const addToast = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    const id = String(Date.now()) + Math.random().toString(36).slice(2, 7);
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  };

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/admin/support', { cache: 'no-store' });
        const payload = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(payload?.error || payload?.details || 'Failed to load messages');
        if (mounted && Array.isArray(payload.items)) setMessages(payload.items as SupportMessage[]);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void load();
    return () => {
      mounted = false;
    };
  }, []);

  const statusClasses = (s?: string) => {
    switch (s) {
      case 'open':
        return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'pending':
        return 'bg-sky-50 text-sky-700 border-sky-100';
      case 'closed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  const updateStatus = async (id: number, status: 'open' | 'pending' | 'closed') => {
    try {
      setUpdatingId(id);
      const res = await fetch('/api/admin/support', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload?.error || payload?.details || 'Failed to update');
      // replace message in state
      setMessages((prev) => prev.map((m) => (m.id === id ? (payload.item as SupportMessage) : m)));
      addToast('Status updated', 'success');
      setSuccessIds((s) => [...s, id]);
      setTimeout(() => setSuccessIds((s) => s.filter((x) => x !== id)), 3000);
    } catch (err) {
      console.error('Update failed', err);
      addToast('Failed to update status', 'error');
    } finally {
      setUpdatingId(null);
      setConfirmChange(null);
    }
  };

  const handleStatusChangeRequest = (id: number, status: 'open' | 'pending' | 'closed') => {
    setConfirmChange({ id, status });
  };

  return (
    <div className="p-6">
      <Toast items={toasts} />
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Admin</p>
          <h2 className="text-2xl font-black">Support Messages</h2>
          <p className="text-sm text-slate-500 mt-1">Recent user messages — manage status and follow up.</p>
        </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, contact, message"
              className="px-3 py-2 border rounded-xl text-sm w-64 shadow-sm"
            />
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)} className="px-2 py-2 border rounded-xl text-sm shadow-sm">
              <option value="all">All</option>
              <option value="open">Open</option>
              <option value="pending">Pending</option>
              <option value="closed">Closed</option>
            </select>
          <button
            onClick={() => {
              setLoading(true);
              void (async () => {
                const res = await fetch('/api/admin/support', { cache: 'no-store' });
                const payload = await res.json().catch(() => ({}));
                if (res.ok && Array.isArray(payload.items)) setMessages(payload.items);
                setLoading(false);
                addToast('Refreshed', 'info');
              })();
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-xl text-sm font-bold shadow-sm hover:opacity-95"
          >
            Refresh
          </button>
          </div>
      </div>

      <section>
        {loading ? (
          <div className="text-sm text-slate-500">Loading...</div>
        ) : error ? (
          <div className="text-sm text-rose-600">{error}</div>
        ) : messages.length === 0 ? (
          <div className="text-sm text-slate-500">No messages yet.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {messages
              .filter((m) => (filterStatus === 'all' ? true : (m.status ?? 'open') === filterStatus))
              .filter((m) => {
                if (!query.trim()) return true;
                const q = query.trim().toLowerCase();
                return (`${m.name} ${m.contact} ${m.message}`).toLowerCase().includes(q);
              })
              .map((m) => (
              <article key={m.id} className="bg-white rounded-2xl border ring-1 ring-slate-100 shadow-sm p-4 flex flex-col justify-between relative">
                <header className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center text-amber-700 font-bold">{m.name?.slice(0,1) ?? 'U'}</div>
                    <div>
                      <div className="font-semibold text-sm">{m.name}</div>
                      <div className="text-xs text-slate-500">{m.contact}</div>
                    </div>
                  </div>
                    <div className="flex items-center gap-2 mt-3 sm:mt-0">
                    <div className={`text-xs font-semibold px-2 py-1 rounded-full border ${statusClasses(m.status)}`}>{m.status ?? 'open'}</div>
                    {successIds.includes(m.id) ? (
                      <FiCheckCircle className="text-emerald-500 w-5 h-5" />
                    ) : null}
                  </div>
                </header>

                <div className="mt-3 text-sm text-slate-700 leading-relaxed">
                  <div className={`${expandedIds.includes(m.id) ? 'whitespace-pre-line' : 'line-clamp-4'}`}>{m.message}</div>
                  <div className="mt-2 flex items-center gap-3">
                    <button
                      onClick={() => {
                        if (expandedIds.includes(m.id)) setExpandedIds((s) => s.filter((x) => x !== m.id));
                        else setExpandedIds((s) => [...s, m.id]);
                      }}
                      className="text-sm text-slate-500 hover:text-slate-700"
                    >
                      {expandedIds.includes(m.id) ? 'Show less' : 'Show more'}
                    </button>
                  </div>
                </div>

                <footer className="mt-4 flex items-center justify-between">
                  <div className="text-xs text-slate-400">{new Date(m.createdAt).toLocaleString()}</div>
                  <div className="flex items-center gap-2">
                    <select
                      value={m.status ?? 'open'}
                      onChange={(e) => handleStatusChangeRequest(m.id, e.target.value as any)}
                      className="text-sm rounded-xl border px-2 py-1 shadow-sm"
                      disabled={updatingId === m.id}
                    >
                      <option value="open">Open</option>
                      <option value="pending">Pending</option>
                      <option value="closed">Closed</option>
                    </select>
                    {updatingId === m.id ? <div className="text-sm text-slate-500 px-2">Updating...</div> : null}
                    {confirmChange && confirmChange.id === m.id ? (
                      <div className="ml-2 flex items-center gap-2">
                        <button
                          onClick={() => updateStatus(m.id, confirmChange.status)}
                          className="px-2 py-1 bg-black text-white rounded-xl text-sm font-bold"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setConfirmChange(null)}
                          className="px-2 py-1 bg-slate-50 text-slate-700 border rounded-xl text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : null}
                    <button
                      onClick={() => { navigator.clipboard?.writeText(m.contact); addToast('Contact copied', 'info'); }}
                      className="text-sm inline-flex items-center gap-2 px-3 py-1 bg-slate-50 border rounded-xl hover:bg-slate-100"
                    >
                      <FiClipboard />
                      Copy
                    </button>
                    <button
                      onClick={() => { setExpandedIds((s) => (s.includes(m.id) ? s.filter((x) => x !== m.id) : [...s, m.id])); }}
                      className="text-sm inline-flex items-center gap-2 px-3 py-1 bg-slate-50 border rounded-xl hover:bg-slate-100"
                    >
                      <FiEye />
                      View
                    </button>
                  </div>
                </footer>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
