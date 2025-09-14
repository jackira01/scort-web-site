import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import type React from 'react';
import '@/styles/globals.css';
import HeaderComponent from '@/components/header/Header';
import { Providers } from '@/config/providers';
import { Poppins } from "next/font/google";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"], // elige los pesos que uses
  variable: "--font-poppins", // define una CSS variable
});

export const metadata: Metadata = {
  title: 'Online Escorts - Premium Escort Services',
  description:
    'Find premium escort services in your city. Professional, verified, and discreet companions.',
  generator: 'v0.dev',
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
          <HeaderComponent />

          {children}
        </Providers>
      </body>
    </html>
  );
}
