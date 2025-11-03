'use client';

import { useAuthSync } from '@/hooks/use-auth-sync';

/**
 * Componente que sincroniza el estado de autenticación entre pestañas usando BroadcastChannel.
 * 
 * Este componente debe montarse una vez en el árbol de componentes (normalmente en Providers o Layout).
 * Se encarga de:
 * 
 * 1. Escuchar mensajes de logout/login de otras pestañas
 * 2. Cerrar sesión automáticamente cuando otra pestaña cierra sesión
 * 3. Recargar la página cuando otra pestaña inicia sesión
 * 
 * Ventajas sobre localStorage (SessionSyncHandler):
 * - Más eficiente (no requiere polling)
 * - Específico para comunicación entre pestañas
 * - No contamina localStorage
 * - Mejor rendimiento
 * 
 * @example
 * // En tu Providers component
 * <SessionProvider>
 *   <AuthSyncHandler />
 *   {children}
 * </SessionProvider>
 */
export default function AuthSyncHandler() {
  useAuthSync();
  return null;
}
