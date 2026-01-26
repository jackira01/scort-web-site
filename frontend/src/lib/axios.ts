import axios from 'axios';
import { API_URL } from './config';

// Crear instancia de axios con configuración optimizada
const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 15000, // Aumentar timeout para consultas complejas
  maxRedirects: 3,
  maxContentLength: 50 * 1024 * 1024, // 50MB
  maxBodyLength: 50 * 1024 * 1024, // 50MB
  // Optimizaciones de rendimiento
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'Accept-Encoding': 'gzip, deflate, br',
  },
  // Configuración de compresión
  decompress: true,
});

// Apply Demo Mode Interceptor
import { applyDemoMode } from './demo-adapter';
applyDemoMode(axiosInstance);

// Cache para evitar llamadas repetidas a getSession
let sessionCache: any = null;
let sessionCacheTime = 0;
const SESSION_CACHE_DURATION = 30000; // 30 segundos

// Interceptor para agregar cabeceras de autenticación
axiosInstance.interceptors.request.use(
  async (config) => {
    // Evitar bucle infinito: no procesar peticiones a /api/auth/session
    if (config.url?.includes('/api/auth/session')) {
      return config;
    }

    // Intentar obtener la sesión de NextAuth.js con cache
    try {
      const now = Date.now();

      // Usar cache si está disponible y no ha expirado
      if (sessionCache && (now - sessionCacheTime) < SESSION_CACHE_DURATION) {
        const session = sessionCache;

        if (session?.accessToken) {
          config.headers['Authorization'] = `Bearer ${session.accessToken}`;
        } else if (session?.user && session.user._id) {
          config.headers['X-User-ID'] = session.user._id;
        } else if (process.env.NODE_ENV === 'development') {
          config.headers['X-User-ID'] = '507f1f77bcf86cd799439011';
        }
      } else {
        // Obtener nueva sesión solo si el cache ha expirado
        const { getSession } = await import('next-auth/react');
        const session = await getSession();

        // Actualizar cache
        sessionCache = session;
        sessionCacheTime = now;

        if (session?.accessToken) {
          config.headers['Authorization'] = `Bearer ${session.accessToken}`;
        } else if (session?.user && session.user._id) {
          config.headers['X-User-ID'] = session.user._id;
        } else if (process.env.NODE_ENV === 'development') {
          config.headers['X-User-ID'] = '507f1f77bcf86cd799439011';
        }
      }
    } catch (error) {
      // Si falla la obtención de la sesión, usar fallback para desarrollo
      if (process.env.NODE_ENV === 'development') {
        config.headers['X-User-ID'] = '507f1f77bcf86cd799439011';
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para respuestas con manejo optimizado de errores
axiosInstance.interceptors.response.use(
  (response) => {
    // Agregar headers de caché para optimización
    if (response.config.method === 'get') {
      response.headers['cache-control'] = 'public, max-age=300'; // 5 minutos
    }
    return response;
  },
  (error) => {
    // Manejo inteligente de errores
    if (error.response) {
      // Error del servidor (4xx, 5xx)
      const status = error.response.status;
      const message = error.response.data?.message || error.message;

      switch (status) {
        case 401:
          // Token expirado o no válido
          break;
        case 403:
          break;
        case 404:
          break;
        case 429:
          break;
        case 500:
        case 502:
        case 503:
        case 504:
          break;
        default:
          break;
      }
    } else if (error.request) {
      // Error de red
    } else {
      // Error de configuración
    }

    return Promise.reject(error);
  }
);

// Función helper para crear claves de caché
export const createCacheKey = (url: string, params?: any): string => {
  const baseKey = url.replace(/[^a-zA-Z0-9]/g, '_');
  const paramsKey = params ? JSON.stringify(params) : '';
  return `${baseKey}_${btoa(paramsKey).replace(/[^a-zA-Z0-9]/g, '')}`;
};

export default axiosInstance;