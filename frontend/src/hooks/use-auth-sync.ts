'use client';

import { useEffect, useRef } from 'react';
import { signOut, useSession } from 'next-auth/react';

/**
 * Hook para sincronizar el estado de autenticación entre pestañas usando BroadcastChannel.
 * 
 * Cuando un usuario cierra sesión en una pestaña, todas las demás pestañas abiertas
 * se desloguearán automáticamente sin necesidad de recargar.
 * 
 * @example
 * // En tu componente de layout o provider
 * function App() {
 *   useAuthSync();
 *   return <YourApp />
 * }
 */
export function useAuthSync() {
    const { data: session, status } = useSession();
    const channelRef = useRef<BroadcastChannel | null>(null);
    const previousStatusRef = useRef<string>(status);

    useEffect(() => {
        // Solo ejecutar en el cliente y si BroadcastChannel está disponible
        if (typeof window === 'undefined' || !('BroadcastChannel' in window)) {
            console.warn('⚠️ [AuthSync] BroadcastChannel no está disponible en este navegador');
            return;
        }

        // Crear el canal "auth" para comunicación entre pestañas
        const channel = new BroadcastChannel('auth');
        channelRef.current = channel;

        console.log('✅ [AuthSync] Canal de autenticación inicializado');

        /**
         * Handler que escucha mensajes de otras pestañas
         */
        const handleMessage = async (event: MessageEvent) => {
            const { type, timestamp } = event.data;

            console.log('📨 [AuthSync] Mensaje recibido:', { type, timestamp });

            // Procesar mensaje de logout
            if (type === 'logout') {
                console.log('🚪 [AuthSync] Cerrando sesión en esta pestaña...');

                // Cerrar sesión sin redirección automática
                try {
                    await signOut({ redirect: false });
                    console.log('✅ [AuthSync] Sesión cerrada exitosamente');

                    // Redirigir manualmente después de cerrar sesión
                    window.location.href = '/';
                } catch (error) {
                    console.error('❌ [AuthSync] Error al cerrar sesión:', error);
                }
            }

            // Procesar mensaje de login (opcional, para sincronizar login también)
            if (type === 'login') {
                console.log('🔑 [AuthSync] Nueva sesión detectada en otra pestaña');
                // Recargar la página para obtener la nueva sesión
                window.location.reload();
            }
        };

        // Registrar el listener
        channel.addEventListener('message', handleMessage);

        // Cleanup al desmontar
        return () => {
            console.log('🧹 [AuthSync] Cerrando canal de autenticación');
            channel.removeEventListener('message', handleMessage);
            channel.close();
            channelRef.current = null;
        };
    }, []); // Solo ejecutar una vez al montar

    /**
     * Detectar cambios en el estado de autenticación para emitir mensajes
     */
    useEffect(() => {
        const previousStatus = previousStatusRef.current;

        // Detectar transición de autenticado a no autenticado (logout)
        if (previousStatus === 'authenticated' && status === 'unauthenticated') {
            console.log('🔴 [AuthSync] Cambio detectado: authenticated → unauthenticated');

            if (channelRef.current) {
                const message = {
                    type: 'logout',
                    timestamp: Date.now(),
                };

                console.log('📤 [AuthSync] Emitiendo logout a otras pestañas:', message);
                channelRef.current.postMessage(message);
            }
        }

        // Detectar transición de no autenticado a autenticado (login)
        if (previousStatus === 'unauthenticated' && status === 'authenticated') {
            console.log('🟢 [AuthSync] Cambio detectado: unauthenticated → authenticated');

            if (channelRef.current) {
                const message = {
                    type: 'login',
                    timestamp: Date.now(),
                };

                console.log('📤 [AuthSync] Emitiendo login a otras pestañas:', message);
                channelRef.current.postMessage(message);
            }
        }

        // Actualizar la referencia del estado anterior
        previousStatusRef.current = status;
    }, [status]);

    return null;
}

/**
 * Función helper para ejecutar logout y notificar a otras pestañas.
 * Úsala en lugar de llamar directamente a signOut() para garantizar
 * que todas las pestañas se sincronicen.
 * 
 * @param callbackUrl - URL a la que redirigir después del logout (opcional)
 * 
 * @example
 * // En tu botón de logout
 * <button onClick={() => broadcastLogout()}>
 *   Cerrar sesión
 * </button>
 */
export async function broadcastLogout(callbackUrl: string = '/') {
    try {
        console.log('🚪 [AuthSync] Iniciando logout broadcast...');

        // Notificar a otras pestañas ANTES de cerrar sesión
        if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
            const channel = new BroadcastChannel('auth');
            channel.postMessage({
                type: 'logout',
                timestamp: Date.now(),
            });

            // Dar tiempo para que el mensaje se envíe
            await new Promise(resolve => setTimeout(resolve, 50));
            channel.close();
        }

        // Ejecutar el logout local
        await signOut({ callbackUrl, redirect: true });
    } catch (error) {
        console.error('❌ [AuthSync] Error en broadcastLogout:', error);
        // Intentar logout de todas formas
        await signOut({ callbackUrl, redirect: true });
    }
}

/**
 * Función helper para ejecutar login y notificar a otras pestañas.
 * 
 * @example
 * // Después de un login exitoso
 * await broadcastLogin();
 */
export async function broadcastLogin() {
    try {
        console.log('🔑 [AuthSync] Notificando login a otras pestañas...');

        if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
            const channel = new BroadcastChannel('auth');
            channel.postMessage({
                type: 'login',
                timestamp: Date.now(),
            });

            await new Promise(resolve => setTimeout(resolve, 50));
            channel.close();
        }
    } catch (error) {
        console.error('❌ [AuthSync] Error en broadcastLogin:', error);
    }
}
