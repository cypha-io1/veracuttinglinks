'use client';

import { useState } from 'react';
import { FiShoppingCart } from 'react-icons/fi';
import { addToCart } from '@/hooks/useCart';

type AddToCartButtonProps = {
  product: {
    id: number;
    name: string;
    price: string;
    image: string;
    category?: string;
    variationKey?: string;
    variationLabel?: string;
    stock?: number | null;
  };
  className?: string;
  disabled?: boolean;
};

export default function AddToCartButton({ product, className, disabled = false }: AddToCartButtonProps) {
  const [added, setAdded] = useState(false);

  const onAdd = () => {
    if (disabled) return;
    addToCart(product, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  return (
    <button
      onClick={onAdd}
      disabled={disabled}
      className={className ?? 'inline-flex items-center justify-center gap-3 rounded-xl bg-black px-6 py-4 text-white font-bold hover:bg-gray-800 transition-colors'}
      type="button"
    >
      <FiShoppingCart className="text-lg" />
      {added ? 'Added' : 'Add to cart'}
    </button>
  );
}
