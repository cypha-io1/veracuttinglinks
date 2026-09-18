'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function ConfirmPaymentPage() {
  const [reference, setReference] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reference.trim()) {
      setError('Please enter a payment reference.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/payments/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference: reference.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Verification failed.');
      } else {
        setSuccess(data.message || 'Payment successfully verified.');
        setReference('');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during verification.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <div className="flex-1 max-w-xl mx-auto w-full px-4 py-12 flex flex-col justify-center">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 mb-2">
              Payment Confirmation
            </h1>
            <p className="text-gray-500 text-sm">
              If your payment was successful but your order shows as pending, enter your payment reference to confirm it.
            </p>
          </div>

          <form onSubmit={handleConfirm} className="space-y-5">
            <div className="space-y-1.5">
              <label htmlFor="reference" className="text-sm font-medium text-gray-700 ml-1">
                Payment Reference
              </label>
              <input
                id="reference"
                type="text"
                required
                placeholder="e.g. wf_123_abc123"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-black focus:border-transparent transition-all outline-none"
              />
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 text-sm flex items-start gap-3">
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 text-sm flex items-start gap-3">
                <span>{success}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !reference.trim()}
              className="w-full h-12 bg-black text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-gray-800 active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100"
            >
              {loading ? 'Verifying...' : 'Verify Payment'}
            </button>
          </form>
        </div>
      </div>

      <Footer />
    </main>
  );
}
