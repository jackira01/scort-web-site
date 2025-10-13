'use client';

import { useState, useEffect } from 'react';
import { IContentPage } from '@/types/content.types';

interface UsePublicContentResult {
  page: IContentPage | null;
  loading: boolean;
  error: string | null;
}

export const usePublicContent = (slug: string): UsePublicContentResult => {
  const [page, setPage] = useState<IContentPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContent = async () => {
      if (!slug) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/content/public/${slug}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Página no encontrada');
          }
          throw new Error('Error al cargar el contenido');
        }

        const data = await response.json();

        if (data.success && data.data) {
          setPage(data.data);
        } else {
          throw new Error(data.message || 'Error al cargar el contenido');
        }
      } catch (err) {
        console.error('Error fetching public content:', err);
        setError(err instanceof Error ? err.message : 'Error desconocido');
        setPage(null);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [slug]);

  return { page, loading, error };
};

export default usePublicContent;