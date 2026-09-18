export type PublicProductVariation = {
  name: string;
  option: string;
  imageUrl?: string | null;
  regularPrice?: string | null;
  salePrice?: string | null;
};

export type PublicProduct = {
  id: number;
  name: string;
  price: string;
  regularPrice?: string | null;
  salePrice?: string | null;
  image: string;
  imageUrls?: string[] | null;
  category: string;
  description?: string;
  isFeatured?: boolean;
  hasVariations?: boolean;
  variations?: PublicProductVariation[] | null;
  stock?: number | null;
  remainingStock?: number | null;
  showStockOnProductPage?: boolean;
  createdAt?: string;
  updatedAt?: string;
};