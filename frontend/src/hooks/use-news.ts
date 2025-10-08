import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { newsService, NewsFilters } from '../services/news.service';
import { News, CreateNewsRequest, NewsFormData } from '../types/news.types';
import { toast } from 'sonner';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const newsKeys = {
  all: ['news'] as const,
  lists: () => [...newsKeys.all, 'list'] as const,
  list: (filters: NewsFilters & NewsPaginationParams) => [...newsKeys.lists(), filters] as const,
  details: () => [...newsKeys.all, 'detail'] as const,
  detail: (id: string) => [...newsKeys.details(), id] as const,
  latest: (limit: number) => [...newsKeys.all, 'latest', limit] as const,
  search: (term: string) => [...newsKeys.all, 'search', term] as const,
  admin: {
    all: () => [...newsKeys.all, 'admin'] as const,
    list: (filters: NewsFilters & NewsPaginationParams) => [...newsKeys.admin.all(), 'list', filters] as const,
    detail: (id: string) => [...newsKeys.admin.all(), 'detail', id] as const,
  },
};

// ============================================================================
// QUERY HOOKS
// ============================================================================

/**
 * Hook para obtener noticias con filtros
 */
export const useNews = (filters: NewsFilters & NewsPaginationParams = {}) => {
  return useQuery({
    queryKey: newsKeys.list(filters),
    queryFn: () => newsService.getNews(filters),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

/**
 * Hook para obtener una noticia por ID
 */
export const useNewsById = (id: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: newsKeys.detail(id),
    queryFn: () => newsService.getNewsById(id),
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook para obtener las últimas noticias
 */
export const useLatestNews = (limit: number = 5) => {
  return useQuery({
    queryKey: newsKeys.latest(limit),
    queryFn: () => newsService.getLatestNews(limit),
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
};

/**
 * Hook para buscar noticias
 */
export const useSearchNews = (searchTerm: string, limit: number = 10) => {
  return useQuery({
    queryKey: newsKeys.search(searchTerm),
    queryFn: () => newsService.searchNews(searchTerm, limit),
    enabled: !!searchTerm && searchTerm.length >= 2,
    staleTime: 5 * 60 * 1000,
  });
};

// ===== HOOKS PARA VISUALIZACIONES =====
// Estos hooks ya no son necesarios con localStorage
// Se mantienen comentados por compatibilidad temporal

/*
export const useLatestUnreadNews = () => {
  return useQuery({
    queryKey: [...newsKeys.all, 'latest-unread'],
    queryFn: () => newsService.getLatestUnreadNews(),
    staleTime: 1 * 60 * 1000, // 1 minuto
    refetchInterval: 2 * 60 * 1000, // Refetch cada 2 minutos
  });
};

export const useUnreadNews = (filters: NewsFilters & NewsPaginationParams = {}) => {
  return useQuery({
    queryKey: [...newsKeys.all, 'unread', filters],
    queryFn: () => newsService.getUnreadNews(),
    staleTime: 1 * 60 * 1000, // 1 minuto
  });
};

export const useMarkNewsAsViewed = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (newsId: string) => newsService.markNewsAsViewed(newsId),
    onSuccess: () => {
      // Invalidar queries relacionadas con noticias no leídas
      queryClient.invalidateQueries({ queryKey: [...newsKeys.all, 'unread'] });
      queryClient.invalidateQueries({ queryKey: [...newsKeys.all, 'latest-unread'] });
      
      toast.success('Noticia marcada como vista');
    },
    onError: (error: any) => {
      console.error('Error al marcar noticia como vista:', error);
      toast.error('Error al marcar la noticia como vista');
    },
  });
};
*/

// ============================================================================
// MUTATION HOOKS
// ============================================================================

/**
 * Hook para crear una nueva noticia
 */
export const useCreateNews = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateNewsRequest) => newsService.createNews(data),
    onSuccess: (newNews) => {
      // Invalidar todas las listas de noticias
      queryClient.invalidateQueries({ queryKey: newsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: newsKeys.latest(5) });
      queryClient.invalidateQueries({ queryKey: newsKeys.admin.all() });
      
      // Agregar la nueva noticia al cache
      queryClient.setQueryData(newsKeys.detail(newNews._id), newNews);
      
      toast.success('Noticia creada exitosamente');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al crear la noticia');
    },
  });
};

/**
 * Hook para actualizar una noticia
 */
export const useUpdateNews = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateNewsRequest }) => 
      newsService.updateNews(id, data),
    onSuccess: (updatedNews) => {
      // Invalidar listas
      queryClient.invalidateQueries({ queryKey: newsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: newsKeys.latest(5) });
      queryClient.invalidateQueries({ queryKey: newsKeys.admin.all() });
      
      // Actualizar el cache de la noticia específica
      queryClient.setQueryData(newsKeys.detail(updatedNews._id), updatedNews);
      
      toast.success('Noticia actualizada exitosamente');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al actualizar la noticia');
    },
  });
};

