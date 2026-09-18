import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Categories from '@/components/Categories';
import AdSection from '@/components/AdSection';
import PopularItems from '@/components/PopularItems';
import NewArrivals from '@/components/NewArrivals';
import Featured from '@/components/Featured';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Home',
  description: 'Discover radiant jewelry inspired by Sparkling Heaven. Shop rings, necklaces, bracelets, and timeless pieces at Zhilakaii.',
};

export default async function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Categories />
      <AdSection />
      <PopularItems />
      <NewArrivals />
      <Featured />
      <Footer />
    </div>
  );
}
