'use client';

import React, { useState } from 'react';
import { FiTrendingUp, FiCreditCard, FiAlertCircle } from 'react-icons/fi';

interface SalesData {
  date: string;
  revenue: number;
  orders: number;
  avgOrderValue: number;
}

interface PaymentData {
  method: string;
  amount: number;
  percentage: number;
  color: string;
}

interface RefundData {
  id: string;
  orderNumber: string;
  amount: number;
  reason: string;
  date: Date;
  status: 'pending' | 'approved' | 'completed';
}

export default function SalesReports() {
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  const [salesData] = useState<SalesData[]>([
    { date: 'Jan 15', revenue: 2450, orders: 48, avgOrderValue: 51 },
    { date: 'Jan 16', revenue: 2780, orders: 52, avgOrderValue: 53 },
    { date: 'Jan 17', revenue: 2150, orders: 41, avgOrderValue: 52 },
    { date: 'Jan 18', revenue: 3120, orders: 58, avgOrderValue: 54 },
    { date: 'Jan 19', revenue: 2890, orders: 55, avgOrderValue: 53 },
    { date: 'Jan 20', revenue: 3450, orders: 64, avgOrderValue: 54 },
    { date: 'Jan 21', revenue: 2675, orders: 50, avgOrderValue: 54 },
  ]);

  const [paymentMethods] = useState<PaymentData[]>([
    { method: 'Mobile Money', amount: 8500, percentage: 45, color: 'bg-white' },
    { method: 'Card', amount: 6800, percentage: 36, color: 'bg-white' },
    { method: 'Cash', amount: 3200, percentage: 17, color: 'bg-gray-600' },
    { method: 'Other', amount: 500, percentage: 2, color: 'bg-white' },
  ]);

  const [itemSales] = useState([
    { item: 'Pepperoni Pizza Large', quantity: 156, revenue: 3900 },
    { item: 'Margherita Medium', quantity: 134, revenue: 2340 },
    { item: 'BBQ Chicken Large', quantity: 112, revenue: 3360 },
    { item: 'Veggie Deluxe', quantity: 98, revenue: 1960 },
    { item: 'Burger Combo', quantity: 87, revenue: 2175 },
  ]);

  const [refunds] = useState<RefundData[]>([
    { id: '1', orderNumber: '#1001', amount: 125, reason: 'Wrong item delivered', date: new Date('2024-01-20'), status: 'completed' },
    { id: '2', orderNumber: '#1002', amount: 55, reason: 'Item not available', date: new Date('2024-01-20'), status: 'approved' },
    { id: '3', orderNumber: '#1003', amount: 180, reason: 'Customer request', date: new Date('2024-01-21'), status: 'pending' },
    { id: '4', orderNumber: '#1004', amount: 95, reason: 'Quality issue', date: new Date('2024-01-21'), status: 'completed' },
  ]);

  const totalRevenue = salesData.reduce((sum, d) => sum + d.revenue, 0);
  const totalOrders = salesData.reduce((sum, d) => sum + d.orders, 0);
  const avgOrderValue = (totalRevenue / totalOrders).toFixed(2);
  const totalRefunds = refunds.reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sales & Reports</h1>
          <p className="text-gray-600 text-sm mt-1">Revenue analysis and business insights</p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Revenue', value: `₵${(totalRevenue / 1000).toFixed(1)}k`, trend: '+12%', color: 'bg-white border-black', icon: <span className="text-2xl font-black leading-none text-black">₵</span> },
          { label: 'Total Orders', value: totalOrders, trend: '+8 orders', color: 'bg-white border-black', icon: <FiTrendingUp className="text-black" size={24} /> },
          { label: 'Avg Order Value', value: `₵${avgOrderValue}`, trend: 'Normal', color: 'bg-white border-black', icon: <FiCreditCard className="text-black" size={24} /> },
          { label: 'Total Refunds', value: `₵${totalRefunds}`, trend: '2 pending', color: 'bg-white border-black', icon: <FiAlertCircle className="text-black" size={24} /> },
        ].map((metric, idx) => (
          <div key={idx} className={`rounded-2xl border-2 p-6 ${metric.color}`}>
            <div className="flex items-start justify-between mb-2">
              <p className="text-gray-600 text-sm font-medium">{metric.label}</p>
              {metric.icon}
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-2">{metric.value}</p>
            <p className="text-xs text-gray-600 mt-2">{metric.trend}</p>
          </div>
        ))}
      </div>

      {/* Time Frame Selection */}
      <div className="flex gap-4">
        {(['daily', 'weekly', 'monthly'] as const).map((tf) => (
          <button
            key={tf}
            onClick={() => setTimeframe(tf)}
            className={`px-6 py-2 rounded-lg font-semibold transition-colors capitalize ${
              timeframe === tf
                ? 'bg-white text-white'
                : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-black'
            }`}
          >
            {tf}
          </button>
        ))}
      </div>

      {/* Sales Trend Chart */}
      <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 mb-6">Revenue Trend ({timeframe})</h2>

        <div className="space-y-6">
          {salesData.map((data, idx) => {
            const maxRevenue = Math.max(...salesData.map(d => d.revenue));
            return (
              <div key={idx}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-700 font-semibold">{data.date}</span>
                  <span className="text-gray-900 font-bold">{data.orders} orders</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="h-3 rounded-full bg-white"
                    style={{ width: `${(data.revenue / maxRevenue) * 100}%` }}
                  />
                </div>
                <p className="text-right text-sm text-gray-600 mt-1">₵{data.revenue.toFixed(2)}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Payment Methods & Top Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Methods */}
        <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Revenue by Payment Method</h2>

          <div className="space-y-4">
            {paymentMethods.map((method, idx) => (
              <div key={idx}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-700 font-semibold">{method.method}</span>
                  <span className="text-gray-900 font-bold">₵{method.amount}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${method.color}`}
                    style={{ width: `${method.percentage}%` }}
                  />
                </div>
                <p className="text-right text-sm text-gray-600 mt-1">{method.percentage}%</p>
              </div>
            ))}
          </div>
        </div>

        {/* Top Selling Items */}
        <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Top Selling Items by Revenue</h2>

          <div className="space-y-3">
            {itemSales.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{item.item}</p>
                  <p className="text-xs text-gray-600">{item.quantity} sold</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">₵{item.revenue}</p>
                  <p className="text-xs text-gray-600">{((item.revenue / totalRevenue) * 100).toFixed(1)}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Refunds & Cancellations */}
      <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 mb-6">Refunds Report</h2>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-3 px-4 font-bold text-gray-900">Order</th>
                <th className="text-left py-3 px-4 font-bold text-gray-900">Reason</th>
                <th className="text-left py-3 px-4 font-bold text-gray-900">Amount</th>
                <th className="text-left py-3 px-4 font-bold text-gray-900">Date</th>
                <th className="text-left py-3 px-4 font-bold text-gray-900">Status</th>
              </tr>
            </thead>
            <tbody>
              {refunds.map((refund) => (
                <tr key={refund.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-semibold text-gray-900">{refund.orderNumber}</td>
                  <td className="py-3 px-4 text-gray-700">{refund.reason}</td>
                  <td className="py-3 px-4 font-bold text-black">₵{refund.amount.toFixed(2)}</td>
                  <td className="py-3 px-4 text-gray-700">{refund.date.toLocaleDateString('en-GB')}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold border ${
                        refund.status === 'completed'
                          ? 'bg-white text-black border-black'
                          : refund.status === 'approved'
                          ? 'bg-white text-black border-black'
                          : 'bg-white text-black border-black'
                      }`}
                    >
                      {refund.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
