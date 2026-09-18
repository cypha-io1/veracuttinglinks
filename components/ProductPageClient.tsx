'use client';

import { useState, useMemo } from 'react';
import { FiTag } from 'react-icons/fi';
import AddToCartButton from '@/components/AddToCartButton';

type Variation = {
  name: string;
  option: string;
  imageUrl?: string | null;
  regularPrice?: string | null;
  salePrice?: string | null;
  stock?: number | null;
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

type ProductPageClientProps = {
  product: Product;
  displayPrice: string;
  regularPriceLabel: string;
  showStruckRegular: boolean;
  isSoldOut: boolean;
  showStockQuantity: boolean;
  groupedVariations: Map<string, Variation[]>;
  onVariationImageChange?: (imageUrl: string | null) => void;
};

export default function ProductPageClient({
  product,
  displayPrice,
  regularPriceLabel,
  showStruckRegular,
  isSoldOut,
  showStockQuantity,
  groupedVariations,
  onVariationImageChange,
}: ProductPageClientProps) {
  const [selectedVariations, setSelectedVariations] = useState<Record<string, string>>({});

  const normalizeStockValue = (value: unknown): number | null => {
    const parsed = typeof value === 'number' ? value : Number(String(value ?? '').trim());
    if (!Number.isFinite(parsed) || parsed < 0) {
      return null;
    }

    return parsed;
  };

  const resolveSelectedVariationImage = (selection: Record<string, string>) => {
    if (!product.variations || product.variations.length === 0) return null;

    for (const [variationType, selectedOption] of Object.entries(selection)) {
      const matched = product.variations.find(
        v => v.name === variationType && v.option === selectedOption
      );

      const imageUrl = matched?.imageUrl?.trim();
      if (imageUrl) return imageUrl;
    }

    return null;
  };

  const allVariationsSelected = useMemo(() => {
    if (!product.hasVariations || groupedVariations.size === 0) return true;
    return Object.keys(selectedVariations).length === groupedVariations.size;
  }, [selectedVariations, product.hasVariations, groupedVariations]);

  const handleVariationSelect = (variationType: string, option: string) => {
    const next = { ...selectedVariations };
    const isAlreadySelected = selectedVariations[variationType] === option;

    if (!option || isAlreadySelected) {
      delete next[variationType];
    } else {
      next[variationType] = option;
    }

    setSelectedVariations(next);
    onVariationImageChange?.(resolveSelectedVariationImage(next));
  };

  // Helper to extract numeric price from formatted price string
  const getPriceValue = (priceStr: string): number => {
    const normalized = priceStr.trim();
    if (!normalized) return 0;
    const numericValue = parseFloat(normalized.replace(/[^\d.]/g, ''));
    return isNaN(numericValue) ? 0 : numericValue;
  };

  // Calculate the price based on selected variation(s)
  const getSelectedVariationPrice = () => {
    if (!product.hasVariations || !allVariationsSelected || !product.variations) {
      return displayPrice;
    }

    // Find all selected variations and sum their prices
    let totalPrice = 0;
    let foundAny = false;

    for (const [variationType, selectedOption] of Object.entries(selectedVariations)) {
      const selectedVar = product.variations.find(
        (v) => v.name === variationType && v.option === selectedOption
      );

      if (selectedVar) {
        const varSalePrice = selectedVar.salePrice?.trim();
        const varRegPrice = selectedVar.regularPrice?.trim();
        const varHasSale = varSalePrice && varSalePrice.length > 0;
        const priceToUse = varHasSale ? varSalePrice : varRegPrice || '0';
        totalPrice += getPriceValue(priceToUse);
        foundAny = true;
      }
    }

    if (!foundAny) return displayPrice;

    return `GH₵${totalPrice.toFixed(0)}`;
  };

  const selectedVariationPrice = getSelectedVariationPrice();

  const selectedVariationEntries = Object.entries(selectedVariations)
    .map(([variationType, selectedOption]) =>
      product.variations?.find(v => v.name === variationType && v.option === selectedOption)
    )
    .filter((variation): variation is Variation => Boolean(variation));

  const selectedVariationStock = (() => {
    if (product.hasVariations && !allVariationsSelected) {
      return null;
    }

    if (product.hasVariations) {
      // A selected variation without stock should be treated as unavailable.
      if (selectedVariationEntries.length !== groupedVariations.size) {
        return 0;
      }

      const selectedStocks = selectedVariationEntries.map(variation => normalizeStockValue(variation.stock));
      if (selectedStocks.some(stock => stock === null)) {
        return 0;
      }

      const inStockValues = selectedStocks.filter((stock): stock is number => typeof stock === 'number');
      return inStockValues.length > 0 ? Math.min(...inStockValues) : 0;
    }

    const stocks = selectedVariationEntries
      .map(variation => normalizeStockValue(variation.stock))
      .filter((stock): stock is number => typeof stock === 'number');

    if (stocks.length === 0) {
      return normalizeStockValue(product.stock);
    }

    return Math.min(...stocks);
  })();

  const normalizedProductStock = normalizeStockValue(product.stock);

  const effectiveStock =
    product.hasVariations && allVariationsSelected
      ? selectedVariationStock
      : normalizedProductStock;

  const isCurrentSelectionSoldOut =
    typeof effectiveStock === 'number' &&
    effectiveStock <= 0;

  const selectedVariationPairs = Object.entries(selectedVariations)
    .sort(([left], [right]) => left.localeCompare(right));

  const selectedVariationKey = selectedVariationPairs
    .map(([type, option]) => `${type}:${option}`)
    .join('|');

  const selectedVariationLabel = selectedVariationPairs
    .map(([type, option]) => `${type}: ${option}`)
    .join(', ');

  const cartProduct = {
    ...product,
    price: selectedVariationPrice,
    stock: effectiveStock,
    variationKey: selectedVariationKey || undefined,
    variationLabel: selectedVariationLabel || undefined,
    image:
      selectedVariationPairs
        .map(([variationType, selectedOption]) => product.variations?.find(v => v.name === variationType && v.option === selectedOption)?.imageUrl?.trim())
        .find((url): url is string => Boolean(url)) || product.image,
  };

  return (
    <div className="flex flex-col">
      <div className="mb-6 inline-flex items-center gap-2 self-start rounded-full bg-gray-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.1em] text-gray-600">
        <FiTag className="text-xs" />
        {product.category}
      </div>

      <h1 className="mb-4 text-4xl font-light tracking-tight text-gray-900 md:text-5xl lg:text-6xl">{product.name}</h1>

      <div className="mb-8 flex items-baseline gap-4">
        <p className="text-3xl font-medium tracking-tight text-gray-900 md:text-4xl">{selectedVariationPrice}</p>
        {showStruckRegular ? (
          <p className="text-xl text-gray-400 line-through decoration-gray-300">{regularPriceLabel}</p>
        ) : null}
      </div>

      {product.hasVariations && groupedVariations.size > 0 && (
        <div className="mb-8 space-y-6 border-y border-gray-200 py-8">
          {Array.from(groupedVariations.entries()).map(([variationType, variations]) => (
            <div key={variationType}>
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm font-bold text-gray-900">{variationType}</span>
                <span className="text-sm text-gray-500">{selectedVariations[variationType] || 'Select one'}</span>
              </div>
              <div className="flex flex-wrap gap-3">
                {variations.map((variation) => {
                  const isSelected = selectedVariations[variationType] === variation.option;
                  return (
                    <button
                      key={`${variationType}-${variation.option}`}
                      onClick={() => handleVariationSelect(variationType, variation.option)}
                      className={`rounded-full border px-5 py-2.5 text-sm font-medium transition-all ${
                        isSelected 
                          ? 'border-gray-900 bg-gray-900 text-white shadow-md' 
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      {variation.option}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {(isSoldOut || isCurrentSelectionSoldOut) && (
        <div className="mb-4 rounded-lg border border-black bg-white px-4 py-3 text-center text-sm font-semibold text-black">
          Out of Stock
        </div>
      )}

      {showStockQuantity && typeof effectiveStock === 'number' && effectiveStock > 0 ? (
        <div className="mb-4 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700">
          In stock: {effectiveStock}
        </div>
      ) : null}

      <AddToCartButton
        product={cartProduct}
        disabled={isSoldOut || isCurrentSelectionSoldOut || (product.hasVariations && !allVariationsSelected)}
        className={`w-full inline-flex items-center justify-center gap-3 rounded-full px-8 py-5 text-base font-bold transition-all duration-300 ${
          isSoldOut || isCurrentSelectionSoldOut || (product.hasVariations && !allVariationsSelected)
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-gray-900 text-white hover:bg-black hover:shadow-xl hover:shadow-gray-900/20 active:scale-[0.98]'
        }`}
      />
    </div>
  );
}
