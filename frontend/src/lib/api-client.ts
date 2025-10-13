import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { API_URL } from './config';

// Crear instancia de axios con configuración optimizada
const apiClient: AxiosInstance = axios.create({
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

// Cache para evitar llamadas repetidas a getSession
let sessionCache: any = null;
let sessionCacheTime = 0;
const SESSION_CACHE_DURATION = 30000; // 30 segundos

// Interceptor para agregar cabeceras de autenticación
apiClient.interceptors.request.use(
  async (config) => {
    // Evitar bucle infinito: no procesar peticiones a /api/auth/session
    if (config.url?.includes('/api/auth/session')) {
      return config;
    }

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

// Interceptor para manejar respuestas y errores
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error) => {
    if (error.response?.status === 401) {
      // Token expirado o inválido
      try {
        const { signOut } = await import('next-auth/react');
        await signOut({ redirect: false });
      } catch (signOutError) {
        console.error('Error al cerrar sesión:', signOutError);
      }
    }
    return Promise.reject(error);
  }
);

export { apiClient };
export default apiClient;