import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SplashScreen from "@/components/SplashScreen";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  metadataBase: new URL('https://veracuttinglinks.com'),
  title: {
    template: '%s | Vera Cutting Links',
    default: 'Vera Cutting Links',
  },
  description: "Discover our beautiful collection of elegant kids caftans and stylish clothing at Vera Cutting Links.",
  icons: {
    icon: "/vera-vera-logo-square.png",
    shortcut: "/vera-vera-logo-square.png",
    apple: "/vera-vera-logo-square.png",
  },
  openGraph: {
    title: "Vera Cutting Links",
    description: "Discover our beautiful collection of elegant kids caftans and stylish clothing at Vera Cutting Links.",
    url: "https://veracuttinglinks.com",
    siteName: "Vera Cutting Links",
    images: [
      {
        url: "/vera-vera-logo.png",
        width: 1200,
        height: 630,
        alt: "Vera Cutting Links Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Vera Cutting Links",
    description: "Discover our beautiful collection of elegant kids caftans and stylish clothing at Vera Cutting Links.",
    images: ["/vera-vera-logo.png"],
  },
};

import BackToTop from "@/components/BackToTop";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SplashScreen />
        {children}
        <BackToTop />
      </body>
    </html>
  );
}
