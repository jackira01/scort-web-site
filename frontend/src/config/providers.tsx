'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { SessionProvider } from 'next-auth/react';
import { type PropsWithChildren, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from '@/components/theme-provider';

const enviroment = process.env.NODE_ENV;

export default function QueryProvider({ children }: PropsWithChildren) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Configuración global para todas las queries
            staleTime: 1 * 60 * 1000, // 1 minuto
            retry: 1,
            refetchOnWindowFocus: true, // Refrescar cuando la ventana recibe foco
            refetchOnMount: true, // Refrescar cuando el componente se monta
          },
        },
      }),
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
  return (
    <QueryProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <SessionProvider>
          <Toaster position="top-right" />
          {children}
        </SessionProvider>
      </ThemeProvider>
    </QueryProvider>
  );
}
