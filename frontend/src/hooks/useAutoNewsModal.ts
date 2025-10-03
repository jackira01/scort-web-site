'use client';

import { useEffect, useState } from 'react';
import { useLatestUnreadNews } from './use-news';
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
    data: latestUnreadResponse, 
    isLoading,
    refetch 
  } = useLatestUnreadNews();

  const latestUnreadNews = latestUnreadResponse?.data;
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
    setIsModalOpen(false);
    setCurrentNews(null);
  };

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