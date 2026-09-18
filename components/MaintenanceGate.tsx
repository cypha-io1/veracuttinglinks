'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const FALLBACK_IMAGES = ['/logo.png'];

const normalizePhoneInput = (value: string) => value.replace(/\D/g, '').slice(0, 10);
const isValidPhone = (value: string) => /^0\d{9}$/.test(value);

type LoginResult = {
  profile?: {
    role?: string;
  };
  error?: string;
};

type MaintenanceGateProps = {
  reason: string;
  productImages: string[];
};

export default function MaintenanceGate({ reason, productImages }: MaintenanceGateProps) {
  const router = useRouter();
  const images = productImages.length > 0 ? productImages : FALLBACK_IMAGES;
  const [activeImage, setActiveImage] = useState(0);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveImage(prev => (prev + 1) % images.length);
    }, 4500);

    return () => window.clearInterval(interval);
  }, [images.length]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedPhone = normalizePhoneInput(phone);
    if (!isValidPhone(normalizedPhone)) {
      setError('Enter a valid phone number (10 digits, starts with 0).');
      return;
    }

    if (!password.trim()) {
      setError('Password is required.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: normalizedPhone, password }),
      });

      const payload = (await response.json().catch(() => ({}))) as LoginResult;

      if (!response.ok) {
        throw new Error(payload.error || 'Login failed');
      }

      if (payload.profile?.role !== 'admin') {
        throw new Error('Only admin accounts can access the site while maintenance mode is enabled.');
      }

      router.push('/admin/dashboard');
      router.refresh();
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden text-white">
      <div className="absolute inset-0">
        {images.map((image, index) => (
          <div
            key={`${image}-${index}`}
            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${
              index === activeImage ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ backgroundImage: `url(${image})` }}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950/82 via-gray-900/76 to-black/80" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(249,115,22,0.35),transparent_50%)]" />
      </div>

      <section className="relative mx-auto min-h-screen w-full max-w-6xl px-4 pb-64 pt-6 sm:px-6 sm:pt-10 lg:grid lg:grid-cols-[1.2fr_0.8fr] lg:items-center lg:gap-10 lg:py-10 lg:pb-10">
        <div className="rounded-2xl border border-white/10 bg-black/25 p-4 text-center backdrop-blur-sm sm:p-6 lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0 lg:text-left lg:backdrop-blur-none">
          <p className="inline-flex rounded-full border border-black bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-black sm:px-4 sm:text-xs sm:tracking-[0.2em]">
            We&apos;ll Be Back Soon!
          </p>
          <h1 className="mt-4 text-3xl font-black tracking-tight sm:mt-5 sm:text-5xl lg:text-6xl">Temporarily Closed</h1>
          <p className="mt-3 max-w-2xl text-sm text-gray-100 sm:mt-4 sm:text-lg">{reason}</p>

          {/* <div className="mt-5 flex items-center justify-center gap-3 text-[11px] font-semibold uppercase tracking-wider text-gray-200 sm:mt-6 sm:text-xs lg:justify-start">
            <span className="h-2 w-2 rounded-full bg-white" />
            Product showcase backgrounds are live
          </div> */}

          <div className="mt-4 flex items-center justify-center gap-2 lg:justify-start" aria-hidden="true">
            {images.slice(0, 5).map((image, index) => (
              <span
                key={`${image}-dot-${index}`}
                className={`h-1.5 rounded-full transition-all ${
                  index === activeImage % Math.min(images.length, 5) ? 'w-6 bg-white' : 'w-2 bg-white/45'
                }`}
              />
            ))}
          </div>
        </div>

        <form
          onSubmit={onSubmit}
          className="hidden w-full max-w-md rounded-2xl border border-white/20 bg-slate-950/78 p-6 text-left shadow-2xl backdrop-blur lg:block"
        >
          {/* <p className="text-xs font-bold uppercase tracking-[0.16em] text-black sm:text-sm sm:tracking-wide">Admin Access</p>
          <p className="mt-1 text-[11px] text-gray-300 sm:text-xs">Only admins can sign in while maintenance mode is active.</p> */}

          <label className="mt-4 block text-[11px] font-semibold uppercase tracking-wide text-gray-300 sm:text-xs">Phone</label>
          <input
            type="tel"
            value={phone}
            onChange={event => setPhone(normalizePhoneInput(event.target.value))}
            inputMode="numeric"
            pattern="0[0-9]{9}"
            maxLength={10}
            placeholder="0XXXXXXXXX"
            className="mt-1 w-full rounded-xl border border-white/20 bg-gray-900/80 px-3 py-3 text-sm text-white placeholder:text-gray-500 focus:border-black focus:outline-none"
          />

          <label className="mt-3 block text-[11px] font-semibold uppercase tracking-wide text-gray-300 sm:text-xs">Password</label>
          <input
            type="password"
            value={password}
            onChange={event => setPassword(event.target.value)}
            placeholder="Enter password"
            className="mt-1 w-full rounded-xl border border-white/20 bg-gray-900/80 px-3 py-3 text-sm text-white placeholder:text-gray-500 focus:border-black focus:outline-none"
          />

          {error && <p className="mt-3 text-xs font-semibold text-black">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="mt-4 w-full rounded-xl bg-black px-4 py-3 text-sm font-bold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
      </section>

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 lg:hidden">
        <div className="mx-auto w-full max-w-6xl px-3 pb-3 sm:px-6 sm:pb-6">
          <form
            onSubmit={onSubmit}
            className="pointer-events-auto rounded-3xl border border-white/20 bg-slate-950/88 p-4 shadow-2xl backdrop-blur sm:rounded-3xl sm:p-5"
          >
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-white/25" aria-hidden="true" />
            {/* <p className="text-xs font-bold uppercase tracking-[0.16em] text-black">Admin Access</p>
            <p className="mt-1 text-[11px] text-gray-300">Only admins can sign in while maintenance mode is active.</p> */}

            <div className="mt-3 grid gap-3">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wide text-gray-300">Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={event => setPhone(normalizePhoneInput(event.target.value))}
                  inputMode="numeric"
                  pattern="0[0-9]{9}"
                  maxLength={10}
                  placeholder="0XXXXXXXXX"
                  className="mt-1 w-full rounded-xl border border-white/20 bg-gray-900/80 px-3 py-3 text-sm text-white placeholder:text-gray-500 focus:border-black focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wide text-gray-300">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={event => setPassword(event.target.value)}
                  placeholder="Enter password"
                  className="mt-1 w-full rounded-xl border border-white/20 bg-gray-900/80 px-3 py-3 text-sm text-white placeholder:text-gray-500 focus:border-black focus:outline-none"
                />
              </div>
            </div>

            {error && <p className="mt-3 text-xs font-semibold text-black">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="mt-4 w-full rounded-xl bg-black px-4 py-3 text-sm font-bold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Signing In...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
