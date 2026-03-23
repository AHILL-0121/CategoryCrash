import type { Metadata } from 'next';
import './globals.css';
import { ToastProvider } from '@/contexts/ToastContext';
import { ToastContainer } from '@/components/ui/ToastContainer';

export const metadata: Metadata = {
  title: 'CategoryCrash - Real-time Word Game',
  description: 'A fast-paced multiplayer word game where speed meets creativity',
  icons: {
    icon: '/categorycrash-pixel-icon.svg',
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
    <html lang="en">
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
