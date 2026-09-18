'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  HiOutlineHome, HiHome,
  HiOutlineSquares2X2, HiSquares2X2,
  HiOutlineShoppingCart, HiShoppingCart,
  HiOutlineClock, HiClock,
  HiOutlineUser,
  HiOutlineViewColumns,
  HiOutlineMagnifyingGlass, HiMagnifyingGlass
} from 'react-icons/hi2';
import { useCart } from '@/hooks/useCart';

export default function Navbar() {
  const pathname = usePathname();
  const { totalItems } = useCart();
  const [authState, setAuthState] = useState<{ isLoggedIn: boolean; role?: 'user' | 'admin' }>({
    isLoggedIn: false,
  });
  const badgeText = totalItems > 99 ? '99+' : String(totalItems);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me', { cache: 'no-store' });
        if (!response.ok) {
          setAuthState({ isLoggedIn: false });
          return;
        }

        const payload = (await response.json()) as {
          authenticated?: boolean;
          profile?: { role?: 'user' | 'admin' };
        };
        setAuthState({
          isLoggedIn: Boolean(payload.authenticated),
          role: payload.profile?.role,
        });
      } catch {
        setAuthState({ isLoggedIn: false });
      }
    };

    checkAuth();
  }, []);

  const profileHref = authState.isLoggedIn
    ? authState.role === 'admin'
      ? '/admin/dashboard'
      : '/dashboard'
    : '/account';

  return (
    <>
      <nav className="fixed top-2 md:top-4 left-0 right-0 z-50 px-4 md:px-8 transition-all duration-300 pointer-events-none">
        <div className="mx-auto max-w-7xl">
          <div className="flex h-16 md:h-20 items-center justify-between pointer-events-auto">
            {/* Logo Section */}
            <div className="flex-shrink-0">
              <Link href="/" className="group flex items-center gap-3 transition-transform duration-500 hover:-translate-y-1">
                <Image
                  src="/logo.png"
                  alt="Zhilakaii Logo"
                  width={64}
                  height={64}
                  className="md:w-[72px] md:h-[72px] object-contain transition-transform duration-500 group-hover:scale-110 drop-shadow-md"
                />
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
                href="/cart"
                className={`relative flex items-center gap-2.5 px-5 py-2.5 rounded-full transition-all duration-500 overflow-hidden group ${
                  pathname === '/cart' ? 'text-white' : 'text-gray-600 hover:text-black'
                }`}
              >
                {pathname === '/cart' ? (
                  <>
                    <div className="absolute inset-0 bg-black shadow-lg" />
                    <HiShoppingCart className="relative text-xl z-10 drop-shadow-sm" />
                    <span className="relative font-bold text-[15px] z-10 drop-shadow-sm">Cart</span>
                    <span className="absolute -top-0.5 right-1.5 bg-white text-black text-[10px] font-black rounded-full h-4 w-4 flex items-center justify-center shadow-sm z-20">
                      {badgeText}
                    </span>
                  </>
                ) : (
                  <>
                    <div className="absolute inset-0 bg-white opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    <div className="relative z-10">
                      <HiOutlineShoppingCart className="text-xl transition-transform duration-300 group-hover:scale-110" />
                      {totalItems > 0 && (
                        <span className="absolute -top-2 -right-2 bg-black text-white text-[9px] font-black rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center border border-white shadow-sm ring-1 ring-black">
                          {badgeText}
                        </span>
                      )}
                    </div>
                    <span className="relative font-bold text-[15px] z-10">Cart</span>
                  </>
                )}
              </Link>

              <Link
                href="/history"
                className={`relative flex items-center gap-2.5 px-5 py-2.5 rounded-full transition-all duration-500 overflow-hidden group ${
                  pathname === '/history' ? 'text-white' : 'text-gray-600 hover:text-black'
                }`}
              >
                {pathname === '/history' ? (
                  <>
                    <div className="absolute inset-0 bg-black shadow-lg" />
                    <HiClock className="relative text-xl z-10 drop-shadow-sm" />
                    <span className="relative font-bold text-[15px] z-10 drop-shadow-sm">History</span>
                  </>
                ) : (
                  <>
                    <div className="absolute inset-0 bg-white opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    <HiOutlineClock className="relative text-xl z-10 transition-transform duration-300 group-hover:scale-110" />
                    <span className="relative font-bold text-[15px] z-10">History</span>
                  </>
                )}
              </Link>

              <Link
                href="/track-order"
                className={`relative flex items-center gap-2.5 px-5 py-2.5 rounded-full transition-all duration-500 overflow-hidden group ${
                  pathname === '/track-order' ? 'text-white' : 'text-gray-600 hover:text-black'
                }`}
              >
                {pathname === '/track-order' ? (
                  <>
                    <div className="absolute inset-0 bg-black shadow-lg" />
                    <HiMagnifyingGlass className="relative text-xl z-10 drop-shadow-sm stroke-[3px]" />
                    <span className="relative font-bold text-[15px] z-10 drop-shadow-sm">Track</span>
                  </>
                ) : (
                  <>
                    <div className="absolute inset-0 bg-white opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    <HiOutlineMagnifyingGlass className="relative text-xl z-10 transition-transform duration-300 group-hover:scale-110" />
                    <span className="relative font-bold text-[15px] z-10">Track</span>
                  </>
                )}
              </Link>
            </div>

            {/* Account Section - Desktop */}
            <div className="hidden md:flex items-center pl-4 pointer-events-auto">
              <Link
                href={profileHref}
                className="group relative flex items-center justify-center w-12 h-12 rounded-full overflow-hidden transition-all duration-500 bg-white shadow-sm hover:shadow-md hover:shadow-none ring-1 ring-gray-100 hover:ring-black"
              >
                <div className="absolute inset-0 bg-white opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                {authState.isLoggedIn && authState.role === 'admin' ? (
                  <HiOutlineViewColumns className="relative text-[22px] text-gray-600 transition-all duration-300 group-hover:text-black group-hover:scale-110" />
                ) : (
                  <HiOutlineUser className="relative text-[22px] text-gray-600 transition-all duration-300 group-hover:text-black group-hover:scale-110" />
                )}
              </Link>
            </div>

            {/* Account Section - Mobile */}
            <div className="md:hidden flex items-center pointer-events-auto">
              <Link
                href={profileHref}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-white/80 backdrop-blur-md shadow-sm border border-gray-100 transition-all active:scale-95"
              >
                {authState.isLoggedIn && authState.role === 'admin' ? (
                  <HiOutlineViewColumns className="text-xl text-gray-700" />
                ) : (
                  <HiOutlineUser className="text-xl text-gray-700" />
                )}
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-4 left-0 right-0 z-[100] px-4 pointer-events-none">
        <div className="flex items-center justify-between px-2 glass-gray rounded-[2rem] shadow-[0_20px_40px_rgb(0,0,0,0.12)] max-w-[380px] mx-auto h-[70px] pointer-events-auto relative">
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

          <Link
            href="/cart"
            className="relative flex flex-col items-center justify-center h-full w-14 group"
          >
            {pathname === '/cart' ? (
              <>
                <div className="absolute -top-3 flex flex-col items-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black text-white shadow-xl">
                    <HiShoppingCart className="text-2xl drop-shadow-sm" />
                    {totalItems > 0 && (
                       <span className="absolute -top-1 -right-1 bg-white text-black text-[10px] font-black rounded-full h-[18px] min-w-[18px] flex items-center justify-center shadow-sm px-1 z-10">
                         {badgeText}
                       </span>
                    )}
                  </div>
                </div>
                <span className="absolute bottom-1.5 text-[10px] font-black text-black">Cart</span>
              </>
            ) : (
              <>
                <div className="relative">
                  <HiOutlineShoppingCart className="text-[26px] text-gray-400 transition-colors group-hover:text-black" />
                  {totalItems > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-black text-white text-[9px] font-black rounded-full h-[16px] min-w-[16px] flex items-center justify-center border-[1.5px] border-white shadow-sm px-1">
                      {badgeText}
                    </span>
                  )}
                </div>
                <span className="mt-0.5 text-[10px] font-bold text-gray-400 transition-colors group-hover:text-black">Cart</span>
              </>
            )}
          </Link>

          <Link
            href="/history"
            className="relative flex flex-col items-center justify-center h-full w-14 group"
          >
            {pathname === '/history' ? (
              <>
                <div className="absolute -top-3 flex flex-col items-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black text-white shadow-xl">
                    <HiClock className="text-2xl drop-shadow-sm" />
                  </div>
                </div>
                <span className="absolute bottom-1.5 text-[10px] font-black text-black">History</span>
              </>
            ) : (
              <>
                <HiOutlineClock className="text-[26px] text-gray-400 transition-colors group-hover:text-black" />
                <span className="mt-0.5 text-[10px] font-bold text-gray-400 transition-colors group-hover:text-black">History</span>
              </>
            )}
          </Link>

          <Link
            href="/track-order"
            className="relative flex flex-col items-center justify-center h-full w-14 group"
          >
            {pathname === '/track-order' ? (
              <>
                <div className="absolute -top-3 flex flex-col items-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black text-white shadow-xl">
                    <HiMagnifyingGlass className="text-2xl drop-shadow-sm stroke-[2px]" />
                  </div>
                </div>
                <span className="absolute bottom-1.5 text-[10px] font-black text-black">Track</span>
              </>
            ) : (
              <>
                <HiOutlineMagnifyingGlass className="text-[26px] text-gray-400 transition-colors group-hover:text-black" />
                <span className="mt-0.5 text-[10px] font-bold text-gray-400 transition-colors group-hover:text-black">Track</span>
              </>
            )}
          </Link>
        </div>
      </div>
    </>
  );
}
