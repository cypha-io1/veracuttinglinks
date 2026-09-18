'use client';

import React, { useState } from 'react';
import { FiTag, FiPlus, FiEdit2, FiTrash2, FiBarChart2, FiAlertCircle } from 'react-icons/fi';

interface PromoCode {
  id: string;
  code: string;
  discount: number;
  type: 'percentage' | 'fixed';
  validFrom: Date;
  validUntil: Date;
  usage: number;
  maxUsage: number;
  status: 'active' | 'expired' | 'inactive';
  usageAbuse?: number;
}

interface Discount {
  id: string;
  name: string;
  description: string;
  discount: number;
  type: 'percentage' | 'fixed';
  applicableTo: string;
  validFrom: Date;
  validUntil: Date;
  restrictions?: string;
  totalRevenue: number;
  totalUsages: number;
}

interface DiscountLog {
  id: string;
  code: string;
  appliedBy: string;
  orderAmount: number;
  discountAmount: number;
  timestamp: Date;
  flag?: string;
}

export default function Promotions() {
  const [promoCodes] = useState<PromoCode[]>([
    { id: '1', code: 'PIZZA20', discount: 20, type: 'percentage', validFrom: new Date('2024-01-01'), validUntil: new Date('2024-02-29'), usage: 145, maxUsage: 500, status: 'active' },
    { id: '2', code: 'SAVE50', discount: 50, type: 'fixed', validFrom: new Date('2024-01-10'), validUntil: new Date('2024-01-31'), usage: 234, maxUsage: 1000, status: 'active' },
    { id: '3', code: 'WELCOME15', discount: 15, type: 'percentage', validFrom: new Date('2023-01-01'), validUntil: new Date('2023-12-31'), usage: 890, maxUsage: 5000, status: 'expired' },
    { id: '4', code: 'VIP30', discount: 30, type: 'percentage', validFrom: new Date('2024-02-01'), validUntil: new Date('2024-03-31'), usage: 0, maxUsage: 100, status: 'inactive' },
  ]);

  const [discounts] = useState<Discount[]>([
    {
      id: '1',
      name: 'Happy Hour Deal',
      description: '20% off on all pizzas between 3pm-5pm',
      discount: 20,
      type: 'percentage',
      applicableTo: 'Pizzas only',
      validFrom: new Date('2024-01-15'),
      validUntil: new Date('2024-03-31'),
      totalRevenue: 2450,
      totalUsages: 156,
    },
    {
      id: '2',
      name: 'Bundle Deal',
      description: 'Buy 2 large pizzas, get 1 free drink',
      discount: 45,
      type: 'fixed',
      applicableTo: 'Bundle items',
      validFrom: new Date('2024-01-10'),
      validUntil: new Date('2024-02-28'),
      totalRevenue: 3200,
      totalUsages: 89,
    },
  ]);

  const [discountLogs] = useState<DiscountLog[]>([
    { id: '1', code: 'PIZZA20', appliedBy: 'Amma Osei', orderAmount: 250, discountAmount: 50, timestamp: new Date(Date.now() - 600000), flag: 'suspicious' },
    { id: '2', code: 'SAVE50', appliedBy: 'Abena Asante', orderAmount: 500, discountAmount: 50, timestamp: new Date(Date.now() - 1200000) },
    { id: '3', code: 'PIZZA20', appliedBy: 'Kwesi Boateng', orderAmount: 300, discountAmount: 60, timestamp: new Date(Date.now() - 1800000) },
    { id: '4', code: 'PIZZA20', appliedBy: 'Yaa Addo', orderAmount: 150, discountAmount: 30, timestamp: new Date(Date.now() - 3600000) },
  ]);

  const [showAddPromo, setShowAddPromo] = useState(false);

  const totalActivePromos = promoCodes.filter(p => p.status === 'active').length;
  const totalAbuseFlags = discountLogs.filter(l => l.flag).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Promotions & Discounts</h1>
          <p className="text-gray-600 text-sm mt-1">Manage promo codes and discount campaigns</p>
        </div>
        <button
          onClick={() => setShowAddPromo(true)}
          className="px-6 py-3 bg-black text-white rounded-lg font-bold hover:bg-gray-800 transition-colors flex items-center gap-2"
        >
          <FiPlus size={20} />
          New Promo
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Active Promos', value: totalActivePromos, color: 'bg-white border-black' },
          { label: 'Total Discounts Given', value: '₵890.50', color: 'bg-white border-black' },
          { label: 'Abuse Alerts', value: totalAbuseFlags, color: 'bg-white border-black', important: true },
        ].map((metric, idx) => (
          <div key={idx} className={`rounded-2xl border-2 p-6 ${metric.color}`}>
            <p className="text-gray-600 font-medium">{metric.label}</p>
            <p className={`text-2xl font-bold mt-2 ${metric.important ? 'text-black' : 'text-gray-900'}`}>
              {metric.value}
            </p>
          </div>
        ))}
      </div>

      {/* Abuse Alert */}
      {totalAbuseFlags > 0 && (
        <div className="bg-white border-2 border-black rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <FiAlertCircle className="text-black flex-shrink-0 mt-1" size={24} />
            <div className="flex-1">
              <h3 className="font-bold text-lg text-black">Discount Abuse Detected</h3>
              <p className="text-black text-sm mt-1">
                {totalAbuseFlags} suspicious discount application{totalAbuseFlags !== 1 ? 's' : ''} detected. Review logs below.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Active Promo Codes */}
      <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
          <FiTag size={24} className="text-black" />
          Promo Codes
        </h2>

        <div className="space-y-4">
          {promoCodes.map((promo) => {
            const usagePercentage = (promo.usage / promo.maxUsage) * 100;
            return (
              <div key={promo.id} className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-bold text-gray-900 text-lg">{promo.code}</h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold border ${
                          promo.status === 'active'
                            ? 'bg-white text-black border-black'
                            : promo.status === 'expired'
                            ? 'bg-gray-100 text-gray-700 border-gray-300'
                            : 'bg-white text-black border-black'
                        }`}
                      >
                        {promo.status}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm">
                      {promo.discount}
                      {promo.type === 'percentage' ? '% off' : '₵ fixed discount'}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button className="p-2 bg-white text-black rounded-lg hover:bg-white transition-colors">
                      <FiEdit2 size={18} />
                    </button>
                    <button className="p-2 bg-white text-black rounded-lg hover:bg-white transition-colors">
                      <FiTrash2 size={18} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 mb-3">
                  <div>
                    <p className="text-xs text-gray-600">Valid Until</p>
                    <p className="font-semibold text-gray-900">
                      {promo.validUntil.toLocaleDateString('en-GB')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Usage</p>
                    <p className="font-semibold text-gray-900">
                      {promo.usage} / {promo.maxUsage}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Abuse Flags</p>
                    <p className="font-semibold text-gray-900">{promo.usageAbuse || 0}</p>
                  </div>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="h-2 rounded-full bg-white" style={{ width: `${usagePercentage}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Discounts */}
      <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
          <FiBarChart2 size={24} className="text-black" />
          Active Discount Campaigns
        </h2>

        <div className="space-y-4">
          {discounts.map((discount) => (
            <div key={discount.id} className="p-4 bg-gray-50 rounded-xl border-l-4 border-black">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900">{discount.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{discount.description}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-black text-lg">
                    {discount.discount}
                    {discount.type === 'percentage' ? '%' : '₵'}
                  </p>
                  <p className="text-xs text-gray-600">off</p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-gray-600">Applicable To</p>
                  <p className="font-semibold text-gray-900 text-sm">{discount.applicableTo}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Valid Until</p>
                  <p className="font-semibold text-gray-900 text-sm">
                    {discount.validUntil.toLocaleDateString('en-GB')}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Total Revenue</p>
                  <p className="font-semibold text-gray-900 text-sm">₵{discount.totalRevenue}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Total Uses</p>
                  <p className="font-semibold text-gray-900 text-sm">{discount.totalUsages}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Discount Usage & Abuse Logs */}
      <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 mb-6">Recent Discount Applications</h2>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-3 px-4 font-bold text-gray-900">Code</th>
                <th className="text-left py-3 px-4 font-bold text-gray-900">Applied By</th>
                <th className="text-left py-3 px-4 font-bold text-gray-900">Order Amount</th>
                <th className="text-left py-3 px-4 font-bold text-gray-900">Discount</th>
                <th className="text-left py-3 px-4 font-bold text-gray-900">Time</th>
                <th className="text-left py-3 px-4 font-bold text-gray-900">Status</th>
              </tr>
            </thead>
            <tbody>
              {discountLogs.map((log) => (
                <tr
                  key={log.id}
                  className={`border-b border-gray-100 hover:bg-gray-50 ${log.flag ? 'bg-white' : ''}`}
                >
                  <td className="py-3 px-4 font-semibold text-gray-900">{log.code}</td>
                  <td className="py-3 px-4 text-gray-700">{log.appliedBy}</td>
                  <td className="py-3 px-4 text-gray-700">₵{log.orderAmount.toFixed(2)}</td>
                  <td className="py-3 px-4 font-bold text-black">-₵{log.discountAmount.toFixed(2)}</td>
                  <td className="py-3 px-4 text-gray-700 text-sm">
                    {log.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="py-3 px-4">
                    {log.flag ? (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-white text-black border border-black">
                        {log.flag}
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-white text-black border border-black">
                        normal
                      </span>
                    )}
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
