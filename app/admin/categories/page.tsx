'use client';

import { useEffect, useState } from 'react';

type Category = {
  id: number;
  name: string;
  slug: string;
  imageUrl?: string | null;
  createdAt: string;
};

type Toast = {
  type: 'success' | 'error';
  message: string;
};

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/categories', { cache: 'no-store' });
      if (!response.ok) throw new Error('Failed to load categories');
      const payload = (await response.json()) as Category[];
      setCategories(payload);
    } catch (err) {
      setToast({ type: 'error', message: err instanceof Error ? err.message : 'Failed to load categories' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCategories();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const addCategory = async () => {
    const name = newCategory.trim();
    if (!name) return;

    try {
      setSaving(true);
      const response = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error || 'Failed to add category');
      }

      const saved = (await response.json()) as Category;
      setCategories(prev => {
        const withoutDuplicate = prev.filter(item => item.id !== saved.id);
        return [...withoutDuplicate, saved].sort((a, b) => a.name.localeCompare(b.name));
      });
      setNewCategory('');
      setToast({ type: 'success', message: 'Category saved.' });
    } catch (err) {
      setToast({ type: 'error', message: err instanceof Error ? err.message : 'Failed to add category' });
    } finally {
      setSaving(false);
    }
  };

  const deleteCategory = async (category: Category) => {
    if (!window.confirm(`Delete category "${category.name}"?`)) return;

    try {
      setDeletingId(category.id);
      const response = await fetch(`/api/admin/categories?id=${category.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error || 'Failed to delete category');
      }

      setCategories(prev => prev.filter(item => item.id !== category.id));
      setToast({ type: 'success', message: 'Category deleted.' });
    } catch (err) {
      setToast({ type: 'error', message: err instanceof Error ? err.message : 'Failed to delete category' });
    } finally {
      setDeletingId(null);
    }
  };

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
        <h1 className="text-2xl font-black text-slate-900 sm:text-3xl">Categories</h1>
        <p className="mt-1 text-sm text-slate-600 sm:text-base">Add and manage product categories for the catalog.</p>

        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:mt-6">
          <label className="text-sm font-semibold text-slate-700">Category Name</label>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <input
              value={newCategory}
              onChange={event => setNewCategory(event.target.value)}
              placeholder="e.g. Celestial Rings"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm sm:text-base"
            />
            <button
              type="button"
              onClick={() => void addCategory()}
              disabled={saving || !newCategory.trim()}
              className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50 sm:text-base"
            >
              {saving ? 'Saving...' : 'Add Category'}
            </button>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200">
          {loading ? (
            <div className="p-5 text-slate-600">Loading categories...</div>
          ) : categories.length === 0 ? (
            <div className="p-5 text-slate-600">No categories yet.</div>
          ) : (
            <table className="w-full min-w-[560px] bg-white">
              <thead>
                <tr className="bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-500 sm:text-xs">
                  <th className="px-3 py-3 sm:px-4">Name</th>
                  <th className="px-3 py-3 sm:px-4">Slug</th>
                  <th className="px-3 py-3 sm:px-4">Created</th>
                  <th className="px-3 py-3 sm:px-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {categories.map(category => (
                  <tr key={category.id} className="border-t border-slate-100 text-xs sm:text-sm">
                    <td className="px-3 py-3 font-bold text-slate-900 sm:px-4">{category.name}</td>
                    <td className="px-3 py-3 text-slate-700 sm:px-4">{category.slug}</td>
                    <td className="px-3 py-3 text-slate-700 sm:px-4">{new Date(category.createdAt).toLocaleDateString()}</td>
                    <td className="px-3 py-3 sm:px-4">
                      <button
                        type="button"
                        onClick={() => void deleteCategory(category)}
                        disabled={deletingId === category.id}
                        className="rounded-lg bg-white px-3 py-2 text-[11px] font-semibold text-black disabled:opacity-50 sm:text-xs"
                      >
                        {deletingId === category.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </section>
  );
}
