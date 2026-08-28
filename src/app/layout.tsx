import type { Metadata, Viewport } from 'next';
import './globals.css';
import { LanguageProvider } from '@/context/LanguageContext';
import { PWARegister } from '@/components/pwa/PWARegister';

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
  other: {
    'mobile-web-app-capable': 'yes',
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
    <html lang="th">
      <head>
        <link rel="preconnect" href="https://ik.imagekit.io" crossOrigin="" />
        <link rel="dns-prefetch" href="https://ik.imagekit.io" />
        <link rel="preconnect" href="https://flagcdn.com" crossOrigin="" />
        <link rel="dns-prefetch" href="https://flagcdn.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      </head>
      <body className="min-h-screen flex flex-col bg-[#121110] text-[#FAF8F5]">
        <LanguageProvider>{children}</LanguageProvider>
        <PWARegister />
      </body>
    </html>
  );
}
