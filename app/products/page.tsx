'use client';

import { Suspense, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { HiOutlineMagnifyingGlass } from 'react-icons/hi2';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useProducts } from '@/hooks/useProducts';
import ProductCard from '@/components/ProductCard';
import ProductGridSkeleton from '@/components/ProductGridSkeleton';

function ProductsPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name-asc');
  const { products: allProducts, loading, error } = useProducts();

  const requestedCategory = searchParams.get('category')?.trim() || '';
  const categories = useMemo(
    () => ['All', ...Array.from(new Set(allProducts.map(product => product.category)))],
    [allProducts]
  );
  const activeCategory = useMemo(() => {
    if (!requestedCategory) return 'All';
    const matched = categories.find(category => category.toLowerCase() === requestedCategory.toLowerCase());
    return matched || requestedCategory;
  }, [requestedCategory, categories]);

  const setCategoryInUrl = (category: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (category === 'All') {
      params.delete('category');
    } else {
      params.set('category', category);
    }

    const queryString = params.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
  };

  const parsePrice = (price: string) => Number(price.replace(/[^0-9.]/g, ''));
  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredProducts = allProducts.filter(product => {
    const matchesCategory =
      activeCategory === 'All' ||
      product.category.toLowerCase() === activeCategory.toLowerCase();
    const matchesQuery =
      normalizedQuery.length === 0 ||
      product.name.toLowerCase().includes(normalizedQuery) ||
      product.category.toLowerCase().includes(normalizedQuery);
    return matchesCategory && matchesQuery;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'price-asc') return parsePrice(a.price) - parsePrice(b.price);
    if (sortBy === 'price-desc') return parsePrice(b.price) - parsePrice(a.price);
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-8 pt-24 md:px-8 md:py-16 md:pt-32">
        <>
          <div className="mb-12 md:mb-16">
            <div className="mb-10 flex flex-col items-center">
              <span className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-black md:text-sm">Storefront</span>
              <h1 className="text-3xl font-black tracking-tight text-gray-800 md:text-5xl">All Products</h1>
              <div className="mt-6 h-1.5 w-16 rounded-full bg-gradient-to-r from-black to-gray-900 shadow-sm" />
            </div>

            {/* Search Bar */}
            <div className="group relative mx-auto max-w-2xl">
               <div className="absolute inset-0 rounded-[2rem] bg-white opacity-0 blur-xl transition-opacity duration-500 group-focus-within:opacity-60" />
               <div className="relative flex items-center rounded-[2rem] bg-white shadow-sm ring-1 ring-gray-200 transition-shadow duration-300 focus-within:shadow-md focus-within:ring-black hover:ring-gray-300">
                 <HiOutlineMagnifyingGlass className="absolute left-5 text-2xl text-gray-400 transition-colors duration-300 group-focus-within:text-black md:left-6" />
                 <input
                   type="text"
                   placeholder="Search for jewelry, rings, necklaces..."
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   className="w-full bg-transparent py-4 pl-14 pr-6 font-medium text-gray-800 placeholder:text-gray-400 focus:outline-none md:py-5 md:pl-16 text-lg"
                 />
               </div>
            </div>

            {/* Filters */}
            <div className="mt-10 flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
              <div className="flex flex-wrap items-center gap-3">
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => setCategoryInUrl(category)}
                    className={`rounded-full px-5 py-2.5 text-sm font-bold transition-all duration-300 ${
                      activeCategory === category
                        ? 'bg-gradient-to-r from-black to-gray-900 text-white shadow-lg shadow-none ring-1 ring-black'
                        : 'bg-white text-gray-600 shadow-sm ring-1 ring-gray-200 hover:text-black hover:shadow-md hover:ring-black'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
              <div className="flex shrink-0 items-center gap-3 relative">
                <label htmlFor="sort" className="text-xs font-black uppercase tracking-wider text-gray-500 md:text-sm">Sort by</label>
                <div className="relative">
                  <select
                    id="sort"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="cursor-pointer appearance-none rounded-full bg-white px-5 py-2.5 pr-10 text-sm font-bold text-gray-700 shadow-sm ring-1 ring-gray-200 transition-all focus:outline-none focus:ring-2 focus:ring-black hover:ring-gray-300"
                  >
                    <option value="name-asc">Name (A-Z)</option>
                    <option value="price-asc">Price (Low-High)</option>
                    <option value="price-desc">Price (High-Low)</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                    <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Results */}
          <div>
            {error && (
              <div className="text-center py-20 mb-6 bg-white border border-black rounded-lg">
                <p className="text-xl text-black">Error: {error}</p>
              </div>
            )}

            {searchQuery && !loading && (
              <h2 className="text-2xl font-black text-gray-800 mb-6">
                {sortedProducts.length} Results for &quot;{searchQuery}&quot;
              </h2>
            )}

            {loading ? (
              <ProductGridSkeleton count={8} gridClassName="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 xl:grid-cols-4 lg:gap-8" />
            ) : sortedProducts.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 xl:grid-cols-4 lg:gap-8">
                {sortedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : searchQuery ? (
              <div className="text-center py-20">
                <p className="text-xl text-gray-500">No results found for &quot;{searchQuery}&quot;</p>
              </div>
            ) : null}
          </div>
        </>
      </main>

      <Footer />
    </div>
  );
}

function ProductsPageFallback() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 pt-24 md:px-8 md:py-16 md:pt-32">
        <ProductGridSkeleton count={8} gridClassName="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 xl:grid-cols-4 lg:gap-8" />
      </main>
      <Footer />
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<ProductsPageFallback />}>
      <ProductsPageContent />
    </Suspense>
  );
}
