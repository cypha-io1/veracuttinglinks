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
  metadataBase: new URL('https://zhilakaii.com'),
  title: {
    template: '%s | Zhilakaii',
    default: 'Zhilakaii',
  },
  description: "Inspired by Sparkling Heaven, Zhilakaii embodies celestial elegance and radiant beauty. Jewelry crafted to sparkle like the stars.",
  icons: {
    icon: "/logo-square.png",
    shortcut: "/logo-square.png",
    apple: "/logo-square.png",
  },
  openGraph: {
    title: "Zhilakaii",
    description: "Inspired by Sparkling Heaven, Zhilakaii embodies celestial elegance and radiant beauty. Jewelry crafted to sparkle like the stars.",
    url: "https://zhilakaii.com",
    siteName: "Zhilakaii",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "Zhilakaii Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Zhilakaii",
    description: "Inspired by Sparkling Heaven, Zhilakaii embodies celestial elegance and radiant beauty. Jewelry crafted to sparkle like the stars.",
    images: ["/logo.png"],
  },
};

import BackToTop from "@/components/BackToTop";
import SupportChatbot from "@/components/SupportChatbot";

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
        <SupportChatbot />
      </body>
    </html>
  );
}
