'use client';

import React, { useState } from 'react';
import { FiPackage, FiAlertTriangle, FiTrendingDown, FiCheckCircle, FiClock } from 'react-icons/fi';

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  minStock: number;
  reorderLevel: number;
  unit: string;
  costPerUnit: number;
  status: 'sufficient' | 'low' | 'critical';
}

interface WastageLog {
  id: string;
  item: string;
  quantity: number;
  reason: string;
  date: Date;
  approvedBy?: string;
}

interface StockAdjustment {
  id: string;
  item: string;
  type: 'in' | 'out';
  quantity: number;
  reason: string;
  status: 'pending' | 'approved';
  requestedBy: string;
  date: Date;
}

export default function Inventory() {
  const [inventory] = useState<InventoryItem[]>([
    { id: '1', name: 'Flour (Kg)', category: 'Dry Goods', currentStock: 45, minStock: 50, reorderLevel: 75, unit: 'kg', costPerUnit: 15, status: 'low' },
    { id: '2', name: 'Tomato Sauce (L)', category: 'Sauces', currentStock: 8, minStock: 10, reorderLevel: 20, unit: 'L', costPerUnit: 25, status: 'critical' },
    { id: '3', name: 'Mozzarella (Kg)', category: 'Dairy', currentStock: 12, minStock: 15, reorderLevel: 25, unit: 'kg', costPerUnit: 120, status: 'low' },
    { id: '4', name: 'Pepperoni (Kg)', category: 'Meat', currentStock: 5, minStock: 8, reorderLevel: 15, unit: 'kg', costPerUnit: 200, status: 'critical' },
    { id: '5', name: 'Olive Oil (L)', category: 'Oils', currentStock: 35, minStock: 20, reorderLevel: 40, unit: 'L', costPerUnit: 50, status: 'sufficient' },
    { id: '6', name: 'Vegetables Mix (Kg)', category: 'Fresh', currentStock: 28, minStock: 30, reorderLevel: 50, unit: 'kg', costPerUnit: 8, status: 'low' },
  ]);

  const [wastageLogs] = useState<WastageLog[]>([
    { id: '1', item: 'Lettuce (expired)', quantity: 2, reason: 'Expired', date: new Date(Date.now() - 86400000), approvedBy: 'John Mensah' },
    { id: '2', item: 'Tomato base', quantity: 1, reason: 'Contaminated', date: new Date(Date.now() - 172800000), approvedBy: 'Amma Osei' },
    { id: '3', item: 'Flour spillage', quantity: 5, reason: 'Damaged packaging', date: new Date(Date.now() - 259200000), approvedBy: 'Nana Owusu' },
  ]);

  const [adjustments] = useState<StockAdjustment[]>([
    { id: '1', item: 'Flour (Kg)', type: 'in', quantity: 50, reason: 'Supplier delivery', status: 'approved', requestedBy: 'Kwesi', date: new Date(Date.now() - 3600000) },
    { id: '2', item: 'Mozzarella (Kg)', type: 'out', quantity: 5, reason: 'Inventory correction', status: 'pending', requestedBy: 'Amma', date: new Date(Date.now() - 7200000) },
    { id: '3', item: 'Pepperoni (Kg)', type: 'in', quantity: 10, reason: 'Bulk purchase', status: 'approved', requestedBy: 'John', date: new Date(Date.now() - 10800000) },
  ]);

  const lowStockItems = inventory.filter(i => i.status !== 'sufficient').length;
  const totalInventoryValue = inventory.reduce((sum, i) => sum + (i.currentStock * i.costPerUnit), 0);
  const wasteValue = wastageLogs.reduce((sum, w) => sum + (w.quantity * 50), 0); // Estimated cost

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-600 text-sm mt-1">Monitor stock levels and manage inventory</p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Total Inventory Value', value: `₵${(totalInventoryValue / 1000).toFixed(1)}k`, icon: <FiPackage className="text-black" size={24} /> },
          { label: 'Low Stock Items', value: lowStockItems, icon: <FiAlertTriangle className="text-black" size={24} /> },
          { label: 'Monthly Wastage', value: `₵${wasteValue}`, icon: <FiTrendingDown className="text-black" size={24} /> },
        ].map((metric, idx) => (
          <div key={idx} className={`rounded-2xl border-2 p-6 ${
            idx === 0 ? 'bg-white border-black' : idx === 1 ? 'bg-white border-black' : 'bg-white border-black'
          }`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-600 font-medium">{metric.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{metric.value}</p>
              </div>
              {metric.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Low Stock Alerts */}
      {lowStockItems > 0 && (
        <div className="bg-white border-2 border-black rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <FiAlertTriangle className="text-black flex-shrink-0 mt-1" size={24} />
            <div className="flex-1">
              <h3 className="font-bold text-lg text-black">Low Stock Alert</h3>
              <p className="text-black text-sm mt-1">
                {lowStockItems} item{lowStockItems !== 1 ? 's' : ''} below reorder level. Please arrange restocking immediately.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Inventory Stock Levels */}
      <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 mb-6">Stock Levels</h2>

        <div className="space-y-4">
          {inventory.map((item) => {
            const stockPercentage = (item.currentStock / item.reorderLevel) * 100;
            return (
              <div key={item.id} className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-gray-900">{item.name}</h3>
                    <p className="text-xs text-gray-600">{item.category}</p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold border ${
                      item.status === 'sufficient'
                        ? 'bg-white text-black border-black'
                        : item.status === 'low'
                        ? 'bg-white text-black border-black'
                        : 'bg-white text-black border-black'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-4 mb-3">
                  <div>
                    <p className="text-xs text-gray-600">Current</p>
                    <p className="font-bold text-gray-900">
                      {item.currentStock} {item.unit}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Min Level</p>
                    <p className="font-bold text-gray-900">
                      {item.minStock} {item.unit}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Reorder</p>
                    <p className="font-bold text-gray-900">
                      {item.reorderLevel} {item.unit}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Value</p>
                    <p className="font-bold text-gray-900">
                      ₵{(item.currentStock * item.costPerUnit).toFixed(0)}
                    </p>
                  </div>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${
                      item.status === 'sufficient'
                        ? 'bg-white'
                        : item.status === 'low'
                        ? 'bg-white'
                        : 'bg-white'
                    }`}
                    style={{ width: `${Math.min(stockPercentage, 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Wastage & Stock Adjustments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Wastage Logs */}
        <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Wastage Logs</h2>

          <div className="space-y-3">
            {wastageLogs.map((log) => (
              <div key={log.id} className="p-4 bg-gray-50 rounded-xl border-l-4 border-black">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-bold text-gray-900">{log.item}</p>
                    <p className="text-xs text-gray-600">{log.reason}</p>
                  </div>
                  <span className="text-sm font-bold text-black">-{log.quantity}</span>
                </div>
                <p className="text-xs text-gray-600">
                  {log.date.toLocaleDateString('en-GB')} • Approved by {log.approvedBy}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Stock Adjustments */}
        <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Stock Adjustments</h2>

          <div className="space-y-3">
            {adjustments.map((adj) => (
              <div key={adj.id} className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p className="font-bold text-gray-900">{adj.item}</p>
                    <p className="text-xs text-gray-600">{adj.reason}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-lg font-bold ${adj.type === 'in' ? 'text-black' : 'text-black'}`}>
                      {adj.type === 'in' ? '+' : '-'}{adj.quantity}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-600">By {adj.requestedBy}</p>
                  <span
                    className={`px-2 py-1 rounded text-xs font-bold ${
                      adj.status === 'approved'
                        ? 'bg-white text-black'
                        : 'bg-white text-black'
                    }`}
                  >
                    {adj.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stock Reorder Suggestions */}
      <div className="bg-white border-2 border-black rounded-2xl p-6">
        <h2 className="text-lg font-bold text-black mb-4 flex items-center gap-2">
          <FiCheckCircle size={24} />
          Reorder Suggestions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {inventory
            .filter(i => i.status !== 'sufficient')
            .map((item) => (
              <div key={item.id} className="p-4 bg-white rounded-lg border border-black">
                <p className="font-semibold text-gray-900">{item.name}</p>
                <p className="text-sm text-gray-600 mt-1">
                  Suggest {item.reorderLevel} {item.unit} @ ₵{(item.reorderLevel * item.costPerUnit).toFixed(0)}
                </p>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
