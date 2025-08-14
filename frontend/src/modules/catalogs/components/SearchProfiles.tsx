import {
  Calendar,
  CheckCircle,
  MapPin,
  Star,
  User,
  Video,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useFilteredProfiles } from '@/hooks/use-filtered-profiles';
import type { FilterQuery } from '@/types/profile.types';
import {
  formatLocation,
  hasProfileVideo,
  isProfileVerified,
  transformProfilesToCards,
} from '@/utils/profile.utils';

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

  // Debug logs
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
            <Card
              key={profile._id}
              className="group hover:shadow-xl transition-all duration-300 overflow-hidden bg-card border-border relative"
            >
              <div className="relative">
                <Image
                  width={300}
                  height={300}
                  src={profile.media.gallery?.[0] || '/placeholder.svg'}
                  alt={profile.name}
                  className={`w-full object-cover group-hover:scale-105 transition-transform duration-300 ${viewMode === 'grid'
                    ? 'h-48 sm:h-56 lg:h-64'
                    : 'h-40 sm:h-48'
                    }`}
                />
                {profile.featured && (
                  <Badge className="absolute top-2 lg:top-3 left-2 lg:left-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs">
                    <Star className="h-2 w-2 lg:h-3 lg:w-3 mr-1" />
                    PRESENTADO
                  </Badge>
                )}
                <div className="absolute top-2 lg:top-3 right-2 lg:right-3 flex space-x-1 lg:space-x-2">
                  {isProfileVerified(profile) && (
                    <Badge
                      variant="secondary"
                      className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 p-1"
                    >
                      <CheckCircle className="h-2 w-2 lg:h-3 lg:w-3" />
                    </Badge>
                  )}
                  {profile.online && (
                    <div className="w-2 h-2 lg:w-3 lg:h-3 bg-green-500 rounded-full border border-white dark:border-gray-800"></div>
                  )}
                  {profile.hasVideo && (
                    <Badge
                      variant="secondary"
                      className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 p-1"
                    >
                      <Video className="h-2 w-2 lg:h-3 lg:w-3" />
                    </Badge>
                  )}
                </div>
              </div>

              {/* Contenido siempre visible */}
              <CardContent className="p-4 lg:p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-base lg:text-lg text-foreground group-hover:text-purple-600 transition-colors">
                      {profile.name}
                    </h3>
                    <div className="flex items-center space-x-2 text-xs lg:text-sm text-muted-foreground mt-1">
                      <span className="flex items-center">
                        <MapPin className="h-3 w-3 mr-1" />
                        {formatLocation(profile.location)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>

              {/* Contenido que aparece en hover */}
              <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end">
                <div className="p-4 lg:p-6 text-white">
                  <h3 className="font-semibold text-base lg:text-lg mb-2">
                    {profile.name}
                  </h3>
                  <div className="flex items-center space-x-4 text-xs lg:text-sm mb-3">
                    <span className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      Edad {profile.age}
                    </span>
                    <span className="flex items-center">
                      <MapPin className="h-3 w-3 mr-1" />
                      {formatLocation(profile.location)}
                    </span>
                  </div>
                  <p className="text-white/90 text-xs lg:text-sm mb-4 line-clamp-3">
                    {profile.description}
                  </p>
                  <Link href={`/perfil/${profile._id}`}>
                    <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-sm">
                      Ver perfil
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
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
