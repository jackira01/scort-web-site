import type { Metadata } from 'next';
import type React from 'react';
import '@/styles/globals.css';
import { Providers } from '@/config/providers';
import { Poppins } from "next/font/google";
import ConditionalHeader from '@/components/layout/ConditionalHeader';

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"], // elige los pesos que uses
  variable: "--font-poppins", // define una CSS variable
});

export const metadata: Metadata = {
  title: 'Online Escorts - Premium Escort Services',
  description:
    'Encuentra servicios de Escorts premium en tu ciudad. Profesionales, verificados y compañeros discretos.'
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${poppins.variable} font-poppins`}>
        <Providers>
          <ConditionalHeader />
          {children}
        </Providers>
      </body>
    </html>
  );
}
