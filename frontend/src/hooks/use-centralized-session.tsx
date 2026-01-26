'use client';

import type { Session } from 'next-auth';
import { useSession } from 'next-auth/react';
import { createContext, useContext, useEffect, type ReactNode } from 'react';

/**
 * Contexto centralizado para la sesión de autenticación.
 * 
 * Este contexto reduce el número de suscripciones a NextAuth de 45+ componentes
 * a UNA ÚNICA suscripción, eliminando múltiples peticiones a /api/auth/session.
 */
interface SessionContextValue {
    session: Session | null;
    status: 'loading' | 'authenticated' | 'unauthenticated';
    isLoading: boolean;
    isAuthenticated: boolean;
    isAdmin: boolean;
    userId: string | null;
    userEmail: string | null;
    userName: string | null;
    accessToken: string | null;
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

/**
 * Provider que centraliza la llamada a useSession().
 * Debe montarse UNA SOLA VEZ en el árbol de componentes (en Providers).
 * 
 * @example
 * <SessionProvider {...}>
 *   <SessionContextProvider>
 *     <App />
 *   </SessionContextProvider>
 * </SessionProvider>
 */
export function SessionContextProvider({ children }: { children: ReactNode }) {
    // ✅ ÚNICA llamada a useSession() en toda la aplicación
    const { data: session, status } = useSession();

    const value: SessionContextValue = {
        session,
        status,
        isLoading: status === 'loading',
        isAuthenticated: status === 'authenticated',
        isAdmin: session?.user?.role === 'admin',
        userId: session?.user?._id || null,
        userEmail: session?.user?.email || null,
        userName: session?.user?.name || null,
        accessToken: (session?.user as any)?.accessToken || null,
    };

    // Keep localStorage in sync for non-React services
    useEffect(() => {
        const token = (session?.user as any)?.accessToken;
        if (session && token) {
            localStorage.setItem('authToken', token);
        } else if (status === 'unauthenticated') {
            localStorage.removeItem('authToken');
        }
    }, [session, status]);

    return (
        <SessionContext.Provider value={value}>
            {children}
        </SessionContext.Provider>
    );
}

/**
 * Hook para consumir la sesión centralizada en cualquier componente.
 * 
 * USAR ESTE HOOK en lugar de useSession() de next-auth/react para:
 * - Reducir peticiones a /api/auth/session
 * - Mejorar el rendimiento
 * - Centralizar la lógica de autenticación
 * 
 * @example
 * // ANTES:
 * import { useSession } from 'next-auth/react';
 * const { data: session } = useSession();
 * 
 * // DESPUÉS:
 * import { useCentralizedSession } from '@/hooks/use-centralized-session';
 * const { session, isAdmin } = useCentralizedSession();
 * 
 * @throws Error si se usa fuera del SessionContextProvider
 */
export function useCentralizedSession() {
    const context = useContext(SessionContext);

    if (!context) {
        throw new Error(
            'useCentralizedSession debe usarse dentro de SessionContextProvider. ' +
            'Asegúrate de que <SessionContextProvider> esté montado en providers.tsx'
        );
    }

    return context;
}
