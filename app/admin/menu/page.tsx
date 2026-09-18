'use client';

import React, { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiX } from 'react-icons/fi';

interface MenuItem {
  id: number;
  name: string;
  description: string;
  category: string;
  price: number;
  variants: number;
  available: boolean;
}

interface Category {
  id: number;
  name: string;
  itemCount: number;
}

interface Modifier {
  id: number;
  name: string;
  options: { name: string; price: number }[];
}

export default function MenuPage() {
  const [activeTab, setActiveTab] = useState('products');
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [items] = useState<MenuItem[]>([
    { id: 1, name: 'Margherita Pizza', description: 'Classic tomato and mozzarella', category: 'Pizzas', price: 34.90, variants: 3, available: true },
    { id: 2, name: 'Pepperoni Pizza', description: 'Pepperoni with extra cheese', category: 'Pizzas', price: 39.90, variants: 3, available: true },
    { id: 3, name: 'Chicken Pizza', description: 'Grilled chicken and bell peppers', category: 'Pizzas', price: 44.90, variants: 3, available: false },
    { id: 4, name: 'Garlic Bread', description: 'Crispy garlic bread', category: 'Sides', price: 14.90, variants: 1, available: true },
  ]);

  const [categories] = useState<Category[]>([
    { id: 1, name: 'Pizzas', itemCount: 12 },
    { id: 2, name: 'Sides', itemCount: 5 },
    { id: 3, name: 'Beverages', itemCount: 8 },
    { id: 4, name: 'Desserts', itemCount: 4 },
    { id: 5, name: 'Combos', itemCount: 3 },
  ]);

  const [modifiers] = useState<Modifier[]>([
    {
      id: 1,
      name: 'Size',
      options: [
        { name: 'Small', price: 0 },
        { name: 'Medium', price: 5.00 },
        { name: 'Large', price: 10.00 },
      ],
    },
    {
      id: 2,
      name: 'Crust Type',
      options: [
        { name: 'Thin Crust', price: 0 },
        { name: 'Regular Crust', price: 0 },
        { name: 'Thick Crust', price: 5.00 },
        { name: 'Cheese Burst', price: 10.00 },
      ],
    },
    {
      id: 3,
      name: 'Toppings',
      options: [
        { name: 'Extra Cheese', price: 7.50 },
        { name: 'Jalapenos', price: 5.00 },
        { name: 'Mushrooms', price: 6.00 },
      ],
    },
  ]);

  const filteredItems = items.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <AdminLayout>
      <div className="space-y-6 pb-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Menu Management</h1>
          <button 
            onClick={() => setShowModal(true)} 
            className="bg-black text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 hover:bg-gray-800 hover:shadow-md transition-all duration-200"
          >
            <FiPlus size={20} /> Add Item
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 border-b border-gray-200 bg-white rounded-t-lg">
          {['products', 'categories', 'modifiers'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 font-medium text-sm border-b-2 transition ${
                activeTab === tab
                  ? 'border-black text-black bg-white'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-4 py-3 bg-white focus-within:border-black transition-all duration-200">
              <FiSearch className="text-gray-400" />
              <input
                type="text"
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 outline-none bg-transparent text-gray-900 placeholder-gray-500"
              />
            </div>

            <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Name</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Description</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Category</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Price</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Variants</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200/50">
                  {filteredItems.map(item => (
                    <tr key={item.id} className="hover:bg-white transition-colors duration-200 group">
                      <td className="px-6 py-4 font-bold text-gray-900">{item.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{item.description}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-700">{item.category}</td>
                      <td className="px-6 py-4 text-sm font-bold text-black">₵{item.price.toFixed(2)}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-700">{item.variants}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${
                          item.available 
                            ? 'bg-white text-black border-black' 
                            : 'bg-gray-100/80 text-gray-800 border-gray-300'
                        }`}>
                          {item.available ? '✓ Available' : '✗ Unavailable'}
                        </span>
                      </td>
                      <td className="px-6 py-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button className="p-2 rounded-lg bg-white text-black hover:bg-white hover:scale-110 transition-all"><FiEdit2 size={16} /></button>
                        <button className="p-2 rounded-lg bg-white text-black hover:bg-white hover:scale-110 transition-all"><FiTrash2 size={16} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Categories Tab */}
        {activeTab === 'categories' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map(category => (
              <div 
                key={category.id} 
                className="relative overflow-hidden rounded-lg bg-white p-6 shadow-sm hover:shadow-md border border-gray-200 cursor-pointer"
              >
                {/* Background Gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-black to-gray-900 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                
                {/* Content */}
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="font-bold text-gray-900 text-lg">{category.name}</h3>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button className="p-2 rounded-lg bg-white text-black hover:bg-white hover:scale-110 transition-all"><FiEdit2 size={16} /></button>
                      <button className="p-2 rounded-lg bg-white text-black hover:bg-white hover:scale-110 transition-all"><FiTrash2 size={16} /></button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600"><span className="font-bold text-gray-900">{category.itemCount}</span> items</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modifiers Tab */}
        {activeTab === 'modifiers' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modifiers.map(modifier => (
              <div 
                key={modifier.id} 
                className="relative overflow-hidden rounded-lg bg-white p-6 shadow-sm hover:shadow-md border border-gray-200"
              >
                {/* Background Gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-black to-gray-900 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                
                {/* Content */}
                <div className="relative z-10">
                  <h3 className="font-bold text-gray-900 mb-4 text-lg">{modifier.name}</h3>
                  <div className="space-y-3">
                    {modifier.options.map((option, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200/50">
                        <span className="text-gray-700 font-medium">{option.name}</span>
                        {option.price > 0 && <span className="font-bold text-black">+₵{option.price.toFixed(2)}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl p-8 max-w-md w-full ring-1 ring-slate-200/50 animate-in slide-in-from-bottom-4 duration-300 relative overflow-hidden">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Add Item</h3>
              <button 
                onClick={() => setShowModal(false)} 
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <FiX size={20} className="text-gray-600" />
              </button>
            </div>
            <div className="space-y-4 mb-6">
              <input 
                type="text" 
                placeholder="Item Name" 
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all" 
              />
              <textarea 
                placeholder="Description" 
                className="w-full px-4 py-3 border border-gray-300 rounded-xl h-20 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all resize-none" 
              />
              <input 
                type="number" 
                placeholder="Price (₵)" 
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all" 
              />
              <select className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all bg-white">
                <option>Select Category</option>
                {categories.map(cat => <option key={cat.id}>{cat.name}</option>)}
              </select>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowModal(false)} 
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button className="flex-1 px-4 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 hover:shadow-md transition-colors">
                  Add Item
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
