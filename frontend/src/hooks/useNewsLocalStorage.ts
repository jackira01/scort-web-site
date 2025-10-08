'use client';

import { useEffect, useState } from 'react';
import { News } from '@/types/news.types';

const VIEWED_NEWS_KEY = 'viewedNews';

interface ViewedNewsData {
  newsId: string;
  viewedAt: string;
}

export const useNewsLocalStorage = () => {
  const [viewedNews, setViewedNews] = useState<ViewedNewsData[]>([]);

  // Cargar noticias vistas del localStorage al inicializar
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(VIEWED_NEWS_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setViewedNews(Array.isArray(parsed) ? parsed : []);
        }
      } catch (error) {
        console.error('Error loading viewed news from localStorage:', error);
        setViewedNews([]);
      }
    }
  }, []);

  // Función para marcar una noticia como vista
  const markNewsAsViewed = (newsId: string) => {
    if (typeof window === 'undefined') return;

    const newViewedNews = viewedNews.filter(item => item.newsId !== newsId);
    newViewedNews.push({
      newsId,
      viewedAt: new Date().toISOString()
    });

    // Mantener solo las últimas 100 noticias vistas para evitar que crezca indefinidamente
    const limitedViewedNews = newViewedNews.slice(-100);

    setViewedNews(limitedViewedNews);
    
    try {
      localStorage.setItem(VIEWED_NEWS_KEY, JSON.stringify(limitedViewedNews));
    } catch (error) {
      console.error('Error saving viewed news to localStorage:', error);
    }
  };

  // Función para verificar si una noticia ha sido vista
  const hasNewsBeenViewed = (newsId: string): boolean => {
    return viewedNews.some(item => item.newsId === newsId);
  };

  // Función para obtener la fecha en que se vio una noticia
  const getNewsViewedDate = (newsId: string): Date | null => {
    const viewedItem = viewedNews.find(item => item.newsId === newsId);
    return viewedItem ? new Date(viewedItem.viewedAt) : null;
  };

  // Función para filtrar noticias no vistas
  const filterUnviewedNews = (newsList: News[]): News[] => {
    return newsList.filter(news => !hasNewsBeenViewed(news._id));
  };

  // Función para obtener la última noticia no vista
  const getLatestUnviewedNews = (newsList: News[]): News | null => {
    const unviewedNews = filterUnviewedNews(newsList);
    if (unviewedNews.length === 0) return null;

    // Ordenar por fecha de creación descendente y tomar la primera
    return unviewedNews.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];
  };

  // Función para limpiar noticias vistas antiguas (opcional)
  const cleanOldViewedNews = (daysToKeep: number = 30) => {
    if (typeof window === 'undefined') return;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const filteredViewedNews = viewedNews.filter(item => 
      new Date(item.viewedAt) > cutoffDate
    );

    if (filteredViewedNews.length !== viewedNews.length) {
      setViewedNews(filteredViewedNews);
      try {
        localStorage.setItem(VIEWED_NEWS_KEY, JSON.stringify(filteredViewedNews));
      } catch (error) {
        console.error('Error cleaning old viewed news:', error);
      }
    }
  };

  return {
    markNewsAsViewed,
    hasNewsBeenViewed,
    getNewsViewedDate,
    filterUnviewedNews,
    getLatestUnviewedNews,
    cleanOldViewedNews,
    viewedNewsCount: viewedNews.length
  };
};

export default useNewsLocalStorage;