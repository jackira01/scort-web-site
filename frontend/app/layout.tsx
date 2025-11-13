import type { Metadata } from 'next';
import type React from 'react';
import '../src/styles/globals.css';
import { Providers } from '@/config/providers';
import { Poppins } from "next/font/google";
import ConditionalHeader from '@/components/layout/ConditionalHeader';
import { auth } from '@/auth';

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"], // elige los pesos que uses
  variable: "--font-poppins", // define una CSS variable
});

export const metadata: Metadata = {
  title: 'Online Escorts - Premium Escort Services',
  description:
    'Encuentra servicios de Escorts premium en tu ciudad. Profesionales, verificados y compañeros discretos.',
  icons: {
    icon: "/images/kiss.png", // o /logo.png
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
        </Providers>
      </body>
    </html>
  );
}
