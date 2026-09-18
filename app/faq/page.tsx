'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function FAQPage() {
  const faqs = [
    {
      question: 'What are your delivery hours?',
      answer: 'We deliver from 9AM to 11PM daily in Accra, North Legon, and Agbogba. In Winneba and Cape Coast, delivery hours are 10AM to 10PM.'
    },
    {
      question: 'Is there a minimum order amount?',
      answer: 'Our minimum order is GH₵30 for delivery. Orders below this amount can be picked up from any of our branches.'
    },
    {
      question: 'How long does delivery take?',
      answer: 'Typical delivery time is 30-45 minutes depending on your location and order complexity. We prioritize hot, fresh delivery.'
    },
    {
      question: 'Do you offer discounts for large orders?',
      answer: 'Yes! Check out our Packages section for family and party packages with special pricing. Corporate orders also qualify for discounts.'
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept mobile money (MTN, Vodafone, AirtelTigo), cash on delivery, and card payments.'
    },
    {
      question: 'Can I customize my pizza?',
      answer: 'Absolutely! You can choose your toppings, crust type, and size. Contact us or add notes to your order for customization.'
    },
    {
      question: 'Do you have vegetarian options?',
      answer: 'Yes, we have vegetarian pizzas and sides. Check our menu for meat-free options.'
    },
        {
      question: 'What if I\'m not satisfied with my order?',
      answer: 'Customer satisfaction is our priority. Contact us immediately if there\'s an issue and we\'ll make it right.'
        },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-12 mb-20 md:mb-0">
        <h1 className="text-2xl md:text-5xl font-black text-gray-800 mb-3 md:mb-4 text-center">Frequently Asked Questions</h1>
        <p className="text-base md:text-xl text-gray-600 text-center mb-6 md:mb-12">Find answers to common questions</p>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <h3 className="text-xl font-black text-gray-800 mb-3">{faq.question}</h3>
              <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center bg-white rounded-lg p-8 shadow-sm border border-black">
          <h2 className="text-2xl font-black text-gray-800 mb-3">Still have questions?</h2>
          <p className="text-gray-600 mb-6">Contact our support team for more help</p>
          <a href="/contact" className="inline-block bg-black text-white px-8 py-3 rounded-full font-bold hover:bg-gray-800">
            Contact Us
          </a>
        </div>
      </main>

      <Footer />
    </div>
  );
}
