'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HiOutlineHome, HiHome,
  HiOutlineSquares2X2, HiSquares2X2,
  HiOutlineBell,
  HiOutlineUser, HiUser
} from 'react-icons/hi2';

export default function Navbar() {
  const pathname = usePathname();

  return (
    <>
      <nav className="fixed top-2 md:top-3 left-0 right-0 z-50 px-3 md:px-6 transition-all duration-300 pointer-events-none">
        <div className="mx-auto max-w-7xl">
          <div className="flex h-14 md:h-16 items-center justify-between pointer-events-auto bg-white/70 backdrop-blur-xl border border-white/40 shadow-sm rounded-full px-4 md:px-6">
            {/* Logo Section */}
            <div className="flex-shrink-0 flex items-center gap-3">
              <Link href="/" className="group flex items-center gap-2 transition-transform duration-500 hover:-translate-y-0.5">
                <span className="font-black text-lg md:text-xl tracking-tighter text-black uppercase">
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
              <Link
                href="/account"
                className={`relative flex items-center gap-2.5 px-5 py-2.5 rounded-full transition-all duration-500 overflow-hidden group ${
                  pathname === '/account' ? 'text-white' : 'text-gray-600 hover:text-black'
                }`}
              >
                {pathname === '/account' ? (
                  <>
                    <div className="absolute inset-0 bg-black shadow-lg" />
                    <HiUser className="relative text-xl z-10 drop-shadow-sm" />
                    <span className="relative font-bold text-[15px] z-10 drop-shadow-sm">Account</span>
                  </>
                ) : (
                  <>
                    <div className="absolute inset-0 bg-white opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    <HiOutlineUser className="relative text-xl z-10 transition-transform duration-300 group-hover:scale-110" />
                    <span className="relative font-bold text-[15px] z-10">Account</span>
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
      <div className="md:hidden fixed bottom-4 left-0 right-0 z-50 px-4 pointer-events-none flex justify-center">
        <div className="flex items-center p-1.5 mx-auto glass-gray rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] pointer-events-auto relative overflow-hidden">
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
                <span className="relative font-bold text-[15px] z-10 drop-shadow-sm">Shop</span>
              </>
            ) : (
              <>
                <div className="absolute inset-0 bg-white opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <HiOutlineSquares2X2 className="relative text-xl z-10 transition-transform duration-300 group-hover:scale-110" />
                <span className="relative font-bold text-[15px] z-10">Shop</span>
              </>
            )}
          </Link>

          <Link
            href="/account"
            className={`relative flex items-center gap-2.5 px-5 py-2.5 rounded-full transition-all duration-500 overflow-hidden group ${
              pathname === '/account' ? 'text-white' : 'text-gray-600 hover:text-black'
            }`}
          >
            {pathname === '/account' ? (
              <>
                <div className="absolute inset-0 bg-black shadow-lg" />
                <HiUser className="relative text-xl z-10 drop-shadow-sm" />
                <span className="relative font-bold text-[15px] z-10 drop-shadow-sm">Account</span>
              </>
            ) : (
              <>
                <div className="absolute inset-0 bg-white opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <HiOutlineUser className="relative text-xl z-10 transition-transform duration-300 group-hover:scale-110" />
                <span className="relative font-bold text-[15px] z-10">Account</span>
              </>
            )}
          </Link>
        </div>
      </div>
    </>
  );
}
