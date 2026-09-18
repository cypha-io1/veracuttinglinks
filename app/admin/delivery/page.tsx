'use client';

import React, { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { FiPlus, FiEdit2, FiTrash2, FiMapPin } from 'react-icons/fi';

interface Driver {
  id: number;
  name: string;
  phone: string;
  status: 'online' | 'offline' | 'busy';
  completed: number;
  rating: number;
}

interface Zone {
  id: number;
  name: string;
  radius: string;
  fee: number;
}

export default function DeliveryPage() {
  const [activeTab, setActiveTab] = useState('drivers');
  const [drivers] = useState<Driver[]>([
    { id: 1, name: 'Kwame Asante', phone: '+233-24-1234567', status: 'online', completed: 145, rating: 4.8 },
    { id: 2, name: 'Ama Osei', phone: '+233-55-2345678', status: 'offline', completed: 89, rating: 4.6 },
    { id: 3, name: 'Kofi Mensah', phone: '+233-50-3456789', status: 'busy', completed: 203, rating: 4.9 },
  ]);

  const [zones] = useState<Zone[]>([
    { id: 1, name: 'Central Accra', radius: '5 km', fee: 5.00 },
    { id: 2, name: 'Greater Accra', radius: '7 km', fee: 8.00 },
    { id: 3, name: 'Outer Districts', radius: '10 km', fee: 12.00 },
  ]);

  const statusColors = {
    online: 'bg-white text-black border-black',
    offline: 'bg-gray-100/80 text-gray-800 border-gray-300',
    busy: 'bg-white text-black border-black',
  };

  return (
    <AdminLayout>
      <div className="space-y-5 pb-8">
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Delivery Management</h1>

        <div className="flex gap-0 overflow-x-auto border-b border-gray-200 rounded-t-lg bg-white">
          {[
            { id: 'drivers', label: 'Drivers' },
            { id: 'zones', label: 'Delivery Zones' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition sm:px-6 ${
                activeTab === tab.id 
                  ? 'border-black text-black bg-white' 
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'drivers' && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            {drivers.map(driver => (
              <div 
                key={driver.id} 
                className="relative cursor-pointer overflow-hidden rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md sm:p-5 lg:p-6"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-gray-900 sm:text-lg">{driver.name}</h3>
                    <p className="mt-1 text-sm text-gray-600">{driver.phone}</p>
                  </div>
                  <span className={`rounded-lg border px-2.5 py-1 text-[11px] font-bold sm:px-3 sm:py-1.5 sm:text-xs ${statusColors[driver.status]}`}>
                    {driver.status}
                  </span>
                </div>
                <div className="space-y-3 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between text-sm">
                    <p className="text-gray-600">Completed Orders</p>
                    <p className="font-bold text-gray-900">{driver.completed}</p>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <p className="text-gray-600">Rating</p>
                    <p className="font-bold text-black">⭐ {driver.rating}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'zones' && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            {zones.map(zone => (
              <div 
                key={zone.id} 
                className="relative cursor-pointer overflow-hidden rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md sm:p-5 lg:p-6"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="flex items-center gap-2 text-base font-bold text-gray-900 sm:text-lg">
                      <FiMapPin className="text-black" size={20} />
                      {zone.name}
                    </h3>
                  </div>
                  <div className="flex gap-2">
                    <button className="rounded-lg bg-white p-2 text-black transition-colors hover:bg-white"><FiEdit2 size={16} /></button>
                    <button className="rounded-lg bg-white p-2 text-black transition-colors hover:bg-white"><FiTrash2 size={16} /></button>
                  </div>
                </div>
                <div className="space-y-3 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between text-sm">
                    <p className="text-gray-600">Delivery Radius</p>
                    <p className="font-bold text-gray-900">{zone.radius}</p>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <p className="text-gray-600">Delivery Fee</p>
                    <p className="font-bold text-black">₵{zone.fee.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
