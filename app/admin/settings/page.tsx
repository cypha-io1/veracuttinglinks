'use client';

import { useEffect, useState } from 'react';

type Settings = {
  liveMode: boolean;
  maintenanceReason: string;
  orderNotifications: boolean;
  allowCashOnDelivery: boolean;
  lowStockThreshold: number;
  supportEmail: string;
  smsOrderConfirmationTemplate: string;
  smsOrderStatusTemplate: string;
  smsNewOrderAdminTemplate: string;
};

type Toast = {
  type: 'success' | 'error';
  message: string;
};

const DEFAULT_SETTINGS: Settings = {
  liveMode: true,
  maintenanceReason: 'We are performing scheduled maintenance. Please check back shortly.',
  orderNotifications: true,
  allowCashOnDelivery: true,
  lowStockThreshold: 5,
  supportEmail: 'support@zhilakaii.com',
  smsOrderConfirmationTemplate:
    'Zhilakaii: Order {orderNumber} confirmed. Payment received. Total GHc{total}. We will notify you when status changes.',
  smsOrderStatusTemplate: 'Zhilakaii: Your order {orderNumber} status is now {status}.',
  smsNewOrderAdminTemplate:
    'Zhilakaii: New paid order {orderNumber} from {customerName} ({city}). Total GHc{total}.',
};

function normalizeSettings(input: Partial<Settings> | null | undefined): Settings {
  return {
    liveMode: input?.liveMode !== false,
    maintenanceReason:
      typeof input?.maintenanceReason === 'string' && input.maintenanceReason.trim()
        ? input.maintenanceReason.trim()
        : DEFAULT_SETTINGS.maintenanceReason,
    orderNotifications: Boolean(input?.orderNotifications ?? DEFAULT_SETTINGS.orderNotifications),
    allowCashOnDelivery: Boolean(input?.allowCashOnDelivery ?? DEFAULT_SETTINGS.allowCashOnDelivery),
    lowStockThreshold:
      Number.isFinite(Number(input?.lowStockThreshold)) && Number(input?.lowStockThreshold) >= 0
        ? Number(input?.lowStockThreshold)
        : DEFAULT_SETTINGS.lowStockThreshold,
    supportEmail:
      typeof input?.supportEmail === 'string' && input.supportEmail.trim()
        ? input.supportEmail.trim()
        : DEFAULT_SETTINGS.supportEmail,
    smsOrderConfirmationTemplate:
      typeof input?.smsOrderConfirmationTemplate === 'string' && input.smsOrderConfirmationTemplate.trim()
        ? input.smsOrderConfirmationTemplate
        : DEFAULT_SETTINGS.smsOrderConfirmationTemplate,
    smsOrderStatusTemplate:
      typeof input?.smsOrderStatusTemplate === 'string' && input.smsOrderStatusTemplate.trim()
        ? input.smsOrderStatusTemplate
        : DEFAULT_SETTINGS.smsOrderStatusTemplate,
    smsNewOrderAdminTemplate:
      typeof input?.smsNewOrderAdminTemplate === 'string' && input.smsNewOrderAdminTemplate.trim()
        ? input.smsNewOrderAdminTemplate
        : DEFAULT_SETTINGS.smsNewOrderAdminTemplate,
  };
}

const SETTINGS_CACHE_KEY = 'wf-admin-settings-cache-v1';
const SETTINGS_CACHE_SCHEMA_KEY = 'wf-admin-settings-cache-schema';
const SETTINGS_CACHE_SCHEMA_VERSION = '3';

function readSettingsCache(): Settings | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(SETTINGS_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Settings>;
    if (!(parsed && typeof parsed === 'object')) return null;

    const normalized = normalizeSettings(parsed);

    // One-time cache migration: rewrite old cache shape to the current schema.
    const cachedSchemaVersion = window.localStorage.getItem(SETTINGS_CACHE_SCHEMA_KEY);
    if (cachedSchemaVersion !== SETTINGS_CACHE_SCHEMA_VERSION) {
      window.localStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify(normalized));
      window.localStorage.setItem(SETTINGS_CACHE_SCHEMA_KEY, SETTINGS_CACHE_SCHEMA_VERSION);
    }

    return normalized;
  } catch {
    return null;
  }
}

