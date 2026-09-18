'use client';

import React, { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { FiPlus, FiEdit2, FiTrash2, FiAlertTriangle } from 'react-icons/fi';

interface InventoryItem {
  id: number;
  name: string;
  quantity: number;
  unit: string;
  minLevel: number;
  supplier: string;
  lastRestocked: string;
  status: 'optimal' | 'low' | 'critical';
}

export default function InventoryPage() {
  const [inventory] = useState<InventoryItem[]>([
    { id: 1, name: 'All-purpose Flour', quantity: 150, unit: 'kg', minLevel: 50, supplier: 'Best Foods Inc', lastRestocked: '2024-01-14', status: 'optimal' },
    { id: 2, name: 'Mozzarella Cheese', quantity: 25, unit: 'kg', minLevel: 20, supplier: 'Dairy Ltd', lastRestocked: '2024-01-15', status: 'low' },
    { id: 3, name: 'Pepperoni', quantity: 5, unit: 'kg', minLevel: 10, supplier: 'Meat Supplies', lastRestocked: '2024-01-10', status: 'critical' },
    { id: 4, name: 'Pizza Boxes', quantity: 200, unit: 'units', minLevel: 100, supplier: 'Packaging Co', lastRestocked: '2024-01-12', status: 'optimal' },
  ]);

  const statusColors = {
    optimal: 'bg-white text-black',
    low: 'bg-white text-black',
    critical: 'bg-white text-black',
  };

  return (
    <AdminLayout>
      <div className="space-y-5 p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold sm:text-3xl">Inventory Management</h1>
          <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-black px-4 py-2 text-sm text-white hover:bg-gray-800">
            <FiPlus /> Add Item
          </button>
        </div>

        <div className="flex items-start gap-3 rounded-lg border border-black bg-white p-4">
          <FiAlertTriangle className="text-black text-xl mt-1" />
          <div>
            <p className="font-semibold text-black text-sm sm:text-base">Low Stock Alert</p>
            <p className="text-sm text-black">2 items at critical stock levels</p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="w-full min-w-[860px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-900 sm:px-6 sm:text-sm">Item</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-900 sm:px-6 sm:text-sm">Quantity</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-900 sm:px-6 sm:text-sm">Min Level</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-900 sm:px-6 sm:text-sm">Supplier</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-900 sm:px-6 sm:text-sm">Last Restocked</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-900 sm:px-6 sm:text-sm">Status</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-900 sm:px-6 sm:text-sm">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {inventory.map(item => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 font-semibold text-gray-900 sm:px-6">{item.name}</td>
                  <td className="px-4 py-4 text-xs text-gray-600 sm:px-6 sm:text-sm">{item.quantity} {item.unit}</td>
                  <td className="px-4 py-4 text-xs text-gray-600 sm:px-6 sm:text-sm">{item.minLevel} {item.unit}</td>
                  <td className="px-4 py-4 text-xs text-gray-600 sm:px-6 sm:text-sm">{item.supplier}</td>
                  <td className="px-4 py-4 text-xs text-gray-600 sm:px-6 sm:text-sm">{item.lastRestocked}</td>
                  <td className="px-4 py-4 text-xs sm:px-6 sm:text-sm">
                    <span className={`rounded-full px-3 py-1 text-[10px] font-semibold sm:text-xs ${statusColors[item.status]}`}>
                      {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-xs flex gap-2 sm:px-6 sm:text-sm">
                    <button className="text-black hover:text-black"><FiEdit2 /></button>
                    <button className="text-black hover:text-black"><FiTrash2 /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
