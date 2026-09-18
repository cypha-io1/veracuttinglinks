'use client';

import React, { useState, useEffect } from 'react';
import { FiAlertCircle, FiClock, FiAlertTriangle, FiZap, FiEye } from 'react-icons/fi';

interface Order {
  id: string;
  orderNumber: string;
  status: 'new' | 'preparing' | 'ready' | 'completed';
  priority: boolean;
  type: 'delivery' | 'pickup' | 'dine-in';
  placedAt: Date;
  estimatedTime: number;
  itemCount: number;
  branch: string;
}

export default function OperationsMonitor() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [kitchenLoad, setKitchenLoad] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Mock data
  useEffect(() => {
    const mockOrders: Order[] = [
      { id: '1', orderNumber: '#1001', status: 'preparing', priority: true, type: 'delivery', placedAt: new Date(Date.now() - 10 * 60000), estimatedTime: 15, itemCount: 2, branch: 'North Legon' },
      { id: '2', orderNumber: '#1002', status: 'preparing', priority: false, type: 'pickup', placedAt: new Date(Date.now() - 8 * 60000), estimatedTime: 12, itemCount: 1, branch: 'Accra' },
      { id: '3', orderNumber: '#1003', status: 'new', priority: true, type: 'delivery', placedAt: new Date(Date.now() - 5 * 60000), estimatedTime: 18, itemCount: 3, branch: 'Agbogba' },
      { id: '4', orderNumber: '#1004', status: 'new', priority: false, type: 'dine-in', placedAt: new Date(Date.now() - 4 * 60000), estimatedTime: 15, itemCount: 2, branch: 'North Legon' },
      { id: '5', orderNumber: '#1005', status: 'ready', priority: false, type: 'pickup', placedAt: new Date(Date.now() - 15 * 60000), estimatedTime: 15, itemCount: 1, branch: 'Accra' },
    ];

    setOrders(mockOrders);
    setKitchenLoad((mockOrders.filter(o => o.status !== 'ready').length / 10) * 100);
  }, []);

  // Real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdated(new Date());
      setKitchenLoad(65 + Math.random() * 30);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const activeOrders = orders.filter(o => o.status !== 'completed').length;
  const frontDeskQueue = orders.filter(o => o.status === 'new').length;
  const readyPickup = orders.filter(o => o.status === 'ready').length;
  const averageWaitTime = Math.round(
    orders.reduce((sum, o) => sum + (new Date().getTime() - o.placedAt.getTime()) / 60000, 0) / Math.max(orders.length, 1)
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-white text-black border-black';
      case 'preparing':
        return 'bg-white text-black border-black';
      case 'ready':
        return 'bg-white text-black border-black';
      case 'completed':
        return 'bg-gray-100 text-gray-700 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Live Operations Monitor</h1>
          <p className="text-gray-600 text-sm mt-1">Real-time view of all active operations</p>
        </div>
      </div>

      {/* Emergency Controls */}
      <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Emergency Controls</h2>
        <div className="flex gap-4 flex-wrap">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`px-6 py-3 rounded-lg font-bold text-white transition-all flex items-center gap-2 ${
              isPaused
                ? 'bg-white hover:bg-white shadow-lg'
                : 'bg-gray-600 hover:bg-gray-700'
            }`}
          >
            <FiAlertTriangle size={20} />
            {isPaused ? 'Pause Orders (ACTIVE)' : 'Pause New Orders'}
          </button>

          <button
            onClick={() => setIsBusy(!isBusy)}
            className={`px-6 py-3 rounded-lg font-bold text-white transition-all flex items-center gap-2 ${
              isBusy
                ? 'bg-white hover:bg-white shadow-lg'
                : 'bg-gray-600 hover:bg-gray-700'
            }`}
          >
            <FiZap size={20} />
            {isBusy ? 'Busy Mode (ON)' : 'Set Busy Mode'}
          </button>

          <div className="ml-auto flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
            <span className="relative flex h-3 w-3">
              <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
            </span>
            <span className="text-sm font-semibold text-gray-700">Live Monitoring</span>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Active Orders', value: activeOrders, color: 'bg-white border-black' },
          { label: 'Front Desk Queue', value: frontDeskQueue, color: 'bg-white border-black', status: frontDeskQueue > 3 ? 'critical' : 'normal' },
          { label: 'Ready for Pickup', value: readyPickup, color: 'bg-white border-black' },
          { label: 'Avg Wait Time', value: `${averageWaitTime}m`, color: 'bg-white border-black' },
        ].map((metric, idx) => (
          <div key={idx} className={`rounded-2xl border-2 p-4 ${metric.color}`}>
            <p className="text-gray-600 text-sm font-medium">{metric.label}</p>
            <p className={`text-2xl font-bold mt-2 ${metric.status === 'critical' ? 'text-black' : 'text-gray-900'}`}>
              {metric.value}
            </p>
          </div>
        ))}
      </div>

      {/* Kitchen Queue Load */}
      <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Kitchen Queue Load</h2>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-700 font-semibold">Overall Load</span>
              <span className={`text-2xl font-bold ${
                kitchenLoad > 80 ? 'text-black' : kitchenLoad > 60 ? 'text-black' : 'text-black'
              }`}>
                {Math.round(kitchenLoad)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${
                  kitchenLoad > 80 ? 'bg-white' : kitchenLoad > 60 ? 'bg-white' : 'bg-white'
                }`}
                style={{ width: `${kitchenLoad}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="p-4 bg-white border border-black rounded-lg">
              <p className="text-gray-600 text-sm">New Orders</p>
              <p className="text-2xl font-bold text-black mt-1">{frontDeskQueue}</p>
            </div>
            <div className="p-4 bg-white border border-black rounded-lg">
              <p className="text-gray-600 text-sm">Preparing</p>
              <p className="text-2xl font-bold text-black mt-1">
                {orders.filter(o => o.status === 'preparing').length}
              </p>
            </div>
            <div className="p-4 bg-white border border-black rounded-lg">
              <p className="text-gray-600 text-sm">Ready</p>
              <p className="text-2xl font-bold text-black mt-1">{readyPickup}</p>
            </div>
          </div>
        </div>
      </div>

      {/* All Active Orders */}
      <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900">All Active Orders</h2>
          <FiEye className="text-black" size={24} />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-3 px-4 font-bold text-gray-900">Order</th>
                <th className="text-left py-3 px-4 font-bold text-gray-900">Type</th>
                <th className="text-left py-3 px-4 font-bold text-gray-900">Status</th>
                <th className="text-left py-3 px-4 font-bold text-gray-900">Wait Time</th>
                <th className="text-left py-3 px-4 font-bold text-gray-900">Items</th>
                <th className="text-left py-3 px-4 font-bold text-gray-900">Branch</th>
              </tr>
            </thead>
            <tbody>
              {orders
                .filter(o => o.status !== 'completed')
                .sort((a, b) => {
                  if (a.priority !== b.priority) return b.priority ? 1 : -1;
                  return b.placedAt.getTime() - a.placedAt.getTime();
                })
                .map((order) => {
                  const waitTime = Math.floor((new Date().getTime() - order.placedAt.getTime()) / 60000);
                  return (
                    <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <span className="font-bold text-gray-900">{order.orderNumber}</span>
                        {order.priority && <span className="ml-2 px-2 py-1 bg-white text-black text-xs rounded font-bold">PRIORITY</span>}
                      </td>
                      <td className="py-3 px-4">
                        <span className="capitalize text-gray-700 font-medium">{order.type}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`font-semibold ${waitTime > order.estimatedTime ? 'text-black' : 'text-gray-700'}`}>
                          {waitTime}m
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-700">{order.itemCount} items</td>
                      <td className="py-3 px-4 text-gray-700">{order.branch}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Alerts */}
      {(isPaused || isBusy) && (
        <div className={`rounded-2xl border-2 p-4 flex items-start gap-4 ${
          isPaused ? 'bg-white border-black' : 'bg-white border-black'
        }`}>
          <FiAlertCircle size={24} className={isPaused ? 'text-black' : 'text-black'} />
          <div>
            <p className={`font-bold text-lg ${isPaused ? 'text-black' : 'text-black'}`}>
              {isPaused ? 'Order Pause Active' : 'Busy Mode Enabled'}
            </p>
            <p className="text-gray-700 text-sm mt-1">
              {isPaused
                ? 'New orders are paused. Existing orders continue processing.'
                : 'Store is marked as busy. Customers will see a notice.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
