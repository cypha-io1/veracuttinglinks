import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import HeroSlider from '@/components/HeroSlider';
import ProductsShowcase from '@/components/ProductsShowcase';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Home',
  description: 'Discover beautiful, elegant designs specially crafted for children at Vera Cutting Links.',
};

export default async function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <HeroSlider />
      <ProductsShowcase />
      <Footer />
    </div>
  );
}
