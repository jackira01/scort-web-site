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
    sex?: string[];
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

export const useSearchFilters = (initialFilters?: Partial<SearchFilters>) => {
  const [filters, setFilters] = useState<SearchFilters>({
    page: 1,
    limit: 12,
    sortBy: 'createdAt',
    sortOrder: 'desc',
    isActive: true,
    ...initialFilters,
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
    const query = {
      ...filters,
    };
    
    console.log('🚀 [DEBUG] Query generada para la API:', query);
    
    return query;
  }, [filters]);

  // Obtener conteo de filtros activos
  const getActiveFiltersCount = useCallback(() => {
    let count = 0;

    if (filters.category) count++;
    if (filters.location?.department || filters.location?.city) count++;
    if (filters.features?.gender) count++;
    if (filters.features?.sex && filters.features.sex.length > 0) count++;
    if (filters.features?.age && filters.features.age.length > 0) count++;
    if (filters.features?.ageRange?.min || filters.features?.ageRange?.max) count++;
    if (filters.priceRange?.min || filters.priceRange?.max) count++;
    if (filters.isVerified !== undefined) count++;

    return count;
  }, [filters]);

  // Método genérico para actualizar filtros
  const updateFilter = useCallback((key: string, value: any) => {
    console.log('🔧 [DEBUG] Actualizando filtro:', { key, value });
    
    setFilters((prev) => {
      const newFilters = { ...prev };
      
      console.log('🔧 [DEBUG] Filtros anteriores:', prev);
      
      // Manejar filtros anidados en features
      if (['gender', 'sex', 'age', 'height', 'weight', 'bodyType', 'ethnicity', 'hairColor', 'eyeColor', 'services'].includes(key)) {
        newFilters.features = {
          ...prev.features,
          [key]: value,
        };
        console.log('🔧 [DEBUG] Filtro de características actualizado:', newFilters.features);
      }
      // Manejar filtros de ubicación
      else if (['department', 'city'].includes(key)) {
        newFilters.location = {
          ...prev.location,
          [key]: value,
        };
        console.log('🔧 [DEBUG] Filtro de ubicación actualizado:', newFilters.location);
      }
      // Manejar filtros de rango de precios
      else if (['minPrice', 'maxPrice'].includes(key)) {
        newFilters.priceRange = {
          ...prev.priceRange,
          [key === 'minPrice' ? 'min' : 'max']: value,
        };
        console.log('🔧 [DEBUG] Filtro de rango de precios actualizado:', newFilters.priceRange);
      }
      // Manejar filtros de rango de edad
      else if (['minAge', 'maxAge'].includes(key)) {
        newFilters.features = {
          ...prev.features,
          ageRange: {
            ...prev.features?.ageRange,
            [key === 'minAge' ? 'min' : 'max']: value,
          },
        };
        console.log('🔧 [DEBUG] Filtro de rango de edad actualizado:', newFilters.features?.ageRange);
      }
      // Manejar filtros directos
      else {
        (newFilters as any)[key] = value;
        console.log('🔧 [DEBUG] Filtro directo actualizado:', { [key]: value });
      }
      
      const finalFilters = {
        ...newFilters,
        page: 1, // Reset page when changing filters
      };
      
      console.log('🔧 [DEBUG] Filtros finales:', finalFilters);
      
      return finalFilters;
    });
  }, []);

  return {
    filters,
    setFilters,
    updateFilter,
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
