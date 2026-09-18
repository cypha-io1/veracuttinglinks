'use client';

import React, { useState } from 'react';
import { FiAlertCircle, FiTrash2, FiEdit2, FiAlertTriangle, FiCode } from 'react-icons/fi';

interface IncidentLog {
  id: string;
  type: 'cancelled' | 'refund' | 'price-edit' | 'manual-override' | 'system-error';
  orderNumber: string;
  orderedBy: string;
  amount?: number;
  reason: string;
  actionBy: string;
  timestamp: Date;
  details?: string;
  severity?: 'low' | 'medium' | 'high';
}

export default function IncidentsLogs() {
  const [incidents] = useState<IncidentLog[]>([
    {
      id: '1',
      type: 'cancelled',
      orderNumber: '#1010',
      orderedBy: 'John Mensah',
      reason: 'Customer request - changed mind',
      actionBy: 'Amma Osei (Cashier)',
      timestamp: new Date(Date.now() - 600000),
      details: 'Order was in prep stage, no charges applied',
      severity: 'low',
    },
    {
      id: '2',
      type: 'refund',
      orderNumber: '#1008',
      orderedBy: 'Grace Owusu',
      amount: 125.50,
      reason: 'Quality issue - cold pizza',
      actionBy: 'John Mensah (Manager)',
      timestamp: new Date(Date.now() - 1800000),
      details: 'Full refund processed via Mobile Money',
      severity: 'medium',
    },
    {
      id: '3',
      type: 'price-edit',
      orderNumber: '#1005',
      orderedBy: 'Kwesi Adu',
      amount: 50,
      reason: 'Applied discount not in system',
      actionBy: 'Abena Asante (Cashier)',
      timestamp: new Date(Date.now() - 3600000),
      details: 'Manual price adjustment from ₵250 to ₵200',
      severity: 'medium',
    },
    {
      id: '4',
      type: 'manual-override',
      orderNumber: '#1002',
      orderedBy: 'Benjamin Joe',
      reason: 'System timeout - manual order creation',
      actionBy: 'Yaa Addo (Cashier)',
      timestamp: new Date(Date.now() - 7200000),
      details: 'Payment system unavailable, processed manually',
      severity: 'high',
    },
    {
      id: '5',
      type: 'system-error',
      orderNumber: 'N/A',
      orderedBy: 'System',
      reason: 'Database connection timeout',
      actionBy: 'Auto-logged',
      timestamp: new Date(Date.now() - 10800000),
      details: 'Connection restored after 45 seconds, no order impact',
      severity: 'low',
    },
    {
      id: '6',
      type: 'cancelled',
      orderNumber: '#0998',
      orderedBy: 'Ama Kwanyah',
      reason: 'Delivery address outside coverage',
      actionBy: 'Kwesi Boateng (Supervisor)',
      timestamp: new Date(Date.now() - 14400000),
      details: 'Full refund for cancelled delivery',
      severity: 'low',
    },
    {
      id: '7',
      type: 'refund',
      orderNumber: '#0995',
      orderedBy: 'Samuel Mensah',
      amount: 180.00,
      reason: 'Missing items in delivery',
      actionBy: 'John Mensah (Manager)',
      timestamp: new Date(Date.now() - 18000000),
      details: 'Customer complaint investigated, full refund issued',
      severity: 'high',
    },
  ]);

  const cancelledOrders = incidents.filter(i => i.type === 'cancelled').length;
  const refundsIssued = incidents.filter(i => i.type === 'refund').length;
  const priceEdits = incidents.filter(i => i.type === 'price-edit').length;
  const systemErrors = incidents.filter(i => i.type === 'system-error').length;
  const totalRefundAmount = incidents
    .filter(i => i.type === 'refund')
    .reduce((sum, i) => sum + (i.amount || 0), 0);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'cancelled':
        return <FiTrash2 size={20} className="text-black" />;
      case 'refund':
        return <span className="text-lg font-black leading-none text-black">₵</span>;
      case 'price-edit':
        return <FiEdit2 size={20} className="text-black" />;
      case 'manual-override':
        return <FiAlertTriangle size={20} className="text-black" />;
      case 'system-error':
        return <FiCode size={20} className="text-black" />;
      default:
        return <FiAlertCircle size={20} />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'cancelled':
        return 'bg-white text-black border-black';
      case 'refund':
        return 'bg-white text-black border-black';
      case 'price-edit':
        return 'bg-white text-black border-black';
      case 'manual-override':
        return 'bg-white text-black border-black';
      case 'system-error':
        return 'bg-white text-black border-black';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getTypeName = (type: string) => {
    return type.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Incident & Exception Logs</h1>
          <p className="text-gray-600 text-sm mt-1">Track all operational incidents and exceptions for accountability</p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Cancelled Orders', value: cancelledOrders, icon: <FiTrash2 className="text-black" size={24} />, color: 'bg-white border-black' },
          { label: 'Refunds Issued', value: refundsIssued, icon: <span className="text-2xl font-black leading-none text-black">₵</span>, color: 'bg-white border-black' },
          { label: 'Total Refund Amount', value: `₵${totalRefundAmount.toFixed(2)}`, icon: <span className="text-2xl font-black leading-none text-black">₵</span>, color: 'bg-white border-black' },
          { label: 'System Errors', value: systemErrors, icon: <FiCode className="text-black" size={24} />, color: 'bg-white border-black' },
        ].map((metric, idx) => (
          <div key={idx} className={`rounded-2xl border-2 p-6 ${metric.color}`}>
            <div className="flex items-start justify-between mb-2">
              <p className="text-gray-600 font-medium">{metric.label}</p>
              {metric.icon}
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-2">{metric.value}</p>
          </div>
        ))}
      </div>

      {/* Incident Types Summary */}
      <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 mb-6">Incident Summary by Type</h2>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { type: 'Cancelled Orders', count: cancelledOrders, color: 'bg-white border-black' },
            { type: 'Refunds', count: refundsIssued, color: 'bg-white border-black' },
            { type: 'Price Edits', count: priceEdits, color: 'bg-white border-black' },
            { type: 'Manual Overrides', count: incidents.filter(i => i.type === 'manual-override').length, color: 'bg-white border-black' },
            { type: 'System Errors', count: systemErrors, color: 'bg-white border-black' },
          ].map((item, idx) => (
            <div key={idx} className={`rounded-xl border-2 p-4 text-center ${item.color}`}>
              <p className="text-gray-600 text-sm font-medium">{item.type}</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{item.count}</p>
            </div>
          ))}
        </div>
      </div>

      {/* All Incidents Log */}
      <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
          <FiAlertCircle size={24} className="text-black" />
          Complete Incident Log
        </h2>

        <div className="space-y-4">
          {incidents.map((incident) => (
            <div
              key={incident.id}
              className={`p-5 bg-gray-50 rounded-xl border-l-4 ${
                incident.severity === 'high'
                  ? 'border-black'
                  : incident.severity === 'medium'
                  ? 'border-black'
                  : 'border-black'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">{getTypeIcon(incident.type)}</div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-bold text-gray-900 flex items-center gap-2">
                        {incident.orderNumber}
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold border ${getTypeColor(
                            incident.type
                          )}`}
                        >
                          {getTypeName(incident.type)}
                        </span>
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">{incident.reason}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {incident.amount && (
                        <p className="font-bold text-black text-lg">
                          ₵{incident.amount.toFixed(2)}
                        </p>
                      )}
                      <p className="text-xs text-gray-600">
                        {incident.timestamp.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-3 text-sm">
                    <div>
                      <p className="text-gray-600">Order By</p>
                      <p className="font-semibold text-gray-900">{incident.orderedBy}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Action By</p>
                      <p className="font-semibold text-gray-900">{incident.actionBy}</p>
                    </div>
                    {incident.severity && (
                      <div>
                        <p className="text-gray-600">Severity</p>
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                            incident.severity === 'high'
                              ? 'bg-white text-black'
                              : incident.severity === 'medium'
                              ? 'bg-white text-black'
                              : 'bg-white text-black'
                          }`}
                        >
                          {incident.severity}
                        </span>
                      </div>
                    )}
                  </div>

                  {incident.details && (
                    <div className="mt-3 p-3 bg-white rounded border border-gray-200">
                      <p className="text-sm text-gray-700">
                        <strong>Details:</strong> {incident.details}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* High Severity Incidents */}
      {incidents.filter(i => i.severity === 'high').length > 0 && (
        <div className="bg-white border-2 border-black rounded-2xl p-6">
          <h2 className="text-lg font-bold text-black mb-4 flex items-center gap-2">
            <FiAlertTriangle size={24} />
            High Severity Incidents - Requires Review
          </h2>
          <div className="space-y-3">
            {incidents
              .filter(i => i.severity === 'high')
              .map((incident) => (
                <div key={incident.id} className="p-4 bg-white rounded-lg border border-black">
                  <p className="font-semibold text-gray-900">
                    {incident.orderNumber}: {incident.reason}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Handled by {incident.actionBy} • {incident.timestamp.toLocaleDateString('en-GB')}
                  </p>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
