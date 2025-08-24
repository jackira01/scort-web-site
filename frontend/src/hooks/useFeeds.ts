import { useQuery } from '@tanstack/react-query';
import { API_URL } from '@/lib/config';
import type { 
  HomeFeedOptions, 
  HomeFeedResponse, 
  FeedStatsResponse,
  HomeFeedProfile 
} from '@/types/profile.types';

// API functions
const feedsApi = {
  getHomeFeed: async (options: HomeFeedOptions = {}): Promise<HomeFeedResponse> => {
    const { page = 1, pageSize = 20 } = options;
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', pageSize.toString());

    const response = await fetch(`${API_URL}/api/profile/home?${params}`);
    if (!response.ok) {
      throw new Error(`Error al obtener perfiles: ${response.status}`);
    }
    
    const result = await response.json();
    
    // Adaptar la respuesta del backend al formato esperado por el frontend
    return {
      profiles: result.profiles || [],
      pagination: result.pagination || { page: 1, limit: pageSize, total: 0, pages: 0 },
      metadata: {
        levelSeparators: [] // El backend ya ordena, no necesitamos separadores manuales
      }
    };
  },

  getFeedStats: async (): Promise<FeedStatsResponse> => {
    const response = await fetch(`${API_URL}/api/feeds/stats`);
    if (!response.ok) {
      throw new Error(`Error al obtener estadísticas: ${response.status}`);
    }
    
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Error en la respuesta del servidor');
    }
    
    return result.data;
  }
};

// React Query hooks
export const useHomeFeed = (options: HomeFeedOptions = {}) => {
  return useQuery({
    queryKey: ['homeFeed', options],
    queryFn: () => feedsApi.getHomeFeed(options),
    staleTime: 2 * 60 * 1000, // 2 minutos
    cacheTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
  });
};

export const useFeedStats = () => {
  return useQuery({
    queryKey: ['feedStats'],
    queryFn: feedsApi.getFeedStats,
    staleTime: 5 * 60 * 1000, // 5 minutos
    cacheTime: 10 * 60 * 1000, // 10 minutos
    refetchOnWindowFocus: false,
  });
};

// Hook para obtener perfiles destacados (primera página del feed)
export const useFeaturedProfiles = () => {
  return useHomeFeed({ page: 1, pageSize: 12 });
};

// Hook para obtener perfiles con separadores por nivel
export const useHomeFeedWithSeparators = (options: HomeFeedOptions = {}) => {
  const { data, ...rest } = useHomeFeed(options);
  
  return {
    ...rest,
    data,
    profiles: data?.profiles || [],
    levelSeparators: data?.metadata?.levelSeparators || [],
    pagination: data?.pagination
  };
};