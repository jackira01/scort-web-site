'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Search } from 'lucide-react';
import { useFilterOptionsQuery, useDepartmentsQuery, useCitiesByDepartmentQuery } from '@/hooks/use-filter-options-query';
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

// =============================
// 🔹 Tipos
// =============================
export interface LocationOption {
  value: string;
  label: string;
}

export interface FilterOptions {
  categories?: LocationOption[];
  locations?: {
    departments?: LocationOption[];
    cities?: LocationOption[];
  };
}

// =============================
// 🔹 Componente principal
// =============================
const FilterBar = () => {
  const router = useRouter();

  // Inicializar hook con valores limpios (sin filtros previos)
  const { filters, updateCategory, updateLocation } = useSearchFilters({
    category: '',
    location: {
      department: '',
      city: '',
    },
  });

  const categoria = filters.category || '';
  const departamento = filters.location?.department || '';
  const ciudad = filters.location?.city || '';

  // Usar React Query hooks
  const {
    data: filterOptions,
    isLoading: isLoadingOptions,
    error: optionsError,
  } = useFilterOptionsQuery();

  const {
    data: departments,
    isLoading: isLoadingDepartments,
    error: departmentsError,
  } = useDepartmentsQuery();

  const {
    data: cities,
    isLoading: isLoadingCities,
    error: citiesError,
  } = useCitiesByDepartmentQuery(departamento);

  // Combinar estados de loading
  const isLoading = isLoadingOptions || isLoadingDepartments || (departamento && isLoadingCities);
  const error = optionsError || departmentsError || citiesError;

  // =============================
  // 🔸 Normalizar categorías
  // =============================
  const categories: LocationOption[] = Array.isArray(filterOptions?.categories)
    ? filterOptions.categories
      .filter((c): c is LocationOption => !!c && !!c.value && !!c.label)
      .map(c => ({ value: String(c.value), label: String(c.label) }))
    : [];

  // =============================
  // 🔸 Usar departamentos de React Query
  // =============================
  const normalizedDepartments: LocationOption[] = Array.isArray(departments)
    ? departments
    : [];

  // =============================
  // 🔸 Usar ciudades de React Query (ya filtradas por departamento)
  // =============================
  const normalizedCities: LocationOption[] = Array.isArray(cities)
    ? cities
    : [];

  // =============================
  // 🔹 Manejadores
  // =============================
  const handleSearch = () => {
    // Generar URL limpia SEO-friendly
    const parts: string[] = [];

    // Normalizar valores: 'all' o vacío se considera como no seleccionado
    const hasCategoria = categoria && categoria !== 'all';
    const hasDepartamento = departamento && departamento !== 'all';
    const hasCiudad = ciudad && ciudad !== 'all';

    // Prioridad 1: Si hay categoría, usarla primero
    if (hasCategoria) {
      parts.push(createSlug(categoria));

      if (hasDepartamento) {
        parts.push(departamento);
      }
      if (hasCiudad) {
        parts.push(ciudad);
      }
    }
    // Prioridad 2: Si NO hay categoría pero SÍ hay ubicación, usar solo ubicación
    else if (hasDepartamento) {
      parts.push(departamento);

      if (hasCiudad) {
        parts.push(ciudad);
      }
    }

    // Si no hay ningún filtro, ir a la página de filtros genérica
    const route = parts.length > 0 ? `/${parts.join('/')}` : '/filtros';

    router.push(route);
  };

  const handleCategoryChange = (value: string) => {
    // Si selecciona 'all', limpiar la categoría
    const newValue = value === 'all' ? '' : value;
    updateCategory(newValue);
  };

  const handleDepartmentChange = (value: string) => {
    // Si selecciona 'all', limpiar el departamento
    const newDept = value === 'all' ? '' : value;
    updateLocation({ department: newDept, city: '' });
  };

  const handleCityChange = (value: string) => {
    updateLocation({ department: departamento, city: value });
  };

  // =============================
  // 🔹 Render
  // =============================
  return (
    <div className="bg-background/50 backdrop-blur border-b transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Categoría */}
          <div className="animate-in slide-in-from-bottom-2" style={{ animationDelay: '0ms' }}>
            {isLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : error ? (
              <Select disabled>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Error al cargar categorías" />
                </SelectTrigger>
              </Select>
            ) : (
              <Select value={categoria || 'all'} onValueChange={handleCategoryChange}>
                <SelectTrigger className="w-full hover:border-red-500 transition-all duration-200 focus:border-red-500 focus:shadow-lg focus:shadow-red-500/10">
                  <SelectValue placeholder="Todas las categorías" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  {categories.length > 0 ? (
                    categories.map((cat, i) => (
                      <SelectItem key={`cat-${i}`} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-cat" disabled>
                      No hay categorías disponibles
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Departamento */}
          <div className="animate-in slide-in-from-bottom-2" style={{ animationDelay: '100ms' }}>
            {isLoadingDepartments ? (
              <Skeleton className="h-10 w-full" />
            ) : departmentsError ? (
              <Select disabled>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Error al cargar departamentos" />
                </SelectTrigger>
              </Select>
            ) : (
              <Select value={departamento || 'all'} onValueChange={handleDepartmentChange}>
                <SelectTrigger className="w-full hover:border-red-500 transition-all duration-200 focus:border-red-500 focus:shadow-lg focus:shadow-red-500/10">
                  <SelectValue placeholder="Todos los departamentos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los departamentos</SelectItem>
                  {normalizedDepartments.length > 0 ? (
                    normalizedDepartments.map((dept, i) => (
                      <SelectItem key={`dept-${i}`} value={dept.value}>
                        {dept.label}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-dept" disabled>
                      No hay departamentos disponibles
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Ciudad */}
          <div className="animate-in slide-in-from-bottom-2" style={{ animationDelay: '200ms' }}>
            {isLoadingCities && departamento ? (
              <Skeleton className="h-10 w-full" />
            ) : citiesError ? (
              <Select disabled>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Error al cargar ciudades" />
                </SelectTrigger>
              </Select>
            ) : (
              <Select
                value={ciudad}
                onValueChange={handleCityChange}
                disabled={!departamento}
              >
                <SelectTrigger className="w-full hover:border-red-500 transition-all duration-200 focus:border-red-500 focus:shadow-lg focus:shadow-red-500/10 disabled:opacity-50">
                  <SelectValue placeholder={departamento ? "Seleccionar ciudad" : "Primero selecciona departamento"} />
                </SelectTrigger>
                <SelectContent>
                  {normalizedCities.length > 0 ? (
                    normalizedCities.map((city, i) => (
                      <SelectItem key={`city-${i}`} value={city.value}>
                        {city.label}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-city" disabled>
                      {departamento ? "No hay ciudades disponibles" : "Selecciona un departamento"}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Botón Buscar */}
          <Button
            className="w-full text-white font-medium shadow-lg transition-all duration-200 hover:scale-[1.02] bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 border-t border-red-400/20"
            onClick={handleSearch}
          >
            <Search className="w-4 h-4 mr-2" />
            Buscar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
