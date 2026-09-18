'use client';

import React, { useState } from 'react';
import { FiMenu, FiX, FiLogOut, FiHome, FiShoppingCart, FiCoffee, FiPackage, FiMapPin, FiTruck, FiUsers, FiCreditCard, FiGift, FiTrendingUp, FiMessageSquare, FiSettings, FiBell, FiSearch, FiMail } from 'react-icons/fi';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const pathname = usePathname();

  const menuSections = [
    {
      label: 'Main',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: FiHome, href: '/admin/dashboard' },
      ],
    },
    {
      label: 'Operations',
      items: [
        { id: 'orders', label: 'Orders', icon: FiShoppingCart, href: '/admin/orders' },
        { id: 'menu', label: 'Menu', icon: FiCoffee, href: '/admin/menu' },
        { id: 'inventory', label: 'Inventory', icon: FiPackage, href: '/admin/inventory' },
      ],
    },
    {
      label: 'Business',
      items: [
        { id: 'branches', label: 'Branches', icon: FiMapPin, href: '/admin/branches' },
        { id: 'delivery', label: 'Delivery', icon: FiTruck, href: '/admin/delivery' },
        { id: 'customers', label: 'Customers', icon: FiUsers, href: '/admin/customers' },
      ],
    },
    {
      label: 'Finance & Growth',
      items: [
        { id: 'payments', label: 'Payments', icon: FiCreditCard, href: '/admin/payments' },
        { id: 'promotions', label: 'Promotions', icon: FiGift, href: '/admin/promotions' },
        { id: 'reports', label: 'Reports', icon: FiTrendingUp, href: '/admin/reports' },
      ],
    },
    {
      label: 'Management',
      items: [
        { id: 'reviews', label: 'Reviews', icon: FiMessageSquare, href: '/admin/reviews' },
        { id: 'support', label: 'Support', icon: FiMail, href: '/admin/support' },
        { id: 'staff', label: 'Staff', icon: FiUsers, href: '/admin/staff' },
        { id: 'settings', label: 'Settings', icon: FiSettings, href: '/admin/settings' },
      ],
    },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div
        className={`${
          isSidebarOpen ? 'w-64' : 'w-20'
        } bg-white transition-all duration-300 flex flex-col fixed h-screen z-40 shadow-lg`}
      >
        {/* Logo/Header */}
        <div className="p-6 flex items-center justify-between border-b border-black">
          {isSidebarOpen && (
            <div className="flex items-center gap-3">
              <Image src="/logo.png" alt="Logo" width={32} height={32} className="w-8 h-8" />
              <h2 className="text-lg font-bold text-white">PizzaCity</h2>
            </div>
          )}
          {!isSidebarOpen && (
            <Image src="/logo.png" alt="Logo" width={28} height={28} className="w-7 h-7 mx-auto" />
          )}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-800 text-white transition-all duration-200 hover:scale-110"
          >
            {isSidebarOpen ? <FiX size={20} /> : <FiMenu size={20} />}
          </button>
        </div>

        {/* Menu */}
        <nav className="flex-1 overflow-y-auto px-3 py-6 space-y-8 scrollbar-hide">
          {menuSections.map((section) => (
            <div key={section.label}>
              {isSidebarOpen && (
                <p className="text-xs font-bold text-black uppercase px-3 mb-3 tracking-widest">{section.label}</p>
              )}
              <div className="space-y-2">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 ${
                        isActive
                          ? 'bg-white border-l-4 border-black text-white font-semibold'
                          : 'text-black hover:bg-white hover:text-white'
                      }`}
                    >
                      <Icon size={20} />
                      {isSidebarOpen && <span className="text-sm">{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-6 border-t border-black">
          <button className="w-full flex items-center justify-center gap-2 px-3 py-3 rounded-lg bg-white text-black hover:bg-white transition-all duration-200 font-medium hover:shadow-md">
            <FiLogOut size={18} />
            {isSidebarOpen && <span className="text-sm">Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className={`${isSidebarOpen ? 'ml-64' : 'ml-20'} flex-1 flex flex-col transition-all duration-300`}>
        {/* Top Header */}
        <div className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between sticky top-0 z-30 shadow-sm">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-xs text-gray-500 mt-1">Manage your restaurant operations</p>
          </div>
          
          <div className="flex items-center gap-6">
            {/* Search */}
            <div className={`relative transition-all duration-300 ${isSearchOpen ? 'w-64' : 'w-10'}`}>
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="absolute right-0 top-1/2 transform -translate-y-1/2 p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-all"
              >
                <FiSearch size={18} />
              </button>
              {isSearchOpen && (
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                  autoFocus
                />
              )}
            </div>

            {/* Notifications */}
            <button className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-all hover:scale-110 group">
              <FiBell size={20} />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-white rounded-full animate-pulse"></span>
              <div className="hidden group-hover:block absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg p-4 border border-gray-200 z-50">
                <p className="text-sm font-semibold text-gray-900 mb-2">Notifications</p>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  <div className="p-2 bg-white rounded border-l-4 border-black text-sm">New order #1007 received</div>
                  <div className="p-2 bg-white rounded border-l-4 border-black text-sm">Low stock: Mozzarella Cheese</div>
                </div>
              </div>
            </button>

            {/* Profile */}
            <div className="flex items-center gap-3 pl-6 border-l border-gray-200">
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">Admin User</p>
                <p className="text-xs text-gray-500">Super Admin</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-white text-black flex items-center justify-center font-bold hover:bg-white transition-colors">
                A
              </div>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-auto">
          <div className="p-8">
            {children}
          </div>
        </div>
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
