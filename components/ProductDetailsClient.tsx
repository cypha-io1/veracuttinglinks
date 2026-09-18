'use client';

import { useMemo, useState } from 'react';
import ProductImageGallery from '@/components/ProductImageGallery';
import ProductPageClient from '@/components/ProductPageClient';

type Variation = {
  name: string;
  option: string;
  imageUrl?: string | null;
  regularPrice?: string | null;
  salePrice?: string | null;
};

type Product = {
  id: number;
  name: string;
  price: string;
  regularPrice?: string | null;
  salePrice?: string | null;
  image: string;
  imageUrls?: string[] | null;
  category: string;
  description?: string;
  stock?: number | null;
  showStockOnProductPage?: boolean;
  hasVariations?: boolean;
  variations?: Variation[] | null;
};

type ProductDetailsClientProps = {
  product: Product;
  displayPrice: string;
  regularPriceLabel: string;
  showStruckRegular: boolean;
  isSoldOut: boolean;
  showStockQuantity: boolean;
};

export default function ProductDetailsClient({
  product,
  displayPrice,
  regularPriceLabel,
  showStruckRegular,
  isSoldOut,
  showStockQuantity,
}: ProductDetailsClientProps) {
  const [forcedImage, setForcedImage] = useState<string | null>(null);

  const galleryImages = useMemo(() => {
    const source = Array.isArray(product.imageUrls) && product.imageUrls.length > 0 ? product.imageUrls : [product.image];
    const variationImages = Array.isArray(product.variations)
      ? product.variations
          .map(variation => variation.imageUrl?.trim())
          .filter((url): url is string => Boolean(url))
      : [];

    return Array.from(new Set([...source, ...variationImages]));
  }, [product.image, product.imageUrls, product.variations]);

  const groupedVariations = useMemo(() => {
    const grouped = new Map<string, Variation[]>();
    if (!Array.isArray(product.variations)) return grouped;

    for (const variation of product.variations) {
      if (!grouped.has(variation.name)) {
        grouped.set(variation.name, []);
      }
      grouped.get(variation.name)!.push(variation);
    }

    return grouped;
  }, [product.variations]);

  return (
    <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-12 lg:gap-16">
      <div className="lg:col-span-7">
        <div className="lg:sticky lg:top-32">
          <ProductImageGallery images={galleryImages} productName={product.name} forcedImage={forcedImage} />
        </div>
      </div>

      <div className="flex flex-col pt-4 lg:col-span-5 lg:pt-0">
        <ProductPageClient
          product={product}
          displayPrice={displayPrice}
          regularPriceLabel={regularPriceLabel}
          showStruckRegular={showStruckRegular}
          isSoldOut={isSoldOut}
          showStockQuantity={showStockQuantity}
          groupedVariations={groupedVariations}
          onVariationImageChange={setForcedImage}
        />

        <hr className="my-8 border-gray-200" />
        <div className="prose prose-slate">
          <h3 className="mb-4 text-xs font-black uppercase tracking-widest text-gray-900">Product Details</h3>
          <p className="leading-relaxed text-gray-600">
            {product.description ||
              'Premium quality product selected for long wear, natural finish, and comfort. Carefully designed to ensure maximum satisfaction and an effortless look.'}
          </p>
        </div>
      </div>
    </div>
  );
}