/**
 * Hook para alternar el estado de publicación de una noticia
 */
export const useToggleNewsStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => newsService.toggleNewsStatus(id),
    onSuccess: (updatedNews) => {
      // Invalidar listas
      queryClient.invalidateQueries({ queryKey: newsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: newsKeys.latest(5) });
      queryClient.invalidateQueries({ queryKey: newsKeys.admin.all() });
      
      // Actualizar el cache
      queryClient.setQueryData(newsKeys.detail(updatedNews._id), updatedNews);
      
      toast.success(`Noticia ${updatedNews.published ? 'publicada' : 'despublicada'} exitosamente`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al cambiar el estado de la noticia');
    },
  });
};

/**
 * Hook para eliminar una noticia
 */
export const useDeleteNews = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => newsService.deleteNews(id),
    onSuccess: (_, deletedId) => {
      // Invalidar listas
      queryClient.invalidateQueries({ queryKey: newsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: newsKeys.latest(5) });
      queryClient.invalidateQueries({ queryKey: newsKeys.admin.all() });
      
      // Remover del cache
      queryClient.removeQueries({ queryKey: newsKeys.detail(deletedId) });
      
      toast.success('Noticia eliminada exitosamente');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al eliminar la noticia');
    },
  });
};

// ============================================================================
// ADMIN HOOKS
// ============================================================================

/**
 * Hook para obtener todas las noticias (admin)
 */
export const useAdminNews = (filters: NewsFilters & NewsPaginationParams = {}) => {
  return useQuery({
    queryKey: newsKeys.admin.list(filters),
    queryFn: () => newsService.getNews(filters),
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
};

/**
 * Hook para obtener una noticia específica (admin)
 */
export const useAdminNewsById = (id: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: newsKeys.admin.detail(id),
    queryFn: () => newsService.getNewsForAdmin(id),
    enabled: enabled && !!id,
    staleTime: 2 * 60 * 1000,
  });
};

// ============================================================================
// CONVENIENCE HOOKS
// ============================================================================

/**
 * Hook para obtener solo noticias publicadas
 */
export const usePublishedNews = (filters: Omit<NewsFilters, 'published'> & NewsPaginationParams = {}) => {
  return useNews({ ...filters, published: true });
};

/**
 * Hook para obtener todas las noticias (incluye no publicadas)
 */
export const useAllNews = (filters: NewsFilters & NewsPaginationParams = {}) => {
  return useNews(filters);
};

/**
 * Hook para prefetch de una noticia
 */
export const usePrefetchNews = () => {
  const queryClient = useQueryClient();

  return (id: string) => {
    queryClient.prefetchQuery({
      queryKey: newsKeys.detail(id),
      queryFn: () => newsService.getNewsById(id),
      staleTime: 5 * 60 * 1000,
    });
  };
};

// ============================================================================
// EXPORT DEFAULT
// ============================================================================

export default {
  useNews,
  useNewsById,
  useLatestNews,
  useSearchNews,
  // useLatestUnreadNews, // Comentado - ya no se usa con localStorage
  // useUnreadNews, // Comentado - ya no se usa con localStorage
  // useMarkNewsAsViewed, // Comentado - ya no se usa con localStorage
  useCreateNews,
  useUpdateNews,
  useToggleNewsStatus,
  useDeleteNews,
  useAdminNews,
  useAdminNewsById,
  usePublishedNews,
  useAllNews,
  usePrefetchNews,
};