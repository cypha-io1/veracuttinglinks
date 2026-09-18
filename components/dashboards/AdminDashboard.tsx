'use client';

import React, { useState } from 'react';
import { FiUsers, FiShoppingCart, FiTrendingUp, FiAlertCircle, FiEdit2, FiTrash2, FiPlus, FiMenu, FiX, FiLogOut, FiHome, FiBox, FiClipboard } from 'react-icons/fi';

interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  status: 'active' | 'inactive';
}

interface Order {
  id: string;
  customer: string;
  total: number;
  status: 'pending' | 'completed' | 'cancelled';
  date: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'customer' | 'driver';
  joined: string;
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [products, setProducts] = useState<Product[]>([
    { id: 1, name: 'Margherita Pizza', category: 'Pizza', price: 599, stock: 45, status: 'active' },
    { id: 2, name: 'Fried Chicken', category: 'Chicken', price: 349, stock: 30, status: 'active' },
    { id: 3, name: 'Pepperoni Pizza', category: 'Pizza', price: 749, stock: 0, status: 'inactive' },
    { id: 4, name: 'Garlic Bread', category: 'Sides', price: 199, stock: 60, status: 'active' },
  ]);

  const [orders, setOrders] = useState<Order[]>([
    { id: '#001', customer: 'John Doe', total: 1299, status: 'completed', date: '2024-01-15' },
    { id: '#002', customer: 'Jane Smith', total: 899, status: 'pending', date: '2024-01-16' },
    { id: '#003', customer: 'Mike Johnson', total: 1599, status: 'completed', date: '2024-01-16' },
  ]);

  const [users, setUsers] = useState<User[]>([
    { id: 1, name: 'Admin User', email: 'admin@pizzacity.com', role: 'admin', joined: '2023-12-01' },
    { id: 2, name: 'John Driver', email: 'john@pizzacity.com', role: 'driver', joined: '2024-01-05' },
    { id: 3, name: 'Alice Customer', email: 'alice@example.com', role: 'customer', joined: '2024-01-10' },
  ]);

