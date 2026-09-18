'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  FiBarChart2,
  FiChevronDown,
  FiChevronUp,
  FiGrid,
  FiMenu,
  FiMessageSquare,
  FiPackage,
  FiMail,
  FiSettings,
  FiShoppingBag,
  FiTag,
  FiUsers,
  FiX,
  FiHome,
} from 'react-icons/fi';

type AdminShellProps = {
  children: React.ReactNode;
  userDisplayName: string;
};

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

type SiteControlState = {
  liveMode: boolean;
};

type AdminSettingsPayload = {
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

const DEFAULT_SITE_CONTROL: SiteControlState = {
  liveMode: true,
};

const DEFAULT_MAINTENANCE_REASON = 'We are performing scheduled maintenance. Please check back shortly.';

const NAV_ITEMS: NavItem[] = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: FiBarChart2 },
  { href: '/admin/orders', label: 'Orders', icon: FiShoppingBag },
  { href: '/admin/products', label: 'Products', icon: FiPackage },
  { href: '/admin/categories', label: 'Categories', icon: FiTag },
  { href: '/admin/promotions', label: 'Promotions', icon: FiTag },
  { href: '/admin/analytics', label: 'Analytics', icon: FiGrid },
  { href: '/admin/communications', label: 'Communications', icon: FiMessageSquare },
  { href: '/admin/support', label: 'Support', icon: FiMail },
  { href: '/admin/users', label: 'Users', icon: FiUsers },
  { href: '/admin/settings', label: 'Settings', icon: FiSettings },
];

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  const [isProductsOpen, setIsProductsOpen] = useState(pathname.startsWith('/admin/products'));

  return (
    <nav className="space-y-2">
      {NAV_ITEMS.map(item => {
        if (item.href === '/admin/products') {
          const isProductsRoute = pathname.startsWith('/admin/products');
          const ProductChevron = isProductsOpen ? FiChevronUp : FiChevronDown;

          return (
            <div key={item.href} className="space-y-2">
              <button
                type="button"
                onClick={() => setIsProductsOpen(prev => !prev)}
                className={`flex w-full items-center justify-between rounded-xl px-4 py-3.5 font-bold transition-all ${
                  isProductsRoute
                    ? 'bg-black text-white shadow-md shadow-none'
                    : 'text-slate-600 hover:bg-white hover:text-black'
                }`}
              >
                <span className="flex items-center gap-3">
                  <FiPackage />
                  Products
                </span>
                <ProductChevron />
              </button>

              {isProductsOpen && (
                <div className="ml-4 space-y-2">
                  <Link
                    href="/admin/products"
                    onClick={onNavigate}
                    className={`block rounded-xl px-4 py-2 text-sm font-bold transition-all ${
                      pathname === '/admin/products'
                        ? 'bg-white text-black ring-1 ring-black'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                    }`}
                  >
                    Manage Products
                  </Link>
                  <Link
                    href="/admin/products/new"
                    onClick={onNavigate}
                    className={`block rounded-xl px-4 py-2 text-sm font-bold transition-all ${
                      pathname === '/admin/products/new'
                        ? 'bg-white text-black ring-1 ring-black'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                    }`}
                  >
                    Add Product
                  </Link>
                </div>
              )}
            </div>
          );
        }

        const Icon = item.icon;
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`flex items-center gap-3 rounded-xl px-4 py-3.5 font-bold transition-all ${
              isActive
                ? 'bg-black text-white shadow-md shadow-none'
                : 'text-slate-600 hover:bg-white hover:text-black'
            }`}
          >
            <Icon />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function SiteModeControl({
  value,
  saving,
  loading,
  error,
  onToggle,
}: {
  value: SiteControlState;
  saving: boolean;
  loading: boolean;
  error: string | null;
  onToggle: () => void;
}) {
  return (
    <div className="mt-8 rounded-2xl border border-slate-100/50 bg-slate-50/50 p-5 shadow-sm ring-1 ring-slate-200/50">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Site Control</p>

      <div className="mt-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-slate-900">Live Mode</p>
          <p className={`text-xs font-semibold ${value.liveMode ? 'text-emerald-600' : 'text-black'}`}>
            {value.liveMode ? 'Site is open' : 'Site is closed'}
          </p>
          <p className="mt-1 text-[11px] font-medium text-slate-500">Changes save instantly.</p>
        </div>
        <button
          type="button"
          onClick={onToggle}
          disabled={loading || saving}
          aria-label="Toggle live mode"
          aria-pressed={value.liveMode}
          className={`relative inline-flex h-8 w-14 items-center rounded-full transition-all duration-300 ${
            value.liveMode ? 'bg-black shadow-inner' : 'bg-slate-200'
          } disabled:cursor-not-allowed disabled:opacity-50`}
        >
          <span
            className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-sm transition-transform duration-300 ${
              value.liveMode ? 'translate-x-7' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {saving && <p className="mt-2 text-xs font-semibold text-slate-500">Updating site mode...</p>}

      {error && <p className="mt-2 text-xs font-semibold text-black">{error}</p>}
    </div>
  );
}

export default function AdminShell({ children, userDisplayName }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [siteControl, setSiteControl] = useState<SiteControlState>(DEFAULT_SITE_CONTROL);
  const [siteControlLoading, setSiteControlLoading] = useState(true);
  const [siteControlSaving, setSiteControlSaving] = useState(false);
  const [siteControlError, setSiteControlError] = useState<string | null>(null);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setSiteControlLoading(true);
        setSiteControlError(null);

        const response = await fetch('/api/admin/settings', { cache: 'no-store' });
        if (!response.ok) {
          throw new Error('Failed to load site control');
        }

        const payload = (await response.json()) as Partial<AdminSettingsPayload>;
        const normalized = {
          liveMode: payload.liveMode !== false,
        };

        setSiteControl(normalized);
      } catch (error) {
        setSiteControlError(error instanceof Error ? error.message : 'Failed to load site control');
      } finally {
        setSiteControlLoading(false);
      }
    };

    void loadSettings();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      router.push('/account');
      router.refresh();
    }
  };

  const updateLiveMode = async (nextLiveMode: boolean) => {
    const previous = siteControl.liveMode;

    try {
      setSiteControl(prev => ({ ...prev, liveMode: nextLiveMode }));
      setSiteControlSaving(true);
      setSiteControlError(null);

      const readResponse = await fetch('/api/admin/settings', { cache: 'no-store' });
      if (!readResponse.ok) {
        throw new Error('Failed to load current settings');
      }

      const current = (await readResponse.json()) as Partial<AdminSettingsPayload>;
      const nextPayload: AdminSettingsPayload = {
        liveMode: nextLiveMode,
        maintenanceReason:
          typeof current.maintenanceReason === 'string' && current.maintenanceReason.trim()
            ? current.maintenanceReason.trim()
            : DEFAULT_MAINTENANCE_REASON,
        orderNotifications: Boolean(current.orderNotifications),
        allowCashOnDelivery: Boolean(current.allowCashOnDelivery),
        lowStockThreshold:
          Number.isFinite(Number(current.lowStockThreshold)) && Number(current.lowStockThreshold) >= 0
            ? Number(current.lowStockThreshold)
            : 5,
        supportEmail:
          typeof current.supportEmail === 'string' && current.supportEmail.trim()
            ? current.supportEmail.trim()
            : 'support@zhilakaii.com',
        smsOrderConfirmationTemplate:
          typeof current.smsOrderConfirmationTemplate === 'string' && current.smsOrderConfirmationTemplate.trim()
            ? current.smsOrderConfirmationTemplate
            : 'Zhilakaii: Order {orderNumber} confirmed. Payment received. Total GHc{total}. We will notify you when status changes.',
        smsOrderStatusTemplate:
          typeof current.smsOrderStatusTemplate === 'string' && current.smsOrderStatusTemplate.trim()
            ? current.smsOrderStatusTemplate
            : 'Zhilakaii: Your order {orderNumber} status is now {status}.',
        smsNewOrderAdminTemplate:
          typeof current.smsNewOrderAdminTemplate === 'string' && current.smsNewOrderAdminTemplate.trim()
            ? current.smsNewOrderAdminTemplate
            : 'Zhilakaii: New paid order {orderNumber} from {customerName} ({city}). Total GHc{total}.',
      };

      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nextPayload),
      });

      if (!response.ok) {
        throw new Error('Failed to update site mode');
      }

      const saved = (await response.json()) as Partial<AdminSettingsPayload>;
      const normalized = {
        liveMode: saved.liveMode !== false,
      };

      setSiteControl(normalized);
      router.refresh();
    } catch (error) {
      setSiteControl(prev => ({ ...prev, liveMode: previous }));
      setSiteControlError(error instanceof Error ? error.message : 'Failed to update site mode');
    } finally {
      setSiteControlSaving(false);
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-slate-50/50 text-slate-900 font-sans selection:bg-white selection:text-black">
      <div className="flex h-full w-full overflow-hidden">
        <aside className="hidden h-full w-72 flex-none flex-col overflow-y-auto border-r border-slate-200/60 bg-white/60 backdrop-blur-2xl p-6 lg:flex">
          <Link href="/admin/dashboard" className="mb-8 flex items-center gap-3">
            <Image src="/logo.png" alt="Zhilakaii" width={44} height={44} className="rounded-xl" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Admin</p>
              <p className="text-lg font-black text-slate-900">Zhilakaii</p>
            </div>
          </Link>

          <NavLinks pathname={pathname} />

          <SiteModeControl
            value={siteControl}
            loading={siteControlLoading}
            saving={siteControlSaving}
            error={siteControlError}
            onToggle={() => void updateLiveMode(!siteControl.liveMode)}
          />

          <div className="mt-auto rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/60">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Signed in as</p>
            <p className="mt-1 truncate text-sm font-black text-slate-800">{userDisplayName}</p>
            <div className="mt-4 flex flex-col gap-2">
              <Link
                href="/"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-200 transition-colors"
              >
                <FiHome className="text-lg" />
                Back to Shop
              </Link>
              <button
                onClick={handleLogout}
                className="w-full rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-black hover:bg-white transition-colors"
              >
                Logout Account
              </button>
            </div>
          </div>
        </aside>

        <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-slate-50/30">
          <header className="sticky top-0 z-30 border-b border-slate-200/60 bg-white/80 px-4 py-3 backdrop-blur-xl sm:px-6 lg:hidden shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <Link href="/admin/dashboard" className="flex items-center gap-2">
                <Image src="/logo.png" alt="Zhilakaii" width={34} height={34} className="rounded-xl shadow-sm" />
                <span className="text-sm font-black">Admin</span>
              </Link>
              <button
                type="button"
                onClick={() => setIsSidebarOpen(true)}
                className="inline-flex items-center justify-center rounded-lg border border-slate-200 p-2 text-slate-700"
                aria-label="Open admin menu"
              >
                <FiMenu className="text-lg" />
              </button>
            </div>
          </header>

          {isSidebarOpen && (
            <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true">
              <button
                type="button"
                onClick={() => setIsSidebarOpen(false)}
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
                aria-label="Close admin menu overlay"
              />
              <aside className="absolute left-0 top-0 h-full w-80 max-w-[85vw] overflow-y-auto border-r border-slate-200/60 bg-white/90 backdrop-blur-2xl p-5 shadow-2xl">
                <div className="mb-6 flex items-center justify-between">
                  <Link href="/admin/dashboard" className="flex items-center gap-2" onClick={() => setIsSidebarOpen(false)}>
                    <Image src="/logo.png" alt="Zhilakaii" width={34} height={34} className="rounded-lg" />
                    <span className="text-sm font-black">Admin Panel</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => setIsSidebarOpen(false)}
                    className="rounded-xl bg-slate-100 p-2.5 text-slate-600 hover:bg-slate-200 transition-colors"
                    aria-label="Close admin menu"
                  >
                    <FiX className="text-lg" />
                  </button>
                </div>

                <NavLinks pathname={pathname} onNavigate={() => setIsSidebarOpen(false)} />

                <SiteModeControl
                  value={siteControl}
                  loading={siteControlLoading}
                  saving={siteControlSaving}
                  error={siteControlError}
                  onToggle={() => void updateLiveMode(!siteControl.liveMode)}
                />

                <div className="mt-8 rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200/50">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Signed in as</p>
                  <p className="mt-1 truncate text-sm font-black text-slate-800">{userDisplayName}</p>
                  <div className="mt-5 flex flex-col gap-2">
                    <Link
                      href="/"
                      onClick={() => setIsSidebarOpen(false)}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-300 transition-colors"
                    >
                      <FiHome className="text-lg" />
                      Back to Shop
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setIsSidebarOpen(false);
                        void handleLogout();
                      }}
                      className="w-full rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-black hover:bg-white transition-colors"
                    >
                      Logout Account
                    </button>
                  </div>
                </div>
              </aside>
            </div>
          )}

          <main className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
