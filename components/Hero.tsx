'use client';

import Link from 'next/link';
import { FiArrowRight } from 'react-icons/fi';

export default function Hero() {
  return (
    <section className="relative bg-black text-white py-20 px-6 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-black via-black to-gray-900" />
      <div className="gray-blur-spot top-[-70px] left-[-40px] h-64 w-64" />
      <div className="gray-blur-spot bottom-[-100px] right-[-60px] h-80 w-80" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center space-y-6">
          <h1 className="text-5xl md:text-7xl font-black tracking-tight">
            Welcome to <span className="text-white">Zhilakaii</span>
          </h1>
          <p className="text-xl md:text-2xl font-semibold max-w-3xl mx-auto">
            Celestial Elegance, Radiant Beauty
          </p>
          <p className="text-lg md:text-xl max-w-2xl mx-auto opacity-90">
            Jewelry crafted to sparkle like the stars and illuminate your unique style
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
            <Link 
              href="/products" 
              className="bg-white text-black px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-200 transition-all shadow-lg flex items-center justify-center gap-2"
            >
              Shop Collection
              <FiArrowRight className="text-xl" />
            </Link>
            <Link 
              href="/products" 
              className="glass-gray text-black px-8 py-4 rounded-full font-bold text-lg hover:bg-white transition-all shadow-lg"
            >
              View Menu
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
