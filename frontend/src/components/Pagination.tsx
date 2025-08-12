'use client';

import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  onPageChange: (page: number) => void;
  totalCount?: number;
  limit?: number;
}

export const Pagination = ({
  currentPage,
  totalPages,
  hasNextPage,
  hasPrevPage,
  onPageChange,
  totalCount,
  limit,
}: PaginationProps) => {
  const startItem = ((currentPage - 1) * (limit || 10)) + 1;
  const endItem = Math.min(currentPage * (limit || 10), totalCount || 0);

  return (
    <div className="flex items-center justify-between px-2">
      <div className="flex-1 text-sm text-muted-foreground">
        {totalCount && limit && (
          <p>
            Mostrando {startItem} a {endItem} de {totalCount} resultados
          </p>
        )}
      </div>
      <div className="flex items-center space-x-6 lg:space-x-8">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium">
            Página {currentPage} de {totalPages}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={!hasPrevPage}
          >
            <span className="sr-only">Ir a la página anterior</span>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={!hasNextPage}
          >
            <span className="sr-only">Ir a la página siguiente</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};