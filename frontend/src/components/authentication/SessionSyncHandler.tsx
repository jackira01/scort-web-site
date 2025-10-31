'use client';

import { useEffect } from 'react';
import { signOut, useSession } from 'next-auth/react';

/**
 * Componente que sincroniza el cierre de sesión entre múltiples pestañas/ventanas
 * del navegador usando el evento storage de localStorage.
 * 
 * Cuando un usuario cierra sesión en una pestaña, todas las demás pestañas
 * abiertas detectarán el cambio y cerrarán sesión automáticamente.
 */
export default function SessionSyncHandler() {
  const { data: session, status } = useSession();

  useEffect(() => {
    // Solo ejecutar en el cliente
    if (typeof window === 'undefined') return;

    /**
     * Handler que escucha cambios en localStorage
     * Se dispara cuando otra pestaña modifica localStorage
     */
    const handleStorageChange = (event: StorageEvent) => {
      // Detectar cuando se ejecuta signOut en otra pestaña
      if (event.key === 'nextauth.message') {
        try {
          const data = event.newValue ? JSON.parse(event.newValue) : null;
          
          // Si el evento es de tipo 'session' y el data es null, significa logout
          if (data?.event === 'session' && data?.data === null) {
            console.log('🔄 [SessionSync] Sesión cerrada en otra pestaña, sincronizando...');
            
            // Cerrar sesión en esta pestaña también
            // redirect: false para evitar redirección múltiple
            signOut({ redirect: false }).then(() => {
              // Redirigir manualmente después de cerrar sesión
              window.location.href = '/';
            });
          }
        } catch (error) {
          console.error('Error procesando cambio de sesión:', error);
        }
      }

      // Detectar cuando se elimina la cookie de sesión directamente
      if (event.key?.includes('next-auth.session-token') && !event.newValue) {
        console.log('🔄 [SessionSync] Cookie de sesión eliminada en otra pestaña');
        
        if (session) {
          signOut({ redirect: false }).then(() => {
            window.location.href = '/';
          });
        }
      }
    };

    /**
     * Handler para el evento beforeunload
     * Detecta cuando se cierra la última pestaña
     */
    const handleBeforeUnload = () => {
      // Marcar que esta pestaña se está cerrando
      sessionStorage.setItem('tab-closing', 'true');
    };

    /**
     * Handler para el evento visibilitychange
     * Detecta cuando la pestaña se vuelve visible y verifica la sesión
     */
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Verificar si la sesión sigue activa al volver a la pestaña
        if (sessionStorage.getItem('tab-closing') === 'true') {
          sessionStorage.removeItem('tab-closing');
        }
        
        // Si no hay sesión pero debería haberla, recargar
        if (status === 'authenticated' && !session) {
          console.log('🔄 [SessionSync] Sesión perdida, recargando...');
          window.location.reload();
        }
      }
    };

    // Registrar event listeners
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup al desmontar
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [session, status]);

  // Este componente no renderiza nada visible
  return null;
}
