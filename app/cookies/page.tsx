'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-12 mb-20 md:mb-0">
        <h1 className="text-3xl md:text-5xl font-black text-gray-800 mb-3 md:mb-4 text-center">Cookie Policy</h1>
        <p className="text-center text-gray-600 mb-6 md:mb-12">Last updated: February 13, 2026</p>

        <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-200 space-y-8">
          <section>
            <h2 className="text-2xl font-black text-gray-800 mb-4">1. What Are Cookies</h2>
            <p className="text-gray-700 leading-relaxed">
              Cookies are small text files that are placed on your device when you visit our website. They help us provide you with a better experience by remembering your preferences and understanding how you use our site.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-gray-800 mb-4">2. Types of Cookies We Use</h2>
            
            <div className="space-y-4 ml-4">
              <div>
                <h3 className="font-bold text-gray-800 mb-2">Essential Cookies</h3>
                <p className="text-gray-700">Required for the website to function properly, including shopping cart and checkout processes.</p>
              </div>

              <div>
                <h3 className="font-bold text-gray-800 mb-2">Performance Cookies</h3>
                <p className="text-gray-700">Help us understand how visitors interact with our website by collecting anonymous information.</p>
              </div>

              <div>
                <h3 className="font-bold text-gray-800 mb-2">Functionality Cookies</h3>
                <p className="text-gray-700">Remember your preferences, such as selected location and language settings.</p>
              </div>

              <div>
                <h3 className="font-bold text-gray-800 mb-2">Marketing Cookies</h3>
                <p className="text-gray-700">Track your activity to deliver relevant advertisements and measure campaign effectiveness.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-black text-gray-800 mb-4">3. How We Use Cookies</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>Remember items in your shopping cart</li>
              <li>Keep you logged into your account</li>
              <li>Remember your location preference</li>
              <li>Analyze site traffic and usage patterns</li>
              <li>Personalize your experience</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-black text-gray-800 mb-4">4. Managing Cookies</h2>
            <p className="text-gray-700 leading-relaxed">
              You can control and delete cookies through your browser settings. However, disabling cookies may affect your ability to use certain features of our website. Most browsers accept cookies automatically, but you can modify your browser settings to decline cookies if you prefer.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-gray-800 mb-4">5. Third-Party Cookies</h2>
            <p className="text-gray-700 leading-relaxed">
              We may use third-party services (such as Google Analytics) that also use cookies. These third parties have their own privacy policies and cookie policies.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-gray-800 mb-4">6. Updates to This Policy</h2>
            <p className="text-gray-700 leading-relaxed">
              We may update this Cookie Policy from time to time. Any changes will be posted on this page with an updated revision date.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-gray-800 mb-4">7. Contact Us</h2>
            <p className="text-gray-700 leading-relaxed">
              If you have questions about our use of cookies, please contact us at info@zhilakaii.com.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
