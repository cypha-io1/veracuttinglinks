'use client';

import React, { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { FiPlus, FiEdit2, FiTrash2, FiMapPin, FiClock } from 'react-icons/fi';

interface Branch {
  id: number;
  name: string;
  address: string;
  phone: string;
  openHours: string;
  radius: string;
  active: boolean;
}

export default function BranchesPage() {
  const [branches] = useState<Branch[]>([
    { id: 1, name: 'Accra Store', address: '123 Oxford Street, Osu, Accra', phone: '+233-2-1234567', openHours: '10 AM - 11 PM', radius: '5 km', active: true },
    { id: 2, name: 'Kumasi Store', address: '456 Ashanti Road, Kumasi', phone: '+233-3-2345678', openHours: '11 AM - 10 PM', radius: '7 km', active: true },
    { id: 3, name: 'Tema Store', address: '789 Harbor Way, Tema', phone: '+233-3-3456789', openHours: '9 AM - Midnight', radius: '10 km', active: false },
  ]);

  return (
    <AdminLayout>
      <div className="space-y-5 pb-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Branches & Store Settings</h1>
          <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-black px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-gray-800 hover:shadow-md sm:px-6 sm:py-3">
            <FiPlus size={20} /> Add Branch
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {branches.map(branch => (
            <div 
              key={branch.id} 
              className="group cursor-pointer rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md sm:p-5 lg:p-6"
            >
              <div>
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-gray-900 sm:text-lg">{branch.name}</h3>
                    <span className={`mt-2 inline-block rounded-lg border px-2.5 py-1 text-[11px] font-bold sm:px-3 sm:py-1.5 sm:text-xs ${
                      branch.active 
                        ? 'bg-white text-black border-black' 
                        : 'bg-gray-100/80 text-gray-800 border-gray-300'
                    }`}>
                      {branch.active ? '✓ Active' : '✗ Inactive'}
                    </span>
                  </div>
                  <div className="flex gap-2 opacity-100 transition-opacity duration-200 sm:opacity-0 sm:group-hover:opacity-100">
                    <button className="rounded-lg bg-white p-2 text-black transition-all hover:bg-white hover:scale-110"><FiEdit2 size={16} /></button>
                    <button className="rounded-lg bg-white p-2 text-black transition-all hover:bg-white hover:scale-110"><FiTrash2 size={16} /></button>
                  </div>
                </div>
                <div className="space-y-3 border-t border-gray-200/50 pt-4">
                  <div className="flex items-start gap-3">
                    <FiMapPin className="text-black text-lg mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-[11px] font-semibold uppercase text-gray-600">Address</p>
                      <p className="mt-1 text-sm font-medium text-gray-900 sm:text-base">{branch.address}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <FiClock className="text-black text-lg mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-[11px] font-semibold uppercase text-gray-600">Hours</p>
                      <p className="mt-1 text-sm font-medium text-gray-900 sm:text-base">{branch.openHours}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 text-base">📱</span>
                    <div className="flex-1">
                      <p className="text-[11px] font-semibold uppercase text-gray-600">Phone</p>
                      <p className="mt-1 text-sm font-medium text-gray-900 sm:text-base">{branch.phone}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
