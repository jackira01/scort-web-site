'use client';

import { useState } from 'react';
import {
  Calendar,
  Clock,
  Edit,
  Eye,
  Search,
  FileText,
  Globe,
  Lock,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useAdminContentPages } from '@/hooks/use-content';
import { IContentPage } from '@/types/content.types';
import Loader from '@/components/Loader';

const ContentPagesManager = () => {
  const [searchTerm, setSearchTerm] = useState('');

  // Hooks
  const { pages, loading, error, refetch } = useAdminContentPages({
    search: searchTerm || undefined,
    limit: 50,
  });

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
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

  const handleEdit = (page: IContentPage) => {
    // Navegar al editor de contenido
    window.location.href = `/adminboard?section=contenido&edit=${page.slug}`;
  };

  const handleViewPublic = (page: IContentPage) => {
    // Abrir la página pública en una nueva pestaña
    window.open(`/${page.slug}`, '_blank');
  };

  const ContentPageCard = ({ page }: { page: IContentPage }) => (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 pr-4">
            <CardTitle className="text-lg font-semibold text-foreground mb-2 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-muted-foreground" />
              {page.title}
            </CardTitle>
            <div className="text-sm text-muted-foreground mb-2">
              <span className="font-mono bg-muted px-2 py-1 rounded text-xs">
                /{page.slug}
              </span>
            </div>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <div className="flex items-center">
                <Calendar className="h-3 w-3 mr-1" />
                Creado: {formatDate(page.createdAt)}
              </div>
              <div className="flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                Última edición: {formatDate(page.updatedAt)}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={page.isActive ? 'default' : 'secondary'}>
              {page.isActive ? (
                <>
                  <Globe className="h-3 w-3 mr-1" />
                  Activo
                </>
              ) : (
                <>
                  <Lock className="h-3 w-3 mr-1" />
                  Inactivo
                </>
              )}
            </Badge>
            <div className="flex space-x-1">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleEdit(page)}
              >
                <Edit className="h-4 w-4 mr-1" />
                Editar
              </Button>
              {page.isActive && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleViewPublic(page)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Ver
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-sm text-muted-foreground">
          <span className="font-medium">{page.sections?.length || 0}</span> secciones • 
          <span className="ml-1">
            {page.sections?.reduce((total, section) => total + (section.blocks?.length || 0), 0) || 0}
          </span> bloques
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">Error: {error}</p>
        <Button onClick={refetch} className="mt-4">
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Páginas de Contenido</h1>
          <p className="text-muted-foreground">
            Gestiona el contenido de páginas estáticas como FAQ, Términos y Condiciones, etc.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar páginas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Separator />

      {/* Content */}
      {pages.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No hay páginas de contenido
          </h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm 
              ? 'No se encontraron páginas que coincidan con tu búsqueda.'
              : 'Las páginas de contenido aparecerán aquí una vez que se inicialicen.'
            }
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {pages.map((page) => (
            <ContentPageCard key={page._id} page={page} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ContentPagesManager;