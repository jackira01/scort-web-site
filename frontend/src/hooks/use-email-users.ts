'use client';

import { useQuery } from '@tanstack/react-query';
import axios from '@/lib/axios';
import { useSession } from 'next-auth/react';

interface User {
  id: string;
  username: string;
  email: string;
  profileName: string;
  profileId: string;
}

// Hook para obtener todos los usuarios con email para envío masivo
export const useAllEmailUsers = () => {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ['allEmailUsers'],
    queryFn: async (): Promise<User[]> => {
      const headers: HeadersInit = {};
      
      // Agregar header de autenticación si hay sesión
      if (session?.accessToken) {
        headers['Authorization'] = `Bearer ${session.accessToken}`;
      } else if (session?.user?._id) {
        headers['X-User-ID'] = session.user._id;
      }
      
      const response = await axios.get('/api/admin/emails/all-emails', { headers });
      return response.data;
    },
    enabled: !!session, // Solo ejecutar si hay sesión
    staleTime: 5 * 60 * 1000, // 5 minutos - los datos de usuarios no cambian frecuentemente
    gcTime: 10 * 60 * 1000, // 10 minutos en cache
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });
};

// Hook para buscar usuarios por término de búsqueda
export const useSearchEmailUsers = (searchTerm: string) => {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ['searchEmailUsers', searchTerm],
    queryFn: async (): Promise<User[]> => {
      if (!searchTerm.trim()) {
        return [];
      }

      const headers: HeadersInit = {};
      
      // Agregar header de autenticación si hay sesión
      if (session?.user?._id) {
        headers['X-User-ID'] = session.user._id;
      }
      
      const response = await axios.get(
        `/api/admin/emails/users/search?q=${encodeURIComponent(searchTerm)}`,
        { headers }
      );
      return response.data;
    },
    enabled: !!session && !!searchTerm.trim(), // Solo ejecutar si hay sesión y término de búsqueda
    staleTime: 2 * 60 * 1000, // 2 minutos - búsquedas pueden cambiar más frecuentemente
    gcTime: 5 * 60 * 1000, // 5 minutos en cache
    refetchOnMount: false, // No refrescar automáticamente en mount para búsquedas
    refetchOnWindowFocus: false,
  });
};