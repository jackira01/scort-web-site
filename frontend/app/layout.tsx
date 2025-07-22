import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import type React from 'react';
import '@/styles/globals.css';
import { SessionProvider } from 'next-auth/react';
import HeaderComponent from '@/components/header/Header';
import Loader from '@/components/Loader';
import { ThemeProvider } from '@/components/theme-provider';
import { auth } from '@/config/auth';
import { Providers } from '@/config/providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Online Escorts - Premium Escort Services',
  description:
    'Find premium escort services in your city. Professional, verified, and discreet companions.',
  generator: 'v0.dev',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    <Loader />;
  }

  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <HeaderComponent />

          {children}
        </Providers>
      </body>
    </html>
  );
}
