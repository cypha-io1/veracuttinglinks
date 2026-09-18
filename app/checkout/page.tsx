'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useCart } from '@/hooks/useCart';

type CheckoutForm = {
  fullName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  notes: string;
};

type AppliedPromo = {
  code: string;
  discountAmount: number;
  totalAfterDiscount: number;
};

type ActivePromo = {
  id: number;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minOrder: number;
};

type SessionProfile = {
  fullName?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
};

const INITIAL_FORM: CheckoutForm = {
  fullName: '',
  phone: '',
  email: '',
  address: '',
  city: 'Accra',
  notes: '',
};

const CHECKOUT_PAYMENT_METHOD = 'paystack' as const;
const CHECKOUT_PROFILE_CACHE_KEY = 'wf-checkout-profile-cache-v1';
const ACTIVE_PROMOS_CACHE_KEY = 'wf-active-promos-cache-v1';

const normalizePhoneInput = (value: string) => value.replace(/\D/g, '').slice(0, 10);
const isValidPhone = (value: string) => /^0\d{9}$/.test(value);
const USER_PHONE_KEY = 'wf-user-phone';
const CHECKOUT_PHONE_KEY = 'wf-checkout-phone';

function readCachedCheckoutForm(): CheckoutForm {
  if (typeof window === 'undefined') return INITIAL_FORM;
  try {
    const raw = window.localStorage.getItem(CHECKOUT_PROFILE_CACHE_KEY);
    if (!raw) return INITIAL_FORM;
    const parsed = JSON.parse(raw) as Partial<CheckoutForm>;
    return {
      fullName: parsed.fullName?.trim() || '',
      phone: parsed.phone?.trim() || '',
      email: parsed.email?.trim() || '',
      address: parsed.address?.trim() || '',
      city: parsed.city?.trim() || 'Accra',
      notes: parsed.notes?.trim() || '',
    };
  } catch {
    return INITIAL_FORM;
  }
}

