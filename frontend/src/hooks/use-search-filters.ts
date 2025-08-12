'use client';

import { useCallback, useState } from 'react';
import type { FilterQuery } from '@/types/profile.types';

export interface SearchFilters {
  // Filtros básicos
  category?: string;
  location?: {
    department?: string;
    city?: string;
  };

  // Características
  features?: {
    gender?: string;
    age?: string[];
    height?: string[];
    weight?: string[];
    bodyType?: string[];
    ethnicity?: string[];
    hairColor?: string[];
    eyeColor?: string[];
    services?: string[];
  };

  // Rango de precios
  priceRange?: {
    min?: number;
    max?: number;
  };

  // Disponibilidad
  availability?: {
    days?: string[];
    hours?: {
      start?: string;
      end?: string;
    };
  };

  // Estados
  isActive?: boolean;
  isVerified?: boolean;

  // Paginación y ordenamiento
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const useSearchFilters = () => {
  const [filters, setFilters] = useState<SearchFilters>({
    page: 1,
    limit: 12,
    sortBy: 'createdAt',
    sortOrder: 'desc',
    isActive: true,
  });

  // Actualizar categoría
  const updateCategory = useCallback((category: string) => {
    setFilters((prev) => ({
      ...prev,
      category,
      page: 1, // Reset page when changing category
    }));
  }, []);

  // Actualizar ubicación
  const updateLocation = useCallback(
    (location: { department?: string; city?: string }) => {
      setFilters((prev) => ({
        ...prev,
        location,
        page: 1,
      }));
    },
    [],
  );

  // Actualizar características
  const updateFeatures = useCallback(
    (features: Partial<SearchFilters['features']>) => {
      setFilters((prev) => ({
        ...prev,
        features: {
          ...prev.features,
          ...features,
        },
        page: 1,
      }));
    },
    [],
  );

  // Actualizar rango de precios
  const updatePriceRange = useCallback(
    (priceRange: { min?: number; max?: number }) => {
      setFilters((prev) => ({
        ...prev,
        priceRange,
        page: 1,
      }));
    },
    [],
  );

  // Actualizar disponibilidad
  const updateAvailability = useCallback(
    (availability: SearchFilters['availability']) => {
      setFilters((prev) => ({
        ...prev,
        availability,
        page: 1,
      }));
    },
    [],
  );

  // Actualizar estados (verificado, activo)
  const updateStates = useCallback(
    (states: { isActive?: boolean; isVerified?: boolean }) => {
      setFilters((prev) => ({
        ...prev,
        ...states,
        page: 1,
      }));
    },
    [],
  );

  // Actualizar paginación
  const updatePagination = useCallback((page: number, limit?: number) => {
    setFilters((prev) => ({
      ...prev,
      page,
      ...(limit && { limit }),
    }));
  }, []);

  // Actualizar ordenamiento
  const updateSorting = useCallback(
    (sortBy: string, sortOrder: 'asc' | 'desc' = 'desc') => {
      setFilters((prev) => ({
        ...prev,
        sortBy,
        sortOrder,
        page: 1,
      }));
    },
    [],
  );

  // Limpiar filtros
  const clearFilters = useCallback(() => {
    setFilters({
      page: 1,
      limit: 12,
      sortBy: 'createdAt',
      sortOrder: 'desc',
      isActive: true,
    });
  }, []);

  // Convertir a FilterQuery para la API
  const toFilterQuery = useCallback((): FilterQuery => {
    return {
      ...filters,
    };
  }, [filters]);

  // Obtener conteo de filtros activos
  const getActiveFiltersCount = useCallback(() => {
    let count = 0;

    if (filters.category) count++;
    if (filters.location?.department || filters.location?.city) count++;
    if (filters.features?.gender) count++;
    if (filters.features?.age && filters.features.age.length > 0) count++;
    if (filters.priceRange?.min || filters.priceRange?.max) count++;
    if (filters.isVerified !== undefined) count++;

    return count;
  }, [filters]);

  return {
    filters,
    setFilters,
    updateCategory,
    updateLocation,
    updateFeatures,
    updatePriceRange,
    updateAvailability,
    updateStates,
    updatePagination,
    updateSorting,
    clearFilters,
    toFilterQuery,
    getActiveFiltersCount,
  };
};
