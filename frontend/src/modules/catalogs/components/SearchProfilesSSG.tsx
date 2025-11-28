'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { ProfilesResponse, FilterQuery } from '@/types/profile.types';
import { transformProfilesToCards } from '@/utils/profile.utils';
import ProfileCard from './ProfileCard';
import ProfileCardSkeleton from './ProfileCardSkeleton';

interface SearchProfilesSSGProps {
  viewMode: 'grid' | 'list';
  profilesData: ProfilesResponse | null;
  filters: FilterQuery;
  onPageChange: (page: number) => void;
}

export default function SearchProfilesSSG({
  viewMode,
  profilesData: initialData,
  filters,
  onPageChange,
}: SearchProfilesSSGProps) {
  const [profilesData, setProfilesData] = useState<ProfilesResponse | null>(initialData);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setProfilesData(initialData);
  }, [initialData]);

  const handlePageChange = async (page: number) => {
    setIsLoading(true);
    onPageChange(page);
    setTimeout(() => setIsLoading(false), 500);
  };

  if (isLoading || !profilesData) {
    return (
      <div className="space-y-6">
        <div className={`grid gap-4 ${viewMode === 'grid'
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

  // --- DEBUGGING START ---
  // 1. Verificamos qué llega exactamente del Backend antes de transformar


  // Transform profiles to include hasDestacadoUpgrade highlighting
  const transformedProfiles = profiles ? transformProfilesToCards(profiles) : [];

  // 2. Verificamos qué sale después de la transformación
  if (transformedProfiles && transformedProfiles.length > 0) {
    // Verificación específica del bug
    const v = transformedProfiles[0].verification;
    if (!v) console.warn('⚠️ ALERTA: El objeto verification se perdió en la transformación');
    else if (typeof v === 'object' && v.verificationProgress === undefined) {
      console.warn('⚠️ ALERTA: verificationProgress no existe en el objeto transformado', v);
    }
    console.groupEnd();
  }
  // --- DEBUGGING END ---

  if (!transformedProfiles || transformedProfiles.length === 0) {
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
      <div className={`grid gap-4 ${viewMode === 'grid'
        ? 'grid-cols-1 sm:grid-cols-3 md:grid-col-4 lg:grid-cols-4'
        : 'grid-cols-1'
        }`}>
        {transformedProfiles.map((profile) => (
          <ProfileCard
            key={profile._id}
            profile={profile}
            viewMode={viewMode}
            variant="default"
          />
        ))}
      </div>

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