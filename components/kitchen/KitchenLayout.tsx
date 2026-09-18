'use client';

import React, { useState, useEffect } from 'react';
import { FiLogOut, FiRefreshCw, FiBell, FiSettings, FiClock, FiTrendingUp } from 'react-icons/fi';
import Image from 'next/image';
import Link from 'next/link';
import OutOfStockManager from './OutOfStockManager';

interface KitchenLayoutProps {
  children: React.ReactNode;
}

export default function KitchenLayout({ children }: KitchenLayoutProps) {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [alertCount, setAlertCount] = useState(2);
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    const interval = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <div className="w-20 bg-white flex flex-col items-center py-6 shadow-lg">
        {/* Logo */}
        <Link href="/kitchen" className="mb-10 p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 transition-all">
          <Image src="/logo.png" alt="Logo" width={40} height={40} className="rounded-xl" />
        </Link>
        
        {/* Main Actions */}
        <div className="flex-1 flex flex-col items-center gap-5">
          {/* Refresh Button */}
          <button 
            title="Refresh orders"
            className="w-12 h-12 rounded-2xl bg-black/10 hover:bg-gray-800/20 flex items-center justify-center text-white transition-all hover:shadow-lg"
          >
            <FiRefreshCw size={20} />
          </button>
          
          {/* Alert Button */}
          <button 
            title="View alerts"
            className="w-12 h-12 rounded-2xl bg-black/10 hover:bg-gray-800/20 flex items-center justify-center text-white transition-all hover:shadow-lg relative"
          >
            <FiBell size={20} />
            {alertCount > 0 && (
              <span className="absolute -top-2 -right-2 w-5 h-5 bg-white text-black text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                {alertCount}
              </span>
            )}
          </button>

          {/* Time Display */}
          <div className="flex flex-col items-center gap-1.5 py-3 px-2.5 rounded-2xl bg-white/10">
            <FiClock className="text-white" size={16} />
            <span className="text-white font-semibold text-xs text-center tracking-tight">{currentTime}</span>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex flex-col items-center gap-3">
          {/* Settings */}
          <Link 
            href="/kitchen/settings" 
            title="Settings"
            className="w-12 h-12 rounded-2xl bg-black/10 hover:bg-gray-800/20 flex items-center justify-center text-white transition-all hover:shadow-lg"
          >
            <FiSettings size={20} />
          </Link>
          
          {/* Logout */}
          <button 
            title="Logout"
            className="w-12 h-12 rounded-2xl bg-black hover:bg-gray-800 flex items-center justify-center text-white transition-all hover:shadow-lg"
          >
            <FiLogOut size={20} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white px-8 py-5 flex items-center justify-between shadow-md border-b border-gray-100">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-3xl font-bold text-gray-900">Kitchen</h1>
              <span className="inline-flex items-center px-3 py-1 bg-white text-black text-xs font-semibold rounded-full">● Live</span>
            </div>
            <p className="text-gray-500 text-sm font-medium">Prepare and manage orders</p>
          </div>
          
          {/* Header Actions */}
          <div className="flex items-center gap-3">
            {/* Sound Toggle */}
            <button 
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`px-4 py-2 rounded-2xl font-semibold transition-all flex items-center gap-2 text-sm ${
                soundEnabled 
                  ? 'bg-white text-black hover:bg-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {soundEnabled ? '🔔' : '🔇'}
              <span>{soundEnabled ? 'Sound ON' : 'Sound OFF'}</span>
            </button>

            {/* Out of Stock Manager */}
            <div>
              <OutOfStockManager />
            </div>

            {/* Order Stats */}
            <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-2xl">
              <FiTrendingUp className="text-black" size={18} />
              <div className="text-right">
                <p className="text-xs text-gray-600 font-medium">Orders</p>
                <p className="text-lg font-bold text-black">12</p>
              </div>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-auto bg-gray-50/50">
          {children}
        </div>
      </div>
    </div>
  );
}
