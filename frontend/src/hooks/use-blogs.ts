"use client";

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { blogService } from '../services/blog.service';
import toast from 'react-hot-toast';
import type { OutputData } from '@editorjs/editorjs';

export interface Blog {
  _id: string;
  title: string;
  slug: string;
  content: OutputData;
  coverImage?: string;
  published: boolean;
  categories?: string[] | { _id: string; name: string; slug: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface BlogFilters {
  published?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export interface CreateBlogData {
  title: string;
  slug?: string;
  content: OutputData;
  coverImage?: string;
  published?: boolean;
  categories?: string[];
}

export interface UpdateBlogData {
  title?: string;
  slug?: string;
  content?: object;
  coverImage?: string;
  published?: boolean;
  categories?: string[];
}

export interface BlogsResponse {
  blogs: Blog[];
  total: number;
  page: number;
  totalPages: number;
  limit: number;
}

// ============================================================================
// QUERY KEYS
// ============================================================================

export const blogKeys = {
  all: ['blogs'] as const,
  lists: () => [...blogKeys.all, 'list'] as const,
  list: (filters: BlogFilters) => [...blogKeys.lists(), filters] as const,
  details: () => [...blogKeys.all, 'detail'] as const,
  detail: (id: string) => [...blogKeys.details(), id] as const,
  related: (id: string) => [...blogKeys.all, 'related', id] as const,
  search: (term: string) => [...blogKeys.all, 'search', term] as const,
};

// ============================================================================
// QUERY HOOKS
// ============================================================================

/**
 * Hook para obtener todos los blogs con filtros
 */
export const useBlogs = (filters: BlogFilters = {}) => {
  return useQuery({
    queryKey: blogKeys.list(filters),
    queryFn: () => blogService.getBlogs(filters),
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  });
};

/**
 * Hook para obtener un blog por ID o slug
 */
export const useBlog = (identifier: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: blogKeys.detail(identifier),
    queryFn: () => blogService.getBlogByIdOrSlug(identifier),
    enabled: enabled && !!identifier,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  });
};

/**
 * Hook para obtener un blog por ID (alias de useBlog para compatibilidad)
 */
export const useBlogById = (id: string, enabled: boolean = true) => {
  return useBlog(id, enabled);
};

/**
 * Hook para obtener blogs relacionados
 */
export const useRelatedBlogs = (blogId: string, limit: number = 3) => {
  return useQuery({
    queryKey: blogKeys.related(blogId),
    queryFn: () => blogService.getRelatedBlogs(blogId, limit),
    enabled: !!blogId,
    staleTime: 10 * 60 * 1000, // 10 minutos
    gcTime: 15 * 60 * 1000, // 15 minutos
  });
};

/**
 * Hook para buscar blogs por término
 */
export const useSearchBlogs = (searchTerm: string, limit: number = 10) => {
  return useQuery({
    queryKey: blogKeys.search(searchTerm),
    queryFn: () => blogService.searchBlogs(searchTerm, limit),
    enabled: !!searchTerm && searchTerm.length >= 2,
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 5 * 60 * 1000, // 5 minutos
  });
};

// ============================================================================
// MUTATION HOOKS
// ============================================================================

/**
 * Hook para crear un nuevo blog
 */
export const useCreateBlog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateBlogData) => blogService.createBlog(data),
    onSuccess: (newBlog) => {
      // Invalidar todas las listas de blogs
      queryClient.invalidateQueries({ queryKey: blogKeys.lists() });

      // Agregar el nuevo blog al cache
      queryClient.setQueryData(blogKeys.detail(newBlog._id), newBlog);
      queryClient.setQueryData(blogKeys.detail(newBlog.slug), newBlog);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al crear blog. Ocurrió un error inesperado.');
    },
  });
};

/**
 * Hook para actualizar un blog
 */
export const useUpdateBlog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBlogData }) =>
      blogService.updateBlog(id, data),
    onSuccess: (updatedBlog) => {
      // Invalidar todas las listas de blogs
      queryClient.invalidateQueries({ queryKey: blogKeys.lists() });

      // Actualizar el blog en el cache
      queryClient.setQueryData(blogKeys.detail(updatedBlog._id), updatedBlog);
      queryClient.setQueryData(blogKeys.detail(updatedBlog.slug), updatedBlog);

      // Invalidar blogs relacionados
      queryClient.invalidateQueries({ queryKey: blogKeys.related(updatedBlog._id) });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al actualizar blog. Ocurrió un error inesperado.');
    },
  });
};

/**
 * Hook para alternar el estado publicado/no publicado de un blog
 */
export const useToggleBlog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => blogService.toggleBlogStatus(id),
    onSuccess: (updatedBlog) => {
      // Invalidar todas las listas de blogs
      queryClient.invalidateQueries({ queryKey: blogKeys.lists() });

      // Actualizar el blog en el cache
      queryClient.setQueryData(blogKeys.detail(updatedBlog._id), updatedBlog);
      queryClient.setQueryData(blogKeys.detail(updatedBlog.slug), updatedBlog);

      const status = updatedBlog.published ? 'publicado' : 'despublicado';
      toast.success(`El blog se ha ${status} exitosamente.`);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al cambiar estado. Ocurrió un error inesperado.');
    },
  });
};

/**
 * Hook para eliminar un blog
 */
export const useDeleteBlog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => blogService.deleteBlog(id),
    onSuccess: (_, deletedId) => {
      // Invalidar todas las listas de blogs
      queryClient.invalidateQueries({ queryKey: blogKeys.lists() });

      // Remover el blog del cache
      queryClient.removeQueries({ queryKey: blogKeys.detail(deletedId) });

      // Invalidar blogs relacionados
      queryClient.invalidateQueries({ queryKey: blogKeys.related(deletedId) });

      toast.success('El blog se ha eliminado exitosamente.');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al eliminar blog. Ocurrió un error inesperado.');
    },
  });
};

// ============================================================================
// UTILITY HOOKS
// ============================================================================

/**
 * Hook para obtener blogs publicados (para uso público)
 */
export const usePublishedBlogs = (filters: Omit<BlogFilters, 'published'> = {}) => {
  return useBlogs({ ...filters, published: true });
};

/**
 * Hook para obtener todos los blogs (para uso administrativo)
 */
export const useAllBlogs = (filters: BlogFilters = {}) => {
  return useBlogs(filters);
};

/**
 * Hook para obtener todos los blogs incluyendo no publicados (para adminboard)
 */
export const useAdminBlogs = (filters: BlogFilters = {}) => {
  return useQuery({
    queryKey: [...blogKeys.lists(), 'admin', filters],
    queryFn: () => blogService.getAllBlogsForAdmin(filters),
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  });
};

/**
 * Hook para prefetch de un blog
 */
export const usePrefetchBlog = () => {
  const queryClient = useQueryClient();

  return (identifier: string) => {
    queryClient.prefetchQuery({
      queryKey: blogKeys.detail(identifier),
      queryFn: () => blogService.getBlogByIdOrSlug(identifier),
      staleTime: 5 * 60 * 1000,
    });
  };
};

export default {
  useBlogs,
  useBlog,
  useBlogById,
  useRelatedBlogs,
  useSearchBlogs,
  useCreateBlog,
  useUpdateBlog,
  useToggleBlog,
  useDeleteBlog,
  usePublishedBlogs,
  useAllBlogs,
  useAdminBlogs,
  usePrefetchBlog,
};