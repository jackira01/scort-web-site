import { useQuery } from '@tanstack/react-query';
import axios from '@/lib/axios';
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

    const response = await axios.get(`/api/profile/home?${params}`);
    const result = response.data;

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
    const response = await axios.get('/api/feeds/stats');
    const result = response.data;
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
    gcTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
  });
};

export const useFeedStats = () => {
  return useQuery({
    queryKey: ['feedStats'],
    queryFn: feedsApi.getFeedStats,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
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
    profiles: (data as HomeFeedResponse)?.profiles || [],
    levelSeparators: (data as HomeFeedResponse)?.metadata?.levelSeparators || [],
    pagination: (data as HomeFeedResponse)?.pagination || { page: 1, pageSize: 12, total: 0, totalPages: 0 }
  };
};