function writeSettingsCache(settings: Settings) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify(settings));
    window.localStorage.setItem(SETTINGS_CACHE_SCHEMA_KEY, SETTINGS_CACHE_SCHEMA_VERSION);
  } catch {
    // Ignore cache write failures.
  }
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [savedSettings, setSavedSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  useEffect(() => {
    const cachedSettings = readSettingsCache();
    if (cachedSettings) {
      setSettings(cachedSettings);
      setSavedSettings(cachedSettings);
      setLoading(false);
    }

    const load = async () => {
      try {
        if (!cachedSettings) {
          setLoading(true);
        }
        const response = await fetch('/api/admin/settings', { cache: 'no-store' });
        if (!response.ok) throw new Error('Failed to load settings');
        const payload = normalizeSettings((await response.json()) as Partial<Settings>);
        setSettings(payload);
        setSavedSettings(payload);
        writeSettingsCache(payload);
      } catch (err) {
        setToast({ type: 'error', message: err instanceof Error ? err.message : 'Failed to load settings' });
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const saveSettings = async () => {
    try {
      setSaving(true);

      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error || 'Failed to save settings');
      }

      const updated = normalizeSettings((await response.json()) as Partial<Settings>);
      setSettings(updated);
      setSavedSettings(updated);
      writeSettingsCache(updated);
      setToast({ type: 'success', message: 'Settings saved successfully.' });
    } catch (err) {
      setToast({ type: 'error', message: err instanceof Error ? err.message : 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const hasChanges =
    settings.orderNotifications !== savedSettings.orderNotifications ||
    settings.allowCashOnDelivery !== savedSettings.allowCashOnDelivery ||
    settings.lowStockThreshold !== savedSettings.lowStockThreshold ||
    settings.supportEmail.trim() !== savedSettings.supportEmail.trim() ||
    settings.smsOrderConfirmationTemplate.trim() !== savedSettings.smsOrderConfirmationTemplate.trim() ||
    settings.smsOrderStatusTemplate.trim() !== savedSettings.smsOrderStatusTemplate.trim() ||
    settings.smsNewOrderAdminTemplate.trim() !== savedSettings.smsNewOrderAdminTemplate.trim();

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
        <h1 className="text-2xl font-black text-slate-900 sm:text-3xl">Settings</h1>
        <p className="mt-1 text-sm text-slate-600 sm:text-base">Configure operational defaults for the admin workspace.</p>

        {loading ? (
          <div className="mt-6 text-slate-600">Loading settings...</div>
        ) : (
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="rounded-[1.5rem] border-0 ring-1 ring-slate-200/50 bg-slate-50/50 p-5 sm:p-6 transition-all hover:bg-slate-50 group">
              <p className="text-sm font-bold text-slate-800 sm:text-base">Order Notifications</p>
              <p className="mt-1 text-sm text-slate-600">Enable alerts for new orders and cancellations.</p>
              <input
                type="checkbox"
                checked={settings.orderNotifications}
                onChange={event => setSettings(prev => ({ ...prev, orderNotifications: event.target.checked }))}
                className="mt-3"
              />
            </label>

            <label className="rounded-[1.5rem] border-0 ring-1 ring-slate-200/50 bg-slate-50/50 p-5 sm:p-6 transition-all hover:bg-slate-50 group">
              <p className="text-sm font-bold text-slate-800 sm:text-base">Cash On Delivery</p>
              <p className="mt-1 text-sm text-slate-600">Allow customers to pay by cash at delivery.</p>
              <input
                type="checkbox"
                checked={settings.allowCashOnDelivery}
                onChange={event => setSettings(prev => ({ ...prev, allowCashOnDelivery: event.target.checked }))}
                className="mt-3"
              />
            </label>

            <label className="rounded-[1.5rem] border-0 ring-1 ring-slate-200/50 bg-slate-50/50 p-5 sm:p-6 transition-all hover:bg-slate-50 group">
              <p className="text-sm font-bold text-slate-800 sm:text-base">Low Stock Threshold</p>
              <p className="mt-1 text-sm text-slate-600">Trigger low stock warnings at this value.</p>
              <input
                type="number"
                min={0}
                value={settings.lowStockThreshold}
                onChange={event =>
                  setSettings(prev => ({
                    ...prev,
                    lowStockThreshold: Number(event.target.value) || 0,
                  }))
                }
                className="mt-3 w-full rounded-xl border-0 ring-1 ring-slate-200 bg-white px-4 py-3 text-sm sm:text-base focus:ring-2 focus:ring-black focus:outline-none transition-shadow shadow-sm"
              />
            </label>

            <label className="rounded-[1.5rem] border-0 ring-1 ring-slate-200/50 bg-slate-50/50 p-5 sm:p-6 transition-all hover:bg-slate-50 group">
              <p className="text-sm font-bold text-slate-800 sm:text-base">Support Email</p>
              <p className="mt-1 text-sm text-slate-600">Shown to staff for system support contact.</p>
              <input
                type="email"
                value={settings.supportEmail}
                onChange={event => setSettings(prev => ({ ...prev, supportEmail: event.target.value }))}
                className="mt-3 w-full rounded-xl border-0 ring-1 ring-slate-200 bg-white px-4 py-3 text-sm sm:text-base focus:ring-2 focus:ring-black focus:outline-none transition-shadow shadow-sm"
              />
            </label>

            <label className="rounded-[1.5rem] border-0 ring-1 ring-slate-200/50 bg-slate-50/50 p-5 sm:p-6 transition-all hover:bg-slate-50 group md:col-span-2">
              <p className="text-sm font-bold text-slate-800 sm:text-base">SMS Template: Order Confirmation (User)</p>
              <p className="mt-1 text-sm text-slate-600">Allowed placeholders: {'{orderNumber}'}, {'{customerName}'}, {'{total}'}</p>
              <textarea
                value={settings.smsOrderConfirmationTemplate}
                onChange={event => setSettings(prev => ({ ...prev, smsOrderConfirmationTemplate: event.target.value }))}
                rows={3}
                className="mt-3 w-full rounded-xl border-0 ring-1 ring-slate-200 bg-white px-4 py-3 text-sm sm:text-base focus:ring-2 focus:ring-black focus:outline-none transition-shadow shadow-sm"
              />
            </label>

            <label className="rounded-[1.5rem] border-0 ring-1 ring-slate-200/50 bg-slate-50/50 p-5 sm:p-6 transition-all hover:bg-slate-50 group md:col-span-2">
              <p className="text-sm font-bold text-slate-800 sm:text-base">SMS Template: Order Status Update (User)</p>
              <p className="mt-1 text-sm text-slate-600">Allowed placeholders: {'{orderNumber}'}, {'{customerName}'}, {'{status}'}</p>
              <textarea
                value={settings.smsOrderStatusTemplate}
                onChange={event => setSettings(prev => ({ ...prev, smsOrderStatusTemplate: event.target.value }))}
                rows={3}
                className="mt-3 w-full rounded-xl border-0 ring-1 ring-slate-200 bg-white px-4 py-3 text-sm sm:text-base focus:ring-2 focus:ring-black focus:outline-none transition-shadow shadow-sm"
              />
            </label>

            <label className="rounded-[1.5rem] border-0 ring-1 ring-slate-200/50 bg-slate-50/50 p-5 sm:p-6 transition-all hover:bg-slate-50 group md:col-span-2">
              <p className="text-sm font-bold text-slate-800 sm:text-base">SMS Template: New Order (Admins)</p>
              <p className="mt-1 text-sm text-slate-600">Allowed placeholders: {'{orderNumber}'}, {'{customerName}'}, {'{city}'}, {'{total}'}</p>
              <textarea
                value={settings.smsNewOrderAdminTemplate}
                onChange={event => setSettings(prev => ({ ...prev, smsNewOrderAdminTemplate: event.target.value }))}
                rows={3}
                className="mt-3 w-full rounded-xl border-0 ring-1 ring-slate-200 bg-white px-4 py-3 text-sm sm:text-base focus:ring-2 focus:ring-black focus:outline-none transition-shadow shadow-sm"
              />
            </label>
          </div>
        )}

        <button
          type="button"
          onClick={() => void saveSettings()}
          disabled={loading || saving || !hasChanges}
          className="mt-8 rounded-xl bg-gradient-to-r from-black to-gray-900 px-6 py-3 text-sm font-bold text-white shadow-md shadow-none hover:scale-[1.02] transition-all disabled:pointer-events-none disabled:opacity-50 sm:text-base"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </section>
  );
}
