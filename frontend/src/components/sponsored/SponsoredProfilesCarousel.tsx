'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Star, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import type { Profile } from '@/types/profile.types';
import { getProfilesForCards } from '@/services/filters.service';

interface SponsoredProfilesCarouselProps {
  className?: string;
}

export default function SponsoredProfilesCarousel({ className = '' }: SponsoredProfilesCarouselProps) {
  const [sponsoredProfiles, setSponsoredProfiles] = useState<Profile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Número de perfiles visibles según el tamaño de pantalla
  const getVisibleCount = () => {
    if (typeof window === 'undefined') return 4;
    if (window.innerWidth < 640) return 1; // sm
    if (window.innerWidth < 768) return 2; // md
    if (window.innerWidth < 1024) return 3; // lg
    return 4; // xl y superior
  };

  const [visibleCount, setVisibleCount] = useState(4);

  // Actualizar visibleCount en resize
  useEffect(() => {
    const handleResize = () => {
      setVisibleCount(getVisibleCount());
    };

    handleResize(); // Ejecutar al montar
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Cargar perfiles sponsored (por ahora perfiles random)
  useEffect(() => {
    const loadSponsoredProfiles = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Por ahora obtenemos perfiles random - en el futuro se filtrarán por sponsored
        const response = await getProfilesForCards({
          limit: 8, // Obtener más perfiles para el carrusel
          page: 1,
          sortBy: 'createdAt',
          sortOrder: 'desc'
        });

        setSponsoredProfiles(response.profiles);
      } catch (err) {
        setError('Error al cargar perfiles patrocinados');
      } finally {
        setIsLoading(false);
      }
    };

    loadSponsoredProfiles();
  }, []);

  const nextSlide = () => {
    setCurrentIndex((prev) => {
      const maxIndex = Math.max(0, (sponsoredProfiles || []).length - visibleCount);
      return prev >= maxIndex ? 0 : prev + 1;
    });
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => {
      const maxIndex = Math.max(0, (sponsoredProfiles || []).length - visibleCount);
      return prev <= 0 ? maxIndex : prev - 1;
    });
  };

  if (isLoading) {
    return (
      <div className={`bg-gradient-to-r from-purple-100 via-pink-100 to-rose-100 rounded-lg p-6 ${className}`}>
        <div className="flex items-center gap-2 mb-4">
          <Crown className="h-5 w-5 text-yellow-600" />
          <h2 className="text-lg font-semibold text-gray-900">Perfiles Destacados</h2>
        </div>
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: visibleCount }).map((_, index) => (
            <div key={index} className="flex-shrink-0 w-full sm:w-1/2 md:w-1/3 lg:w-1/4">
              <Card className="animate-pulse">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-full" />
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded mb-2" />
                      <div className="h-3 bg-gray-200 rounded w-2/3" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || (sponsoredProfiles || []).length === 0) {
    return null; // No mostrar nada si hay error o no hay perfiles
  }

  return (
    <div className={`bg-gradient-to-r from-purple-100 via-pink-100 to-rose-100 rounded-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-yellow-600" />
          <h2 className="text-lg font-semibold text-gray-900">Perfiles Destacados</h2>
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
            Sponsored
          </Badge>
        </div>

        {/* Navigation buttons */}
        {(sponsoredProfiles || []).length > visibleCount && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={prevSlide}
              className="h-8 w-8 p-0 bg-white/80 hover:bg-white"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={nextSlide}
              className="h-8 w-8 p-0 bg-white/80 hover:bg-white"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Carousel */}
      <div className="relative overflow-hidden">
        <div
          className="flex transition-transform duration-300 ease-in-out gap-4"
          style={{
            transform: `translateX(-${currentIndex * (100 / visibleCount)}%)`
          }}
        >
          {sponsoredProfiles.map((profile) => (
            <div
              key={profile._id}
              className="flex-shrink-0"
              style={{ width: `${100 / visibleCount}%` }}
            >
              <Link href={`/perfil/${profile._id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer bg-white/90 backdrop-blur-sm border-purple-200 hover:border-purple-300">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className="relative">
                        <Avatar className="h-12 w-12 border-2 border-purple-200">
                          <AvatarImage
                            src={profile.media?.gallery?.[0]}
                            alt={profile.name}
                          />
                          <AvatarFallback className="bg-purple-100 text-purple-700">
                            {profile.name?.charAt(0)?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {/* Sponsored badge */}
                        <div className="absolute -top-1 -right-1">
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        </div>
                      </div>

                      {/* Profile info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">
                          {profile.name}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          {profile.age && (
                            <span>{profile.age} años</span>
                          )}
                          {profile.location?.city?.label && (
                            <>
                              <span>•</span>
                              <span className="truncate">{profile.location.city.label}</span>
                            </>
                          )}
                        </div>
                        {profile.verification?.verificationStatus === 'verified' && (
                          <Badge variant="secondary" className="mt-1 text-xs bg-green-100 text-green-800">
                            Verificado
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Indicators */}
      {(sponsoredProfiles || []).length > visibleCount && (
        <div className="flex justify-center mt-4 space-x-2">
          {Array.from({ length: Math.ceil((sponsoredProfiles || []).length / visibleCount) }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-colors ${Math.floor(currentIndex / visibleCount) === index
                  ? 'bg-purple-600'
                  : 'bg-purple-300'
                }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}