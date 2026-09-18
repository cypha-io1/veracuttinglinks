'use client';

import React, { useState, useEffect } from 'react';
import { FiTrendingUp, FiTrendingDown, FiClock, FiAlertTriangle, FiUsers, FiBox } from 'react-icons/fi';

interface DashboardMetric {
  label: string;
  value: string | number;
  unit?: string;
  trend?: 'up' | 'down';
  trendValue?: string;
  icon: React.ReactNode;
  color: string;
}

interface TopItem {
  name: string;
  quantity: number;
  revenue: number;
}

interface Staff {
  id: string;
  name: string;
  role: 'kitchen' | 'cashier' | 'supervisor';
  status: 'online' | 'offline' | 'break';
  loginTime: Date;
}

export default function ManagerDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetric[]>([]);
  const [topItems, setTopItems] = useState<TopItem[]>([]);
  const [staffOnShift, setStaffOnShift] = useState<Staff[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [updateCounter, setUpdateCounter] = useState(0);

  // Mock data
  useEffect(() => {
    setLastUpdated(new Date());

    const todaysRevenue = 2450.00 + Math.random() * 500;
    const totalOrders = 45 + Math.floor(Math.random() * 20);
    const avgPrepTime = 14 + Math.floor(Math.random() * 5);
    const cancellationRate = 2.3 + Math.random() * 2;
    const delayedOrders = 3 + Math.floor(Math.random() * 5);

    setMetrics([
      {
        label: "Today's Revenue",
        value: `₵${todaysRevenue.toFixed(2)}`,
        trend: 'up',
        trendValue: '+12%',
        icon: <FiTrendingUp className="text-black" size={24} />,
        color: 'bg-white border-black',
      },
      {
        label: 'Total Orders',
        value: totalOrders,
        trend: 'up',
        trendValue: '+8 vs yesterday',
        icon: <FiBox className="text-black" size={24} />,
        color: 'bg-white border-black',
      },
      {
        label: 'Avg Prep Time',
        value: avgPrepTime,
        unit: 'min',
        trend: 'down',
        trendValue: '-2 min vs avg',
        icon: <FiClock className="text-black" size={24} />,
        color: 'bg-white border-black',
      },
      {
        label: 'Cancellation Rate',
        value: cancellationRate.toFixed(1),
        unit: '%',
        trend: avgPrepTime > 16 ? 'up' : 'down',
        trendValue: delayedOrders > 5 ? 'High' : 'Normal',
        icon: <FiAlertTriangle className="text-black" size={24} />,
        color: 'bg-white border-black',
      },
      {
        label: 'Delayed Orders',
        value: delayedOrders,
        trend: 'down',
        trendValue: '↓ Normal range',
        icon: <FiTrendingDown className="text-black" size={24} />,
        color: 'bg-white border-black',
      },
      {
        label: 'Staff on Shift',
        value: 7,
        trend: 'up',
        trendValue: '3 in kitchen',
        icon: <FiUsers className="text-black" size={24} />,
        color: 'bg-white border-black',
      },
    ]);

    setTopItems([
      { name: 'Pepperoni Pizza Large', quantity: 23, revenue: 575.00 },
      { name: 'Margherita Medium', quantity: 18, revenue: 315.00 },
      { name: 'BBQ Chicken Large', quantity: 15, revenue: 450.00 },
      { name: 'Veggie Deluxe', quantity: 12, revenue: 240.00 },
      { name: 'Burger Combo', quantity: 11, revenue: 275.00 },
    ]);

    setStaffOnShift([
      { id: '1', name: 'John Mensah', role: 'supervisor', status: 'online', loginTime: new Date(Date.now() - 480 * 60000) },
      { id: '2', name: 'Amma Osei', role: 'kitchen', status: 'online', loginTime: new Date(Date.now() - 420 * 60000) },
      { id: '3', name: 'Kwesi Boateng', role: 'kitchen', status: 'online', loginTime: new Date(Date.now() - 360 * 60000) },
      { id: '4', name: 'Abena Asante', role: 'cashier', status: 'online', loginTime: new Date(Date.now() - 300 * 60000) },
      { id: '5', name: 'Kofi Mensah', role: 'kitchen', status: 'break', loginTime: new Date(Date.now() - 240 * 60000) },
      { id: '6', name: 'Yaa Addo', role: 'cashier', status: 'online', loginTime: new Date(Date.now() - 180 * 60000) },
      { id: '7', name: 'Nana Owusu', role: 'supervisor', status: 'online', loginTime: new Date(Date.now() - 120 * 60000) },
    ]);
  }, [updateCounter]);

  // Real-time updates
  useEffect(() => {
    let callCount = 0;
    const interval = setInterval(() => {
      callCount++;
      setUpdateCounter(prev => prev + 1);
      setLastUpdated(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const hours = Math.floor(diffMinutes / 60);
    return `${hours}h ago`;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 text-sm mt-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        {lastUpdated && (
          <div className="text-right">
            <p className="text-sm text-gray-500">
              Last updated: <span className="font-semibold text-gray-900">{lastUpdated.toLocaleTimeString()}</span>
            </p>
            <p className="text-xs text-black mt-1 flex items-center justify-end gap-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
              </span>
              Live Updates Active
            </p>
          </div>
        )}
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {metrics.map((metric, idx) => (
          <div
            key={idx}
            className={`rounded-2xl border-2 p-6 transition-all hover:shadow-lg ${metric.color}`}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-gray-600 text-sm font-medium">{metric.label}</p>
                <div className="mt-2 flex items-baseline gap-2">
                  <p className="text-3xl font-bold text-gray-900">{metric.value}</p>
                  {metric.unit && <span className="text-gray-600 font-medium">{metric.unit}</span>}
                </div>
              </div>
              <div className="p-3 bg-white rounded-lg">{metric.icon}</div>
            </div>

            {metric.trend && (
              <div className="flex items-center gap-1 text-sm">
                {metric.trend === 'up' ? (
                  <FiTrendingUp size={16} className="text-black" />
                ) : (
                  <FiTrendingDown size={16} className="text-black" />
                )}
                <span
                  className={metric.trend === 'up' ? 'text-black font-semibold' : 'text-black font-semibold'}
                >
                  {metric.trendValue}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Top Selling Items & Staff */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Items */}
        <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">Top Selling Items</h2>
            <FiBox className="text-black" size={24} />
          </div>

          <div className="space-y-4">
            {topItems.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{item.name}</p>
                  <p className="text-sm text-gray-600">{item.quantity} sold</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">₵{item.revenue.toFixed(2)}</p>
                  <p className="text-xs text-gray-500">{((item.revenue / 2450) * 100).toFixed(1)}% of today</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Staff on Shift */}
        <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">Staff on Shift</h2>
            <FiUsers className="text-black" size={24} />
          </div>

          <div className="space-y-3">
            {staffOnShift.map((staff) => (
              <div key={staff.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3 flex-1">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      staff.status === 'online'
                        ? 'bg-white'
                        : staff.status === 'break'
                        ? 'bg-white'
                        : 'bg-gray-400'
                    }`}
                  />
                  <div>
                    <p className="font-semibold text-gray-900">{staff.name}</p>
                    <p className="text-xs text-gray-600 capitalize">
                      {staff.role.replace('-', ' ')} • {formatTime(staff.loginTime)}
                    </p>
                  </div>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    staff.status === 'online'
                      ? 'bg-white text-black'
                      : staff.status === 'break'
                      ? 'bg-white text-black'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {staff.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'View All Orders', color: 'bg-white text-black hover:bg-white' },
            { label: 'Check Inventory', color: 'bg-white text-black hover:bg-white' },
            { label: 'Staff Schedule', color: 'bg-white text-black hover:bg-white' },
            { label: 'View Reports', color: 'bg-white text-black hover:bg-white' },
          ].map((action, idx) => (
            <button
              key={idx}
              className={`p-4 rounded-xl font-semibold text-sm transition-colors ${action.color}`}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
