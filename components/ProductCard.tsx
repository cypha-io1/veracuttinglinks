'use client';

import Image from 'next/image';
import Link from 'next/link';

type ProductCardItem = {
  id: number | string;
  name: string;
  image: string;
  category?: string;
};

type ProductCardProps = {
  product: ProductCardItem;
  href?: string;
  size?: 'default' | 'compact';
};

export default function ProductCard({
  product,
  href,
  size = 'default',
}: ProductCardProps) {
  const cardHref = href ?? `/products/${product.id}`;
  const isCompact = size === 'compact';

  return (
    <Link
      href={cardHref}
      className="group relative flex h-full flex-col overflow-hidden rounded-[2rem] bg-white transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] ring-1 ring-gray-100/80 hover:ring-black shadow-[0_8px_30px_-15px_rgba(0,0,0,0.06)]"
    >
      {/* Top Image Section */}
      <div className={`relative w-full overflow-hidden bg-gray-50 ${isCompact ? 'h-[180px]' : 'h-[240px]'}`}>
        <div className="absolute top-0 right-0 -mx-10 -mt-10 h-40 w-40 rounded-full bg-white blur-3xl transition-all duration-700 group-hover:bg-white group-hover:scale-150" />
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 h-40 w-40 rounded-full bg-white blur-3xl transition-all duration-700 group-hover:bg-white group-hover:scale-150" />
        
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover object-center transition-all duration-700 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] group-hover:scale-110 group-hover:rotate-1"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 via-gray-900/5 to-transparent opacity-40 transition-opacity duration-500 group-hover:opacity-20" />
      </div>

      {/* Bottom Content Section */}
      <div className={`relative flex flex-grow flex-col justify-center items-center text-center bg-white ${isCompact ? 'p-4' : 'p-5 lg:p-6'} z-10 before:absolute before:-top-4 before:left-0 before:right-0 before:h-4 before:bg-gradient-to-t before:from-white before:to-transparent`}>
        <h3 className={`line-clamp-2 font-bold leading-snug text-gray-800 transition-colors duration-300 group-hover:text-black ${isCompact ? 'text-sm sm:text-base' : 'text-base sm:text-lg'}`}>
          {product.name}
        </h3>
      </div>
    </Link>
  );
}
