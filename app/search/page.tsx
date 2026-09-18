'use client';

import { useState } from 'react';
import { FiSearch, FiShoppingCart } from 'react-icons/fi';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProductViewModal, { ProductViewItem } from '@/components/ProductViewModal';

interface Product {
  id: number;
  name: string;
  price: string;
  image: string;
  category: string;
}

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [sortBy, setSortBy] = useState('name-asc');
  const [selectedProduct, setSelectedProduct] = useState<ProductViewItem | null>(null);

  const allProducts: Product[] = [
    { id: 1, name: 'Pepperoni Pizza', price: 'GH₵45', image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400&q=80', category: 'Pizza' },
    { id: 2, name: 'Fried Chicken', price: 'GH₵35', image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400&q=80', category: 'Chicken' },
    { id: 3, name: 'BBQ Wings', price: 'GH₵40', image: 'https://images.unsplash.com/photo-1608039755401-742074f0548d?w=400&q=80', category: 'Chicken' },
    { id: 4, name: 'Margherita Pizza', price: 'GH₵42', image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&q=80', category: 'Pizza' },
    { id: 5, name: 'Chicken Burger', price: 'GH₵30', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80', category: 'Sides' },
    { id: 6, name: 'French Fries', price: 'GH₵15', image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&q=80', category: 'Sides' },
  ];

  const categories = ['All', ...Array.from(new Set(allProducts.map(product => product.category)))];

  const parsePrice = (price: string) => Number(price.replace(/[^0-9.]/g, ''));
  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredProducts = allProducts.filter(product => {
    const matchesCategory = activeCategory === 'All' || product.category === activeCategory;
    const matchesQuery =
      normalizedQuery.length === 0 ||
      product.name.toLowerCase().includes(normalizedQuery) ||
      product.category.toLowerCase().includes(normalizedQuery);
    return matchesCategory && matchesQuery;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'price-asc') {
      return parsePrice(a.price) - parsePrice(b.price);
    }
    if (sortBy === 'price-desc') {
      return parsePrice(b.price) - parsePrice(a.price);
    }
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-12">
        <div className="mb-12">
          <h1 className="text-2xl md:text-4xl font-black text-gray-800 mb-4 md:mb-6 text-center">Search Menu</h1>
          
          {/* Search Bar */}
          <div className="relative max-w-2xl mx-auto">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-gray-400" />
            <input
              type="text"
              placeholder="Search for pizza, chicken, sides..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-14 pr-6 py-4 rounded-full border-2 border-gray-200 focus:border-black focus:outline-none text-lg"
            />
          </div>

          {/* Filters */}
          <div className="mt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors border ${
                    activeCategory === category
                      ? 'bg-white text-white border-black'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-black'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="sort" className="text-sm font-semibold text-gray-600">Sort</label>
              <select
                id="sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm font-semibold text-gray-700 focus:outline-none focus:border-black"
              >
                <option value="name-asc">Name (A-Z)</option>
                <option value="price-asc">Price (Low-High)</option>
                <option value="price-desc">Price (High-Low)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results */}
        <div>
          {searchQuery && (
            <h2 className="text-2xl font-black text-gray-800 mb-6">
              {sortedProducts.length} Results for "{searchQuery}"
            </h2>
          )}
          
          {sortedProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {sortedProducts.map((product) => (
                <div
                  key={product.id}
                  className="cursor-pointer"
                  onClick={() => setSelectedProduct(product)}
                >
                  <div className="relative h-40 bg-gray-100 rounded-xl overflow-hidden shadow-lg mb-3 group">
                    <Image src={product.image} alt={product.name} fill className="object-cover" />
                    <button className="absolute top-2 right-2 w-10 h-10 bg-white hover:bg-white rounded-full flex items-center justify-center md:opacity-0 md:group-hover:opacity-100 transition-opacity shadow-lg">
                      <FiShoppingCart className="text-gray-900 text-lg" />
                    </button>
                  </div>
                  <div className="text-center">
                    <h3 className="font-bold text-gray-800 text-sm mb-2">{product.name}</h3>
                    <div className="bg-white rounded-lg px-3 py-1.5 inline-block">
                      <p className="text-white font-black text-sm">{product.price}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-xl text-gray-500">No results found for "{searchQuery}"</p>
            </div>
          )}
        </div>
      </main>

      <Footer />

      <ProductViewModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
    </div>
  );
}
