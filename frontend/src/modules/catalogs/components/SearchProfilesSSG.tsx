'use client';

import { useState, useEffect } from 'react';
import ProfileCard from './ProfileCard';
import ProfileCardSkeleton from './ProfileCardSkeleton';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { ProfilesResponse, FilterQuery } from '@/types/profile.types';
import { getProfilesForCards } from '@/services/filters.service';

interface SearchProfilesSSGProps {
  viewMode: 'grid' | 'list';
  profilesData: ProfilesResponse;
  filters: FilterQuery;
  onPageChange: (page: number) => void;
}

export default function SearchProfilesSSG({
  viewMode,
  profilesData: initialData,
  filters,
  onPageChange,
}: SearchProfilesSSGProps) {
  const [profilesData, setProfilesData] = useState<ProfilesResponse>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Función para refrescar datos cuando cambian los filtros
  const refreshData = async (newFilters: FilterQuery) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Usar getProfilesForCards que ya está optimizado para excluir features
      const newData = await getProfilesForCards(newFilters);
      setProfilesData(newData);
    } catch (err) {
      // Error fetching filtered profiles
      setError('Error al cargar los perfiles. Por favor, intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  // Efecto para refrescar datos cuando cambian los filtros
  useEffect(() => {
    // Solo refrescar si los filtros han cambiado significativamente
    const hasFiltersChanged = 
      filters.category !== initialData.profiles[0]?.category ||
      filters.location?.department !== undefined ||
      filters.location?.city !== undefined ||
      filters.features?.gender !== undefined ||
      filters.features?.age !== undefined ||
      filters.priceRange?.min !== undefined ||
      filters.priceRange?.max !== undefined ||
      filters.sortBy !== 'createdAt' ||
      filters.sortOrder !== 'desc';

    if (hasFiltersChanged) {
      refreshData(filters);
    }
  }, [filters]);

  const handlePageChange = async (page: number) => {
    const newFilters = { ...filters, page };
    onPageChange(page);
    await refreshData(newFilters);
  };

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={() => refreshData(filters)} variant="outline">
          Reintentar
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className={`grid gap-4 ${
          viewMode === 'grid' 
            ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
            : 'grid-cols-1'
        }`}>
          {Array.from({ length: 8 }).map((_, index) => (
            <ProfileCardSkeleton key={index} viewMode={viewMode} />
          ))}
        </div>
      </div>
    );
  }

  const { profiles, pagination } = profilesData;

  if (profiles.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-semibold text-muted-foreground mb-2">
          Aún no se han inscrito modelos en esta zona
        </h3>
        <p className="text-muted-foreground">
          Intenta ajustar tus filtros para ver más resultados.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Mostrando {profiles.length} de {pagination.totalProfiles} perfiles
        </p>
      </div>

      {/* Profiles Grid */}
      <div className={`grid gap-4 ${
        viewMode === 'grid' 
          ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
          : 'grid-cols-1'
      }`}>
        {profiles.map((profile) => (
          <ProfileCard 
            key={profile._id} 
            profile={profile} 
            viewMode={viewMode}
          />
        ))}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2 mt-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.currentPage - 1)}
            disabled={!pagination.hasPrevPage || isLoading}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Anterior
          </Button>
          
          <div className="flex items-center space-x-1">
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              const pageNumber = i + 1;
              const isCurrentPage = pageNumber === pagination.currentPage;
              
              return (
                <Button
                  key={pageNumber}
                  variant={isCurrentPage ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handlePageChange(pageNumber)}
                  disabled={isLoading}
                  className="w-8 h-8 p-0"
                >
                  {pageNumber}
                </Button>
              );
            })}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.currentPage + 1)}
            disabled={!pagination.hasNextPage || isLoading}
          >
            Siguiente
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}