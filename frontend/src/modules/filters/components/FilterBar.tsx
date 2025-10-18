'use client';

import { useRouter } from 'next/navigation';
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
  const { filters, updateCategory, updateLocation } = useSearchFilters();

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
    let route = '/filtros';
    const params = new URLSearchParams();

    if (categoria) route += `/${createSlug(categoria)}`;
    if (departamento) params.append('departamento', departamento);
    if (ciudad) params.append('ciudad', ciudad);

    const queryString = params.toString();
    const finalRoute = queryString ? `${route}?${queryString}` : route;
    router.push(finalRoute);
  };

  const handleCategoryChange = (value: string) => updateCategory(value);

  const handleDepartmentChange = (value: string) =>
    updateLocation({ department: value, city: '' });

  const handleCityChange = (value: string) =>
    updateLocation({ department: departamento, city: value });

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
              <Select value={categoria} onValueChange={handleCategoryChange}>
                <SelectTrigger className="w-full hover:border-purple-500 transition-all duration-200 focus:border-purple-500 focus:shadow-lg focus:shadow-purple-500/10">
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
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
              <Select value={departamento} onValueChange={handleDepartmentChange}>
                <SelectTrigger className="w-full hover:border-purple-500 transition-all duration-200 focus:border-purple-500 focus:shadow-lg focus:shadow-purple-500/10">
                  <SelectValue placeholder="Seleccionar departamento" />
                </SelectTrigger>
                <SelectContent>
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
                <SelectTrigger className="w-full hover:border-purple-500 transition-all duration-200 focus:border-purple-500 focus:shadow-lg focus:shadow-purple-500/10 disabled:opacity-50">
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
          <div className="animate-in slide-in-from-bottom-2" style={{ animationDelay: '300ms' }}>
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
      </div>
    </div>
  );
};

export default FilterBar;
