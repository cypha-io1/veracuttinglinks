'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-12 mb-20 md:mb-0">
        <h1 className="text-3xl md:text-5xl font-black text-gray-800 mb-4 md:mb-8 text-center">About Zhilakaii</h1>

        <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-200 space-y-6">
          <p className="text-lg text-gray-700 leading-relaxed">
            Inspired by the phrase Sparkling Heaven, Zhilakaii embodies celestial elegance and radiant beauty. Our jewelry pieces are crafted to sparkle like the stars, illuminating your unique style and personality.
          </p>

          <h2 className="text-3xl font-black text-gray-800 mt-8">Our Mission</h2>
          <p className="text-lg text-gray-700 leading-relaxed">
            To create timeless jewelry that celebrates individuality, confidence, and everyday brilliance.
          </p>

          <h2 className="text-3xl font-black text-gray-800 mt-8">What We Offer</h2>
          <ul className="list-disc list-inside space-y-2 text-lg text-gray-700">
            <li>Elegant everyday jewelry pieces</li>
            <li>Statement designs for special moments</li>
            <li>Quality craftsmanship with refined finishing</li>
            <li>Collections that blend modern style with timeless beauty</li>
            <li>Reliable delivery for a seamless shopping experience</li>
          </ul>

          <h2 className="text-3xl font-black text-gray-800 mt-8">Why Choose Us</h2>
          <p className="text-lg text-gray-700 leading-relaxed">
            We are dedicated to quality, detail, and customer satisfaction. Every piece is selected and finished with care so you can shine with confidence in every look.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
