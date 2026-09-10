import type { Metadata } from 'next';
import { Anton, Epilogue, DM_Mono } from 'next/font/google';
import './globals.css';
import { ToastProvider } from '@/contexts/ToastContext';
import { ToastContainer } from '@/components/ui/ToastContainer';

// Self-hosted at build time by next/font — no render-blocking request to
// fonts.googleapis.com, and no layout shift while the faces load.
const anton = Anton({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-anton',
  display: 'swap',
});

const epilogue = Epilogue({
  weight: ['400', '500', '700', '900'],
  subsets: ['latin'],
  variable: '--font-epilogue',
  display: 'swap',
});

const dmMono = DM_Mono({
  weight: ['400', '500'],
  subsets: ['latin'],
  variable: '--font-dm-mono',
  display: 'swap',
});

// Without metadataBase every Open Graph / Twitter image resolves against
// http://localhost:3000, so shared room links preview as a broken image.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'CategoryCrash - Real-time Word Game',
  description: 'A fast-paced multiplayer word game where speed meets creativity',
  icons: {
    icon: '/categorycrash-pixel-icon.png',
    apple: '/categorycrash-pixel-icon.png',
  },
  openGraph: {
    title: 'CategoryCrash',
    description: 'Name something that fits both categories. Speed meets creativity.',
    images: ['/categorycrash-splash-og.png'],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CategoryCrash',
    description: 'Name something that fits both categories. Speed meets creativity.',
    images: ['/categorycrash-splash-og.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${anton.variable} ${epilogue.variable} ${dmMono.variable}`}>
      <body className="font-epilogue">
        <ToastProvider>
          <div className="halftone-bg" />
          {children}
          <ToastContainer />
        </ToastProvider>
      </body>
    </html>
  );
}
