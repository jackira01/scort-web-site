import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useFilteredProfiles } from '@/hooks/use-filtered-profiles';
import type { FilterQuery } from '@/types/profile.types';
import { transformProfilesToCards } from '@/utils/profile.utils';
import { ProfileCard } from './ProfileCard';

interface SearchProfilesProps {
  viewMode: 'grid' | 'list';
  filters?: Omit<FilterQuery, 'fields'>;
  onPageChange?: (page: number) => void;
}

const SearchProfiles = ({
  viewMode,
  filters = {},
  onPageChange,
}: SearchProfilesProps) => {
  const { data, isLoading, error } = useFilteredProfiles(filters);

  if (isLoading) {
    return (
      <div className="grid gap-4 lg:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={`skeleton-${index}-${Math.random()}`} className="animate-pulse">
            <div className="bg-gray-300 h-48 sm:h-56 lg:h-64 w-full"></div>
            <CardContent className="p-4 lg:p-6">
              <div className="h-4 bg-gray-300 rounded mb-2"></div>
              <div className="h-3 bg-gray-300 rounded mb-4"></div>
              <div className="h-8 bg-gray-300 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          Error al cargar los perfiles. Intenta nuevamente.
        </p>
      </div>
    );
  }

  const profiles = data?.profiles
    ? transformProfilesToCards(data.profiles)
    : [];


  // SearchProfiles data processing

  return (
    <>
      <div
        className={`grid gap-4 lg:gap-6 ${viewMode === 'grid'
          ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3'
          : 'grid-cols-1'
          }`}
      >
        {profiles.length === 0 ? (
          <div className="col-span-full text-center py-8">
            <p className="text-muted-foreground">
              No se encontraron perfiles con los filtros aplicados.
            </p>
          </div>
        ) : (
          profiles.map((profile) => (
            <ProfileCard
              key={profile._id}
              profile={profile}
              viewMode={viewMode}
              variant="default"
            />
          ))
        )}
      </div>

      {/* Paginación */}
      {data?.pagination && data.pagination.totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-8">
          <Button
            variant="outline"
            size="sm"
            disabled={!data.pagination.hasPrevPage || isLoading}
            onClick={() => onPageChange?.(data.pagination.currentPage - 1)}
          >
            Anterior
          </Button>

          <div className="flex items-center space-x-1">
            {Array.from(
              { length: Math.min(5, data.pagination.totalPages) },
              (_, i) => {
                const pageNum = i + 1;
                const isCurrentPage = pageNum === data.pagination.currentPage;

                return (
                  <Button
                    key={pageNum}
                    variant={isCurrentPage ? 'default' : 'outline'}
                    size="sm"
                    className="w-8 h-8 p-0"
                    disabled={isLoading}
                    onClick={() => onPageChange?.(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              },
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            disabled={!data.pagination.hasNextPage || isLoading}
            onClick={() => onPageChange?.(data.pagination.currentPage + 1)}
          >
            Siguiente
          </Button>
        </div>
      )}
    </>
  );
};

export default SearchProfiles;
