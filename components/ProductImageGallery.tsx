'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';

type ProductImageGalleryProps = {
  images: string[];
  productName: string;
  forcedImage?: string | null;
};

export default function ProductImageGallery({ images, productName, forcedImage }: ProductImageGalleryProps) {
  const normalizedImages = useMemo(() => {
    const unique = Array.from(new Set(images.map(url => url.trim()).filter(Boolean)));
    return unique;
  }, [images]);

  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!forcedImage) return;
    const forcedIndex = normalizedImages.findIndex(image => image === forcedImage);
    if (forcedIndex >= 0) {
      setActiveIndex(forcedIndex);
    }
  }, [forcedImage, normalizedImages]);

  if (normalizedImages.length === 0) {
    return <div className="h-80 bg-gray-100 md:h-[520px]" />;
  }

  const activeImage = normalizedImages[Math.min(activeIndex, normalizedImages.length - 1)]!;

  return (
    <div className="flex flex-col gap-4">
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[2rem] bg-gray-100">
        <Image src={activeImage} alt={productName} fill className="object-cover" priority sizes="(max-width: 1024px) 100vw, 50vw" />
      </div>

      {normalizedImages.length > 1 ? (
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {normalizedImages.map((image, index) => {
            const isActive = index === activeIndex;
            return (
              <button
                key={`${image}-${index}`}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-xl transition-all duration-300 md:h-24 md:w-24 ${
                  isActive ? 'ring-2 ring-gray-900 ring-offset-2' : 'opacity-60 hover:opacity-100'
                }`}
                aria-label={`Show image ${index + 1}`}
              >
                <Image src={image} alt={`${productName} ${index + 1}`} fill className="object-cover" sizes="96px" />
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
