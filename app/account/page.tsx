'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FiPhone } from 'react-icons/fi';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

type AuthStep = 'phone' | 'login' | 'signup';
type ForgotStage = 'request' | 'verify' | 'reset';

type Profile = {
  fullName: string;
  phone: string;
  role?: 'user' | 'admin';
  email: string;
  address: string;
  city: string;
};

const normalizePhoneInput = (value: string) => value.replace(/\D/g, '').slice(0, 10);
const isValidPhone = (value: string) => /^0\d{9}$/.test(value);

export default function AccountPage() {
  const router = useRouter();
  const [step, setStep] = useState<AuthStep>('phone');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotStage, setForgotStage] = useState<ForgotStage>('request');
  const [resetCodeDigits, setResetCodeDigits] = useState<string[]>(Array(6).fill(''));
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const codeInputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [profile, setProfile] = useState<Profile>({
    fullName: '',
    phone: '',
    email: '',
    address: '',
    city: 'Accra',
  });
  const resetCode = resetCodeDigits.join('');

  const focusResetDigit = (index: number) => {
    const target = codeInputRefs.current[index];
    if (target) {
      target.focus();
      target.select();
    }
  };

  const clearResetCode = () => {
    setResetCodeDigits(Array(6).fill(''));
  };

  const fillResetDigitsFrom = (startIndex: number, rawValue: string) => {
    const digits = rawValue.replace(/\D/g, '');
    if (!digits) return;

    setResetCodeDigits((prev) => {
      const next = [...prev];
      let cursor = startIndex;

      for (const digit of digits) {
        if (cursor > 5) break;
        next[cursor] = digit;
        cursor += 1;
      }

      return next;
    });

    const nextIndex = Math.min(5, startIndex + digits.length);
    focusResetDigit(nextIndex);
  };

  const handleResetDigitChange = (index: number, rawValue: string) => {
    const digits = rawValue.replace(/\D/g, '');

    if (!digits) {
      setResetCodeDigits((prev) => {
        const next = [...prev];
        next[index] = '';
        return next;
      });
      return;
    }

    if (digits.length > 1) {
      fillResetDigitsFrom(index, digits);
      return;
    }

    const digit = digits[0];
    setResetCodeDigits((prev) => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });

    if (index < 5) {
      focusResetDigit(index + 1);
    }
  };

  const handleResetDigitKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    const key = event.key;

    if (key === 'Backspace') {
      if (resetCodeDigits[index]) {
        setResetCodeDigits((prev) => {
          const next = [...prev];
          next[index] = '';
          return next;
        });
      } else if (index > 0) {
        setResetCodeDigits((prev) => {
          const next = [...prev];
          next[index - 1] = '';
          return next;
        });
        focusResetDigit(index - 1);
      }
      event.preventDefault();
      return;
    }

    if (key === 'ArrowLeft' && index > 0) {
      event.preventDefault();
      focusResetDigit(index - 1);
      return;
    }

    if (key === 'ArrowRight' && index < 5) {
      event.preventDefault();
      focusResetDigit(index + 1);
      return;
    }

    if (key.length === 1 && /\D/.test(key)) {
      event.preventDefault();
    }
  };

  const handleResetDigitPaste = (index: number, text: string) => {
    fillResetDigitsFrom(index, text);
  };

  const lookupPhone = async () => {
    const normalized = normalizePhoneInput(phone);
    if (!isValidPhone(normalized)) {
      setAuthError('Enter a valid phone number (10 digits, starts with 0).');
      return;
    }

    try {
      setLoading(true);
      setAuthError('');
      setAuthSuccess('');

      const response = await fetch('/api/auth/phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: normalized }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Failed to check phone');
      }

      const payload = (await response.json()) as {
        exists: boolean;
        hasPassword: boolean;
        profile?: Profile;
      };

      if (payload.profile) {
        setProfile(payload.profile);
      } else {
        setProfile(prev => ({ ...prev, phone: normalized }));
      }

      if (payload.exists && payload.hasPassword) {
        setStep('login');
      } else {
        setStep('signup');
      }
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Failed to check phone');
    } finally {
      setLoading(false);
    }
  };

  const login = async () => {
    try {
      setLoading(true);
      setAuthError('');
      setAuthSuccess('');

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: normalizePhoneInput(phone), password }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Login failed');
      }

      const payload = (await response.json()) as { profile: Profile };
      window.localStorage.setItem('wf-user-phone', payload.profile.phone);
      const target = payload.profile.role === 'admin' ? '/admin/dashboard' : '/dashboard';
      router.push(target);
      router.refresh();
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const signup = async () => {
    const normalizedPhone = normalizePhoneInput(phone);

    if (!profile.fullName.trim()) {
      setAuthError('Full name is required.');
      return;
    }
    if (!isValidPhone(normalizedPhone)) {
      setAuthError('Phone number must be 10 digits and start with 0.');
      return;
    }
    if (password.trim().length < 6) {
      setAuthError('Password must be at least 6 characters.');
      return;
    }

    try {
      setLoading(true);
      setAuthError('');
      setAuthSuccess('');

      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...profile, phone: normalizedPhone, password }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Signup failed');
      }

      const payload = (await response.json()) as { profile: Profile };
      window.localStorage.setItem('wf-user-phone', payload.profile.phone);
      const target = payload.profile.role === 'admin' ? '/admin/dashboard' : '/dashboard';
      router.push(target);
      router.refresh();
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const requestResetCode = async () => {
    const normalizedPhone = normalizePhoneInput(phone);

    if (!isValidPhone(normalizedPhone)) {
      setAuthError('Enter a valid phone number (10 digits, starts with 0).');
      return;
    }

    try {
      setLoading(true);
      setAuthError('');
      setAuthSuccess('');

      const response = await fetch('/api/auth/forgot/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: normalizedPhone }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
        devCode?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to send verification code');
      }

      setForgotStage('verify');
      setAuthSuccess(
        payload.devCode
          ? `Verification code sent. Dev code: ${payload.devCode}`
          : 'Verification code sent to your phone number.'
      );
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  const verifyResetCode = async () => {
    const normalizedPhone = normalizePhoneInput(phone);
    const code = resetCode.replace(/\D/g, '').slice(0, 6);

    if (!isValidPhone(normalizedPhone)) {
      setAuthError('Enter a valid phone number (10 digits, starts with 0).');
      return;
    }

    if (!/^\d{6}$/.test(code)) {
      setAuthError('Enter a valid 6-digit verification code.');
      return;
    }

    try {
      setLoading(true);
      setAuthError('');
      setAuthSuccess('');

      const response = await fetch('/api/auth/forgot/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: normalizedPhone, code }),
      });

      const payload = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error || 'Code verification failed');
      }

      setResetCodeDigits(code.split(''));
      setForgotStage('reset');
      setAuthSuccess('Code verified. You can now set a new password.');
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Code verification failed');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    const normalizedPhone = normalizePhoneInput(phone);
    const code = resetCode.replace(/\D/g, '').slice(0, 6);

    if (!isValidPhone(normalizedPhone)) {
      setAuthError('Enter a valid phone number (10 digits, starts with 0).');
      return;
    }

    if (!/^\d{6}$/.test(code)) {
      setAuthError('Verification code must be 6 digits.');
      return;
    }

    if (newPassword.trim().length < 6) {
      setAuthError('New password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setAuthError('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      setAuthError('');
      setAuthSuccess('');

      const response = await fetch('/api/auth/forgot/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: normalizedPhone, code, newPassword }),
      });

      const payload = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error || 'Password reset failed');
      }

      setForgotMode(false);
      setForgotStage('request');
      clearResetCode();
      setNewPassword('');
      setConfirmNewPassword('');
      setPassword('');
      setAuthSuccess('Password reset successful. Sign in with your new password.');
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Password reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 py-10 pt-24 sm:px-6 sm:py-14 md:pt-32">
        <div className="mb-10 flex flex-col items-center">
          <span className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-black md:text-sm">Welcome</span>
          <h1 className="text-3xl font-black tracking-tight text-gray-800 sm:text-4xl md:text-5xl">My Account</h1>
          <div className="mt-6 mb-4 h-1.5 w-16 rounded-full bg-gradient-to-r from-black to-gray-900 shadow-sm" />
          <p className="text-gray-500 font-medium text-center">Secure access with your phone number.</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="rounded-[2.5rem] bg-gradient-to-br from-black to-gray-900 p-8 text-white shadow-xl shadow-none md:p-10">
            <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/20 shadow-inner backdrop-blur-md">
                <FiPhone className="text-3xl drop-shadow-md" />
              </div>
              <div>
                <h2 className="text-2xl font-black drop-shadow-md">Phone-First Access</h2>
                <p className="text-sm font-medium text-white/90">We detect existing users automatically.</p>
              </div>
            </div>
            <ul className="space-y-4 text-sm font-medium text-white/90">
              <li className="flex items-center gap-3">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-white shadow-sm shadow-none"></span>
                Existing users sign in with password.
              </li>
              <li className="flex items-center gap-3">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-white shadow-sm shadow-white/50"></span>
                New users complete a quick signup.
              </li>
              <li className="flex items-center gap-3">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-gray-900 shadow-sm shadow-gray-900/50"></span>
                Successful auth opens your dashboard.
              </li>
            </ul>
          </div>

          <div className="rounded-[2.5rem] bg-white p-8 shadow-sm ring-1 ring-gray-200 md:p-10">
            <h3 className="mb-2 text-2xl font-black text-gray-800">
              {step === 'phone' && 'Enter Phone Number'}
              {step === 'login' && 'Enter Password'}
              {step === 'signup' && 'Complete Sign Up'}
            </h3>

            <p className="mb-8 text-sm font-medium text-gray-500">
              {step === 'phone' && 'We will use this to identify your account automatically.'}
              {step === 'login' && `Welcome back. Phone: ${phone.trim()}`}
              {step === 'signup' && 'No account found with this number. Fill your details below.'}
            </p>

            {step === 'phone' && (
              <>
                <label className="mb-2 block text-xs font-black uppercase tracking-wider text-gray-500" htmlFor="phone">Phone Number</label>
                <div className="relative">
                  <FiPhone className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(normalizePhoneInput(e.target.value))}
                    inputMode="numeric"
                    pattern="0[0-9]{9}"
                    maxLength={10}
                    placeholder="0XXXXXXXXX"
                    className="w-full rounded-[1.5rem] bg-gray-50 py-4 pl-12 pr-5 text-sm font-bold text-gray-800 shadow-sm ring-1 ring-gray-200 transition-all focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
                <button
                  onClick={lookupPhone}
                  disabled={loading}
                  className="mt-8 w-full rounded-[2rem] bg-gradient-to-r from-black to-gray-900 py-4 text-base font-black text-white shadow-lg shadow-none transition-all duration-300 hover:scale-[1.02] hover:shadow-none disabled:scale-100 disabled:opacity-60"
                >
                  {loading ? 'Checking...' : 'Continue'}
                </button>
              </>
            )}

            {step === 'login' && (
              <>
                {!forgotMode && (
                  <>
                    <label className="mb-2 block text-xs font-black uppercase tracking-wider text-gray-500" htmlFor="password">Password</label>
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      className="w-full rounded-[1.5rem] bg-gray-50 px-5 py-4 text-sm font-bold text-gray-800 shadow-sm ring-1 ring-gray-200 transition-all focus:outline-none focus:ring-2 focus:ring-black"
                    />
                    <button
                      onClick={login}
                      disabled={loading}
                      className="mt-8 w-full rounded-[2rem] bg-gradient-to-r from-black to-gray-900 py-4 text-base font-black text-white shadow-lg shadow-none transition-all duration-300 hover:scale-[1.02] hover:shadow-none disabled:scale-100 disabled:opacity-60"
                    >
                      {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                    <button
                      onClick={() => {
                        setForgotMode(true);
                        setForgotStage('request');
                        clearResetCode();
                        setNewPassword('');
                        setConfirmNewPassword('');
                        setAuthError('');
                        setAuthSuccess('');
                      }}
                      className="mt-4 w-full rounded-[2rem] bg-white py-4 text-sm font-bold text-black transition-all hover:bg-white"
                    >
                      Forgot password?
                    </button>
                  </>
                )}

                {forgotMode && (
                  <>
                    {forgotStage === 'request' && (
                      <>
                        <p className="mb-2 text-sm font-semibold text-gray-600">Send a 6-digit verification code to {phone.trim()}.</p>
                        <button
                          onClick={requestResetCode}
                          disabled={loading}
                          className="mt-2 w-full rounded-[2rem] bg-gradient-to-r from-black to-gray-900 py-4 text-base font-black text-white shadow-lg shadow-none transition-all duration-300 hover:scale-[1.02] hover:shadow-none disabled:scale-100 disabled:opacity-60"
                        >
                          {loading ? 'Sending code...' : 'Send verification code'}
                        </button>
                      </>
                    )}

                    {forgotStage === 'verify' && (
                      <>
                        <label className="mb-2 block text-xs font-black uppercase tracking-wider text-gray-500" htmlFor="resetCode-0">Verification Code</label>
                        <div className="grid grid-cols-6 gap-2 sm:gap-3">
                          {Array.from({ length: 6 }, (_, index) => (
                            <input
                              key={index}
                              id={`resetCode-${index}`}
                              ref={(el) => {
                                codeInputRefs.current[index] = el;
                              }}
                              type="text"
                              value={resetCodeDigits[index] || ''}
                              onChange={(e) => handleResetDigitChange(index, e.target.value)}
                              onKeyDown={(e) => handleResetDigitKeyDown(index, e)}
                              onPaste={(e) => {
                                e.preventDefault();
                                handleResetDigitPaste(index, e.clipboardData.getData('text'));
                              }}
                              inputMode="numeric"
                              autoComplete="one-time-code"
                              maxLength={1}
                              className="h-14 w-full rounded-xl bg-gray-50 text-center text-lg font-black text-gray-800 shadow-sm ring-1 ring-gray-200 transition-all focus:outline-none focus:ring-2 focus:ring-black"
                            />
                          ))}
                        </div>
                        <button
                          onClick={verifyResetCode}
                          disabled={loading}
                          className="mt-4 w-full rounded-[2rem] bg-gradient-to-r from-black to-gray-900 py-4 text-base font-black text-white shadow-lg shadow-none transition-all duration-300 hover:scale-[1.02] hover:shadow-none disabled:scale-100 disabled:opacity-60"
                        >
                          {loading ? 'Verifying...' : 'Verify code'}
                        </button>
                        <button
                          onClick={requestResetCode}
                          disabled={loading}
                          className="mt-3 w-full rounded-[2rem] bg-gray-100 py-4 text-sm font-bold text-gray-600 transition-all hover:bg-gray-200 hover:text-gray-800"
                        >
                          Resend code
                        </button>
                      </>
                    )}

                    {forgotStage === 'reset' && (
                      <>
                        <label className="mb-2 block text-xs font-black uppercase tracking-wider text-gray-500" htmlFor="newPassword">New Password</label>
                        <input
                          id="newPassword"
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="New password (min 6 chars)"
                          className="w-full rounded-[1.5rem] bg-gray-50 px-5 py-4 text-sm font-bold text-gray-800 shadow-sm ring-1 ring-gray-200 transition-all focus:outline-none focus:ring-2 focus:ring-black"
                        />
                        <label className="mb-2 mt-4 block text-xs font-black uppercase tracking-wider text-gray-500" htmlFor="confirmNewPassword">Confirm Password</label>
                        <input
                          id="confirmNewPassword"
                          type="password"
                          value={confirmNewPassword}
                          onChange={(e) => setConfirmNewPassword(e.target.value)}
                          placeholder="Re-enter new password"
                          className="w-full rounded-[1.5rem] bg-gray-50 px-5 py-4 text-sm font-bold text-gray-800 shadow-sm ring-1 ring-gray-200 transition-all focus:outline-none focus:ring-2 focus:ring-black"
                        />
                        <button
                          onClick={resetPassword}
                          disabled={loading}
                          className="mt-4 w-full rounded-[2rem] bg-gradient-to-r from-black to-gray-900 py-4 text-base font-black text-white shadow-lg shadow-none transition-all duration-300 hover:scale-[1.02] hover:shadow-none disabled:scale-100 disabled:opacity-60"
                        >
                          {loading ? 'Resetting password...' : 'Reset password'}
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => {
                        setForgotMode(false);
                        setForgotStage('request');
                        clearResetCode();
                        setNewPassword('');
                        setConfirmNewPassword('');
                        setAuthError('');
                        setAuthSuccess('');
                      }}
                      className="mt-4 w-full rounded-[2rem] bg-gray-100 py-4 text-sm font-bold text-gray-600 transition-all hover:bg-gray-200 hover:text-gray-800"
                    >
                      Back to sign in
                    </button>
                  </>
                )}

                <button
                  onClick={() => {
                    setStep('phone');
                    setPassword('');
                    setAuthError('');
                    setAuthSuccess('');
                    setForgotMode(false);
                    setForgotStage('request');
                    clearResetCode();
                    setNewPassword('');
                    setConfirmNewPassword('');
                  }}
                  className="mt-4 w-full rounded-[2rem] bg-gray-100 py-4 text-sm font-bold text-gray-600 transition-all hover:bg-gray-200 hover:text-gray-800"
                >
                  Use another number
                </button>
              </>
            )}

            {step === 'signup' && (
              <>
                <div className="space-y-4">
                  <input
                    type="text"
                    value={profile.fullName}
                    onChange={(e) => setProfile(prev => ({ ...prev, fullName: e.target.value }))}
                    placeholder="Full name"
                    className="w-full rounded-[1.5rem] bg-gray-50 px-5 py-4 text-sm font-bold text-gray-800 shadow-sm ring-1 ring-gray-200 transition-all focus:outline-none focus:ring-2 focus:ring-black"
                  />
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Email (optional)"
                    className="w-full rounded-[1.5rem] bg-gray-50 px-5 py-4 text-sm font-bold text-gray-800 shadow-sm ring-1 ring-gray-200 transition-all focus:outline-none focus:ring-2 focus:ring-black"
                  />
                  <input
                    type="text"
                    value={profile.address}
                    onChange={(e) => setProfile(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Address (optional)"
                    className="w-full rounded-[1.5rem] bg-gray-50 px-5 py-4 text-sm font-bold text-gray-800 shadow-sm ring-1 ring-gray-200 transition-all focus:outline-none focus:ring-2 focus:ring-black"
                  />
                  <input
                    type="text"
                    value={profile.city}
                    onChange={(e) => setProfile(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="City"
                    className="w-full rounded-[1.5rem] bg-gray-50 px-5 py-4 text-sm font-bold text-gray-800 shadow-sm ring-1 ring-gray-200 transition-all focus:outline-none focus:ring-2 focus:ring-black"
                  />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create password (min 6 chars)"
                    className="w-full rounded-[1.5rem] bg-gray-50 px-5 py-4 text-sm font-bold text-gray-800 shadow-sm ring-1 ring-gray-200 transition-all focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
                <button
                  onClick={signup}
                  disabled={loading}
                  className="mt-8 w-full rounded-[2rem] bg-gradient-to-r from-black to-gray-900 py-4 text-base font-black text-white shadow-lg shadow-none transition-all duration-300 hover:scale-[1.02] hover:shadow-none disabled:scale-100 disabled:opacity-60"
                >
                  {loading ? 'Creating account...' : 'Create Account'}
                </button>
              </>
            )}

            {authError && <p className="mt-3 text-sm font-semibold text-black">{authError}</p>}
            {authSuccess && <p className="mt-3 text-sm font-semibold text-gray-600">{authSuccess}</p>}

            <p className="text-xs text-gray-500 mt-4">
              By continuing, you agree to receive account-related messages.
            </p>

            <div className="mt-8 flex justify-center border-t border-gray-100 pt-6">
              <Link href="/" className="text-sm font-bold text-gray-500 transition-colors hover:text-black">
                &larr; Back to home
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
