'use client';

import { useState } from 'react';
import { FiAlertCircle, FiX, FiClock } from 'react-icons/fi';

interface OutOfStockItem {
  id: string;
  name: string;
  category: string;
  markedAt: Date;
  expectedAvailable?: Date;
}

export default function OutOfStockManager() {
  const [items, setItems] = useState<OutOfStockItem[]>([]);

  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const menuItems = [
    // Pizzas
    { id: 'p1', name: 'Pepperoni Pizza', category: 'Pizzas' },
    { id: 'p2', name: 'Margherita Pizza', category: 'Pizzas' },
    { id: 'p3', name: 'BBQ Chicken Pizza', category: 'Pizzas' },
    
    // Toppings
    { id: 't1', name: 'Pepperoni', category: 'Toppings' },
    { id: 't2', name: 'Extra Cheese', category: 'Toppings' },
    { id: 't3', name: 'Mushrooms', category: 'Toppings' },
    { id: 't4', name: 'Green Peppers', category: 'Toppings' },
    
    // Sides
    { id: 's1', name: 'Chicken Wings', category: 'Sides' },
    { id: 's2', name: 'Garlic Bread', category: 'Sides' },
    
    // Drinks
    { id: 'd1', name: 'Coca Cola', category: 'Drinks' },
    { id: 'd2', name: 'Sprite', category: 'Drinks' },
  ];

  const filteredItems = menuItems.filter(
    item =>
      !items.find(oos => oos.id === item.id) &&
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addOutOfStock = (item: typeof menuItems[0]) => {
    setItems([
      ...items,
      {
        id: item.id,
        name: item.name,
        category: item.category,
        markedAt: new Date(),
      },
    ]);
    setSearchTerm('');
  };

  const removeOutOfStock = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const getMinutesElapsed = (date: Date) => {
    return Math.floor((Date.now() - date.getTime()) / 60000);
  };

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-colors ${
          items.length > 0
            ? 'bg-white text-gray-900 hover:bg-white'
            : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
        }`}
      >
        <FiAlertCircle size={18} />
        <span>Out of Stock</span>
        {items.length > 0 && (
          <span className="ml-1 px-2 py-0.5 bg-black text-white rounded-full text-xs font-black">
            {items.length}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white border-2 border-black rounded-lg shadow-xl z-40 max-h-96 flex flex-col">
          {/* Search Section */}
          <div className="p-4 border-b border-gray-200">
            <input
              type="text"
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-gray-100 text-gray-900 placeholder-gray-500 border border-gray-200 focus:border-black focus:outline-none text-sm"
            />
          </div>

          {/* Current Out of Stock Items */}
          {items.length > 0 && (
            <div className="border-b border-gray-200 p-4 bg-gray-50">
              <p className="text-xs font-bold text-black mb-3 uppercase">Currently Unavailable</p>
              <div className="space-y-2 max-h-36 overflow-y-auto">
                {items.map(item => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2 bg-white border border-black rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="text-gray-900 font-semibold text-sm">{item.name}</p>
                      <div className="flex items-center gap-1 text-black text-xs mt-1">
                        <FiClock size={12} />
                        {getMinutesElapsed(item.markedAt)}m ago
                      </div>
                    </div>
                    <button
                      onClick={() => removeOutOfStock(item.id)}
                      className="ml-2 p-1 hover:bg-white rounded text-black hover:text-black transition-colors"
                    >
                      <FiX size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Available Items to Mark Out of Stock */}
          <div className="p-4 flex-1 overflow-y-auto">
            {filteredItems.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-bold text-gray-500 mb-3 px-2 uppercase">Mark as Out of Stock</p>
                {filteredItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => addOutOfStock(item)}
                    className="w-full text-left px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-900 transition-colors text-sm border border-gray-200"
                  >
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-gray-600 text-xs">{item.category}</p>
                  </button>
                ))}
              </div>
            ) : searchTerm ? (
              <div className="text-center py-8">
                <p className="text-gray-500 text-sm">No items found</p>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 text-sm">All items available! ✓</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-3 bg-gray-50">
            <button
              onClick={() => setIsOpen(false)}
              className="w-full px-3 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold text-sm transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
