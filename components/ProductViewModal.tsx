'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { FiShoppingCart } from 'react-icons/fi';
import { addToCart } from '@/hooks/useCart';

export interface ProductViewItem {
  id: number | string;
  name: string;
  price: string;
  regularPrice?: string | null;
  salePrice?: string | null;
  image?: string;
  category?: string;
  description?: string;
}

interface ProductViewModalProps {
  product: ProductViewItem | null;
  onClose: () => void;
}

export default function ProductViewModal({ product, onClose }: ProductViewModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [discountRate, setDiscountRate] = useState(0);
  const [promoError, setPromoError] = useState('');
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [touchDelta, setTouchDelta] = useState(0);

  const isOpen = Boolean(product);

  const formatCedi = (value: string) => {
    const normalized = value.trim();
    if (!normalized) return 'GH₵0';
    if (normalized.includes('₵') || normalized.toUpperCase().startsWith('GH')) return normalized;
    return `GH₵${normalized}`;
  };

  const parsePrice = (price: string) => Number(price.replace(/[^0-9.]/g, ''));
  const normalizedRegularPrice = product?.regularPrice?.trim() || '';
  const normalizedSalePrice = product?.salePrice?.trim() || '';
  const hasSale = normalizedSalePrice.length > 0;
  const effectivePriceLabel = formatCedi(hasSale ? normalizedSalePrice : normalizedRegularPrice || product?.price || '0');
  const showStruckRegular = hasSale && normalizedRegularPrice.length > 0 && normalizedRegularPrice !== normalizedSalePrice;
  const regularPriceLabel = formatCedi(normalizedRegularPrice);

  const baseTotal = product ? parsePrice(effectivePriceLabel) * quantity : 0;
  const discountAmount = baseTotal * discountRate;
  const total = baseTotal - discountAmount;

  useEffect(() => {
    const root = document.documentElement;
    const scrollY = window.scrollY;

    if (isOpen) {
      root.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
    } else {
      const previousTop = document.body.style.top;
      root.style.overflow = '';
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      if (previousTop) {
        window.scrollTo(0, Math.abs(Number.parseInt(previousTop, 10)) || 0);
      }
    }

    return () => {
      root.style.overflow = '';
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const availablePromos: Record<string, number> = {
    PIZZA10: 0.1,
    SAVE20: 0.2,
    WELCOME5: 0.05,
  };

  const handleApplyPromo = () => {
    const normalized = promoCode.trim().toUpperCase();
    const rate = availablePromos[normalized];
    if (rate) {
      setAppliedPromo(normalized);
      setDiscountRate(rate);
      setPromoError('');
    } else {
      setAppliedPromo(null);
      setDiscountRate(0);
      setPromoError(normalized ? 'Promo code not recognized.' : 'Enter a promo code to apply.');
    }
  };

  const handleAddToCart = () => {
    if (!product) return;
    const image = product.image && (product.image.startsWith('http') || product.image.startsWith('data:'))
      ? product.image
      : '/logo.png';

    addToCart(
      {
        id: Number(product.id),
        name: product.name,
        price: effectivePriceLabel,
        image,
        category: product.category,
      },
      quantity
    );
    onClose();
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    setTouchStartY(event.touches[0]?.clientY ?? null);
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartY === null) {
      return;
    }
    const currentY = event.touches[0]?.clientY ?? touchStartY;
    const delta = Math.max(0, currentY - touchStartY);
    setTouchDelta(delta);
  };

  const handleTouchEnd = () => {
    if (touchDelta > 120) {
      onClose();
    }
    setTouchStartY(null);
    setTouchDelta(0);
  };

  const isImageUrl = product?.image?.startsWith('http') || product?.image?.startsWith('data:');

  return (
    <div
      className={`fixed inset-0 z-50 ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
      aria-hidden={!isOpen}
    >
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />
      <div className="absolute inset-x-0 bottom-0 flex justify-center">
        <div
          key={product ? String(product.id) : 'closed'}
          className={`w-full max-w-2xl bg-white rounded-t-3xl shadow-2xl ${
            touchStartY === null ? 'transition-transform duration-300' : ''
          }`}
          style={{
            transform: isOpen ? `translateY(${touchDelta}px)` : 'translateY(100%)',
          }}
          onClick={(e) => e.stopPropagation()}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="p-6 pb-8 max-h-[85vh] overflow-y-auto">
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-gray-200" />
            <div className="flex items-start justify-between mb-4">
              <div>
                {product?.category && (
                  <p className="text-xs font-semibold text-gray-500">{product.category}</p>
                )}
                <h3 className="text-2xl font-black text-gray-900">{product?.name}</h3>
                {product?.description && (
                  <p className="text-sm text-gray-600 mt-1">{product.description}</p>
                )}
              </div>
              <button
                className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold"
                onClick={onClose}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="relative w-full h-56 rounded-2xl overflow-hidden bg-gray-100 mb-5 flex items-center justify-center">
              {product?.image && isImageUrl && (
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
              )}
              {product?.image && !isImageUrl && (
                <span className="text-7xl" aria-hidden>
                  {product.image}
                </span>
              )}
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-xs text-gray-500 font-semibold">Price</p>
                <div className="text-lg font-black text-black">{effectivePriceLabel}</div>
                {showStruckRegular && <div className="text-xs font-semibold text-gray-400 line-through">{regularPriceLabel}</div>}
              </div>
              <div className="flex items-center gap-3">
                <button
                  className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 text-lg font-bold"
                  onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                  aria-label="Decrease quantity"
                >
                  -
                </button>
                <span className="min-w-[2rem] text-center font-bold text-gray-900">{quantity}</span>
                <button
                  className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 text-lg font-bold"
                  onClick={() => setQuantity(prev => prev + 1)}
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
              <button
                className="w-12 h-12 bg-black hover:bg-gray-800 text-white rounded-full flex items-center justify-center transition-colors"
                aria-label="Add to cart"
                onClick={handleAddToCart}
                type="button"
              >
                <FiShoppingCart className="text-lg" />
              </button>
            </div>

            <div className="mt-6 p-4 rounded-2xl bg-gray-50 border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-bold text-gray-900">Promo Code</p>
                {appliedPromo && (
                  <span className="text-xs font-semibold text-black bg-white px-2 py-1 rounded-full">
                    {appliedPromo} applied
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => {
                    setPromoCode(e.target.value);
                    if (promoError) {
                      setPromoError('');
                    }
                  }}
                  placeholder="Enter code (e.g. PIZZA10)"
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-700 focus:outline-none focus:border-black"
                />
                <button
                  onClick={handleApplyPromo}
                  className="px-4 py-2 rounded-lg bg-black text-white text-sm font-semibold hover:bg-gray-800 transition-colors"
                >
                  Apply
                </button>
              </div>
              {promoError && (
                <p className="mt-2 text-xs font-semibold text-black">{promoError}</p>
              )}
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="text-gray-600">Discount</span>
                <span className="font-bold text-gray-900">-GH₵{discountAmount.toFixed(2)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-gray-600">Total</span>
                <span className="font-black text-black">GH₵{total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
