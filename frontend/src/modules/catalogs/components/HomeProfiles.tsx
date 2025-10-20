'use client';

import { ArrowRight, Loader2 } from 'lucide-react';
import { useHomeFeedWithSeparators } from '@/hooks/useFeeds';
import CardComponent from '@/components/Card/Card';

const HomeProfiles = () => {
  const { data: feedData, profiles, isLoading, error, pagination } = useHomeFeedWithSeparators();

  if (isLoading) {
    return (
      <div className="lg:container lg:mx-auto md:px-0 md:mx-0 md:w-full px-4 py-8">
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-pink-600" />
          <span className="ml-2 text-gray-600 dark:text-gray-300">Cargando perfiles...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="lg:container lg:mx-auto md:px-0 md:mx-0 md:w-full px-4 py-8">
        <div className="text-center py-12">
          <p className="text-red-600 dark:text-red-400">Error al cargar perfiles</p>
          <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">
            {error instanceof Error ? error.message : 'Error desconocido'}
          </p>
        </div>
      </div>
    );
  }

  const totalProfiles = pagination?.total || 0;

  if (!profiles || profiles.length === 0) {
    return (
      <div className="lg:container lg:mx-auto md:px-0 md:mx-0 md:w-full px-4 py-8">
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-300">No hay perfiles disponibles</p>
        </div>
      </div>
    );
  }
  return (
    <div className="px-4 py-8 md:mx-20 md:w-container md:px-0 lg:container lg:mx-auto">
      {totalProfiles > 12 && (
        <div className="flex justify-end mb-6">
          <button className="flex items-center gap-2 text-pink-600 hover:text-pink-700 font-medium">
            Ver más
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Renderizar perfiles en el orden jerárquico del backend */}
      <div>
        <CardComponent profiles={profiles as any} />
      </div>
    </div>
  );
};

export default HomeProfiles;
