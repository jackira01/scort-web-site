'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface ProfileCardSkeletonProps {
  viewMode: 'grid' | 'list';
}

export function ProfileCardSkeleton({ viewMode }: ProfileCardSkeletonProps) {
  return (
    <Card className="group overflow-hidden relative bg-card border-border">
      {/* Layout responsive: horizontal en mobile, vertical en desktop */}
      <div className="flex flex-row sm:flex-col h-full w-full">
        {/* Imagen */}
        <div className="relative w-32 h-44 sm:w-full sm:h-56 md:h-96 lg:h-96 flex-shrink-0">
          <Skeleton className="w-full h-full rounded-none" />

          {/* Badges simulados (posición ajustada para coincidir con ProfileCard) */}
          <div className="absolute top-8 right-1 sm:top-9 lg:top-10 sm:right-2 lg:right-3 flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-1 lg:space-x-2 z-10">
            <Skeleton className="h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-white/30" />
            <Skeleton className="h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-white/30" />
          </div>

          {/* Overlay Desktop (simulando información flotante) */}
          <div className="hidden sm:flex absolute inset-0 p-4 lg:p-6 flex-col justify-end">
            <div className="space-y-2 bg-black/70 backdrop-blur-sm rounded-lg p-3 lg:p-4">
              {/* Nombre y edad */}
              <div className="flex justify-between items-center">
                <Skeleton className="h-5 w-1/2 bg-white/20 rounded" />
                <Skeleton className="h-4 w-1/4 bg-white/20 rounded" />
              </div>

              {/* Ubicación */}
              <Skeleton className="h-4 w-2/3 bg-white/20 rounded" />

              {/* Descripción líneas */}
              <div className="space-y-1 pt-1">
                <Skeleton className="h-3 w-full bg-white/10 rounded" />
                <Skeleton className="h-3 w-5/6 bg-white/10 rounded" />
              </div>

              {/* Barra verificación */}
              <Skeleton className="h-2 w-full bg-white/20 rounded mt-2" />
            </div>
          </div>
        </div>

        {/* Contenido lateral en MOBILE (siempre visible) */}
        <CardContent className="p-3 sm:hidden lg:p-6 flex-1 flex flex-col justify-between">
          <div className="w-full">
            {/* Nombre */}
            <Skeleton className="h-5 w-3/4 mb-2" />

            {/* Info meta (edad, ubicación) */}
            <div className="flex flex-col space-y-1 mb-3">
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-3 w-2/3" />
            </div>

            {/* Descripción */}
            <div className="space-y-1 mb-3">
              <Skeleton className="h-2 w-full" />
              <Skeleton className="h-2 w-full" />
              <Skeleton className="h-2 w-4/5" />
            </div>

            {/* Barra verificación */}
            <Skeleton className="h-2 w-full rounded" />
          </div>

          {/* Botón visible en mobile */}
          <div className="mt-2">
            <Skeleton className="h-8 w-full rounded-md" />
          </div>
        </CardContent>
      </div>
    </Card>
  );
}

export default ProfileCardSkeleton;
