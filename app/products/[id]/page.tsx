import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FiArrowLeft } from 'react-icons/fi';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProductDetailsClient from '@/components/ProductDetailsClient';
import { pool } from '@/lib/db';
import { ensureDbInitialized } from '@/lib/dbInit';
import { withApiCache } from '@/lib/apiCache';

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
  variations?: Array<{
    name: string;
    option: string;
    imageUrl?: string | null;
    regularPrice?: string | null;
    salePrice?: string | null;
  }> | null;
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);
  if (product) {
    const fallbackDescription = 'Discover this Zhilakaii piece inspired by celestial elegance and radiant beauty.';
    const productDescription = (product.description || '').trim() || fallbackDescription;
    const primaryImage = product.image || product.imageUrls?.[0] || '/logo.png';

    return {
      title: product.name,
      description: productDescription,
      openGraph: {
        title: product.name,
        description: productDescription,
        images: [
          {
            url: primaryImage,
            alt: product.name,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: product.name,
        description: productDescription,
        images: [primaryImage],
      },
    };
  }
  return {};
}

async function getProduct(id: string): Promise<Product | null> {
  const numericId = Number(id);

  if (!Number.isInteger(numericId) || numericId <= 0) {
    return null;
  }

  await ensureDbInitialized();

  return withApiCache(`products:detail:${numericId}`, 30_000, async () => {
    let client;
    try {
      client = await pool.connect();
      const result = await client.query(
        `
        SELECT
          p.*,
          COALESCE((
            SELECT SUM(oi.quantity)::int
            FROM "OrderItem" oi
            WHERE oi."productId" = p.id
          ), 0) AS "soldQuantity",
          p.stock AS "remainingStock"
        FROM "Product" p
        WHERE p.id = $1
        LIMIT 1
        `,
        [numericId],
      );

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0] as Product & { remainingStock?: number | null };
      return {
        ...row,
        stock: typeof row.remainingStock === 'number' ? row.remainingStock : row.stock,
      };
    } finally {
      if (client) {
        client.release();
      }
    }
  });
}

export default async function ProductPage({ params }: PageProps) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    notFound();
  }

  const formatCedi = (value: string) => {
    const normalized = value.trim();
    if (!normalized) return 'GH₵0';
    if (normalized.includes('₵') || normalized.toUpperCase().startsWith('GH')) return normalized;
    return `GH₵${normalized}`;
  };

  const normalizedRegularPrice = product.regularPrice?.trim() || '';
  const normalizedSalePrice = product.salePrice?.trim() || '';
  const isSoldOut = product.stock !== undefined && product.stock !== null && product.stock <= 0;

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
  const regularPriceLabel = formatCedi(normalizedRegularPrice || product.price);
  const showStruckRegular = !variationRange && hasSale && regularPriceLabel !== displayPrice;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 py-8 pt-24 md:px-6 md:py-12 md:pt-32">
        <Link
          href="/products"
          className="group mb-8 inline-flex items-center gap-2 text-sm font-bold text-gray-500 transition-colors hover:text-gray-900"
        >
          <FiArrowLeft className="transition-transform group-hover:-translate-x-1" />
          Back to products
        </Link>

        <ProductDetailsClient
          product={product}
          displayPrice={displayPrice}
          regularPriceLabel={regularPriceLabel}
          showStruckRegular={showStruckRegular}
          isSoldOut={isSoldOut}
          showStockQuantity={Boolean(product.showStockOnProductPage)}
        />
      </main>

      <Footer />
    </div>
  );
}
