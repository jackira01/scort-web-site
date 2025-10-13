'use client';

import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Calendar, Eye } from 'lucide-react';
import { useLatestNews } from '@/hooks/use-news';
import { useNewsLocalStorage } from '@/hooks/useNewsLocalStorage';
import { News } from '@/types/news.types';
import { DateTime } from 'luxon';
import Image from 'next/image';

interface NewsModalProps {
  isOpen: boolean;
  onClose: () => void;
  news?: News | null;
}

export const NewsModal: React.FC<NewsModalProps> = ({
  isOpen,
  onClose,
  news: propNews
}) => {
  const [currentNews, setCurrentNews] = useState<News | null>(propNews || null);
  const { data: latestNewsResponse } = useLatestNews(10);
  const { getLatestUnviewedNews, markNewsAsViewed } = useNewsLocalStorage();

  // Si no se pasa una noticia específica, usar la última no leída del localStorage
  useEffect(() => {
    if (!propNews && latestNewsResponse?.data) {
      const latestUnreadNews = getLatestUnviewedNews(latestNewsResponse.data);
      setCurrentNews(latestUnreadNews);
    } else if (propNews) {
      setCurrentNews(propNews);
    }
  }, [propNews, latestNewsResponse, getLatestUnviewedNews]);

  const handleClose = () => {
    if (currentNews?._id) {
      // Marcar como vista al cerrar usando localStorage
      markNewsAsViewed(currentNews._id);
    }
    setCurrentNews(null);
    onClose();
  };

  const formatDate = (dateString: string) => {
    try {
      return DateTime.fromJSDate(new Date(dateString))
        .setLocale('es')
        .toRelative() || 'Fecha no disponible';
    } catch {
      return 'Fecha no disponible';
    }
  };

  if (!currentNews) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 overflow-hidden">
        {/* Header con imagen de banner si existe */}
        {currentNews.imageUrl && (
          <div className="relative w-full aspect-video bg-gradient-to-r from-purple-500 to-pink-500">
            <Image
              src={currentNews.imageUrl}
              alt={currentNews.title}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-black/20" />
          </div>
        )}

        <div className="p-6">
          {/* Header sin imagen */}
          {!currentNews.imageUrl && (
            <DialogHeader className="mb-4">
              <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
                {currentNews.title}
              </DialogTitle>
            </DialogHeader>
          )}

          {/* Título cuando hay imagen */}
          {currentNews.imageUrl && (
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {currentNews.title}
              </h2>
            </div>
          )}

          {/* Metadatos */}
          <div className="flex items-center gap-4 mb-6 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(currentNews.createdAt)}</span>
            </div>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              Nueva noticia
            </Badge>
          </div>

          {/* Contenido */}
          <ScrollArea className="max-h-96">
            <div className="space-y-4">
              {currentNews.content.map((paragraph, index) => (
                <p
                  key={index}
                  className="text-gray-700 dark:text-gray-300 leading-relaxed"
                >
                  {paragraph}
                </p>
              ))}
            </div>
          </ScrollArea>

          {/* Footer */}
          <div className="flex justify-end mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              onClick={handleClose}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
            >
              Entendido
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewsModal;