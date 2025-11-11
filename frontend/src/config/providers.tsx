'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { SessionProvider } from 'next-auth/react';
import { type PropsWithChildren, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from '@/components/theme-provider';
import AuthRedirectHandler from '@/components/authentication/AuthRedirectHandler';
import AuthSyncHandler from '@/components/authentication/AuthSyncHandler';
import { CookieConsentProvider } from '@/contexts/CookieConsentContext';
import CookieConsentWrapper from '@/components/CookieConsentWrapper';
import { AgeVerificationProvider } from '@/contexts/AgeVerificationContext';
import { SessionContextProvider } from '@/hooks/use-centralized-session';
import type { Session } from 'next-auth';

const enviroment = process.env.NODE_ENV;

export default function QueryProvider({ children }: PropsWithChildren) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Configuración optimizada para rendimiento
            staleTime: 5 * 60 * 1000, // 5 minutos - datos frescos por más tiempo
            gcTime: 10 * 60 * 1000, // 10 minutos - mantener en caché más tiempo
            retry: (failureCount, error: any) => {
              // No reintentar en errores 4xx (cliente)
              if (error?.response?.status >= 400 && error?.response?.status < 500) {
                return false;
              }
              // Máximo 2 reintentos para otros errores
              return failureCount < 2;
            },
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
            refetchOnWindowFocus: false, // Evitar refetch innecesarios
            refetchOnMount: 'always', // Siempre refrescar al montar
            refetchOnReconnect: 'always', // Refrescar al reconectar
            networkMode: 'online', // Solo ejecutar cuando hay conexión
          },
          mutations: {
            retry: 1,
            networkMode: 'online',
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

export function Providers({
  children,
  session
}: PropsWithChildren<{ session?: Session | null }>) {
  return (
    <QueryProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <SessionProvider
          session={session}
          refetchInterval={0}
          refetchOnWindowFocus={false}
          refetchWhenOffline={false}
        >
          {/* ✅ Contexto centralizado - ÚNICA suscripción a useSession() */}
          <SessionContextProvider>
            {/* Sistema de sincronización moderno con BroadcastChannel */}
            <AuthSyncHandler />
            <CookieConsentProvider>
              <AgeVerificationProvider>
                <AuthRedirectHandler />
                <Toaster position="top-right" />
                <CookieConsentWrapper>
                  {children}
                </CookieConsentWrapper>
              </AgeVerificationProvider>
            </CookieConsentProvider>
          </SessionContextProvider>
        </SessionProvider>
      </ThemeProvider>
    </QueryProvider>
  );
}
