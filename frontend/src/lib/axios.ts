import axios from 'axios';
import { getSession } from 'next-auth/react';
import { API_URL } from './config';

// Crear instancia de axios con configuración base
const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

// Interceptor para agregar cabeceras de autenticación
axiosInstance.interceptors.request.use(
  async (config) => {
    try {
      // Solo intentar obtener la sesión si estamos en el cliente
      if (typeof window !== 'undefined') {
        // Obtener la sesión actual
        const session = await getSession();
        
        // Si hay una sesión activa y un JWT token, usar Authorization Bearer
        if (session?.accessToken) {
          config.headers['Authorization'] = `Bearer ${session.accessToken}`;
        } else if (session?.user?._id) {
          // Fallback a X-User-ID si no hay JWT token
          config.headers['X-User-ID'] = session.user._id;
        }
        
        // Para desarrollo, si no hay sesión, usar un ID de desarrollo
        if (!session?.user?._id && process.env.NODE_ENV === 'development') {
          config.headers['X-User-ID'] = '507f1f77bcf86cd799439011';
        }
      } else {
        // En el servidor, usar ID de desarrollo si estamos en modo desarrollo
        if (process.env.NODE_ENV === 'development') {
          config.headers['X-User-ID'] = '507f1f77bcf86cd799439011';
        }
      }
    } catch (error) {
      // En caso de error obteniendo la sesión, continuar sin cabeceras

    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas de error
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Manejar errores de autenticación
    if (error.response?.status === 401) {

      // Aquí podrías redirigir al login si es necesario
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;