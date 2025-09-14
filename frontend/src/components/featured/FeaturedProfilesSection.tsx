'use client';

import { useState, useEffect } from 'react';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { Profile } from '@/types/profile.types';
import { getProfilesForCards } from '@/services/filters.service';
import { ProfileCard } from '@/modules/catalogs/components/ProfileCard';

interface FeaturedProfilesSectionProps {
  className?: string;
}

export default function FeaturedProfilesSection({ className = '' }: FeaturedProfilesSectionProps) {
  const [featuredProfiles, setFeaturedProfiles] = useState<Profile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Número de perfiles visibles según el tamaño de pantalla
  const getVisibleCount = () => {
    if (typeof window === 'undefined') return 4;
    if (window.innerWidth < 640) return 2; // sm
    if (window.innerWidth < 768) return 3; // md
    if (window.innerWidth < 1024) return 4; // lg
    return 5; // xl y superior
  };

  const [visibleCount, setVisibleCount] = useState(4);

  // Actualizar visibleCount en resize
  useEffect(() => {
    const handleResize = () => {
      setVisibleCount(getVisibleCount());
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Cargar perfiles destacados
  useEffect(() => {
    const loadFeaturedProfiles = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Obtener perfiles destacados
        const response = await getProfilesForCards({
          limit: 10,
          page: 1,
          sortBy: 'createdAt',
          sortOrder: 'desc',
          featured: true // Filtrar solo perfiles destacados
        });

        setFeaturedProfiles(response.profiles);
      } catch (err) {
        setError('Error al cargar perfiles destacados');
      } finally {
        setIsLoading(false);
      }
    };

    loadFeaturedProfiles();
  }, []);

  const nextSlide = () => {
    setCurrentIndex((prev) => {
      const maxIndex = Math.max(0, (featuredProfiles || []).length - visibleCount);
      return prev >= maxIndex ? 0 : prev + 1;
    });
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => {
      const maxIndex = Math.max(0, (featuredProfiles || []).length - visibleCount);
      return prev <= 0 ? maxIndex : prev - 1;
    });
  };

  if (isLoading) {
    return (
      <div className={`border border-gray-200 rounded-lg p-6 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            PERFILES DESTACADOS
          </h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: visibleCount }).map((_, index) => (
            <div key={index} className="animate-pulse">
              <Card className="overflow-hidden">
                <div className="aspect-[4/3] bg-gray-200" />
              </Card>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || featuredProfiles.length === 0) {
    return null;
  }

  return (
    <div className={`border border-gray-200 rounded-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-500" />
          PERFILES DESTACADOS
        </h2>

        {/* Navigation buttons */}
        {featuredProfiles.length > visibleCount && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={prevSlide}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={nextSlide}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Grid de perfiles destacados */}
      <div className="relative overflow-hidden">
        <div
          className="flex transition-transform duration-300 ease-in-out gap-4"
          style={{
            transform: `translateX(-${currentIndex * (100 / visibleCount)}%)`
          }}
        >
          {featuredProfiles.map((profile) => (
            <div
              key={profile._id}
              className="flex-shrink-0"
              style={{ width: `${100 / visibleCount}%` }}
            >
              <ProfileCard
                profile={profile}
                viewMode="grid"
                variant="featured"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}