'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HiOutlineHome, HiHome,
  HiOutlineSquares2X2, HiSquares2X2,
  HiOutlineBell
} from 'react-icons/hi2';

export default function Navbar() {
  const pathname = usePathname();

  return (
    <>
      <nav className="fixed top-2 md:top-4 left-0 right-0 z-50 px-4 md:px-8 transition-all duration-300 pointer-events-none">
        <div className="mx-auto max-w-7xl">
          <div className="flex h-16 md:h-20 items-center justify-between pointer-events-auto">
            {/* Logo Section */}
            <div className="flex-shrink-0 flex items-center gap-4">
              <Link href="/" className="group flex items-center gap-3 transition-transform duration-500 hover:-translate-y-1">
                <span className="font-black text-xl md:text-2xl tracking-tighter text-black uppercase">
                  Vera<span className="text-gray-500">Cutting</span>Links
                </span>
              </Link>
            </div>

            {/* Middle Navigation Section - Desktop */}
            <div className="hidden md:flex items-center p-1.5 mx-auto glass-gray rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.08)] relative overflow-hidden">
              <div className="gray-blur-spot -top-16 left-10 h-32 w-32" />
              <div className="gray-blur-spot -bottom-16 right-10 h-32 w-32" />
              <Link
                href="/"
                className={`relative flex items-center gap-2.5 px-5 py-2.5 rounded-full transition-all duration-500 overflow-hidden group ${
                  pathname === '/' ? 'text-white' : 'text-gray-600 hover:text-black'
                }`}
              >
                {pathname === '/' ? (
                  <>
                    <div className="absolute inset-0 bg-black shadow-lg" />
                    <HiHome className="relative text-xl z-10 drop-shadow-sm" />
                    <span className="relative font-bold text-[15px] z-10 drop-shadow-sm">Home</span>
                  </>
                ) : (
                  <>
                    <div className="absolute inset-0 bg-white opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    <HiOutlineHome className="relative text-xl z-10 transition-transform duration-300 group-hover:scale-110" />
                    <span className="relative font-bold text-[15px] z-10">Home</span>
                  </>
                )}
              </Link>
              
              <Link
                href="/products"
                className={`relative flex items-center gap-2.5 px-5 py-2.5 rounded-full transition-all duration-500 overflow-hidden group ${
                  pathname === '/products' ? 'text-white' : 'text-gray-600 hover:text-black'
                }`}
              >
                {pathname === '/products' ? (
                  <>
                    <div className="absolute inset-0 bg-black shadow-lg" />
                    <HiSquares2X2 className="relative text-xl z-10 drop-shadow-sm" />
                    <span className="relative font-bold text-[15px] z-10 drop-shadow-sm">Products</span>
                  </>
                ) : (
                  <>
                    <div className="absolute inset-0 bg-white opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    <HiOutlineSquares2X2 className="relative text-xl z-10 transition-transform duration-300 group-hover:scale-110" />
                    <span className="relative font-bold text-[15px] z-10">Products</span>
                  </>
                )}
              </Link>
            </div>
            
            <div className="flex items-center pl-4 pointer-events-auto">
              <button className="text-gray-500 transition-colors hover:text-black" aria-label="Notifications">
                <HiOutlineBell className="text-2xl" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-4 left-0 right-0 z-[100] px-4 pointer-events-none flex justify-center">
        <div className="flex items-center justify-center gap-6 px-4 glass-gray rounded-[2rem] shadow-[0_20px_40px_rgb(0,0,0,0.12)] h-[70px] pointer-events-auto relative">
          <div className="absolute inset-0 rounded-[2rem] overflow-hidden pointer-events-none">
            <div className="gray-blur-spot -top-10 left-8 h-24 w-24" />
            <div className="gray-blur-spot -bottom-10 right-8 h-24 w-24" />
          </div>
          <Link
            href="/"
            className="relative flex flex-col items-center justify-center h-full w-14 group"
          >
            {pathname === '/' ? (
              <>
                <div className="absolute -top-3 flex flex-col items-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black text-white shadow-xl">
                    <HiHome className="text-2xl drop-shadow-sm" />
                  </div>
                </div>
                <span className="absolute bottom-1.5 text-[10px] font-black text-black">Home</span>
              </>
            ) : (
              <>
                <HiOutlineHome className="text-[26px] text-gray-400 transition-colors group-hover:text-black" />
                <span className="mt-0.5 text-[10px] font-bold text-gray-400 transition-colors group-hover:text-black">Home</span>
              </>
            )}
          </Link>
          
          <Link
            href="/products"
            className="relative flex flex-col items-center justify-center h-full w-14 group"
          >
            {pathname === '/products' ? (
              <>
                <div className="absolute -top-3 flex flex-col items-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black text-white shadow-xl">
                    <HiSquares2X2 className="text-2xl drop-shadow-sm" />
                  </div>
                </div>
                <span className="absolute bottom-1.5 text-[10px] font-black text-black">Shop</span>
              </>
            ) : (
              <>
                <HiOutlineSquares2X2 className="text-[26px] text-gray-400 transition-colors group-hover:text-black" />
                <span className="mt-0.5 text-[10px] font-bold text-gray-400 transition-colors group-hover:text-black">Shop</span>
              </>
            )}
          </Link>
        </div>
      </div>
    </>
  );
}
