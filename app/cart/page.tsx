'use client';

import Image from 'next/image';
import Link from 'next/link';
import { FiTrash2, FiPlus, FiMinus } from 'react-icons/fi';
import { useCart } from '@/hooks/useCart';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function CartPage() {
  const { items: cartItems, updateCartItemQuantity, removeCartItem } = useCart();

  const parsePrice = (value: string) => {
    const numeric = Number(String(value).replace(/[^0-9.]/g, ''));
    return Number.isFinite(numeric) ? numeric : 0;
  };

  const removeItem = (id: number, variationKey?: string) => {
    removeCartItem(id, variationKey);
  };

  const getCartItemKey = (id: number, variationKey?: string) => `${id}:${variationKey || ''}`;

  const subtotal = cartItems.reduce((sum, item) => sum + parsePrice(item.price) * item.quantity, 0);
  const delivery = 0;
  const total = subtotal + delivery;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="mx-auto max-w-7xl px-4 py-8 pt-24 sm:px-6 sm:py-12 md:pt-32">
        <div className="mb-10 flex flex-col items-center">
          <span className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-black md:text-sm">Your Bag</span>
          <h1 className="text-3xl font-black tracking-tight text-gray-800 sm:text-4xl md:text-5xl">Shopping Cart</h1>
          <div className="mt-6 h-1.5 w-16 rounded-full bg-gradient-to-r from-black to-gray-900 shadow-sm" />
        </div>

        {cartItems.length > 0 ? (
          <div className="grid lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <div key={getCartItemKey(item.id, item.variationKey)} className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-[2rem] bg-white p-4 sm:p-5 shadow-sm ring-1 ring-gray-200 transition-all hover:shadow-md hover:ring-black">
                  <div className="relative w-full sm:w-24 h-40 sm:h-24 flex-shrink-0">
                    <Image src={item.image} alt={item.name} fill className="object-cover rounded-lg" />
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-black text-lg text-gray-800">{item.name}</h3>
                    {item.variationLabel ? <p className="text-xs font-semibold text-gray-500">{item.variationLabel}</p> : null}
                    <p className="text-black font-bold">{item.price}</p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-start gap-3">
                    <div className="flex items-center gap-3">
                      <button onClick={() => updateCartItemQuantity(item.id, Math.max(1, item.quantity - 1), item.variationKey)} className="w-9 h-9 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center">
                        <FiMinus className="text-gray-600" />
                      </button>
                      <span className="font-black text-lg w-8 text-center">{item.quantity}</span>
                      <button onClick={() => updateCartItemQuantity(item.id, item.quantity + 1, item.variationKey)} className="w-9 h-9 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center">
                        <FiPlus className="text-gray-600" />
                      </button>
                    </div>
                    <button onClick={() => removeItem(item.id, item.variationKey)} className="w-10 h-10 bg-white hover:bg-white rounded-full flex items-center justify-center sm:hidden">
                      <FiTrash2 className="text-black" />
                    </button>
                  </div>

                  <button onClick={() => removeItem(item.id, item.variationKey)} className="hidden sm:flex w-10 h-10 bg-white hover:bg-white rounded-full items-center justify-center">
                    <FiTrash2 className="text-black" />
                  </button>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="h-fit rounded-[2rem] bg-white p-5 sm:p-6 shadow-sm ring-1 ring-gray-200 lg:sticky lg:top-32">
              <h2 className="mb-5 text-xl font-black text-gray-800 sm:mb-6 sm:text-2xl">Order Summary</h2>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-bold">GH₵{subtotal.toFixed(2)}</span>
                </div>
                <div className="border-t pt-3 flex justify-between">
                  <span className="font-black text-lg">Total</span>
                  <span className="font-black text-xl text-black">GH₵{total.toFixed(2)}</span>
                </div>
              </div>

              <Link
                href="/checkout"
                className="block w-full rounded-[2rem] bg-gradient-to-r from-black to-gray-900 py-3.5 sm:py-4 text-center text-base sm:text-lg font-black text-white shadow-lg shadow-none transition-all duration-300 hover:scale-[1.02] hover:shadow-none"
              >
                Proceed to Checkout
              </Link>
            </div>
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-2xl text-gray-500 mb-6">Your cart is empty</p>
            <Link href="/products" className="inline-block bg-black text-white px-8 py-3 rounded-full font-bold hover:bg-gray-800">
              Start Shopping
            </Link>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
