'use client';

import React, { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { FiCheck, FiX } from 'react-icons/fi';

interface Payment {
  id: string;
  orderId: string;
  customer: string;
  amount: number;
  method: 'card' | 'momo' | 'cash' | 'wallet';
  status: 'completed' | 'pending' | 'failed';
  date: string;
}

interface Refund {
  id: string;
  orderId: string;
  customer: string;
  reason: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  date: string;
}

export default function PaymentsPage() {
  const [activeTab, setActiveTab] = useState('transactions');

  const [payments] = useState<Payment[]>([
    { id: 'PAY001', orderId: '#1001', customer: 'Kwesi Boateng', amount: 134.70, method: 'card', status: 'completed', date: '2024-01-16 14:30' },
    { id: 'PAY002', orderId: '#1002', customer: 'Abena Osei', amount: 54.90, method: 'momo', status: 'pending', date: '2024-01-16 14:45' },
    { id: 'PAY003', orderId: '#1003', customer: 'Yaw Mensah', amount: 54.80, method: 'cash', status: 'failed', date: '2024-01-16 15:00' },
  ]);

  const [refunds] = useState<Refund[]>([
    { id: 'REF001', orderId: '#995', customer: 'Nadia Sarfo', reason: 'Order not received', amount: 59.90, status: 'approved', date: '2024-01-15' },
    { id: 'REF002', orderId: '#998', customer: 'Ekua Adjei', reason: 'Wrong item delivered', amount: 89.90, status: 'pending', date: '2024-01-16' },
  ]);

  const statusColors = {
    completed: 'bg-white text-black',
    pending: 'bg-white text-black',
    failed: 'bg-white text-black',
    approved: 'bg-white text-black',
    rejected: 'bg-white text-black',
  };

  const methodColors = {
    card: 'bg-white text-black',
    momo: 'bg-white text-black',
    cash: 'bg-gray-100 text-gray-800',
    wallet: 'bg-white text-black',
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Payments & Finance</h1>

        <div className="flex gap-0 border-b border-gray-200">
          {[
            { id: 'transactions', label: 'Transactions' },
            { id: 'refunds', label: 'Refunds' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 font-medium text-sm border-b-2 transition ${
                activeTab === tab.id ? 'border-black text-black bg-white' : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'transactions' && (
          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
            <table className="w-full min-w-[760px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-900 sm:px-6 sm:text-sm">Payment ID</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-900 sm:px-6 sm:text-sm">Order</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-900 sm:px-6 sm:text-sm">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-900 sm:px-6 sm:text-sm">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-900 sm:px-6 sm:text-sm">Method</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-900 sm:px-6 sm:text-sm">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-900 sm:px-6 sm:text-sm">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {payments.map(payment => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 font-semibold text-gray-900 sm:px-6">{payment.id}</td>
                    <td className="px-4 py-4 text-xs text-gray-600 sm:px-6 sm:text-sm">{payment.orderId}</td>
                    <td className="px-4 py-4 text-xs text-gray-600 sm:px-6 sm:text-sm">{payment.customer}</td>
                    <td className="px-4 py-4 text-xs font-semibold sm:px-6 sm:text-sm">₵{payment.amount}</td>
                    <td className="px-4 py-4 text-xs sm:px-6 sm:text-sm">
                      <span className={`rounded-full px-3 py-1 text-[10px] font-semibold capitalize sm:text-xs ${methodColors[payment.method]}`}>
                        {payment.method}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-xs sm:px-6 sm:text-sm">
                      <span className={`rounded-full px-3 py-1 text-[10px] font-semibold sm:text-xs ${statusColors[payment.status]}`}>
                        {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-xs text-gray-600 sm:px-6 sm:text-sm">{payment.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'refunds' && (
          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
            <table className="w-full min-w-[760px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 sm:px-6 sm:text-sm">Refund ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 sm:px-6 sm:text-sm">Order</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 sm:px-6 sm:text-sm">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 sm:px-6 sm:text-sm">Reason</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 sm:px-6 sm:text-sm">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 sm:px-6 sm:text-sm">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 sm:px-6 sm:text-sm">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {refunds.map(refund => (
                  <tr key={refund.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 font-semibold text-gray-900 sm:px-6">{refund.id}</td>
                    <td className="px-4 py-4 text-xs text-gray-600 sm:px-6 sm:text-sm">{refund.orderId}</td>
                    <td className="px-4 py-4 text-xs text-gray-600 sm:px-6 sm:text-sm">{refund.customer}</td>
                    <td className="px-4 py-4 text-xs text-gray-600 sm:px-6 sm:text-sm">{refund.reason}</td>
                    <td className="px-4 py-4 text-xs font-semibold sm:px-6 sm:text-sm">₵{refund.amount}</td>
                    <td className="px-4 py-4 text-xs sm:px-6 sm:text-sm">
                      <span className={`rounded-full px-3 py-1 text-[10px] font-semibold sm:text-xs ${statusColors[refund.status]}`}>
                        {refund.status.charAt(0).toUpperCase() + refund.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-xs flex gap-2 sm:px-6 sm:text-sm">
                      {refund.status === 'pending' && (
                        <>
                          <button className="text-black hover:text-black"><FiCheck /></button>
                          <button className="text-black hover:text-black"><FiX /></button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
