'use client';

import { useEffect, useState } from 'react';

type UserRow = {
  id: number;
  fullName: string;
  phone: string;
  email: string | null;
  role: 'user' | 'admin';
  createdAt: string;
};

type SaveState = Record<number, boolean>;
type Toast = {
  type: 'success' | 'error';
  message: string;
};

type UserSnapshot = {
  fullName: string;
  role: 'user' | 'admin';
};

const USERS_CACHE_KEY = 'wf-admin-users-cache-v1';

function readUsersCache(): UserRow[] | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.sessionStorage.getItem(USERS_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as UserRow[];
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function writeUsersCache(users: UserRow[]) {
  if (typeof window === 'undefined') return;

  try {
    window.sessionStorage.setItem(USERS_CACHE_KEY, JSON.stringify(users));
  } catch {
    // Ignore cache write failures.
  }
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [originalUsers, setOriginalUsers] = useState<Record<number, UserSnapshot>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<SaveState>({});
  const [toast, setToast] = useState<Toast | null>(null);

  useEffect(() => {
    const cachedUsers = readUsersCache();
    if (cachedUsers) {
      setUsers(cachedUsers);

      const nextOriginals: Record<number, UserSnapshot> = {};
      for (const user of cachedUsers) {
        nextOriginals[user.id] = {
          fullName: user.fullName.trim(),
          role: user.role,
        };
      }
      setOriginalUsers(nextOriginals);
      setLoading(false);
    }

    const load = async () => {
      try {
        if (!cachedUsers) {
          setLoading(true);
        }
        const response = await fetch('/api/admin/users', { cache: 'no-store' });
        if (!response.ok) throw new Error('Failed to load users');
        const payload = (await response.json()) as UserRow[];
        setUsers(payload);
        writeUsersCache(payload);

        const nextOriginals: Record<number, UserSnapshot> = {};
        for (const user of payload) {
          nextOriginals[user.id] = {
            fullName: user.fullName.trim(),
            role: user.role,
          };
        }
        setOriginalUsers(nextOriginals);
      } catch (err) {
        setToast({ type: 'error', message: err instanceof Error ? err.message : 'Failed to load users' });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const updateRow = (id: number, patch: Partial<UserRow>) => {
    setUsers(prev => {
      const next = prev.map(user => (user.id === id ? { ...user, ...patch } : user));
      writeUsersCache(next);
      return next;
    });
  };

  const saveUser = async (user: UserRow) => {
    try {
      setSaving(prev => ({ ...prev, [user.id]: true }));

      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id, fullName: user.fullName, role: user.role }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error || 'Failed to update user');
      }

      const updated = (await response.json()) as UserRow;
      const nextUsers = users.map(existingUser =>
        existingUser.id === user.id
          ? {
              ...existingUser,
              fullName: updated.fullName,
              role: updated.role,
            }
          : existingUser,
      );

      setUsers(nextUsers);
      writeUsersCache(nextUsers);
      setOriginalUsers(prev => ({
        ...prev,
        [user.id]: {
          fullName: updated.fullName.trim(),
          role: updated.role,
        },
      }));
      setToast({ type: 'success', message: 'User updated successfully.' });
    } catch (err) {
      setToast({ type: 'error', message: err instanceof Error ? err.message : 'Failed to update user' });
    } finally {
      setSaving(prev => ({ ...prev, [user.id]: false }));
    }
  };

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const hasUserChanges = (user: UserRow) => {
    const original = originalUsers[user.id];
    if (!original) return false;
    return original.fullName !== user.fullName.trim() || original.role !== user.role;
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
        <h1 className="text-2xl font-black text-slate-900 sm:text-3xl">Users</h1>
        <p className="mt-1 text-sm text-slate-600 sm:text-base">Manage user names and access roles.</p>

        <div className="mt-8 overflow-x-auto rounded-[1.5rem] border-0 ring-1 ring-slate-200/50 bg-slate-50/30 overflow-hidden shadow-inner">
          {loading ? (
            <div className="p-5 text-slate-600">Loading users...</div>
          ) : users.length === 0 ? (
            <div className="p-5 text-slate-600">No users found.</div>
          ) : (
            <table className="w-full min-w-[720px] bg-white">
              <thead>
                <tr className="bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-500 sm:text-xs">
                  <th className="px-3 py-3 sm:px-4">Name</th>
                  <th className="px-3 py-3 sm:px-4">Phone</th>
                  <th className="px-3 py-3 sm:px-4">Email</th>
                  <th className="px-3 py-3 sm:px-4">Role</th>
                  <th className="px-3 py-3 sm:px-4">Created</th>
                  <th className="px-3 py-3 sm:px-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} className="border-t border-slate-100 text-xs sm:text-sm">
                    <td className="px-3 py-3 sm:px-4">
                      <input
                        value={user.fullName}
                        onChange={event => updateRow(user.id, { fullName: event.target.value })}
                        className="w-full rounded-xl border-0 ring-1 ring-slate-200 bg-white px-3 py-2.5 text-sm sm:text-base focus:ring-2 focus:ring-black focus:outline-none transition-shadow shadow-sm"
                      />
                    </td>
                    <td className="px-3 py-3 text-slate-700 sm:px-4">{user.phone}</td>
                    <td className="px-3 py-3 text-slate-700 sm:px-4">{user.email || '-'}</td>
                    <td className="px-3 py-3 sm:px-4">
                      <select
                        value={user.role}
                        onChange={event => updateRow(user.id, { role: event.target.value as UserRow['role'] })}
                        className="rounded-xl border-0 ring-1 ring-slate-200 bg-white px-3 py-2.5 text-sm sm:text-base focus:ring-2 focus:ring-black focus:outline-none transition-shadow shadow-sm"
                      >
                        <option value="user">user</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                    <td className="px-3 py-3 text-slate-700 sm:px-4">{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td className="px-3 py-3 sm:px-4">
                      <button
                        type="button"
                        onClick={() => void saveUser(user)}
                        disabled={saving[user.id] || !hasUserChanges(user) || !user.fullName.trim()}
                        className="rounded-xl bg-gradient-to-r from-black to-gray-900 px-4 py-2.5 text-[11px] font-bold text-white shadow-md shadow-none hover:scale-[1.02] transition-all disabled:pointer-events-none disabled:opacity-50 sm:text-xs"
                      >
                        {saving[user.id] ? 'Saving...' : 'Save'}
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
