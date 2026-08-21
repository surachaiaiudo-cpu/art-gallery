import type { Metadata } from 'next';
import './globals.css';
import { LanguageProvider } from '@/context/LanguageContext';
import { Maitree } from 'next/font/google';

const maitree = Maitree({
  weight: ['200', '300', '400', '500', '600', '700'],
  subsets: ['thai', 'latin'],
  variable: '--font-maitree',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ARTVARA | หอศิลป์และนิทรรศการศิลปกรรมออนไลน์ (Virtual Gallery & E-Catalog)',
  description: 'Online Art Exhibition & Gallery System with 2D Grid / Carousel / 3D Virtual Room and Automated PDF Catalog Generator',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" className={maitree.variable}>
      <body className={`${maitree.className} min-h-screen flex flex-col bg-[#F9F8F6] text-[#1E1D1B]`}>
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
