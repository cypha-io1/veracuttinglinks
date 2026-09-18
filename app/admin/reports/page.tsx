'use client';

import React, { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { FiDownload, FiFilter } from 'react-icons/fi';

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState('7days');

  const metrics = [
    { label: 'Avg Prep Time', value: '12 mins', change: '-2 mins', color: 'text-black' },
    { label: 'Avg Delivery Time', value: '28 mins', change: '+3 mins', color: 'text-black' },
    { label: 'Cancellation Rate', value: '2.3%', change: '-0.5%', color: 'text-black' },
    { label: 'Customer Satisfaction', value: '4.6/5', change: '+0.2', color: 'text-black' },
  ];

  const salesData = [
    { day: 'Mon', orders: 145, revenue: 5892 },
    { day: 'Tue', orders: 167, revenue: 6768 },
    { day: 'Wed', orders: 189, revenue: 7641 },
    { day: 'Thu', orders: 156, revenue: 6324 },
  ];

  const topProducts = [
    { name: 'Margherita Pizza', sales: 245, revenue: 8550.50 },
    { name: 'Pepperoni Pizza', sales: 198, revenue: 7900.20 },
    { name: 'Chicken Pizza', sales: 156, revenue: 7004.40 },
  ];

  const maxRevenue = Math.max(...salesData.map(d => d.revenue));

  return (
    <AdminLayout>
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          <button className="bg-black text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-800">
            <FiDownload /> Export
          </button>
        </div>

        <div className="flex items-center gap-4">
          <FiFilter className="text-gray-600" />
          <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg bg-white">
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics.map((metric, idx) => (
            <div key={idx} className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <p className="text-gray-600 text-sm font-medium">{metric.label}</p>
              <p className={`text-3xl font-bold ${metric.color} mt-2`}>{metric.value}</p>
              <p className="text-xs text-black mt-2">{metric.change}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h2 className="text-lg font-semibold mb-6">Daily Sales Trend</h2>
          <div className="space-y-3">
            {salesData.map((data, idx) => (
              <div key={idx} className="flex items-center gap-4">
                <span className="w-12 font-semibold text-sm text-gray-900">{data.day}</span>
                <div className="flex-1">
                  <div className="bg-gray-100 rounded-full h-8 overflow-hidden" style={{ width: '100%' }}>
                    <div
                      className="bg-black h-8 flex items-center justify-end pr-3 text-xs font-bold text-white"
                      style={{ width: `${(data.revenue / maxRevenue) * 100}%` }}
                    >
                      ₵{data.revenue}
                    </div>
                  </div>
                </div>
                <span className="text-sm text-gray-600">{data.orders} orders</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
          <h2 className="text-lg font-semibold p-6 border-b border-gray-200">Top Products</h2>
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-bold text-gray-900">Product</th>
                <th className="px-6 py-3 text-left text-sm font-bold text-gray-900">Sales Count</th>
                <th className="px-6 py-3 text-left text-sm font-bold text-gray-900">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {topProducts.map((product, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-semibold text-gray-900">{product.name}</td>
                  <td className="px-6 py-4 text-sm font-semibold">{product.sales}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-black">₵{product.revenue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
