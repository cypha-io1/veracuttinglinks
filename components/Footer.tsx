'use client';

import Link from 'next/link';
import Image from 'next/image';
import { FiMail } from 'react-icons/fi';
import { FaInstagram, FaSnapchat, FaTiktok, FaWhatsapp } from 'react-icons/fa6';

const SOCIALS = [
  { name: 'Snapchat', link: 'https://snapchat.com/t/ZUch8xYy' , handle: 'ZUch8xYy' },
  { name: 'TikTok', link: 'https://www.tiktok.com/@.zhilakaii', handle: '@zhilakaii' },
  { name: 'Instagram', link: 'https://www.instagram.com/zhilakaii_?igsh=MXhnZHNhNGw0N3FwYg%3D%3D&utm_source=qr', handle: '@zhilakaii_' },
  { name: 'WhatsApp', link: 'https://wa.me/+233206742769', handle: '+233 206 742 769' },
  { name: 'Email', link: 'mailto:shopzhilakaii@gmail.com', handle: 'shopzhilakaii@gmail.com' },
];

export default function Footer() {
  return (
    <footer className="text-white mt-16 mb-4 mx-4">
      <div className="max-w-7xl mx-auto rounded-3xl overflow-hidden shadow-lg bg-black">
        <div className="px-6 py-10">
          <div className="max-w-3xl mx-auto space-y-5 text-center">
            <Link href="/" className="flex items-center justify-center">
              <Image 
                src="/logo.png" 
                alt="Zhilakaii Logo" 
                width={50} 
                height={50}
                className="rounded-lg brightness-0 invert"
              />
            </Link>
            <p className="text-white text-sm md:text-base">
              Inspired by Sparkling Heaven, Zhilakaii curates celestial jewelry that shines with timeless elegance and radiant beauty.
            </p>
            <div className="flex justify-center gap-4 pt-1">
              {SOCIALS.map((social) => (
                <a
                  key={social.name}
                  href={social.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.name}
                  className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
                >
                  {social.name === 'Snapchat' ? (
                    <FaSnapchat className="text-xl" />
                  ) : social.name === 'TikTok' ? (
                    <FaTiktok className="text-xl" />
                  ) : social.name === 'Instagram' ? (
                    <FaInstagram className="text-xl" />
                  ) : social.name === 'WhatsApp' ? (
                    <FaWhatsapp className="text-xl" />
                  ) : (
                    <FiMail className="text-xl" />
                  )}
                </a>
              ))}
            </div>
            <p className="text-white/90 text-xs md:text-sm pt-2">
              © 2026 Zhilakaii. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
