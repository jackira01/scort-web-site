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
  const [hasCheckedInitialNews, setHasCheckedInitialNews] = useState(false);
  const [shownInSessionNews, setShownInSessionNews] = useState<Set<string>>(new Set());

  const {
    data: latestNewsResponse,
    isLoading,
    refetch
  } = useLatestNews(10); // Obtener las últimas 10 noticias

  const {
    getLatestUnviewedNews,
    markNewsAsViewed,
    cleanOldViewedNews,
    hasNewsBeenViewed,
    filterUnviewedNews
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
      // Marcar como mostrada en esta sesión
      setShownInSessionNews(prev => new Set(prev).add(newsToShow._id));
    }
  };

  // Función para cerrar el modal
  const closeModal = () => {
    // Ya NO marcamos como vista automáticamente al cerrar
    // Esto solo se hará si el usuario marca el checkbox "No volver a mostrar"
    setIsModalOpen(false);
    setCurrentNews(null);

    // Buscar la siguiente noticia no vista después de un pequeño delay
    setTimeout(() => {
      // Filtrar noticias que no han sido vistas permanentemente y no mostradas en esta sesión
      const unviewedNews = latestNews.filter(news =>
        !shownInSessionNews.has(news._id) &&
        !hasNewsBeenViewed(news._id)
      );

      if (unviewedNews.length > 0) {
        // Ordenar por fecha y tomar la más reciente no mostrada
        const nextNews = unviewedNews.sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )[0];

        if (nextNews) {
          openModal(nextNews);
        }
      }
    }, 500);
  };

  // Limpiar noticias vistas antiguas al inicializar
  useEffect(() => {
    cleanOldViewedNews(30); // Mantener solo las últimas 30 días
  }, [cleanOldViewedNews]);

  // Efecto para mostrar automáticamente la noticia no leída
  useEffect(() => {
    if (!enabled || isLoading || hasCheckedInitialNews) {
      return;
    }

    if (latestUnreadNews) {
      const timer = setTimeout(() => {
        openModal(latestUnreadNews);
        setHasCheckedInitialNews(true);
      }, delay);

      return () => clearTimeout(timer);
    } else {
      // Si no hay noticias no leídas, marcar como chequeado de todas formas
      setHasCheckedInitialNews(true);
    }
  }, [enabled, isLoading, latestUnreadNews, hasCheckedInitialNews, delay]);

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
    if (!enabled || !hasCheckedInitialNews || isLoading) {
      return;
    }

    // Si hay una nueva noticia no leída y el modal no está abierto
    if (latestUnreadNews && !isModalOpen) {
      // Solo mostrar si NO se ha mostrado ya en esta sesión
      if (!shownInSessionNews.has(latestUnreadNews._id)) {
        openModal(latestUnreadNews);
      }
    }
  }, [enabled, hasCheckedInitialNews, isLoading, latestUnreadNews, isModalOpen, shownInSessionNews]);

  return {
    isModalOpen,
    currentNews,
    openModal,
    closeModal,
    hasUnreadNews
  };
};

export default useAutoNewsModal;