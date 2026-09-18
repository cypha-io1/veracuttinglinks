'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-12 mb-20 md:mb-0">
        <h1 className="text-3xl md:text-5xl font-black text-gray-800 mb-3 md:mb-4 text-center">Terms & Conditions</h1>
        <p className="text-center text-gray-600 mb-6 md:mb-12">Last updated: February 13, 2026</p>

        <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-200 space-y-8">
          <section>
            <h2 className="text-2xl font-black text-gray-800 mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              By accessing and using Zhilakaii&apos;s services, you accept and agree to be bound by these Terms and Conditions. If you do not agree, please do not use our services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-gray-800 mb-4">2. Orders and Payment</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>All orders are subject to acceptance and availability</li>
              <li>Prices are in Ghana Cedis (GH₵) and may change without notice</li>
              <li>Payment must be made at time of order or delivery</li>
              <li>We accept mobile money, cash, and card payments</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-black text-gray-800 mb-4">3. Delivery</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              Delivery times are estimates and may vary. We are not liable for delays caused by factors beyond our control. You must provide accurate delivery information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-gray-800 mb-4">4. Cancellation and Refunds</h2>
            <p className="text-gray-700 leading-relaxed">
              Orders can be cancelled within 5 minutes of placement. Once preparation begins, cancellations are not accepted. Refunds are provided only for quality issues reported within 30 minutes of delivery.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-gray-800 mb-4">5. Product Quality</h2>
            <p className="text-gray-700 leading-relaxed">
              We strive to maintain the highest quality standards. If you&apos;re not satisfied with your order, contact us immediately so we can make it right.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-gray-800 mb-4">6. Limitation of Liability</h2>
            <p className="text-gray-700 leading-relaxed">
              Zhilakaii is not liable for any indirect, incidental, or consequential damages arising from the use of our services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-gray-800 mb-4">7. Changes to Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              We reserve the right to modify these terms at any time. Continued use of our services constitutes acceptance of any changes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-gray-800 mb-4">8. Contact Information</h2>
            <p className="text-gray-700 leading-relaxed">
              For questions about these Terms & Conditions, contact us at info@zhilakaii.com or +233 XX XXX XXXX.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
