'use client';

import { useState } from 'react';
import { useProducts } from '@/hooks/useProducts';
import ProductCard from '@/components/ProductCard';
import ProductGridSkeleton from '@/components/ProductGridSkeleton';

const CATEGORIES = ['All', 'Women', 'Girls', 'Men', 'Boys'];

export default function ProductsShowcase() {
  const [activeCategory, setActiveCategory] = useState('All');
  const { products, loading, error } = useProducts(
    activeCategory === 'All' ? {} : { category: activeCategory }
  );

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 pt-24 md:px-8 md:py-24 md:pt-32">
      <div className="mb-10 flex flex-col items-center md:mb-12">
        <span className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-gray-500 md:text-sm">Vera Cutting Links</span>
        <h2 className="text-3xl font-black tracking-tight text-gray-800 md:text-5xl lg:text-6xl">Collections</h2>
        <div className="mt-8 h-1.5 w-20 rounded-full bg-gradient-to-r from-gray-200 to-gray-400 shadow-sm" />
      </div>
      
      {/* Category Tabs */}
      <div className="mb-10 flex flex-wrap justify-center gap-2 md:gap-4">
        {CATEGORIES.map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`rounded-full px-6 py-2.5 text-sm font-semibold transition-all duration-300 md:text-base ${
              activeCategory === category
                ? 'bg-gray-900 text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-900 shadow-sm border border-gray-200'
            }`}
          >
            {category}
          </button>
        ))}
      </div>
      
      {loading ? (
        <ProductGridSkeleton count={12} gridClassName="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 xl:grid-cols-4 lg:gap-8" />
      ) : error ? (
        <div className="flex justify-center items-center py-12">
          <p className="text-black text-lg">Failed to load collections: {error}</p>
        </div>
      ) : products.length === 0 ? (
        <div className="flex justify-center items-center py-20">
          <p className="text-gray-500 text-lg">No products available in this category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 xl:grid-cols-4 lg:gap-8">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
}
