'use client';

import { useState, useEffect } from 'react';
import { HiArrowUp } from 'react-icons/hi2';

export default function BackToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      // Show button when page is scrolled down 400px
      if (window.scrollY > 400) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <button
      onClick={scrollToTop}
      aria-label="Back to top"
      className={`fixed right-4 bottom-[100px] md:right-8 md:bottom-8 z-[100] flex h-12 w-12 items-center justify-center rounded-full bg-gray-900 text-white shadow-lg shadow-gray-900/30 ring-1 ring-white/10 backdrop-blur-md transition-all duration-300 hover:bg-gray-800 hover:-translate-y-1 hover:shadow-xl hover:shadow-gray-900/40 ${
        isVisible ? 'scale-100 opacity-100 translate-y-0' : 'scale-0 opacity-0 translate-y-8 pointer-events-none'
      }`}
    >
      <HiArrowUp className="text-xl stroke-[2px]" />
    </button>
  );
}
