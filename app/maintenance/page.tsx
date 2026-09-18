import type { Metadata } from 'next';
import MaintenanceGate from '@/components/MaintenanceGate';
import { getPublicProducts } from '@/lib/productData';

export const metadata: Metadata = {
  title: 'Maintenance',
  description: 'Zhilakaii is temporarily unavailable while we perform scheduled improvements. Please check back shortly.',
};

type MaintenancePageProps = {
  searchParams?: Promise<{
    reason?: string;
  }>;
};

export default async function MaintenancePage({ searchParams }: MaintenancePageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const reason =
    typeof resolvedSearchParams?.reason === 'string' && resolvedSearchParams.reason.trim()
      ? resolvedSearchParams.reason.trim()
      : 'We are performing scheduled maintenance. Please check back shortly.';

  let productImages: string[] = [];

  try {
    const products = await getPublicProducts({ limit: 12 });
    productImages = products
      .map(product => product.image)
      .filter((image): image is string => typeof image === 'string' && image.trim().length > 0);
  } catch {
    // Keep maintenance page resilient if product images are unavailable.
  }

  return <MaintenanceGate reason={reason} productImages={productImages} />;
}
