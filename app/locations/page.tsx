'use client';

import { FiMapPin, FiPhone, FiClock } from 'react-icons/fi';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function LocationsPage() {
  const locations = [
    {
      name: 'Accra Branch',
      address: 'Central Accra, Ghana',
      phone: '+233 XX XXX XXXX',
      hours: 'Mon-Sun: 9AM - 11PM'
    },
    {
      name: 'North Legon Branch',
      address: 'North Legon, Accra',
      phone: '+233 XX XXX XXXX',
      hours: 'Mon-Sun: 9AM - 11PM'
    },
    {
      name: 'Agbogba Branch',
      address: 'Agbogba, Accra',
      phone: '+233 XX XXX XXXX',
      hours: 'Mon-Sun: 9AM - 11PM'
    },
    {
      name: 'Winneba Branch',
      address: 'Winneba Town, Ghana',
      phone: '+233 XX XXX XXXX',
      hours: 'Mon-Sun: 10AM - 10PM'
    },
    {
      name: 'Cape Coast Branch',
      address: 'Cape Coast, Ghana',
      phone: '+233 XX XXX XXXX',
      hours: 'Mon-Sun: 10AM - 10PM'
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-12 mb-20 md:mb-0">
        <h1 className="text-3xl md:text-5xl font-black text-gray-800 mb-4 md:mb-8 text-center">Our Locations</h1>
        <p className="text-base md:text-xl text-gray-600 text-center mb-6 md:mb-12">Visit us or order for delivery from your nearest branch</p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {locations.map((location) => (
            <div key={location.name} className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-200">
              <h2 className="text-2xl font-black text-gray-800 mb-4">{location.name}</h2>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <FiMapPin className="text-xl text-black mt-1 flex-shrink-0" />
                  <p className="text-gray-700">{location.address}</p>
                </div>
                
                <div className="flex items-start gap-3">
                  <FiPhone className="text-xl text-black mt-1 flex-shrink-0" />
                  <p className="text-gray-700">{location.phone}</p>
                </div>
                
                <div className="flex items-start gap-3">
                  <FiClock className="text-xl text-black mt-1 flex-shrink-0" />
                  <p className="text-gray-700">{location.hours}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
