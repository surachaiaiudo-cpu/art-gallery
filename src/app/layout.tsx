import type { Metadata, Viewport } from 'next';
import './globals.css';
import { LanguageProvider } from '@/context/LanguageContext';
import { Maitree } from 'next/font/google';

import { PWARegister } from '@/components/pwa/PWARegister';

const maitree = Maitree({
  weight: ['200', '300', '400', '500', '600', '700'],
  subsets: ['thai', 'latin'],
  variable: '--font-maitree',
  display: 'swap',
});

export const viewport: Viewport = {
  themeColor: '#8B1B1B',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: 'หอศิลป์เพาะช่าง (POH-CHANG) | วิทยาลัยเพาะช่าง มทร.รัตนโกสินทร์',
  description: 'หอศิลป์และนิทรรศการศิลปกรรมเสมือนจริง วิทยาลัยเพาะช่าง มหาวิทยาลัยเทคโนโลยีราชมงคลรัตนโกสินทร์ (Poh-Chang Academy of Arts Virtual 3D Gallery & E-Catalog)',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'POH-CHANG',
  },
  icons: {
    icon: '/icons/icon-192x192.png',
    apple: '/icons/apple-touch-icon.png',
  },
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
        <PWARegister />
      </body>
    </html>
  );
}
