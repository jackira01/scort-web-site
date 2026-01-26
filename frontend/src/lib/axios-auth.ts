import axios, { type AxiosInstance } from 'axios';
import { API_URL } from './config';

/**
 * Crea una instancia de Axios configurada con autenticación.
 * 
 * ✅ NO llama a getSession() internamente, evitando peticiones a /api/auth/session
 * ✅ Recibe el token/userId como parámetros desde el componente
 * ✅ Debe usarse junto con useCentralizedSession() para obtener las credenciales
 * 
 * @param accessToken - Token de acceso de la sesión (opcional)
 * @param userId - ID del usuario (opcional, fallback si no hay token)
 * @returns Instancia de Axios configurada
 * 
 * @example
 * // En un componente
 * import { useCentralizedSession } from '@/hooks/use-centralized-session';
 * import { createAuthenticatedAxios } from '@/lib/axios-auth';
 * 
 * function MyComponent() {
 *   const { accessToken, userId } = useCentralizedSession();
 *   
 *   const fetchData = async () => {
 *     const api = createAuthenticatedAxios(accessToken, userId);
 *     const response = await api.get('/endpoint');
 *     return response.data;
 *   };
 * }
 */
export function createAuthenticatedAxios(
    accessToken?: string | null,
    userId?: string | null
): AxiosInstance {
    const instance = axios.create({
        baseURL: API_URL,
        timeout: 15000,
        maxRedirects: 3,
        maxContentLength: 50 * 1024 * 1024, // 50MB
        maxBodyLength: 50 * 1024 * 1024, // 50MB
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Accept-Encoding': 'gzip, deflate, br',
        },
        decompress: true,
    });

    // Interceptor para agregar headers de autenticación
    instance.interceptors.request.use(
        (config) => {
            // Evitar bucle infinito: no procesar peticiones a /api/auth/session
            if (config.url?.includes('/api/auth/session')) {
                return config;
            }

            // Agregar Authorization header si hay token
            if (accessToken) {
                config.headers['Authorization'] = `Bearer ${accessToken}`;
            }
            // Fallback: usar X-User-ID si hay userId pero no token
            else if (userId) {
                config.headers['X-User-ID'] = userId;
            }
            // Fallback de desarrollo
            else if (process.env.NODE_ENV === 'development') {
                config.headers['X-User-ID'] = '507f1f77bcf86cd799439011';
            }

            return config;
        },
        (error) => {
            return Promise.reject(error);
        }
    );

    // Interceptor para respuestas con manejo de errores
    instance.interceptors.response.use(
        (response) => response,
        (error) => {
            // Manejar errores de autenticación
            if (error.response?.status === 401) {
                console.error('❌ [Axios Auth] No autorizado - Token inválido o expirado');
            }

            // Manejar errores de red
            if (!error.response) {
                console.error('❌ [Axios Auth] Error de red:', error.message);
            }

            return Promise.reject(error);
        }
    );

    // Apply Demo Mode Interceptor
    // This allows testing UI interactions without persisting data
    try {
        const { applyDemoMode } = require('./demo-adapter');
        applyDemoMode(instance);
    } catch (e) {
        // Ignore if module not found (shouldn't happen)
    }

    return instance;
}

/**
 * Hook helper para usar axios autenticado con la sesión centralizada.
 * 
 * @example
 * import { useAuthenticatedAxios } from '@/lib/axios-auth';
 * 
 * function MyComponent() {
 *   const api = useAuthenticatedAxios();
 *   
 *   const fetchData = async () => {
 *     const response = await api.get('/endpoint');
 *     return response.data;
 *   };
 * }
 */
export function useAuthenticatedAxios(): AxiosInstance {
    // Importación dinámica para evitar usar el hook fuera de componentes
    try {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const { useCentralizedSession } = require('@/hooks/use-centralized-session');
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const { accessToken, userId } = useCentralizedSession();
        return createAuthenticatedAxios(accessToken, userId);
    } catch (error) {
        console.error('❌ [Axios Auth] Error al obtener sesión:', error);
        return createAuthenticatedAxios();
    }
}