function readCachedActivePromos(): ActivePromo[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.sessionStorage.getItem(ACTIVE_PROMOS_CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ActivePromo[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

declare global {
  interface Window {
    PaystackPop?: {
      setup: (options: Record<string, unknown>) => { openIframe: () => void };
    };
  }
}

export default function CheckoutPage() {
  const { items, clearCart, removeCartItem, updateCartItemQuantity } = useCart();
  const [form, setForm] = useState<CheckoutForm>(() => readCachedCheckoutForm());
  const [isAuthenticatedUser, setIsAuthenticatedUser] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [placedOrderNumber, setPlacedOrderNumber] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [applyingPromo, setApplyingPromo] = useState(false);
  const [promoMessage, setPromoMessage] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<AppliedPromo | null>(null);
  const [activePromos, setActivePromos] = useState<ActivePromo[]>(() => readCachedActivePromos());

  const parsePrice = (value: string) => {
    const numeric = Number(String(value).replace(/[^0-9.]/g, ''));
    return Number.isFinite(numeric) ? numeric : 0;
  };

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + parsePrice(item.price) * item.quantity, 0),
    [items]
  );
  const delivery = 0;
  const totalBeforeDiscount = subtotal + delivery;
  const discountAmount = appliedPromo?.discountAmount || 0;
  const total = Math.max(0, totalBeforeDiscount - discountAmount);

  const onChange = (field: keyof CheckoutForm, value: string) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(CHECKOUT_PROFILE_CACHE_KEY, JSON.stringify(next));
      }
      return next;
    });
  };

  const applyProfileToForm = (profile: SessionProfile) => {
    setForm(prev => ({
      ...prev,
      fullName: profile.fullName?.trim() || prev.fullName,
      phone: profile.phone?.trim() || prev.phone,
      email: profile.email?.trim() || prev.email,
      address: profile.address?.trim() || prev.address,
      city: profile.city?.trim() || prev.city || 'Accra',
    }));
  };

  const applyPromo = async () => {
    if (!promoCode.trim() || applyingPromo) return;

    try {
      setApplyingPromo(true);
      setPromoMessage('');

      const response = await fetch('/api/promotions/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: promoCode.trim(),
          subtotal,
          delivery,
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        code?: string;
        discountAmount?: number;
        totalAfterDiscount?: number;
        error?: string;
      };

      if (!response.ok || !payload.code) {
        throw new Error(payload.error || 'Invalid promo code');
      }

      setAppliedPromo({
        code: payload.code,
        discountAmount: Number(payload.discountAmount || 0),
        totalAfterDiscount: Number(payload.totalAfterDiscount || 0),
      });
      setPromoCode(payload.code);
      setPromoMessage(`Promo applied: ${payload.code}`);
    } catch (error) {
      setAppliedPromo(null);
      setPromoMessage(error instanceof Error ? error.message : 'Failed to apply promo code');
    } finally {
      setApplyingPromo(false);
    }
  };

  const removePromo = () => {
    setAppliedPromo(null);
    setPromoMessage('Promo removed');
  };

  useEffect(() => {
    if (!appliedPromo) return;
    setAppliedPromo(null);
    setPromoMessage('Cart changed. Re-apply promo code.');
  }, [appliedPromo, subtotal, delivery]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(CHECKOUT_PROFILE_CACHE_KEY, JSON.stringify(form));
  }, [form]);

  useEffect(() => {
    const loadActivePromos = async () => {
      try {
        const response = await fetch('/api/promotions/active', { cache: 'force-cache' });
        if (!response.ok) return;
        const data = (await response.json()) as ActivePromo[];
        const next = Array.isArray(data) ? data : [];
        setActivePromos(next);
        if (typeof window !== 'undefined') {
          window.sessionStorage.setItem(ACTIVE_PROMOS_CACHE_KEY, JSON.stringify(next));
        }
      } catch {
        // Keep cached promos if refresh fails.
      }
    };

    void loadActivePromos();
  }, []);

  const canPlaceOrder =
    items.length > 0 &&
    form.fullName.trim() &&
    isValidPhone(form.phone.trim()) &&
    form.address.trim() &&
    form.city.trim() &&
    form.email.trim().includes('@');

  useEffect(() => {
    const hydrateCheckoutProfile = async () => {
      try {
        const authResponse = await fetch('/api/auth/me', { cache: 'no-store' });
        if (authResponse.ok) {
          const authPayload = (await authResponse.json()) as {
            authenticated?: boolean;
            profile?: SessionProfile;
          };

          if (authPayload.authenticated && authPayload.profile) {
            setIsAuthenticatedUser(true);
            applyProfileToForm(authPayload.profile);

            const phone = authPayload.profile.phone?.trim() || '';
            if (isValidPhone(phone)) {
              window.localStorage.setItem(USER_PHONE_KEY, phone);
            }
            return;
          }
        }
      } catch {
        // Fallback to guest autofill below.
      }

      setIsAuthenticatedUser(false);

      const storedPhone = window.localStorage.getItem(USER_PHONE_KEY)?.trim() || '';
      if (!isValidPhone(storedPhone)) return;

      try {
        const profileResponse = await fetch(`/api/profile?phone=${encodeURIComponent(storedPhone)}`, {
          cache: 'no-store',
        });
        if (!profileResponse.ok) return;
        const profilePayload = (await profileResponse.json()) as SessionProfile | null;
        if (!profilePayload) return;
        applyProfileToForm(profilePayload);
      } catch {
        // Keep checkout usable even if profile lookup fails.
      }
    };

    void hydrateCheckoutProfile();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const payment = params.get('payment');
    const orderNumber = params.get('orderNumber');

    if (payment === 'success') {
      setPlacedOrderNumber(orderNumber || null);
      setOrderPlaced(true);
      setSubmitError('');
      clearCart();

      const checkoutPhone = window.sessionStorage.getItem(CHECKOUT_PHONE_KEY)?.trim();
      if (checkoutPhone && isValidPhone(checkoutPhone)) {
        window.localStorage.setItem(USER_PHONE_KEY, checkoutPhone);
      }
      window.sessionStorage.removeItem(CHECKOUT_PHONE_KEY);
      return;
    }

    if (payment === 'failed') {
      setSubmitError('Payment was not completed. You can try again.');
    }
  }, [clearCart]);

  const placeOrder = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canPlaceOrder || submitting) return;

    setSubmitting(true);
    setSubmitError('');

    try {
      const cartValidationResponse = await fetch('/api/cart/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });

      const cartValidationPayload = (await cartValidationResponse.json().catch(() => ({}))) as {
        valid?: boolean;
        adjustments?: Array<{
          id: number;
          variationKey?: string;
          action: 'remove' | 'clamp';
          quantity?: number;
          reason?: string;
        }>;
      };

      if (!cartValidationResponse.ok) {
        throw new Error('Could not verify current stock. Please try again.');
      }

      const adjustments = Array.isArray(cartValidationPayload.adjustments) ? cartValidationPayload.adjustments : [];

      if (adjustments.length > 0 || cartValidationPayload.valid === false) {
        for (const adjustment of adjustments) {
          if (adjustment.action === 'remove') {
            removeCartItem(adjustment.id, adjustment.variationKey);
            continue;
          }

          if (adjustment.action === 'clamp' && typeof adjustment.quantity === 'number' && adjustment.quantity > 0) {
            updateCartItemQuantity(adjustment.id, adjustment.quantity, adjustment.variationKey);
          }
        }

        throw new Error('Some cart items were updated because stock changed. Please review your cart and try again.');
      }

      const normalizedPhone = normalizePhoneInput(form.phone);
      if (isValidPhone(normalizedPhone)) {
        window.sessionStorage.setItem(CHECKOUT_PHONE_KEY, normalizedPhone);
      }

      // 1. Create an unpaid order in the database first
      const tempReference = `unpaid_wf_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
      const orderResponse = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: form.fullName,
          phone: normalizedPhone,
          email: form.email,
          address: form.address,
          city: form.city,
          notes: form.notes,
          paymentMethod: CHECKOUT_PAYMENT_METHOD,
          subtotal,
          delivery,
          total,
          promoCode: appliedPromo?.code || null,
          paymentReference: tempReference,
          items,
          paymentCompleted: false, // Create as unpaid order first!
        }),
      });

      const orderPayload = (await orderResponse.json().catch(() => ({}))) as {
        id?: number;
        orderNumber?: string;
        error?: string;
        details?: string;
      };

      if (!orderResponse.ok || !orderPayload.id) {
        throw new Error(orderPayload.details || orderPayload.error || 'Failed to create unpaid order');
      }

      const orderId = orderPayload.id;
      const orderNumber = orderPayload.orderNumber;

      // 2. Initialize the Paystack payment with the created order context
      const paymentInitResponse = await fetch('/api/payments/paystack/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          total,
          email: form.email,
          fullName: form.fullName,
          phone: normalizedPhone,
          paymentMethod: CHECKOUT_PAYMENT_METHOD,
          orderId,
          orderNumber,
        }),
      });

      const paymentPayload = (await paymentInitResponse.json().catch(() => ({}))) as {
        authorizationUrl?: string;
        accessCode?: string;
        publicKey?: string;
        error?: string;
        details?: string;
        reference?: string;
        amount?: number;
        email?: string;
        channels?: string[];
        mock?: boolean;
      };

      if (!paymentInitResponse.ok) {
        throw new Error(paymentPayload.details || paymentPayload.error || 'Failed to initialize payment');
      }

      const finalizePaidOrder = async (reference: string) => {
        const finalizeResponse = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fullName: form.fullName,
            phone: normalizedPhone,
            email: form.email,
            address: form.address,
            city: form.city,
            notes: form.notes,
            paymentMethod: CHECKOUT_PAYMENT_METHOD,
            subtotal,
            delivery,
            total,
            promoCode: appliedPromo?.code || null,
            paymentReference: reference,
            items,
            paymentCompleted: true, // Mark order as paid!
          }),
        });

        const finalizePayload = (await finalizeResponse.json().catch(() => ({}))) as {
          id?: number;
          orderNumber?: string;
          error?: string;
          details?: string;
        };

        if (!finalizeResponse.ok) {
          throw new Error(finalizePayload.details || finalizePayload.error || 'Failed to finalize paid order');
        }

        setPlacedOrderNumber(finalizePayload.orderNumber || null);
        clearCart();
        if (isValidPhone(normalizedPhone)) {
          window.localStorage.setItem(USER_PHONE_KEY, normalizedPhone);
        }
        window.sessionStorage.removeItem(CHECKOUT_PHONE_KEY);
        setOrderPlaced(true);
      };

      if (paymentPayload.mock && paymentPayload.reference) {
        await finalizePaidOrder(paymentPayload.reference);
        return;
      }

      if (!window.PaystackPop || typeof window.PaystackPop.setup !== 'function') {
        throw new Error('Paystack checkout is not available right now. Please refresh and try again.');
      }

      const publicKey = paymentPayload.publicKey || '';
      if (!publicKey) {
        throw new Error('Paystack public key is missing. Please contact support.');
      }

      const paystackEmail = paymentPayload.email || form.email;
      const paystackAmount = Number(paymentPayload.amount) || Math.round(total * 100);

      await new Promise<void>((resolve, reject) => {
        let finished = false;

        const settle = (error?: Error) => {
          if (finished) return;
          finished = true;
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        };

        const verifyAndFinalizePayment = async (reference: string) => {
          await finalizePaidOrder(reference);
        };

        const handler = window.PaystackPop!.setup({
          key: publicKey,
          email: paystackEmail,
          amount: paystackAmount,
          currency: 'GHS',
          ref: paymentPayload.reference,
          access_code: paymentPayload.accessCode,
          channels: Array.isArray(paymentPayload.channels) ? paymentPayload.channels : undefined,
          metadata: {
            paymentMethod: CHECKOUT_PAYMENT_METHOD,
          },
          callback: (responseRef: { reference?: string }) => {
            const reference = responseRef.reference || paymentPayload.reference || '';
            if (!reference) {
              settle(new Error('Payment reference was not received.'));
              return;
            }

            void verifyAndFinalizePayment(reference)
              .then(() => settle())
              .catch((error) => {
                settle(error instanceof Error ? error : new Error('Payment verification failed. Please try again.'));
              });
          },
          onClose: () => {
            settle(new Error('Payment was cancelled.'));
          },
        });

        handler.openIframe();
      });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to place order');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Script src="https://js.paystack.co/v1/inline.js" strategy="afterInteractive" />
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-8 pt-24 md:px-6 md:py-12 md:pt-32">
        <div className="mb-10 flex flex-col items-center">
          <span className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-black md:text-sm">Secure Payment</span>
          <h1 className="text-3xl font-black tracking-tight text-gray-800 sm:text-4xl md:text-5xl">Checkout</h1>
          <div className="mt-6 mb-4 h-1.5 w-16 rounded-full bg-gradient-to-r from-black to-gray-900 shadow-sm" />
          <p className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide shadow-sm ${
            isAuthenticatedUser
              ? 'border border-gray-200 bg-gray-50 text-gray-700'
              : 'border border-black bg-white text-black'
          }`}>
            {isAuthenticatedUser ? 'Checkout' : 'Checkout as Guest'}
          </p>
        </div>

        {orderPlaced ? (
          <div className="max-w-xl mx-auto bg-white border border-gray-200 rounded-2xl p-8 text-center shadow-sm">
            <h2 className="text-2xl font-black text-gray-900 mb-3">Order placed successfully</h2>
            <p className="text-gray-600 mb-6">Thank you. We received your order and will contact you shortly.</p>
            {placedOrderNumber && (
              <p className="text-sm font-bold text-black mb-6">Order Number: {placedOrderNumber}</p>
            )}
            <Link href="/products" className="inline-block bg-black text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-800">
              Continue Shopping
            </Link>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-2xl text-gray-500 mb-6">Your cart is empty</p>
            <Link href="/products" className="inline-block bg-black text-white px-8 py-3 rounded-full font-bold hover:bg-gray-800">
              Browse Products
            </Link>
          </div>
        ) : (
          <form onSubmit={placeOrder} className="grid lg:grid-cols-3 gap-6 sm:gap-8">
            <div className="space-y-4 rounded-[2rem] bg-white p-5 lg:col-span-2 sm:p-6 shadow-sm ring-1 ring-gray-200">
              <h2 className="text-xl sm:text-2xl font-black text-gray-800 mb-2">Delivery Details</h2>

              <input
                type="text"
                value={form.fullName}
                onChange={(e) => onChange('fullName', e.target.value)}
                placeholder="Full name"
                className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-black"
                required
              />

              <div className="grid sm:grid-cols-2 gap-4">
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => onChange('phone', normalizePhoneInput(e.target.value))}
                  inputMode="numeric"
                  pattern="0[0-9]{9}"
                  maxLength={10}
                  placeholder="0XXXXXXXXX"
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-black"
                  required
                />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => onChange('email', e.target.value)}
                  placeholder="Email (required)"
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-black"
                  required
                />
              </div>

              <input
                type="text"
                value={form.address}
                onChange={(e) => onChange('address', e.target.value)}
                placeholder="Street address"
                className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-black"
                required
              />

              <input
                type="text"
                value={form.city}
                onChange={(e) => onChange('city', e.target.value)}
                placeholder="City"
                className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-black"
                required
              />

              <textarea
                value={form.notes}
                onChange={(e) => onChange('notes', e.target.value)}
                placeholder="Delivery notes (optional)"
                rows={4}
                className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-black"
              />

              {/* <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700">
                Payment Method: Paystack
              </div> */}

            </div>

            <div className="h-fit rounded-[2rem] bg-white p-5 sm:p-6 shadow-sm ring-1 ring-gray-200 lg:sticky lg:top-32">
              <h2 className="text-xl sm:text-2xl font-black text-gray-800 mb-4">Order Summary</h2>

              <div className="space-y-3 mb-4 max-h-64 overflow-y-auto pr-1">
                {items.map(item => (
                  <div key={`${item.id}:${item.variationKey || ''}`} className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{item.name}</p>
                      <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-bold text-gray-800 text-sm">GH₵{(parsePrice(item.price) * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>

              <div className="mb-6 rounded-xl border border-gray-200 bg-gray-50 p-3">
                <p className="font-bold text-gray-800 mb-2">Promo Code</p>
                <div className="flex flex-wrap gap-2">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    placeholder="Enter promo code"
                    className="min-w-0 flex-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-black bg-white"
                  />
                  <button
                    type="button"
                    onClick={applyPromo}
                    disabled={applyingPromo || !promoCode.trim()}
                    className="px-4 py-2.5 rounded-lg bg-gray-900 text-white text-sm font-semibold hover:bg-black disabled:opacity-60"
                  >
                    {applyingPromo ? 'Applying...' : 'Apply'}
                  </button>
                  {appliedPromo ? (
                    <button
                      type="button"
                      onClick={removePromo}
                      className="px-4 py-2.5 rounded-lg bg-gray-100 text-gray-700 text-sm font-semibold hover:bg-gray-200"
                    >
                      Remove
                    </button>
                  ) : null}
                </div>
                {promoMessage ? (
                  <p className={`mt-2 text-sm font-semibold ${appliedPromo ? 'text-black' : 'text-black'}`}>
                    {promoMessage}
                  </p>
                ) : null}

                {activePromos.length > 0 ? (
                  <div className="mt-3 border-t border-gray-200 pt-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">Available Promos</p>
                    <div className="space-y-1.5">
                      {activePromos.slice(0, 4).map((promo) => (
                        <button
                          key={promo.id}
                          type="button"
                          onClick={() => setPromoCode(promo.code)}
                          className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-left hover:border-black"
                        >
                          <p className="text-sm font-bold text-gray-800">{promo.code}</p>
                          <p className="text-xs text-gray-600">
                            {promo.type === 'percentage' ? `${promo.value}% off` : `GH₵${promo.value.toFixed(2)} off`} • Min GH₵{promo.minOrder.toFixed(2)}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="space-y-3 mb-6 border-t pt-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-bold">GH₵{subtotal.toFixed(2)}</span>
                </div>
                {discountAmount > 0 ? (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Discount {appliedPromo ? `(${appliedPromo.code})` : ''}</span>
                    <span className="font-bold text-black">-GH₵{discountAmount.toFixed(2)}</span>
                  </div>
                ) : null}
                <div className="border-t pt-3 flex justify-between">
                  <span className="font-black text-lg">Total</span>
                  <span className="font-black text-xl text-black">GH₵{total.toFixed(2)}</span>
                </div>
                <p className="text-xs text-gray-500">Payment is processed on order amount GH₵{total.toFixed(2)}.</p>
              </div>

              <button
                type="submit"
                disabled={!canPlaceOrder || submitting}
                className="w-full rounded-[2rem] bg-gradient-to-r from-black to-gray-900 py-4 text-center text-base sm:text-lg font-black text-white shadow-lg shadow-none transition-all duration-300 hover:scale-[1.02] hover:shadow-none disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {submitting ? 'Please Wait...' : 'Proceed to Payment'}
              </button>
              {submitError && <p className="mt-3 text-sm font-semibold text-black">{submitError}</p>}
            </div>
          </form>
        )}
      </main>

      <Footer />
    </div>
  );
}
