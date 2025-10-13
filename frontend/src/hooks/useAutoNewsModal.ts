'use client';

import { useEffect, useState } from 'react';
import { useLatestNews } from './use-news';
import { useNewsLocalStorage } from './useNewsLocalStorage';
import { News } from '@/types/news.types';

interface UseAutoNewsModalOptions {
  enabled?: boolean;
  delay?: number; // Delay en milisegundos antes de mostrar el modal
  checkInterval?: number; // Intervalo para verificar nuevas noticias
}

interface UseAutoNewsModalReturn {
  isModalOpen: boolean;
  currentNews: News | null;
  openModal: (news?: News) => void;
  closeModal: () => void;
  hasUnreadNews: boolean;
}

export const useAutoNewsModal = (
  options: UseAutoNewsModalOptions = {}
): UseAutoNewsModalReturn => {
  const {
    enabled = true,
    delay = 2000, // 2 segundos por defecto
    checkInterval = 30000 // 30 segundos por defecto
  } = options;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentNews, setCurrentNews] = useState<News | null>(null);
  const [hasShownInitialNews, setHasShownInitialNews] = useState(false);

  const { 
    data: latestNewsResponse, 
    isLoading,
    refetch 
  } = useLatestNews(10); // Obtener las últimas 10 noticias

  const { 
    getLatestUnviewedNews, 
    markNewsAsViewed,
    cleanOldViewedNews 
  } = useNewsLocalStorage();

  // Obtener la última noticia no vista usando localStorage
  const latestNews = latestNewsResponse?.data || [];
  const latestUnreadNews = getLatestUnviewedNews(latestNews);
  const hasUnreadNews = !!latestUnreadNews;

  // Función para abrir el modal
  const openModal = (news?: News) => {
    const newsToShow = news || latestUnreadNews;
    if (newsToShow) {
      setCurrentNews(newsToShow);
      setIsModalOpen(true);
    }
  };

  // Función para cerrar el modal
  const closeModal = () => {
    // Marcar la noticia como vista al cerrar el modal
    if (currentNews) {
      markNewsAsViewed(currentNews._id);
    }
    setIsModalOpen(false);
    setCurrentNews(null);
  };

  // Limpiar noticias vistas antiguas al inicializar
  useEffect(() => {
    cleanOldViewedNews(30); // Mantener solo las últimas 30 días
  }, [cleanOldViewedNews]);

  // Efecto para mostrar automáticamente la noticia no leída
  useEffect(() => {
    if (!enabled || isLoading || hasShownInitialNews) {
      return;
    }

    if (latestUnreadNews) {
      const timer = setTimeout(() => {
        openModal(latestUnreadNews);
        setHasShownInitialNews(true);
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [enabled, isLoading, latestUnreadNews, hasShownInitialNews, delay]);

  // Efecto para verificar periódicamente nuevas noticias
  useEffect(() => {
    if (!enabled || !checkInterval) {
      return;
    }

    const interval = setInterval(() => {
      refetch();
    }, checkInterval);

    return () => clearInterval(interval);
  }, [enabled, checkInterval, refetch]);

  // Efecto para mostrar nuevas noticias que aparezcan después de la inicial
  useEffect(() => {
    if (!enabled || !hasShownInitialNews || isLoading) {
      return;
    }

    // Si hay una nueva noticia no leída y el modal no está abierto
    if (latestUnreadNews && !isModalOpen) {
      // Verificar si es una noticia diferente a la que ya se mostró
      if (!currentNews || currentNews._id !== latestUnreadNews._id) {
        openModal(latestUnreadNews);
      }
    }
  }, [enabled, hasShownInitialNews, isLoading, latestUnreadNews, isModalOpen, currentNews]);

  return {
    isModalOpen,
    currentNews,
    openModal,
    closeModal,
    hasUnreadNews
  };
};

export default useAutoNewsModal;