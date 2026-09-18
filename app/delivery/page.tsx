'use client';

import { FiTruck, FiMapPin, FiClock } from 'react-icons/fi';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function DeliveryPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-12 mb-20 md:mb-0">
        <h1 className="text-3xl md:text-5xl font-black text-gray-800 mb-4 md:mb-8 text-center">Delivery Information</h1>

        <div className="space-y-6">
          <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-200">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center flex-shrink-0">
                <FiMapPin className="text-xl text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-gray-800 mb-3">Delivery Areas</h2>
                <p className="text-gray-700 leading-relaxed mb-2">We currently deliver to the following locations:</p>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li>Accra (Central and surrounding areas)</li>
                  <li>North Legon</li>
                  <li>Agbogba</li>
                  <li>Winneba</li>
                  <li>Cape Coast</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-200">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center flex-shrink-0">
                <FiClock className="text-xl text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-gray-800 mb-3">Delivery Times</h2>
                <p className="text-gray-700 leading-relaxed mb-3">Standard delivery time: 30-45 minutes</p>
                <p className="text-gray-700 leading-relaxed">Delivery hours vary by location:</p>
                <ul className="list-disc list-inside space-y-1 text-gray-700 mt-2">
                  <li>Accra, North Legon, Agbogba: 9AM - 11PM daily</li>
                  <li>Winneba, Cape Coast: 10AM - 10PM daily</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-200">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-xl font-black leading-none text-white">₵</span>
              </div>
              <div>
                <h2 className="text-2xl font-black text-gray-800 mb-3">Delivery Fees</h2>
                <ul className="space-y-2 text-gray-700">
                  <li><span className="font-bold">Free delivery</span> on all orders</li>
                  <li>Minimum order: GH₵30</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-200">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center flex-shrink-0">
                <FiTruck className="text-xl text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-gray-800 mb-3">How It Works</h2>
                <ol className="list-decimal list-inside space-y-2 text-gray-700">
                  <li>Browse our menu and add items to cart</li>
                  <li>Select your delivery location</li>
                  <li>Confirm your order and payment method</li>
                  <li>Track your order in real-time</li>
                  <li>Enjoy your hot, fresh meal!</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
