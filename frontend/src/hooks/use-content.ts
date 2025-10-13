import { useState, useEffect } from 'react';
import { ContentService } from '@/services/content.service';
import {
  IContentPage,
  CreateContentPageInput,
  UpdateContentPageInput,
  ContentPaginationParams,
  DuplicatePageInput
} from '@/types/content.types';

/**
 * Hook para obtener una página de contenido por slug
 */
export const useContentPage = (slug: string) => {
  const [page, setPage] = useState<IContentPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPage = async () => {
      if (!slug) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await ContentService.getPageBySlug(slug);
        
        if (response.success && response.data) {
          setPage(response.data);
        } else {
          setError(response.message || 'Error al cargar la página');
        }
      } catch (err) {
        setError('Error al cargar la página');
        console.error('Error en useContentPage:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPage();
  }, [slug]);

  return { page, loading, error, refetch: () => fetchPage() };
};

/**
 * Hook para obtener todas las páginas de contenido con paginación
 */
export const useContentPages = (params?: ContentPaginationParams) => {
  const [pages, setPages] = useState<IContentPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  const fetchPages = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await ContentService.getAllPages(params);
      
      if (response.success && response.data) {
        setPages(response.data);
        if (response.pagination) {
          setPagination(response.pagination);
        }
      } else {
        setError(response.message || 'Error al cargar las páginas');
      }
    } catch (err) {
      setError('Error al cargar las páginas');
      console.error('Error en useContentPages:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPages();
  }, [params?.page, params?.limit, params?.isActive, params?.search]);

  return { 
    pages, 
    loading, 
    error, 
    pagination, 
    refetch: fetchPages 
  };
};

/**
 * Hook para operaciones CRUD de páginas de contenido (admin)
 */
export const useContentAdmin = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createPage = async (pageData: CreateContentPageInput): Promise<IContentPage | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await ContentService.createPage(pageData);
      
      if (response.success && response.data) {
        return response.data;
      } else {
        setError(response.message || 'Error al crear la página');
        return null;
      }
    } catch (err) {
      setError('Error al crear la página');
      console.error('Error en createPage:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updatePage = async (slug: string, pageData: UpdateContentPageInput): Promise<IContentPage | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await ContentService.updatePage(slug, pageData);
      
      if (response.success && response.data) {
        return response.data;
      } else {
        setError(response.message || 'Error al actualizar la página');
        return null;
      }
    } catch (err) {
      setError('Error al actualizar la página');
      console.error('Error en updatePage:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deletePage = async (slug: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await ContentService.deletePage(slug);
      
      if (response.success) {
        return true;
      } else {
        setError(response.message || 'Error al eliminar la página');
        return false;
      }
    } catch (err) {
      setError('Error al eliminar la página');
      console.error('Error en deletePage:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const duplicatePage = async (slug: string, duplicateData: DuplicatePageInput): Promise<IContentPage | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await ContentService.duplicatePage(slug, duplicateData);
      
      if (response.success && response.data) {
        return response.data;
      } else {
        setError(response.message || 'Error al duplicar la página');
        return null;
      }
    } catch (err) {
      setError('Error al duplicar la página');
      console.error('Error en duplicatePage:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getPageBySlugAdmin = async (slug: string): Promise<IContentPage | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await ContentService.getPageBySlugAdmin(slug);
      
      if (!result.success) {
        setError(result.message || 'Error al obtener la página');
        return null;
      }
      
      return result.data || null;
    } catch (error: any) {
      const errorMessage = error.message || 'Error al obtener la página';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getPageById = async (id: string): Promise<IContentPage | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await ContentService.getPageById(id);
      
      if (response.success && response.data) {
        return response.data;
      } else {
        setError(response.message || 'Error al obtener la página');
        return null;
      }
    } catch (err) {
      setError('Error al obtener la página');
      console.error('Error en getPageById:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    createPage,
    updatePage,
    deletePage,
    duplicatePage,
    getPageById,
    getPageBySlugAdmin,
    clearError: () => setError(null)
  };
};

/**
 * Hook para obtener páginas de contenido para administración
 */
export const useAdminContentPages = (params?: ContentPaginationParams) => {
  const [pages, setPages] = useState<IContentPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  const fetchPages = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await ContentService.getAdminPages(params);
      
      if (response.success && response.data) {
        setPages(response.data);
        if (response.pagination) {
          setPagination(response.pagination);
        }
      } else {
        setError(response.message || 'Error al cargar las páginas');
      }
    } catch (err) {
      setError('Error al cargar las páginas');
      console.error('Error en useAdminContentPages:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPages();
  }, [params?.page, params?.limit, params?.isActive, params?.search]);

  return { 
    pages, 
    loading, 
    error, 
    pagination, 
    refetch: fetchPages 
  };
};