'use client';

import { SessionProvider } from 'next-auth/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { PropsWithChildren, useState } from 'react';
import { ThemeProvider } from '@/components/theme-provider';
import HeaderComponent from '@/components/header/Header';
import { Toaster } from 'react-hot-toast';

const enviroment = process.env.NODE_ENV;

export default function QueryProvider({ children }: PropsWithChildren) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Configuración global para todas las queries
            staleTime: 5 * 60 * 1000, // 5 minutos
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (

    <QueryClientProvider client={queryClient}>
      {children}
      {/* Solo en desarrollo */}
      {enviroment === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}

export function Providers({ children }: PropsWithChildren) {
  return (<QueryProvider>
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    ><SessionProvider>
        <Toaster position="top-right" />

        <HeaderComponent />
        {children}
      </SessionProvider></ThemeProvider>

  </QueryProvider>)
}
