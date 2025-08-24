'use client';

import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Edit, Trash2, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { usePlans, useDeletePlan } from '@/hooks/usePlans';
import { Plan, PlansFilters, PLAN_LEVELS } from '@/types/plans';
import toast from 'react-hot-toast';

interface PlansListProps {
  onEdit: (plan: Plan) => void;
}

export const PlansList: React.FC<PlansListProps> = ({ onEdit }) => {
  const [filters, setFilters] = useState<PlansFilters & { page: number; limit: number }>({
    page: 1,
    limit: 10,
    isActive: undefined,
    level: undefined,
    search: '',
  });

  const { data, isLoading, error } = usePlans(filters);
  const deletePlanMutation = useDeletePlan();

  const handleFilterChange = (key: keyof PlansFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1, // Reset to first page when filtering
    }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const handleDelete = async (plan: Plan) => {
    if (!plan._id) return;
    
    if (window.confirm(`¿Estás seguro de que deseas eliminar el plan "${plan.name}"?`)) {
      try {
        await deletePlanMutation.mutateAsync(plan._id);
      } catch (error) {

      }
    }
  };

  const getPlanLevelName = (level: number): string => {
    const levelEntry = Object.entries(PLAN_LEVELS).find(([, value]) => value === level);
    return levelEntry ? levelEntry[0] : `Nivel ${level}`;
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            Error al cargar los planes: {error.message}
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
              placeholder="Buscar planes..."
              value={filters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <Select
          value={filters.isActive?.toString() || 'all'}
          onValueChange={(value) => 
            handleFilterChange('isActive', value === 'all' ? undefined : value === 'true')
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

        <Select
          value={filters.level?.toString() || 'all'}
          onValueChange={(value) => 
            handleFilterChange('level', value === 'all' ? undefined : parseInt(value))
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Nivel" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los niveles</SelectItem>
            {Object.entries(PLAN_LEVELS).map(([name, level]) => (
              <SelectItem key={level} value={level.toString()}>
                {name} (Nivel {level})
              </SelectItem>
            ))}
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
                <TableHead>Nivel</TableHead>
                <TableHead>Variantes</TableHead>
                <TableHead>Precio Desde</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Cargando planes...
                  </TableCell>
                </TableRow>
              ) : data?.plans?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    No se encontraron planes
                  </TableCell>
                </TableRow>
              ) : (
                data?.plans?.map((plan) => {
                  const minPrice = Math.min(...plan.variants.map(v => v.price));
                  
                  return (
                    <TableRow key={plan._id}>
                      <TableCell className="font-mono">{plan.code}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{plan.name}</div>
                          <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                            {plan.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getPlanLevelName(plan.level)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {plan.variants.length} variante{plan.variants.length !== 1 ? 's' : ''}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatPrice(minPrice)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={plan.isActive ? 'default' : 'secondary'}>
                          {plan.isActive ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEdit(plan)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(plan)}
                            disabled={deletePlanMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
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
              {Math.min(filters.page * filters.limit, data?.total || 0)} de {data?.total || 0} planes
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

export default PlansList;