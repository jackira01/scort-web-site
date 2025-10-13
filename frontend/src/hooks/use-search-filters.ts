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
    ageRange?: {
      min?: number;
      max?: number;
    };
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

  // Verificación
  verification?: {
    identityVerified?: boolean;
    hasVideo?: boolean;
    documentVerified?: boolean;
  };

  // Estados
  isActive?: boolean;
  profileVerified?: boolean;
  hasVideos?: boolean;
  hasDestacadoUpgrade?: boolean;

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

  // Método para actualizar disponibilidad
  const updateAvailability = useCallback((availability: SearchFilters['availability']) => {
    setFilters((prev) => ({
      ...prev,
      availability,
      page: 1, // Reset page when changing filters
    }));
  }, []);

  // Método para actualizar filtros de verificación
  const updateVerification = useCallback((verificationFilters: SearchFilters['verification']) => {
    setFilters((prev) => ({
      ...prev,
      verification: verificationFilters,
      page: 1, // Reset page when changing filters
    }));
  }, []);

  // Actualizar estados (verificado, activo)
  const updateStates = useCallback(
    (states: { isActive?: boolean; profileVerified?: boolean }) => {
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
      // No establecer profileVerified por defecto para mostrar todos los perfiles
    });
  }, []);

  // Convertir a FilterQuery para la API
  const toFilterQuery = useCallback((): FilterQuery => {
    const query = {
      ...filters,
    };
    

    
    return query;
  }, [filters]);



  // Método genérico para actualizar filtros
  const updateFilter = useCallback((key: string, value: any) => {
    setFilters((prev) => {
      const newFilters = { ...prev };
      
      console.log('🔍 DEBUG useSearchFilters - updateFilter called', { key, value });
      
      // Manejar filtros anidados en features
      if (['gender', 'sex', 'age', 'height', 'weight', 'bodyType', 'ethnicity', 'hairColor', 'eyeColor', 'services', 'ageRange'].includes(key)) {
        newFilters.features = {
          ...prev.features,
          [key]: value,
        };
        
        if (key === 'ageRange') {
          console.log('🔍 DEBUG useSearchFilters - Processing ageRange in features:', {
            key,
            value,
            updatedFeatures: newFilters.features
          });
        }
        
        console.log('useSearchFilters: Updated features', newFilters.features);
      }
      // Manejar filtros de ubicación
      else if (['department', 'city'].includes(key)) {
        newFilters.location = {
          ...prev.location,
          [key]: value,
        };

      }
      // Manejar filtros de rango de precios
      else if (['minPrice', 'maxPrice'].includes(key)) {
        newFilters.priceRange = {
          ...prev.priceRange,
          [key === 'minPrice' ? 'min' : 'max']: value,
        };

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
        
      }
      // Manejar filtros de verificación
      else if (['identityVerified', 'hasVideo', 'documentVerified'].includes(key)) {
        newFilters.verification = {
          ...prev.verification,
          [key]: value,
        };
      }
      // Manejar filtros directos
      else {
        (newFilters as any)[key] = value;

      }
      
      const finalFilters = {
        ...newFilters,
        page: 1, // Reset page when changing filters
      };
      
      console.log('useSearchFilters: Final filters after update', finalFilters);
      
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
    updateVerification,
    updateStates,
    updatePagination,
    updateSorting,
    clearFilters,
    toFilterQuery,

  };
};
