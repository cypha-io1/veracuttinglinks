'use client';

import { useEffect, useMemo, useState } from 'react';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

type Promotion = {
  id: number;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minOrder: number;
  active: boolean;
  startsAt: string | null;
  endsAt: string | null;
  usageCount: number;
  maxUsage: number | null;
  createdAt: string;
  updatedAt: string;
};

type PromotionForm = {
  code: string;
  type: 'percentage' | 'fixed';
  value: string;
  minOrder: string;
  active: boolean;
  startsAt: string;
  endsAt: string;
  maxUsage: string;
};

const INITIAL_FORM: PromotionForm = {
  code: '',
  type: 'percentage',
  value: '',
  minOrder: '0',
  active: true,
  startsAt: '',
  endsAt: '',
  maxUsage: '',
};

const PROMOTIONS_CACHE_KEY = 'wf-admin-promotions-cache-v1';

function readPromotionsCache(): Promotion[] | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.sessionStorage.getItem(PROMOTIONS_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Promotion[];
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function writePromotionsCache(promotions: Promotion[]) {
  if (typeof window === 'undefined') return;

  try {
    window.sessionStorage.setItem(PROMOTIONS_CACHE_KEY, JSON.stringify(promotions));
  } catch {
    // Ignore cache write failures.
  }
}

function toDateTimeLocal(value: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${d}T${h}:${min}`;
}

export default function AdminPromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<PromotionForm>(INITIAL_FORM);

  const activeCount = useMemo(() => promotions.filter(p => p.active).length, [promotions]);

  useEffect(() => {
    const cachedPromotions = readPromotionsCache();
    if (cachedPromotions) {
      setPromotions(cachedPromotions);
      setLoading(false);
    }

    void loadPromotions(!cachedPromotions);
  }, []);

  const loadPromotions = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      const response = await fetch('/api/admin/promotions', { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = (await response.json()) as Promotion[];
      setPromotions(data);
      writePromotionsCache(data);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load promotions');
    } finally {
      setLoading(false);
    }
  };

  const createPromo = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.code.trim() || !form.value.trim()) return;

    try {
      setSaving(true);
      const response = await fetch('/api/admin/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: form.code.trim().toUpperCase(),
          type: form.type,
          value: Number(form.value),
          minOrder: Number(form.minOrder || 0),
          active: form.active,
          startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null,
          endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null,
          maxUsage: form.maxUsage ? Number(form.maxUsage) : null,
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to create promo');
      }

      setForm(INITIAL_FORM);
      await loadPromotions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create promo');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (promo: Promotion) => {
    try {
      const response = await fetch(`/api/admin/promotions?id=${promo.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !promo.active }),
      });

      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to update promo');
      }

      await loadPromotions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update promo');
    }
  };

  const deletePromo = async (promoId: number) => {
    try {
      const response = await fetch(`/api/admin/promotions?id=${promoId}`, { method: 'DELETE' });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to delete promo');
      }

      await loadPromotions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete promo');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Promotions</h1>
          <p className="text-slate-600 mt-1">Create and manage promo codes used at checkout.</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Active Codes</p>
          <p className="text-2xl font-black text-slate-900">{activeCount}</p>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-black bg-white px-4 py-3 text-sm font-semibold text-black">
          {error}
        </div>
      ) : null}

      <section className="rounded-[2rem] border-0 bg-white p-6 sm:p-8 ring-1 ring-slate-200/50 shadow-sm relative overflow-hidden">
        <h2 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
          <FiPlus /> Add New Promo
        </h2>
        <form onSubmit={createPromo} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <input
            value={form.code}
            onChange={(e) => setForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
            placeholder="Code (e.g. SAVE20)"
            className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:border-black"
            required
          />
          <select
            value={form.type}
            onChange={(e) => setForm(prev => ({ ...prev, type: e.target.value as 'percentage' | 'fixed' }))}
            className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:border-black"
          >
            <option value="percentage">Percentage</option>
            <option value="fixed">Fixed Amount</option>
          </select>
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.value}
            onChange={(e) => setForm(prev => ({ ...prev, value: e.target.value }))}
            placeholder={form.type === 'percentage' ? 'Discount %' : 'Discount amount'}
            className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:border-black"
            required
          />
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.minOrder}
            onChange={(e) => setForm(prev => ({ ...prev, minOrder: e.target.value }))}
            placeholder="Min order"
            className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:border-black"
          />
          <input
            type="datetime-local"
            value={form.startsAt}
            onChange={(e) => setForm(prev => ({ ...prev, startsAt: e.target.value }))}
            className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:border-black"
          />
          <input
            type="datetime-local"
            value={form.endsAt}
            onChange={(e) => setForm(prev => ({ ...prev, endsAt: e.target.value }))}
            className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:border-black"
          />
          <input
            type="number"
            min="0"
            step="1"
            value={form.maxUsage}
            onChange={(e) => setForm(prev => ({ ...prev, maxUsage: e.target.value }))}
            placeholder="Max usage (optional)"
            className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:border-black"
          />
          <label className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm(prev => ({ ...prev, active: e.target.checked }))}
            />
            Active
          </label>
          <button
            type="submit"
            disabled={saving}
            className="sm:col-span-2 lg:col-span-4 rounded-xl bg-black px-4 py-3 text-sm font-bold text-white hover:bg-gray-800 disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Create Promo'}
          </button>
        </form>
      </section>

      <section className="rounded-[2rem] border-0 bg-white p-6 sm:p-8 ring-1 ring-slate-200/50 shadow-sm relative overflow-hidden">
        <h2 className="text-lg font-black text-slate-900 mb-4">All Promo Codes</h2>
        {loading ? (
          <p className="text-slate-600">Loading promotions...</p>
        ) : promotions.length === 0 ? (
          <p className="text-slate-600">No promotions yet.</p>
        ) : (
          <div className="space-y-3">
            {promotions.map((promo) => (
              <div key={promo.id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-base font-black text-slate-900">{promo.code}</p>
                    <p className="text-sm text-slate-600 mt-1">
                      {promo.type === 'percentage' ? `${promo.value}% off` : `GH₵${promo.value.toFixed(2)} off`} • Min: GH₵{promo.minOrder.toFixed(2)}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {promo.startsAt ? `Starts: ${toDateTimeLocal(promo.startsAt)}` : 'Starts: immediately'} • {promo.endsAt ? `Ends: ${toDateTimeLocal(promo.endsAt)}` : 'No end date'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${promo.active ? 'bg-white text-black' : 'bg-slate-100 text-slate-600'}`}>
                      {promo.active ? 'Active' : 'Inactive'}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleActive(promo)}
                      className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                    >
                      {promo.active ? 'Pause' : 'Activate'}
                    </button>
                    <button
                      type="button"
                      onClick={() => deletePromo(promo.id)}
                      className="inline-flex items-center gap-1 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-black hover:bg-white"
                    >
                      <FiTrash2 /> Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
