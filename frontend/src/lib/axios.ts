import axios from 'axios';
import { API_URL } from './config';

// Crear instancia de axios con configuración base
const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

// Interceptor para agregar cabeceras de autenticación
axiosInstance.interceptors.request.use(
  (config) => {
    // Para desarrollo, usar un ID de desarrollo por defecto
    // La autenticación real se maneja en los componentes del cliente
    if (process.env.NODE_ENV === 'development') {
      config.headers['X-User-ID'] = '507f1f77bcf86cd799439011';
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