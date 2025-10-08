'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { useFilterOptions } from '@/hooks/use-filter-options';
import { getCitiesByDepartment } from '@/utils/colombiaData';
import { useSearchFilters } from '@/hooks/use-search-filters';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { createSlug } from '@/utils/slug';
import HorizontalFilterBar from './HorizontalFilterBar';

const FilterBar = () => {
  const router = useRouter();
  const { filters, updateFilter, updateCategory, updateLocation } = useSearchFilters();

  // Usar los valores del hook en lugar de estados locales
  const categoria = filters.category || '';
  const departamento = filters.location?.department || '';
  const ciudad = filters.location?.city || '';

  const {
    data: filterOptions,
    loading: isLoadingFilterOptions,
    error: filterOptionsError,
  } = useFilterOptions();

  // Extraer las opciones específicas del objeto de datos
  const categories = filterOptions?.categories || [];
  const departments = filterOptions?.locations?.departments || [];

  // Estados de carga y error derivados
  const isLoadingCategories = isLoadingFilterOptions;
  const isLoadingDepartments = isLoadingFilterOptions;
  const categoriesError = filterOptionsError;
  const departmentsError = filterOptionsError;

  const cities = departamento ? getCitiesByDepartment(departamento) : [];

  const handleSearch = () => {
    // Construir la ruta dinámica basada en los filtros seleccionados
    let route = '/filtros';

    const params = new URLSearchParams();

    // La categoría siempre va como parte de la ruta (slug)
    if (categoria) {
      route += `/${createSlug(categoria)}`;
    }

    // El departamento y ciudad van como query parameters
    if (departamento) {
      params.append('departamento', departamento);
    }

    if (ciudad) {
      params.append('ciudad', ciudad);
    }

    const queryString = params.toString();
    const finalRoute = queryString ? `${route}?${queryString}` : route;
    router.push(finalRoute);
  };

  // Función para manejar cambio de categoría
  const handleCategoryChange = (value: string) => {
    updateCategory(value);
  };

  // Función para manejar cambio de departamento
  const handleDepartmentChange = (value: string) => {
    updateLocation({ department: value, city: '' }); // Limpiar ciudad cuando se cambie el departamento
  };

  // Función para manejar cambio de ciudad
  const handleCityChange = (value: string) => {
    updateLocation({ department: departamento, city: value });
  };

  return (
    <div className="bg-background/50 backdrop-blur border-b transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Categoría */}
          <div
            className="animate-in slide-in-from-bottom-2"
            style={{ animationDelay: '0ms' }}
          >
            {isLoadingCategories ? (
              <Skeleton className="h-10 w-full" />
            ) : categoriesError || !categories ? (
              <Select disabled>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Error al cargar categorías" />
                </SelectTrigger>
              </Select>
            ) : (
              <Select value={categoria} onValueChange={handleCategoryChange}>
                <SelectTrigger className="w-full hover:border-purple-500 transition-all duration-200 focus:border-purple-500 focus:shadow-lg focus:shadow-purple-500/10">
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categories && Array.isArray(categories) ? categories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  )) : (
                    <SelectItem value="loading" disabled>
                      Cargando categorías...
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Departamento */}
          <div
            className="animate-in slide-in-from-bottom-2"
            style={{ animationDelay: '100ms' }}
          >
            {isLoadingDepartments ? (
              <Skeleton className="h-10 w-full" />
            ) : departmentsError || !departments ? (
              <Select disabled>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Error al cargar departamentos" />
                </SelectTrigger>
              </Select>
            ) : (
              <Select value={departamento} onValueChange={handleDepartmentChange}>
                <SelectTrigger className="w-full hover:border-purple-500 transition-all duration-200 focus:border-purple-500 focus:shadow-lg focus:shadow-purple-500/10">
                  <SelectValue placeholder="Seleccionar departamento" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((department) => (
                    <SelectItem key={department.value} value={department.value}>
                      {department.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Ciudad */}
          <div
            className="animate-in slide-in-from-bottom-2"
            style={{ animationDelay: '200ms' }}
          >
            <Select value={ciudad} onValueChange={handleCityChange} disabled={!departamento}>
              <SelectTrigger className="w-full hover:border-purple-500 transition-all duration-200 focus:border-purple-500 focus:shadow-lg focus:shadow-purple-500/10">
                <SelectValue placeholder="Seleccionar ciudad" />
              </SelectTrigger>
              <SelectContent>
                {cities.length > 0 ? (
                  cities.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-cities" disabled>
                    {departamento ? 'No hay ciudades disponibles' : 'Selecciona un departamento primero'}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Botón Buscar */}
          <div
            className="animate-in slide-in-from-bottom-2"
            style={{ animationDelay: '300ms' }}
          >
            <Button
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed disabled:shadow-none"
              onClick={handleSearch}
              disabled={!categoria && !departamento}
            >
              <Search className="w-4 h-4 mr-2" />
              Buscar
            </Button>
          </div>
        </div>
        {/* <HorizontalFilterBar 
          filters={filters.verification}
          onFiltersChange={(verificationFilters) => {
            // Actualizar filtros y navegar a la página de búsqueda
            const params = new URLSearchParams();
            
            if (verificationFilters.identityVerified) {
              params.append('profileVerified', 'true');
            }
            if (verificationFilters.hasVideo) {
              params.append('hasVideo', 'true');
            }
            if (verificationFilters.documentVerified) {
              params.append('documentVerified', 'true');
            }
            
            const queryString = params.toString();
            const route = queryString ? `/filtros?${queryString}` : '/filtros';
            router.push(route);
          }}
          onClearFilters={clearFilters}
          className="mt-4"
        /> */}
      </div>
    </div>
  );
};

export default FilterBar;
