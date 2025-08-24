'use client';

import { useState } from 'react';
import { Edit, Trash2, ChevronLeft, ChevronRight, Zap, Clock, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUpgrades, useDeleteUpgrade } from '@/hooks/usePlans';
import { Upgrade } from '@/types/plans';
import { formatCurrency } from '@/lib/utils';

interface UpgradesListProps {
  onEdit: (upgrade: Upgrade) => void;
}

interface Filters {
  search: string;
  status: string;
  page: number;
  limit: number;
}

export default function UpgradesList({ onEdit }: UpgradesListProps) {
  const [filters, setFilters] = useState<Filters>({
    search: '',
    status: 'all',
    page: 1,
    limit: 10,
  });

  const { data, isLoading, error } = useUpgrades({
    page: filters.page,
    limit: filters.limit,
    search: filters.search || undefined,
    active: filters.status === 'active' ? true : filters.status === 'inactive' ? false : undefined,
  });

  const deleteUpgradeMutation = useDeleteUpgrade();

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este upgrade?')) {
      try {
        await deleteUpgradeMutation.mutateAsync(id);
      } catch (error) {

      }
    }
  };

  const handleFilterChange = (key: keyof Filters, value: string | number) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      ...(key !== 'page' && { page: 1 }), // Reset page when other filters change
    }));
  };

  const totalPages = Math.ceil((data?.total || 0) / filters.limit);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-32"></div>
                  <div className="h-3 bg-muted rounded w-48"></div>
                </div>
                <div className="flex gap-2">
                  <div className="h-8 w-16 bg-muted rounded"></div>
                  <div className="h-8 w-8 bg-muted rounded"></div>
                  <div className="h-8 w-8 bg-muted rounded"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

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
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Buscar upgrades..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="max-w-sm"
          />
        </div>
        <Select
          value={filters.status}
          onValueChange={(value) => handleFilterChange('status', value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Activos</SelectItem>
            <SelectItem value="inactive">Inactivos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Mostrando {data?.upgrades?.length || 0} de {data?.total || 0} upgrades
        </p>
        <Select
          value={filters.limit.toString()}
          onValueChange={(value) => handleFilterChange('limit', parseInt(value))}
        >
          <SelectTrigger className="w-[100px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="5">5</SelectItem>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="20">20</SelectItem>
            <SelectItem value="50">50</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Upgrades List */}
      <div className="space-y-4">
        {data?.upgrades?.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay upgrades</h3>
              <p className="text-muted-foreground mb-4">
                No se encontraron upgrades con los filtros aplicados.
              </p>
            </CardContent>
          </Card>
        ) : (
          data?.upgrades?.map((upgrade) => (
            <Card key={upgrade.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Zap className="h-5 w-5 text-yellow-500" />
                      <h3 className="text-lg font-semibold">{upgrade.name}</h3>
                      <Badge variant={upgrade.active ? 'default' : 'secondary'}>
                        {upgrade.active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>
                    
                    <p className="text-muted-foreground mb-3">
                      {upgrade.description}
                    </p>
                    
                    <div className="flex items-center gap-6 text-sm">
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span className="font-medium">
                          {formatCurrency(upgrade.price)}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-blue-600" />
                        <span>
                          {upgrade.durationDays} día{upgrade.durationDays !== 1 ? 's' : ''}
                        </span>
                      </div>
                      
                      {upgrade.boostMultiplier && (
                        <div className="flex items-center gap-1">
                          <Zap className="h-4 w-4 text-yellow-600" />
                          <span>x{upgrade.boostMultiplier} boost</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(upgrade)}
                      className="flex items-center gap-1"
                    >
                      <Edit className="h-4 w-4" />
                      Editar
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(upgrade.id)}
                      className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                      disabled={deleteUpgradeMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                      Eliminar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => handleFilterChange('page', Math.max(1, filters.page - 1))}
            disabled={filters.page <= 1}
            className="flex items-center gap-2"
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
                page === totalPages || 
                Math.abs(page - filters.page) <= 1
              )
              .map((page, index, array) => (
                <div key={page} className="flex items-center">
                  {index > 0 && array[index - 1] !== page - 1 && (
                    <span className="px-2 text-muted-foreground">...</span>
                  )}
                  <Button
                    variant={filters.page === page ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleFilterChange('page', page)}
                    className="w-8 h-8 p-0"
                  >
                    {page}
                  </Button>
                </div>
              ))}
          </div>
          
          <Button
            variant="outline"
            onClick={() => handleFilterChange('page', Math.min(totalPages, filters.page + 1))}
            disabled={filters.page >= totalPages}
            className="flex items-center gap-2"
          >
            Siguiente
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}