'use client';

import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Edit, Trash2, Search, ChevronLeft, ChevronRight, Zap, Clock } from 'lucide-react';
import { useUpgrades, useDeleteUpgrade } from '@/hooks/usePlans';
import { Upgrade, UpgradesFilters } from '@/types/plans';
import toast from 'react-hot-toast';

interface UpgradesListProps {
  onEdit: (upgrade: Upgrade) => void;
}

export const UpgradesList: React.FC<UpgradesListProps> = ({ onEdit }) => {
  const [filters, setFilters] = useState<UpgradesFilters & { page: number; limit: number }>({
    page: 1,
    limit: 10,
    search: '',
    active: undefined,
  });

  const { data, isLoading, error } = useUpgrades(filters);
  const deleteUpgradeMutation = useDeleteUpgrade();

  const handleFilterChange = (key: keyof UpgradesFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1, // Reset to first page when filtering
    }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const handleDelete = async (upgrade: Upgrade) => {
    if (!upgrade._id) return;
    
    if (window.confirm(`¿Estás seguro de que deseas eliminar el upgrade "${upgrade.name}"?`)) {
      try {
        await deleteUpgradeMutation.mutateAsync(upgrade._id);
      } catch (error) {

      }
    }
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDuration = (hours: number): string => {
    if (hours < 24) return `${hours} hora${hours > 1 ? 's' : ''}`;
    const days = Math.floor(hours / 24);
    if (days === 1) return '1 día';
    if (days < 30) return `${days} días`;
    if (days === 30) return '1 mes';
    if (days < 365) {
      const months = Math.floor(days / 30);
      return `${months} mes${months > 1 ? 'es' : ''}`;
    }
    const years = Math.floor(days / 365);
    return `${years} año${years > 1 ? 's' : ''}`;
  };

  const getEffectTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      'HIGHLIGHT': 'Destacado',
      'BOOST': 'Impulso',
      'FEATURE_ACCESS': 'Acceso a Función',
      'CONTENT_LIMIT': 'Límite de Contenido'
    };
    return labels[type] || type;
  };

  const getEffectTypeBadgeVariant = (type: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      'HIGHLIGHT': 'default',
      'BOOST': 'secondary',
      'FEATURE_ACCESS': 'outline',
      'CONTENT_LIMIT': 'destructive'
    };
    return variants[type] || 'outline';
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            Error al cargar los upgrades: {error.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar upgrades..."
              value={filters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <Select
           value={filters.active?.toString() || 'all'}
           onValueChange={(value) => 
             handleFilterChange('active', value === 'all' ? undefined : value === 'true')
           }
         >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="true">Activos</SelectItem>
            <SelectItem value="false">Inactivos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabla */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Duración</TableHead>
                <TableHead>Efectos</TableHead>
                <TableHead>Dependencias</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    Cargando upgrades...
                  </TableCell>
                </TableRow>
              ) : data?.upgrades?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    No se encontraron upgrades
                  </TableCell>
                </TableRow>
              ) : (
                data?.upgrades?.map((upgrade) => (
                  <TableRow key={upgrade._id}>
                    <TableCell className="font-mono">{upgrade.code}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          <Zap className="h-4 w-4 text-yellow-500" />
                          {upgrade.name}
                        </div>
                        <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                          {upgrade.description || 'Sin descripción'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {upgrade.price ? formatPrice(upgrade.price) : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{formatDuration(upgrade.durationHours)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {upgrade.effect && (
                          <Badge 
                            variant="secondary"
                            className="text-xs"
                          >
                            {upgrade.effect.levelDelta !== undefined && `Nivel: ${upgrade.effect.levelDelta > 0 ? '+' : ''}${upgrade.effect.levelDelta}`}
                            {upgrade.effect.setLevelTo !== undefined && `Nivel: ${upgrade.effect.setLevelTo}`}
                            {upgrade.effect.priorityBonus !== undefined && ` | Prioridad: +${upgrade.effect.priorityBonus}`}
                          </Badge>
                        )}
                        {upgrade.effect?.positionRule && (
                          <Badge variant="outline" className="text-xs">
                            {upgrade.effect.positionRule}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                       {upgrade.requires && upgrade.requires.length > 0 ? (
                         <div className="flex flex-wrap gap-1">
                           {upgrade.requires.slice(0, 2).map((dep, index) => (
                             <Badge key={index} variant="outline" className="text-xs font-mono">
                               {dep}
                             </Badge>
                           ))}
                           {upgrade.requires.length > 2 && (
                             <Badge variant="outline" className="text-xs">
                               +{upgrade.requires.length - 2}
                             </Badge>
                           )}
                         </div>
                       ) : (
                         <span className="text-muted-foreground text-sm">Sin dependencias</span>
                       )}
                     </TableCell>
                    <TableCell>
                       <Badge variant={upgrade.active ? 'default' : 'secondary'}>
                         {upgrade.active ? 'Activo' : 'Inactivo'}
                       </Badge>
                     </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(upgrade)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(upgrade)}
                          disabled={deleteUpgradeMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Paginación */}
      {data && data.total > 0 && (
          <div className="flex items-center justify-between px-2">
            <div className="text-sm text-muted-foreground">
              Mostrando {(filters.page - 1) * filters.limit + 1} a{' '}
              {Math.min(filters.page * filters.limit, data?.total || 0)} de {data?.total || 0} upgrades
            </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(filters.page - 1)}
              disabled={filters.page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from(
                { length: Math.ceil((data?.total || 0) / filters.limit) },
                (_, i) => i + 1
              )
                .filter(page => 
                  page === 1 || 
                  page === Math.ceil((data?.total || 0) / filters.limit) ||
                  Math.abs(page - filters.page) <= 1
                )
                .map((page, index, array) => {
                  const showEllipsis = index > 0 && page - array[index - 1] > 1;
                  
                  return (
                    <React.Fragment key={page}>
                      {showEllipsis && (
                        <span className="px-2 text-muted-foreground">...</span>
                      )}
                      <Button
                        variant={page === filters.page ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </Button>
                    </React.Fragment>
                  );
                })
              }
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(filters.page + 1)}
              disabled={filters.page >= Math.ceil((data?.total || 0) / filters.limit)}
            >
              Siguiente
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UpgradesList;