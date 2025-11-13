'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface ProfileCardSkeletonProps {
  viewMode: 'grid' | 'list';
}

export function ProfileCardSkeleton({ viewMode }: ProfileCardSkeletonProps) {
  return (
    <Card
      className={cn(
        'overflow-hidden relative group transition-all duration-300',
        'bg-card border-border flex flex-row sm:flex-col h-full w-full'
      )}
    >
      {/* Imagen principal */}
      <div
        className={cn(
          'relative flex-shrink-0',
          'w-32 h-44 sm:w-full sm:h-56 md:h-96 lg:h-96'
        )}
      >
        <Skeleton className="absolute inset-0 w-full h-full" />

        {/* Badges superiores */}
        <div className="absolute top-1 right-1 sm:top-2 lg:top-3 sm:right-2 lg:right-3 flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-1 lg:space-x-2 z-10">
          <Skeleton className="h-3 w-3 rounded-full" />
          <Skeleton className="h-3 w-3 rounded-full" />
          <Skeleton className="h-3 w-3 rounded-full" />
        </div>

        {/* Badge destacado */}
        <div className="absolute top-1 left-1 sm:top-3 sm:left-3 z-10">
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>

        {/* Overlay (visible en desktop, simulando hover info) */}
        <div className="hidden sm:flex absolute inset-0 p-4 lg:p-6 flex-col justify-end">
          <div className="space-y-2 bg-black/70 backdrop-blur-sm rounded-lg p-3 lg:p-4">
            <Skeleton className="h-4 w-1/2 rounded" />
            <div className="space-y-1">
              <Skeleton className="h-3 w-1/3 rounded" />
              <Skeleton className="h-3 w-2/3 rounded" />
            </div>
            <Skeleton className="h-3 w-full rounded" />
            <Skeleton className="h-2 w-full rounded mt-2" />
          </div>
        </div>
      </div>

      {/* Contenido lateral en mobile */}
      <CardContent className="p-3 sm:hidden lg:p-6 flex-1 flex flex-col justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-2/3 rounded" />
          <div className="space-y-1">
            <Skeleton className="h-3 w-1/2 rounded" />
            <Skeleton className="h-3 w-2/3 rounded" />
          </div>
          <Skeleton className="h-3 w-full rounded mt-2" />
          <Skeleton className="h-2 w-full rounded mt-1" />
        </div>

        {/* Botón (versión móvil) */}
        <div className="mt-3">
          <Skeleton className="h-8 w-full rounded-md" />
        </div>
      </CardContent>
    </Card>
  );
}

export default ProfileCardSkeleton;
