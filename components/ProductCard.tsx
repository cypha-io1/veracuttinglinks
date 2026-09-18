'use client';

import Image from 'next/image';
import Link from 'next/link';

type ProductCardItem = {
  id: number | string;
  name: string;
  price: string;
  regularPrice?: string | null;
  salePrice?: string | null;
  stock?: number | null;
  remainingStock?: number | null;
  hasVariations?: boolean;
  variations?: Array<{
    name: string;
    option: string;
    regularPrice?: string | null;
    salePrice?: string | null;
  }> | null;
  image: string;
  category?: string;
};

type ProductCardProps = {
  product: ProductCardItem;
  href?: string;
  size?: 'default' | 'compact';
  showCategory?: boolean;
  showViewLabel?: boolean;
};

export default function ProductCard({
  product,
  href,
  size = 'default',
  showCategory = true,
  showViewLabel = true,
}: ProductCardProps) {
  const formatCedi = (value: string) => {
    const normalized = value.trim();
    if (!normalized) return 'GH₵0';
    if (normalized.includes('₵') || normalized.toUpperCase().startsWith('GH')) return normalized;
    return `GH₵${normalized}`;
  };

  const cardHref = href ?? `/products/${product.id}`;
  const isCompact = size === 'compact';
  const normalizedRegularPrice = product.regularPrice?.trim() || '';
  const normalizedSalePrice = product.salePrice?.trim() || '';
  const effectiveStock =
    typeof product.remainingStock === 'number'
      ? product.remainingStock
      : product.stock;
  const isSoldOut = typeof effectiveStock === 'number' && effectiveStock <= 0;

  // Extract min/max prices from variations if they exist
  const getVariationPrices = () => {
    if (!product.hasVariations || !Array.isArray(product.variations) || product.variations.length === 0) {
      return null;
    }
    const prices = product.variations
      .flatMap(v => {
        const sale = v.salePrice?.trim();
        const reg = v.regularPrice?.trim();
        return [sale || reg].filter((p): p is string => Boolean(p));
      })
      .map(p => parseFloat(p.replace(/[^\d.]/g, '')))
      .filter(n => !isNaN(n) && n > 0);

    if (prices.length === 0) return null;
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    return minPrice === maxPrice ? null : { min: minPrice, max: maxPrice };
  };

  const variationRange = getVariationPrices();
  const hasSale = variationRange ? false : normalizedSalePrice.length > 0;
  const displayPrice = variationRange
    ? `GH₵${variationRange.min.toFixed(0)} - GH₵${variationRange.max.toFixed(0)}`
    : formatCedi(hasSale ? normalizedSalePrice : normalizedRegularPrice || product.price);
  const showStruckRegular = !variationRange && hasSale && normalizedRegularPrice.length > 0 && normalizedRegularPrice !== normalizedSalePrice;
  const regularPriceLabel = formatCedi(normalizedRegularPrice);

  const discountPct = (() => {
    if (variationRange || !hasSale || !showStruckRegular) return null;
    const parsePrice = (s: string) => parseFloat(s.replace(/[^\d.]/g, ''));
    const reg = parsePrice(normalizedRegularPrice);
    const sale = parsePrice(normalizedSalePrice);
    if (!reg || reg <= 0 || sale >= reg) return null;
    return Math.round(((reg - sale) / reg) * 100);
  })();

  return (
    <Link
      href={cardHref}
      className={`group relative flex h-full flex-col overflow-hidden rounded-[2rem] bg-white transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(249,115,22,0.15)] ring-1 ring-gray-100/80 hover:ring-black shadow-[0_8px_30px_-15px_rgba(0,0,0,0.06)] ${isSoldOut ? 'pointer-events-none opacity-80' : ''}`}
    >
      {/* Top Image Section */}
      <div className={`relative w-full overflow-hidden bg-gray-50 ${isCompact ? 'h-[180px]' : 'h-[240px]'}`}>
        {/* Soft abstract glows behind image */}
        <div className="absolute top-0 right-0 -mx-10 -mt-10 h-40 w-40 rounded-full bg-white blur-3xl transition-all duration-700 group-hover:bg-white group-hover:scale-150" />
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 h-40 w-40 rounded-full bg-white blur-3xl transition-all duration-700 group-hover:bg-white group-hover:scale-150" />
        
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover object-center transition-all duration-700 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] group-hover:scale-110 group-hover:rotate-1"
        />

        {/* Elegant overlay to ensure content is readable */}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 via-gray-900/5 to-transparent opacity-60 transition-opacity duration-500 group-hover:opacity-30" />

        {/* Badges Overlay */}
        <div className="absolute inset-0 p-3 sm:p-4 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            {showCategory && product.category ? (
              <span className="rounded-full border border-white/30 bg-white/50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-800 backdrop-blur-md shadow-sm transition-all duration-300 lg:text-[11px] group-hover:bg-white/80">
                {product.category}
              </span>
            ) : <div />}

            {discountPct !== null && !isSoldOut ? (
              <span className="flex items-center justify-center rounded-full bg-gradient-to-br from-black to-gray-900 px-2.5 py-1 text-xs font-black text-white shadow-lg shadow-none">
                -{discountPct}%
              </span>
            ) : null}
          </div>


        </div>

        {/* Sold Out Overlay */}
        {isSoldOut ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900/10 backdrop-blur-[2px]">
            <span className="rounded-full border border-white/30 bg-white/90 px-6 py-2.5 text-xs font-black uppercase tracking-[0.2em] text-gray-800 shadow-xl backdrop-blur-md lg:text-sm">
              Out of Stock
            </span>
          </div>
        ) : null}
      </div>

      {/* Bottom Content Section */}
      <div className={`relative flex flex-grow flex-col justify-between bg-white ${isCompact ? 'p-4' : 'p-5 lg:p-6'} z-10 before:absolute before:-top-4 before:left-0 before:right-0 before:h-4 before:bg-gradient-to-t before:from-white before:to-transparent`}>
        <div className="mb-4">
          <h3 className={`line-clamp-2 font-bold leading-snug text-gray-800 transition-colors duration-300 group-hover:text-black ${isCompact ? 'text-sm sm:text-base' : 'text-base sm:text-lg'}`}>
            {product.name}
          </h3>
        </div>

        <div className="mt-auto flex items-end justify-between gap-2">
          <div className="flex flex-col">
            {showStruckRegular ? (
              <span className="mb-0.5 text-[11px] font-semibold text-gray-400 line-through decoration-gray-300/70 sm:text-xs">
                {regularPriceLabel}
              </span>
            ) : null}
            <span className={`font-black text-gray-900 tracking-tight truncate ${isCompact ? 'text-xs sm:text-sm' : 'text-sm sm:text-base'}`}>
              {displayPrice}
            </span>
          </div>
          
          {showViewLabel && !isSoldOut ? (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-50 transition-colors duration-300 group-hover:bg-white">
               <svg className="h-4 w-4 -rotate-45 text-gray-400 transition-all duration-300 group-hover:rotate-0 group-hover:text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
               </svg>
            </div>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
