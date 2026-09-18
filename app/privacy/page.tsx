'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-12 mb-20 md:mb-0">
        <h1 className="text-3xl md:text-5xl font-black text-gray-800 mb-3 md:mb-4 text-center">Privacy Policy</h1>
        <p className="text-center text-gray-600 mb-6 md:mb-12">Last updated: February 13, 2026</p>

        <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-200 space-y-8">
          <section>
            <h2 className="text-2xl font-black text-gray-800 mb-4">1. Information We Collect</h2>
            <p className="text-gray-700 leading-relaxed">
              We collect information you provide directly to us, including your name, email address, phone number, delivery address, and payment information when you place an order or create an account.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-gray-800 mb-4">2. How We Use Your Information</h2>
            <p className="text-gray-700 leading-relaxed mb-3">We use the information we collect to:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>Process and deliver your orders</li>
              <li>Send order confirmations and updates</li>
              <li>Respond to your comments and questions</li>
              <li>Send promotional materials (with your consent)</li>
              <li>Improve our services</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-black text-gray-800 mb-4">3. Information Sharing</h2>
            <p className="text-gray-700 leading-relaxed">
              We do not sell, trade, or rent your personal information to third parties. We may share your information with service providers who assist us in operating our website and conducting our business.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-gray-800 mb-4">4. Data Security</h2>
            <p className="text-gray-700 leading-relaxed">
              We implement appropriate security measures to protect your personal information. However, no method of transmission over the internet is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-gray-800 mb-4">5. Your Rights</h2>
            <p className="text-gray-700 leading-relaxed">
              You have the right to access, update, or delete your personal information. Contact us at info@zhilakaii.com to exercise these rights.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-gray-800 mb-4">6. Contact Us</h2>
            <p className="text-gray-700 leading-relaxed">
              If you have any questions about this Privacy Policy, please contact us at info@zhilakaii.com or +233 XX XXX XXXX.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
