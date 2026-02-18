import { auth } from '@/auth';
import ConditionalHeader from '@/components/layout/ConditionalHeader';
import { Providers } from '@/config/providers';
import { GoogleAnalytics } from '@next/third-parties/google';
import type { Metadata } from 'next';
import { Poppins } from "next/font/google";
import type React from 'react';
import '../src/styles/globals.css';
const gaId = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID || '';

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"], // elige los pesos que uses
  variable: "--font-poppins", // define una CSS variable
});

export const metadata: Metadata = {
  metadataBase: new URL('https://www.prepagoya.com'),
  title: {
    default: 'PrepagoYa - Escorts, Putas y Gigolós en Colombia',
    template: '%s | PrepagoYa Services'
  },
  description:
    'Servicios de Prepagos, Escorts, Putas, Gigolós. Encuentros de Sexo en tu ciudad. Profesionales verificados, servicios Gay, Acompañantes y Trans discretos.',
  keywords: ['prepagos', 'putas', 'Escorts', 'gigolo', 'gay', 'sexo', 'servicios sexuales', 'adultos', 'colombia', 'encuentros', 'trans', 'acompañantes', 'sex'],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: 'PrepagoYa - La mejor guía de Escorts y Prepagos',
    description: 'Directorio líder de servicios para adultos. Encuentra Escorts, putas, gigolós y más.',
    url: 'https://www.prepagoya.com',
    siteName: 'PrepagoYa',
    locale: 'es_CO',
    type: 'website',
    images: [
      {
        url: '/images/kiss.png', // Fallback image
        width: 800,
        height: 600,
      },
    ],
  },
  icons: {
    icon: "/images/kiss.png",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // ✅ Obtener sesión en el servidor para eliminar petición inicial a /api/auth/session
  const session = await auth();

  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${poppins.variable} font-poppins`}>
        <Providers session={session}>
          <ConditionalHeader />
          {children}
          <GoogleAnalytics gaId={gaId} />
        </Providers>
      </body>
    </html>
  );
}
