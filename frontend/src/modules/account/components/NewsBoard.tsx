'use client';

import { useState } from 'react';
import { Calendar, Clock, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useLatestNews, useSearchNews } from '@/hooks/use-news';
import { News } from '@/types/news.types';
import Loader from '@/components/Loader';

const NewsBoard = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Obtener las últimas noticias
  const { data: latestNews, isLoading: isLoadingLatest, error: latestError } = useLatestNews(10);

  // Búsqueda de noticias (solo cuando hay término de búsqueda)
  const { data: searchResults, isLoading: isLoadingSearch } = useSearchNews(
    searchTerm,
    10
  );

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setIsSearching(value.length >= 2);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setIsSearching(false);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (error) {
      return dateString;
    }
  };

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return '';
    }
  };

  const NewsItem = ({ news }: { news: News }) => (
    <Card className="mb-4 hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg font-semibold text-foreground pr-4">
            {news.title}
          </CardTitle>
          <Badge variant="outline" className="shrink-0">
            <Calendar className="h-3 w-3 mr-1" />
            {formatDate(news.createdAt)}
          </Badge>
        </div>
        <div className="flex items-center text-sm text-muted-foreground">
          <Clock className="h-3 w-3 mr-1" />
          {formatTime(news.createdAt)}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          {news.content.map((item, index) => (
            <div key={index} className="flex items-start space-x-2">
              <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 shrink-0" />
              <p className="text-sm text-foreground leading-relaxed">{item}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  const EmptyState = ({ message }: { message: string }) => (
    <Card className="text-center py-12">
      <CardContent>
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-foreground">Sin resultados</h3>
            <p className="text-sm text-muted-foreground max-w-sm">{message}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const ErrorState = ({ error }: { error: string }) => (
    <Card className="text-center py-12 border-destructive/20">
      <CardContent>
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
            <Search className="h-8 w-8 text-destructive" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-destructive">Error al cargar noticias</h3>
            <p className="text-sm text-muted-foreground max-w-sm">{error}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoadingLatest) {
    return <Loader />;
  }

  if (latestError) {
    return <ErrorState error={latestError.message} />;
  }

  const displayNews = isSearching ? searchResults : latestNews;
  const isLoading = isSearching ? isLoadingSearch : isLoadingLatest;

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
      {/* Header */}
      <div className="flex flex-col space-y-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Tablero de Noticias</h1>
          <p className="text-muted-foreground mt-2">
            Mantente al día con las últimas actualizaciones y cambios del sistema
          </p>
        </div>

        {/* Search */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar en noticias..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          {isSearching && (
            <Button variant="outline" onClick={clearSearch}>
              Limpiar búsqueda
            </Button>
          )}
        </div>

        {/* Search indicator */}
        {isSearching && (
          <div className="flex items-center space-x-2">
            <Badge variant="secondary">
              Buscando: "{searchTerm}"
            </Badge>
            {searchResults && (
              <span className="text-sm text-muted-foreground">
                {searchResults.length} resultado{searchResults.length !== 1 ? 's' : ''} encontrado{searchResults.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        )}
      </div>

      <Separator />

      {/* Content */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader />
          </div>
        ) : !displayNews || displayNews.data.length === 0 ? (
          <EmptyState
            message={
              isSearching
                ? `No se encontraron noticias que coincidan con "${searchTerm}"`
                : "No hay noticias disponibles en este momento"
            }
          />
        ) : (
          <div className="space-y-4">
            {displayNews.data.map((news) => (
              <NewsItem key={news._id} news={news} />
            ))}
          </div>
        )}
      </div>

      {/* Footer info */}
      {!isSearching && displayNews && displayNews.data.length > 0 && (
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground">
            Mostrando las {displayNews.data.length} noticias más recientes
          </p>
        </div>
      )}
    </div>
  );
};

export default NewsBoard;