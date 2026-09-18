'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

type SliderProduct = {
  image?: string;
  imageUrls?: string[] | null;
};

const FALLBACK_SLIDES = [
  '/logo.png',
];

export default function AdSection() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slides, setSlides] = useState<string[]>(FALLBACK_SLIDES);

  useEffect(() => {
    let isMounted = true;
    let eventSource: EventSource | null = null;

    const loadSlides = async () => {
      try {
        const response = await fetch('/api/products?limit=30');
        if (!response.ok) {
          return;
        }

        const products = (await response.json()) as SliderProduct[];
        const cloudinaryUrls: string[] = [];

        for (const product of products) {
          const urls: string[] = [];

          if (Array.isArray(product.imageUrls)) {
            urls.push(...product.imageUrls);
          }

          if (product.image) {
            urls.push(product.image);
          }

          for (const rawUrl of urls) {
            const url = rawUrl?.trim();
            if (!url) continue;

            if (url.includes('res.cloudinary.com')) {
              if (!cloudinaryUrls.includes(url)) {
                cloudinaryUrls.push(url);
              }
            }
          }
        }

        const nextSlides = cloudinaryUrls.slice(0, 6);
        if (isMounted && nextSlides.length > 0) {
          setSlides(nextSlides);
          setCurrentSlide(0);
        }
      } catch {
        // Keep fallback slide if API fetch fails.
      }
    };

    void loadSlides();

    eventSource = new EventSource('/api/realtime/stream?channels=products');
    eventSource.addEventListener('message', () => {
      if (document.visibilityState !== 'visible') {
        return;
      }

      void loadSlides();
    });

    const refreshTimer = setInterval(() => {
      if (document.visibilityState !== 'visible') {
        return;
      }

      void loadSlides();
    }, 45_000);

    return () => {
      isMounted = false;
      clearInterval(refreshTimer);
      if (eventSource) {
        eventSource.close();
      }
    };
  }, []);

  useEffect(() => {
    if (slides.length <= 1) {
      return;
    }

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 3000);

    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <section className="mx-auto max-w-7xl px-4 pt-24 pb-8 md:px-8 md:pt-32 md:pb-10">
      <div className="group relative overflow-hidden rounded-[2rem] shadow-[0_20px_50px_-15px_rgba(249,115,22,0.2)] ring-1 ring-gray-100 h-[250px] md:h-[500px]">
        {slides.map((slide, index) => (
          <div
            key={`${slide}-${index}`}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          >
            <div className="relative h-full w-full">
              <Image
                src={slide}
                alt={`Slide ${index + 1}`}
                fill
                className={`object-cover transition-transform duration-[10s] ease-linear ${
                  index === currentSlide ? 'scale-[1.15]' : 'scale-100'
                }`}
                priority={index === 0}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 via-gray-900/20 to-transparent"></div>
            </div>
          </div>
        ))}

        {/* Navigation Dots */}
        <div className="absolute bottom-6 left-0 right-0 z-20 flex justify-center gap-2.5">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? 'w-8 bg-white shadow-[0_0_10px_rgba(249,115,22,0.8)]'
                  : 'w-2 bg-white/60 hover:bg-white'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
