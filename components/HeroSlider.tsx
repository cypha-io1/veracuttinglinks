'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useProducts } from '@/hooks/useProducts';

export default function HeroSlider() {
  const { products, loading } = useProducts({ limit: 5 });
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!products || products.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % products.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [products]);

  if (loading || !products || products.length === 0) {
    return (
      <div className="relative w-full h-[60vh] md:h-[80vh] bg-gray-100 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-8 w-48 bg-gray-300 rounded mb-4" />
          <div className="h-4 w-64 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[60vh] md:h-[80vh] overflow-hidden bg-gray-900 pt-16 md:pt-20">
      {products.map((product, index) => (
        <div
          key={product.id}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
          }`}
        >
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover object-top"
            priority={index === 0}
          />
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 text-white pt-16 md:pt-20">
            <h2 className="text-4xl md:text-6xl font-black mb-4 tracking-tight drop-shadow-md">
              {product.name}
            </h2>
            <p className="text-lg md:text-2xl font-light tracking-wide max-w-2xl drop-shadow-sm">
              {product.description || 'Discover our elegant new collection'}
            </p>
          </div>
        </div>
      ))}
      <div className="absolute bottom-8 left-0 right-0 z-20 flex justify-center gap-3">
        {products.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-3 h-3 rounded-full transition-all ${
              index === currentIndex ? 'bg-white scale-125' : 'bg-white/50 hover:bg-white/80'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