  const stats = [
    { icon: FiShoppingCart, label: 'Total Orders', value: '1,234', change: '+12% from last month' },
    { icon: FiUsers, label: 'Total Users', value: '892', change: '+5% from last month' },
    { icon: FiTrendingUp, label: 'Revenue', value: '₹5,43,200', change: '+18% from last month' },
    { icon: FiAlertCircle, label: 'Low Stock Items', value: '3', change: 'Urgent: Pepperoni Pizza' },
  ];

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: FiHome },
    { id: 'products', label: 'Products', icon: FiBox },
    { id: 'orders', label: 'Orders', icon: FiClipboard },
    { id: 'users', label: 'Users', icon: FiUsers },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-gray-900 text-white transition-all duration-300 fixed h-screen flex flex-col`}>
        {/* Logo Section */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          {sidebarOpen && <h2 className="text-xl font-bold">Pizzacity</h2>}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-800 rounded-lg transition"
          >
            {sidebarOpen ? <FiX size={20} /> : <FiMenu size={20} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                  activeTab === item.id
                    ? 'bg-white text-white'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
                title={!sidebarOpen ? item.label : ''}
              >
                <Icon size={20} />
                {sidebarOpen && <span className="font-medium">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="border-t border-gray-700 p-4">
          <button className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition ${sidebarOpen ? '' : 'justify-center'}`}>
            <FiLogOut size={20} />
            {sidebarOpen && <span className="text-sm">Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className={`${sidebarOpen ? 'ml-64' : 'ml-20'} flex-1 flex flex-col transition-all duration-300`}>
        {/* Top Header */}
        <div className="bg-white shadow sticky top-0 z-10">
          <div className="px-8 py-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-white font-bold cursor-pointer hover:bg-gray-800 transition">
                A
              </div>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-auto">
          <div className="p-8">
            {/* Title Section */}
            <div className="mb-6">
              <p className="text-gray-600">
                {activeTab === 'overview' && 'Manage your dashboard and view key metrics'}
                {activeTab === 'products' && 'Manage all products and inventory'}
                {activeTab === 'orders' && 'View and manage all orders'}
                {activeTab === 'users' && 'Manage users and their roles'}
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {stats.map((stat, idx) => {
                const Icon = stat.icon;
                return (
                  <div key={idx} className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-500 text-sm font-medium">{stat.label}</p>
                        <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
                        <p className="text-xs text-gray-400 mt-2">{stat.change}</p>
                      </div>
                      <Icon className="text-black text-3xl" />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Content */}
            <div className="bg-white rounded-lg shadow">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="p-6">
                  <h2 className="text-lg font-semibold mb-4">Dashboard Overview</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="border rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-4">Recent Orders</h3>
                      <div className="space-y-3">
                        {orders.slice(0, 3).map((order) => (
                          <div key={order.id} className="flex justify-between items-center py-2 border-b">
                            <div>
                              <p className="font-medium text-gray-900">{order.customer}</p>
                              <p className="text-xs text-gray-500">{order.date}</p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              order.status === 'completed' ? 'bg-white text-black' :
                              order.status === 'pending' ? 'bg-white text-black' :
                              'bg-white text-black'
                            }`}>
                              {order.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="border rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-4">System Status</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Server Status</span>
                          <span className="text-black font-medium">Online</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Database</span>
                          <span className="text-black font-medium">Healthy</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">API Status</span>
                          <span className="text-black font-medium">Running</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Products Tab */}
              {activeTab === 'products' && (
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold">Products</h2>
                    <button className="bg-black text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-800">
                      <FiPlus /> Add Product
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Name</th>
                          <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Category</th>
                          <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Price</th>
                          <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Stock</th>
                          <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Status</th>
                          <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.map((product) => (
                          <tr key={product.id} className="border-t hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900">{product.name}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{product.category}</td>
                            <td className="px-4 py-3 text-sm font-medium">₹{product.price}</td>
                            <td className="px-4 py-3 text-sm">
                              <span className={product.stock === 0 ? 'text-black font-medium' : 'text-gray-600'}>
                                {product.stock} units
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                product.status === 'active' ? 'bg-white text-black' : 'bg-gray-100 text-gray-800'
                              }`}>
                                {product.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm flex gap-2">
                              <button className="text-black hover:text-black"><FiEdit2 /></button>
                              <button className="text-black hover:text-black"><FiTrash2 /></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Orders Tab */}
              {activeTab === 'orders' && (
                <div className="p-6">
                  <h2 className="text-lg font-semibold mb-4">All Orders</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Order ID</th>
                          <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Customer</th>
                          <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Total</th>
                          <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Date</th>
                          <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Status</th>
                          <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((order) => (
                          <tr key={order.id} className="border-t hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{order.id}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{order.customer}</td>
                            <td className="px-4 py-3 text-sm font-medium">₹{order.total}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{order.date}</td>
                            <td className="px-4 py-3 text-sm">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                order.status === 'completed' ? 'bg-white text-black' :
                                order.status === 'pending' ? 'bg-white text-black' :
                                'bg-white text-black'
                              }`}>
                                {order.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <button className="text-black hover:text-black text-xs">View Details</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Users Tab */}
              {activeTab === 'users' && (
                <div className="p-6">
                  <h2 className="text-lg font-semibold mb-4">Users Management</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Name</th>
                          <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Email</th>
                          <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Role</th>
                          <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Joined</th>
                          <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((user) => (
                          <tr key={user.id} className="border-t hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{user.name}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{user.email}</td>
                            <td className="px-4 py-3 text-sm">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                user.role === 'admin' ? 'bg-white text-black' :
                                user.role === 'driver' ? 'bg-white text-black' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {user.role}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">{user.joined}</td>
                            <td className="px-4 py-3 text-sm flex gap-2">
                              <button className="text-black hover:text-black"><FiEdit2 /></button>
                              <button className="text-black hover:text-black"><FiTrash2 /></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
