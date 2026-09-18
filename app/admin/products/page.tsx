'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

type Product = {
  id: number;
  name: string;
  category: string;
  price: string;
  image: string;
  description: string | null;
  isFeatured: boolean;
  stock?: number | null;
  soldQuantity?: number;
  remainingStock?: number | null;
};

type Toast = {
  type: 'success' | 'error';
  message: string;
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<Toast | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/products', { cache: 'no-store' });
      if (!response.ok) throw new Error('Failed to load products');

      const payload = (await response.json()) as Product[];
      setProducts(payload);
    } catch (err) {
      setToast({ type: 'error', message: err instanceof Error ? err.message : 'Failed to load products' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProducts();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const totalProducts = products.length;
  const featuredCount = useMemo(() => products.filter(product => product.isFeatured).length, [products]);
  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return products;

    return products.filter(product => {
      const name = product.name.toLowerCase();
      const category = product.category.toLowerCase();
      const description = (product.description || '').toLowerCase();
      return name.includes(query) || category.includes(query) || description.includes(query);
    });
  }, [products, searchQuery]);

  const deleteProduct = async (product: Product) => {
    if (!window.confirm(`Delete ${product.name}?`)) return;

    try {
      setDeletingId(product.id);
      const response = await fetch(`/api/products/${product.id}`, { method: 'DELETE' });
      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error || 'Failed to delete product');
      }

      setProducts(prev => prev.filter(item => item.id !== product.id));
      setToast({ type: 'success', message: `${product.name} deleted.` });
    } catch (err) {
      setToast({ type: 'error', message: err instanceof Error ? err.message : 'Failed to delete product' });
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
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900 sm:text-3xl">Products</h1>
            <p className="mt-1 text-sm text-slate-600 sm:text-base">Product details with direct actions for edit, delete, and update.</p>
          </div>
          <Link
            href="/admin/products/new"
            className="inline-flex items-center justify-center rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
          >
            Add Product
          </Link>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Products</p>
            <p className="mt-2 text-2xl font-black text-slate-900">{totalProducts}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Featured</p>
            <p className="mt-2 text-2xl font-black text-slate-900">{featuredCount}</p>
          </div>
        </div>

        <div className="mt-5">
          <input
            type="search"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search products by name, category, or description"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
          />
        </div>

        <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200">
          {loading ? (
            <div className="p-5 text-slate-600">Loading products...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-5 text-slate-600">No products found for "{searchQuery.trim()}".</div>
          ) : (
            <table className="w-full min-w-[800px] bg-white">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-500 sm:text-xs">
                  <th className="px-3 py-3 sm:px-4">Product</th>
                  <th className="px-3 py-3 sm:px-4">Category</th>
                  <th className="px-3 py-3 sm:px-4">Price</th>
                  <th className="px-3 py-3 sm:px-4">Remaining/Qty</th>
                  <th className="px-3 py-3 sm:px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(product => {
                  const stockQty = typeof product.stock === 'number' ? product.stock : null;
                  const remainingQty = typeof product.remainingStock === 'number' ? product.remainingStock : stockQty;
                  const stockLabel = stockQty === null ? 'Unlimited' : String(stockQty);
                  const remainingLabel = remainingQty === null ? 'Unlimited' : String(remainingQty);

                  return (
                    <tr key={product.id} className="border-t border-slate-100 text-xs transition-colors hover:bg-slate-50/70 sm:text-sm">
                      <td className="px-3 py-3 sm:px-4">
                        <div className="flex items-center gap-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={product.image}
                            alt={product.name}
                            className="h-9 w-9 rounded-md border border-slate-200 object-cover sm:h-10 sm:w-10"
                          />
                          <p className="font-bold text-slate-900">{product.name}</p>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-slate-700 sm:px-4">{product.category}</td>
                      <td className="px-3 py-3 font-semibold text-slate-800 sm:px-4">{product.price}</td>
                      <td className="px-3 py-3 sm:px-4">
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-700 sm:px-2.5 sm:text-xs">
                          {remainingLabel}/{stockLabel}
                        </span>
                      </td>
                      <td className="px-3 py-3 sm:px-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            href={`/products/${product.id}`}
                            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 sm:text-xs"
                          >
                            Preview
                          </Link>
                          <Link
                            href={`/admin/products/${product.id}/edit`}
                            className="rounded-lg border border-black bg-white px-3 py-2 text-[11px] font-semibold text-black hover:bg-white sm:text-xs"
                          >
                            Edit
                          </Link>
                          <button
                            type="button"
                            onClick={() => void deleteProduct(product)}
                            disabled={deletingId === product.id}
                            className="rounded-lg bg-white px-3 py-2 text-[11px] font-semibold text-black hover:bg-white disabled:cursor-not-allowed disabled:opacity-50 sm:text-xs"
                          >
                            {deletingId === product.id ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </section>
  );
}
