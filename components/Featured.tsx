'use client';

import { useProducts } from '@/hooks/useProducts';
import ProductCard from '@/components/ProductCard';
import ProductGridSkeleton from '@/components/ProductGridSkeleton';

export default function Featured() {
  const { products, loading, error } = useProducts();

  const displayProducts = products.slice(6, 12);

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-16">
      <div className="mb-10 flex flex-col items-center md:mb-14">
        <span className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-black md:text-sm">Hand Picked</span>
        <h2 className="text-3xl font-black tracking-tight text-gray-800 md:text-4xl lg:text-5xl">Featured Products</h2>
        <div className="mt-6 h-1.5 w-16 rounded-full bg-gradient-to-r from-white to-white shadow-sm" />
      </div>
      
      {loading ? (
        <ProductGridSkeleton count={6} />
      ) : error ? (
        <div className="flex justify-center items-center py-12">
          <p className="text-black">Error: {error}</p>
        </div>
      ) : displayProducts.length === 0 ? (
        <div className="flex justify-center items-center py-12">
          <p className="text-gray-600">No products available</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:gap-8">
          {displayProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
}
