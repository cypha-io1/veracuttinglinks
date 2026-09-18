"use client";

import React from 'react';

export type ToastItem = { id: string; message: string; type?: 'info' | 'success' | 'error' };

export default function Toast({ items }: { items: ToastItem[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="fixed top-6 right-6 z-50 flex flex-col gap-3">
      {items.map((t) => (
        <div
          key={t.id}
          className={`max-w-xs px-4 py-2 rounded-lg shadow-md ring-1 transform-gpu transition-all duration-200 ease-out ${
            t.type === 'success'
              ? 'bg-emerald-50 ring-emerald-100 text-emerald-800'
              : t.type === 'error'
              ? 'bg-rose-50 ring-rose-100 text-rose-800'
              : 'bg-white ring-slate-100 text-slate-900'
          }`}
        >
          <div className="text-sm font-medium">{t.message}</div>
        </div>
      ))}
    </div>
  );
}
