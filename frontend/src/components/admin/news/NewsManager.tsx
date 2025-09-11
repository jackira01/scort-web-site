'use client';

import { useState } from 'react';
import {
  Calendar,
  Clock,
  Edit,
  Eye,
  EyeOff,
  Plus,
  Search,
  Trash2,
  MoreHorizontal,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Separator } from '@/components/ui/separator';
import { useAdminNews, useDeleteNews, useToggleNewsStatus } from '@/hooks/use-news';
import { News } from '@/types/news.types';
import Loader from '@/components/Loader';
import NewsForm from './NewsForm';

const NewsManager = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedNews, setSelectedNews] = useState<News | null>(null);

  // Hooks
  const { data: newsData, isLoading, error, refetch } = useAdminNews({
    search: searchTerm || undefined,
    limit: 50,
  });
  const deleteNewsMutation = useDeleteNews();
  const toggleStatusMutation = useToggleNewsStatus();

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return dateString;
    }
  };

  const handleEdit = (news: News) => {
    setSelectedNews(news);
    setIsEditModalOpen(true);
  };

  const handleDelete = (news: News) => {
    setSelectedNews(news);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (selectedNews) {
      try {
        await deleteNewsMutation.mutateAsync(selectedNews._id);
        setIsDeleteDialogOpen(false);
        setSelectedNews(null);
        refetch();
      } catch (error) {
        console.error('Error al eliminar noticia:', error);
      }
    }
  };

  const handleToggleStatus = async (news: News) => {
    try {
      await toggleStatusMutation.mutateAsync(news._id);
      refetch();
    } catch (error) {
      console.error('Error al cambiar estado:', error);
    }
  };

  const handleCreateSuccess = () => {
    setIsCreateModalOpen(false);
    refetch();
  };

  const handleEditSuccess = () => {
    setIsEditModalOpen(false);
    setSelectedNews(null);
    refetch();
  };

  const NewsCard = ({ news }: { news: News }) => (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 pr-4">
            <CardTitle className="text-lg font-semibold text-foreground mb-2">
              {news.title}
            </CardTitle>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <div className="flex items-center">
                <Calendar className="h-3 w-3 mr-1" />
                {formatDate(news.createdAt)}
              </div>
              <div className="flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                Actualizado: {formatDate(news.updatedAt)}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={news.published ? 'default' : 'secondary'}>
              {news.published ? 'Publicado' : 'Borrador'}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleEdit(news)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleToggleStatus(news)}>
                  {news.published ? (
                    <>
                      <EyeOff className="h-4 w-4 mr-2" />
                      Despublicar
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-2" />
                      Publicar
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleDelete(news)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground mb-2">
            {news.content.length} elemento{news.content.length !== 1 ? 's' : ''} de contenido
          </p>
          <div className="space-y-1">
            {news.content.slice(0, 3).map((item, index) => (
              <div key={index} className="flex items-start space-x-2">
                <div className="w-1 h-1 bg-muted-foreground rounded-full mt-2 shrink-0" />
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {item}
                </p>
              </div>
            ))}
            {news.content.length > 3 && (
              <p className="text-xs text-muted-foreground italic">
                +{news.content.length - 3} elemento{news.content.length - 3 !== 1 ? 's' : ''} más...
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const EmptyState = () => (
    <Card className="text-center py-12">
      <CardContent>
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-foreground">No hay noticias</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              {searchTerm
                ? `No se encontraron noticias que coincidan con "${searchTerm}"`
                : 'Aún no se han creado noticias. Crea la primera noticia para comenzar.'}
            </p>
          </div>
          {!searchTerm && (
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Crear primera noticia
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return <Loader />;
  }

  if (error) {
    return (
      <Card className="text-center py-12 border-destructive/20">
        <CardContent>
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
              <Search className="h-8 w-8 text-destructive" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-destructive">Error al cargar noticias</h3>
              <p className="text-sm text-muted-foreground max-w-sm">{error.message}</p>
            </div>
            <Button variant="outline" onClick={() => refetch()}>
              Reintentar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const news = newsData?.news || [];

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
      {/* Header */}
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gestión de Noticias</h1>
            <p className="text-muted-foreground mt-2">
              Administra las noticias y actualizaciones del sistema
            </p>
          </div>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Noticia
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar noticias..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Stats */}
        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
          <span>Total: {newsData?.total || 0} noticias</span>
          <Separator orientation="vertical" className="h-4" />
          <span>
            Publicadas: {news.filter((n) => n.published).length}
          </span>
          <Separator orientation="vertical" className="h-4" />
          <span>
            Borradores: {news.filter((n) => !n.published).length}
          </span>
        </div>
      </div>

      <Separator />

      {/* Content */}
      <div className="space-y-4">
        {news.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid gap-4">
            {news.map((newsItem) => (
              <NewsCard key={newsItem._id} news={newsItem} />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <NewsForm
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
        mode="create"
      />

      <NewsForm
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedNews(null);
        }}
        onSuccess={handleEditSuccess}
        mode="edit"
        news={selectedNews}
      />

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar noticia?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La noticia "{selectedNews?.title}" será
              eliminada permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteNewsMutation.isPending}
            >
              {deleteNewsMutation.isPending ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default NewsManager;