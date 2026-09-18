'use client';

import { useEffect, useMemo, useState } from 'react';

const CART_STORAGE_KEY_PREFIX = 'wig-factory-cart';
const USER_PHONE_KEY = 'wf-user-phone';
const CART_EVENT = 'cart-updated';

export type CartItem = {
  id: number;
  name: string;
  price: string;
  image: string;
  category?: string;
  variationKey?: string;
  variationLabel?: string;
  stock?: number | null;
  quantity: number;
};

type CartProductInput = Omit<CartItem, 'quantity'>;

function normalizeStock(stock: number | null | undefined): number | null {
  const parsed = typeof stock === 'number' ? stock : Number(String(stock ?? '').trim());

  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
}

function clampQuantity(quantity: number, stock: number | null | undefined) {
  const normalized = Math.max(1, quantity);
  const normalizedStock = normalizeStock(stock);

  if (normalizedStock === null) {
    return normalized;
  }

  if (normalizedStock <= 0) {
    return 0;
  }

  return Math.min(normalized, normalizedStock);
}

function isBrowser() {
  return typeof window !== 'undefined';
}

function getCartStorageKey() {
  if (!isBrowser()) return `${CART_STORAGE_KEY_PREFIX}:guest`;
  const phone = window.localStorage.getItem(USER_PHONE_KEY)?.trim();
  return phone ? `${CART_STORAGE_KEY_PREFIX}:${phone}` : `${CART_STORAGE_KEY_PREFIX}:guest`;
}

function readCart(): CartItem[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(getCartStorageKey());
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartItem[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(item => typeof item?.id === 'number' && typeof item?.quantity === 'number');
  } catch {
    return [];
  }
}

function writeCart(items: CartItem[]) {
  if (!isBrowser()) return;
  window.localStorage.setItem(getCartStorageKey(), JSON.stringify(items));
  window.dispatchEvent(new Event(CART_EVENT));
}

function getCartItemIdentity(item: Pick<CartItem, 'id' | 'variationKey'>) {
  return `${item.id}:${item.variationKey || ''}`;
}

export function addToCart(product: CartProductInput, quantity = 1) {
  const items = readCart();
  const incomingIdentity = getCartItemIdentity(product);
  const existingIndex = items.findIndex(item => getCartItemIdentity(item) === incomingIdentity);
  const existing = existingIndex >= 0 ? items[existingIndex] : undefined;
  const nextStock = product.stock ?? existing?.stock ?? null;
  const requestedQuantity = Math.max(1, quantity);

  if (existing) {
    const nextQuantity = clampQuantity(existing.quantity + requestedQuantity, nextStock);

    if (nextQuantity <= 0) {
      items.splice(existingIndex, 1);
    } else {
      existing.variationLabel = product.variationLabel ?? existing.variationLabel;
      existing.variationKey = product.variationKey ?? existing.variationKey;
      existing.stock = nextStock;
      existing.quantity = nextQuantity;
    }
  } else {
    const nextQuantity = clampQuantity(requestedQuantity, nextStock);
    if (nextQuantity <= 0) {
      writeCart(items);
      return;
    }

    items.push({ ...product, stock: nextStock, quantity: nextQuantity });
  }

  writeCart(items);
}

export function updateCartItemQuantity(id: number, quantity: number, variationKey?: string) {
  const targetIdentity = `${id}:${variationKey || ''}`;
  const items = readCart()
    .map(item => {
      if (getCartItemIdentity(item) !== targetIdentity) {
        return item;
      }

      const nextQuantity = clampQuantity(quantity, item.stock ?? null);
      if (nextQuantity <= 0) {
        return null;
      }

      return { ...item, quantity: nextQuantity };
    })
    .filter((item): item is CartItem => Boolean(item));

  writeCart(items);
}

export function removeCartItem(id: number, variationKey?: string) {
  const targetIdentity = `${id}:${variationKey || ''}`;
  const items = readCart().filter(item => getCartItemIdentity(item) !== targetIdentity);
  writeCart(items);
}

export function clearCart() {
  writeCart([]);
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const sync = () => setItems(readCart());
    const syncOnVisible = () => {
      if (document.visibilityState === 'visible') {
        sync();
      }
    };
    sync();

    window.addEventListener(CART_EVENT, sync);
    window.addEventListener('storage', sync);
    window.addEventListener('focus', sync);
    document.addEventListener('visibilitychange', syncOnVisible);

    return () => {
      window.removeEventListener(CART_EVENT, sync);
      window.removeEventListener('storage', sync);
      window.removeEventListener('focus', sync);
      document.removeEventListener('visibilitychange', syncOnVisible);
    };
  }, []);

  const totalItems = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);

  return {
    items,
    totalItems,
    addToCart,
    updateCartItemQuantity,
    removeCartItem,
    clearCart,
  };
}
