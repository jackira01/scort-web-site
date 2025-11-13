'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import SearchProfilesSSG from '@/modules/catalogs/components/SearchProfilesSSG';
import FeaturedProfilesSection from '@/components/featured/FeaturedProfilesSection';
import AgeFilter from '@/modules/filters/components/AgeFilter';
import CategoryFilter from '@/modules/filters/components/CategoryFilter';
import LocationFilter from '@/modules/filters/components/LocationFIlter';
import HorizontalFilterBar from '@/modules/filters/components/HorizontalFilterBar';
import { useSearchFilters } from '@/hooks/use-search-filters';
import { useFilteredProfiles } from '@/hooks/use-filtered-profiles';
import { useDepartmentsQuery, useCitiesByDepartmentQuery } from '@/hooks/use-filter-options-query';
import type { ProfilesResponse } from '@/types/profile.types';

interface SearchPageClientProps {
  categoria: string;
  departamento?: string;
  ciudad?: string;
  profilesData: ProfilesResponse;
}

export default function SearchPageClient({
  categoria,
  departamento,
  ciudad,
  profilesData,
}: SearchPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [hasInitialFetch, setHasInitialFetch] = useState(false);

  // Ref para evitar sincronización circular cuando cambiamos la URL programáticamente
  const isUpdatingUrlRef = useRef(false);
  // Ref para rastrear valores previos y evitar actualizaciones innecesarias
  const prevFiltersRef = useRef<{ department?: string; city?: string }>({});

  // CLAVE: Leer los filtros desde searchParams primero, y si no existen, usar los props
  const departamentoFromUrl = searchParams.get('departamento') || departamento;
  const ciudadFromUrl = searchParams.get('ciudad') || ciudad;

  // Hook para manejar filtros - inicializar con los valores de la URL/props
  const initialFilters = {
    category: categoria,
    location: {
      department: departamentoFromUrl,
      city: ciudadFromUrl,
    },
  };

  const {
    filters,
    updateFilter,
    clearFilters,
    updateVerification,
  } = useSearchFilters(initialFilters);

  // Sincronizar filtros cuando cambian los parámetros de la URL
  // OPTIMIZACIÓN: Solo actualizar si no estamos en medio de una actualización programática
  // y si los valores realmente cambiaron
  useEffect(() => {
    // Si estamos actualizando la URL programáticamente, no sincronizar
    if (isUpdatingUrlRef.current) {
      return;
    }

    const newDepartamento = searchParams.get('departamento') || departamento;
    const newCiudad = searchParams.get('ciudad') || ciudad;

    // Comparar con valores previos para evitar actualizaciones innecesarias
    const prevDepartment = prevFiltersRef.current.department;
    const prevCity = prevFiltersRef.current.city;

    // Solo actualizar si realmente cambiaron
    if (
      filters.location?.department !== newDepartamento ||
      filters.location?.city !== newCiudad
    ) {
      // Verificar que no sea solo un re-render sin cambios reales
      if (prevDepartment !== newDepartamento || prevCity !== newCiudad) {
        console.log('🔄 Sincronizando filtros desde URL:', {
          newDepartamento,
          newCiudad,
          prevDepartment,
          prevCity
        });

        updateFilter('location', {
          department: newDepartamento,
          city: newCiudad,
        });

        // Actualizar refs
        prevFiltersRef.current = {
          department: newDepartamento,
          city: newCiudad,
        };
      }
    }
  }, [searchParams, departamento, ciudad]); // Remover filters de dependencias para evitar loop

  // Función helper para normalizar filtros al formato esperado por la API
  const normalizeFiltersForQuery = (): any => {
    const normalized: any = {
      isActive: true,
      sortBy: 'createdAt',
      sortOrder: 'desc' as const,
      page: 1,
      limit: 20
    };

    // Categoría - solo incluir si existe y no es undefined
    if (filters.category) {
      normalized.category = filters.category;
    }

    // Ubicación - solo incluir si department está definido
    if (filters.location?.department) {
      normalized.location = filters.location;
    }

    // Features - convertir a arrays
    const hasFeatures = filters.features?.ageRange || filters.features?.gender || filters.features?.sex;
    if (hasFeatures) {
      normalized.features = {};

      // Age range -> convertir a array de strings
      if (filters.features?.ageRange) {
        const { min, max } = filters.features.ageRange;
        normalized.features.age = [`${min}-${max}`];
      }

      // Gender -> asegurar que sea array
      if (filters.features?.gender) {
        normalized.features.gender = Array.isArray(filters.features.gender)
          ? filters.features.gender
          : [filters.features.gender];
      }

      // Sex -> mantener como está (ya debería ser array)
      if (filters.features?.sex) {
        normalized.features.sex = Array.isArray(filters.features.sex)
          ? filters.features.sex
          : [filters.features.sex];
      }

      // Copiar otros features si existen
      if (filters.features?.age) {
        normalized.features.age = filters.features.age;
      }
      if (filters.features?.height) {
        normalized.features.height = filters.features.height;
      }
      if (filters.features?.weight) {
        normalized.features.weight = filters.features.weight;
      }
      if (filters.features?.bodyType) {
        normalized.features.bodyType = filters.features.bodyType;
      }
      if (filters.features?.ethnicity) {
        normalized.features.ethnicity = filters.features.ethnicity;
      }
      if (filters.features?.hairColor) {
        normalized.features.hairColor = filters.features.hairColor;
      }
      if (filters.features?.eyeColor) {
        normalized.features.eyeColor = filters.features.eyeColor;
      }
      if (filters.features?.services) {
        normalized.features.services = filters.features.services;
      }
    }

    // Verificaciones
    if (filters.verification?.identityVerified) {
      normalized.profileVerified = filters.verification.identityVerified;
    }
    if (filters.verification?.hasVideo) {
      normalized.hasVideos = filters.verification.hasVideo;
    }
    if (filters.verification?.documentVerified) {
      normalized.documentVerified = filters.verification.documentVerified;
    }

    return normalized;
  };

  const queryFilters = normalizeFiltersForQuery();

  // Normalizar filtros también para SearchProfilesSSG (con type assertion)
  const normalizedFiltersForDisplay: any = queryFilters;

  // Determinar si hay filtros activos más allá de los básicos de la URL
  // Solo desactivar el fetch si NO hay filtros adicionales (edad, verificación, etc.)
  const hasAdditionalFilters = Boolean(
    filters.features?.ageRange ||
    filters.features?.gender ||
    filters.features?.sex ||
    filters.verification?.identityVerified ||
    filters.verification?.hasVideo ||
    filters.verification?.documentVerified
  );

  // Detectar si los filtros de ubicación/categoría son diferentes a la URL actual
  const hasLocationOrCategoryChanged = Boolean(
    (filters.location?.department !== departamentoFromUrl) ||
    (filters.location?.city !== ciudadFromUrl) ||
    (filters.category !== categoria)
  );

  // CRÍTICO: Siempre hacer fetch en el primer montaje del componente
  // Después, solo hacer fetch si hay filtros adicionales o cambios
  const shouldFetchClientSide = !hasInitialFetch || hasAdditionalFilters || hasLocationOrCategoryChanged;

  // Usar useQuery para manejar los datos filtrados
  const {
    data: currentProfilesData = profilesData,
    isLoading: isLoadingProfiles,
    error,
    refetch
  } = useFilteredProfiles(
    queryFilters,
    {
      initialData: profilesData,
      staleTime: shouldFetchClientSide ? 0 : 5 * 60 * 1000,
      enabled: shouldFetchClientSide,
      refetchOnMount: true // Siempre refetch en mount para datos frescos
    }
  );

  // Marcar que ya se hizo el fetch inicial después de la primera carga
  useEffect(() => {
    if (!isLoadingProfiles && !hasInitialFetch) {
      setHasInitialFetch(true);
    }
  }, [isLoadingProfiles, hasInitialFetch]);

  // Función wrapper para limpiar filtros y refrescar datos
  const handleClearFilters = async () => {
    console.log('🧹 Limpiando todos los filtros');

    // Marcar que estamos actualizando la URL
    isUpdatingUrlRef.current = true;

    // Limpiar completamente todos los filtros
    clearFilters();

    // Resetear los refs para que el LocationFilter se reinicie
    prevFiltersRef.current = {
      department: undefined,
      city: undefined,
    };

    // Navegar a la ruta base con solo la categoría
    const baseUrl = `/${categoria}`;
    router.push(baseUrl);

    // Resetear la bandera después de un pequeño delay
    setTimeout(() => {
      isUpdatingUrlRef.current = false;
      refetch();
    }, 100);
  };

  // Función wrapper para actualizar filtros
  const handleUpdateFilter = (key: string, value: any) => {
    updateFilter(key, value);
  };

  // Función para construir URL con searchParams
  const buildUrlWithParams = (
    cat: string,
    dept?: string,
    city?: string,
    preserveOtherFilters: boolean = true
  ) => {
    // Construir path limpio SEO-friendly
    const parts: string[] = [];

    // Prioridad 1: Si hay categoría, usarla primero
    if (cat) {
      parts.push(cat);
      if (dept) {
        parts.push(dept);
      }
      if (city && dept) {
        parts.push(city);
      }
    }
    // Prioridad 2: Si NO hay categoría pero SÍ hay ubicación, usar solo ubicación
    else if (dept) {
      parts.push(dept);
      if (city) {
        parts.push(city);
      }
    }

    const basePath = parts.length > 0 ? `/${parts.join('/')}` : '/filtros';

    // Preservar otros filtros si se solicita (como query params)
    if (preserveOtherFilters) {
      const params = new URLSearchParams();

      // Agregar filtros de features si existen
      if (filters.features?.ageRange) {
        params.set('ageMin', filters.features.ageRange.min?.toString() || '');
        params.set('ageMax', filters.features.ageRange.max?.toString() || '');
      }
      if (filters.features?.gender) {
        const genderValue = Array.isArray(filters.features.gender)
          ? filters.features.gender.join(',')
          : filters.features.gender;
        params.set('gender', genderValue);
      }
      if (filters.features?.sex) {
        const sexValue = Array.isArray(filters.features.sex)
          ? filters.features.sex.join(',')
          : filters.features.sex;
        params.set('sex', sexValue);
      }

      // Agregar filtros de verificación
      if (filters.verification?.identityVerified) {
        params.set('verified', 'true');
      }
      if (filters.verification?.hasVideo) {
        params.set('video', 'true');
      }
      if (filters.verification?.documentVerified) {
        params.set('document', 'true');
      }

      const queryString = params.toString();
      return queryString ? `${basePath}?${queryString}` : basePath;
    }

    return basePath;
  };

  // Manejar cambio de ubicación - mantener filtros
  const handleLocationChange = (newDepartment?: string, newCity?: string) => {
    console.log('🔄 handleLocationChange:', { newDepartment, newCity });

    // Marcar que estamos actualizando la URL para evitar sincronización circular
    isUpdatingUrlRef.current = true;

    // Actualizar el estado local primero
    updateFilter('location', {
      department: newDepartment,
      city: newCity,
    });

    // Actualizar refs
    prevFiltersRef.current = {
      department: newDepartment,
      city: newCity,
    };

    // Construir y navegar a la nueva URL
    const newUrl = buildUrlWithParams(categoria, newDepartment, newCity, true);
    router.push(newUrl);

    // Resetear la bandera después de un pequeño delay para permitir que la navegación complete
    setTimeout(() => {
      isUpdatingUrlRef.current = false;
    }, 100);
  };

  // Manejar cambio de categoría - mantener filtros
  const handleCategoryChange = (newCategory: string) => {
    console.log('🔄 handleCategoryChange:', { newCategory });

    // Marcar que estamos actualizando la URL
    isUpdatingUrlRef.current = true;

    // Actualizar el estado local primero
    updateFilter('category', newCategory);

    // Construir y navegar a la nueva URL
    const newUrl = buildUrlWithParams(
      newCategory,
      filters.location?.department,
      filters.location?.city,
      true
    );
    router.push(newUrl);

    // Resetear la bandera
    setTimeout(() => {
      isUpdatingUrlRef.current = false;
    }, 100);
  };

  // Obtener información de ubicación desde el backend
  const { data: departments = [] } = useDepartmentsQuery();
  const { data: cities = [] } = useCitiesByDepartmentQuery(departamentoFromUrl || '');

  // Encontrar el label del departamento actual
  const departmentLabel = departamentoFromUrl
    ? departments.find(d => d.value === departamentoFromUrl)?.label
    : undefined;

  // Encontrar el label de la ciudad actual
  const cityLabel = ciudadFromUrl
    ? cities.find(c => c.value === ciudadFromUrl)?.label
    : undefined;

  const locationInfo = (departmentLabel || cityLabel) ? {
    department: departmentLabel,
    city: cityLabel,
  } : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50">
      {/* Header con información de ubicación */}
      <div className="backdrop-blur-sm border-b border-purple-100 dark:border-purple-900 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col gap-4">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Inicio</span>
              {categoria && (
                <>
                  <span>/</span>
                  <span className="capitalize font-medium text-purple-600">{categoria}</span>
                </>
              )}
              {locationInfo?.department && (
                <>
                  <span>/</span>
                  <span className="font-medium text-purple-600">{locationInfo.department}</span>
                </>
              )}
              {locationInfo?.city && (
                <>
                  <span>/</span>
                  <span className="font-medium text-purple-600">{locationInfo.city}</span>
                </>
              )}
              {!categoria && !locationInfo && (
                <>
                  <span>/</span>
                  <span className="font-medium text-purple-600">Todos los perfiles</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Sección de perfiles destacados con los mismos filtros */}
        <FeaturedProfilesSection
          className="mb-8"
          filters={{
            category: filters.category,
            department: filters.location?.department,
            city: filters.location?.city,
            features: normalizeFiltersForQuery().features,
            minPrice: filters.priceRange?.min,
            maxPrice: filters.priceRange?.max,
            identityVerified: filters.verification?.identityVerified,
            hasVideo: filters.verification?.hasVideo,
            documentVerified: filters.verification?.documentVerified,
          }}
        />

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar de filtros - Desktop */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            <Card className="sticky top-32">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-200">Filtros</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearFilters}
                    disabled={isLoadingProfiles}
                    className="text-purple-600 hover:text-purple-700"
                  >
                    {isLoadingProfiles ? 'Cargando...' : 'Restaurar filtros'}
                  </Button>
                </div>

                <div className="space-y-6">
                  <LocationFilter
                    selectedDepartment={departamentoFromUrl}
                    selectedCity={ciudadFromUrl}
                    onLocationChange={handleLocationChange}
                  />

                  <Separator />

                  <AgeFilter
                    ageRange={filters.features?.ageRange}
                    onAgeRangeChange={(range) => handleUpdateFilter('ageRange', range)}
                  />

                  <Separator />

                  <CategoryFilter
                    selectedCategory={filters.category}
                    onCategoryChange={handleCategoryChange}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contenido principal */}
          <div className="flex-1 min-w-0">
            {/* Barra de filtros horizontal */}
            <HorizontalFilterBar
              filters={filters.verification}
              onFiltersChange={updateVerification}
              onClearFilters={handleClearFilters}
              className="mb-4"
            />

            {/* Controles superiores */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              {/* Filtros móviles */}
              <div className="flex items-center gap-3 lg:hidden">
                <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="relative">
                      <Filter className="h-4 w-4 mr-2" />
                      Filtros
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-80 overflow-y-auto max-h-screen">
                    <SheetHeader className="sticky top-0 bg-white dark:bg-gray-900 z-10 pb-2">
                      <SheetTitle>
                        Filtros
                      </SheetTitle>
                    </SheetHeader>

                    {/* Botón restaurar filtros separado del header */}
                    <div className="sticky top-16 bg-white dark:bg-gray-900 z-10 pb-4 pt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClearFilters}
                        disabled={isLoadingProfiles}
                        className="text-purple-600 hover:text-purple-700 w-full"
                      >
                        {isLoadingProfiles ? 'Cargando...' : 'Restaurar filtros'}
                      </Button>
                    </div>

                    <div className="mt-6 space-y-6 pb-20 px-1">
                      <LocationFilter
                        selectedDepartment={departamentoFromUrl}
                        selectedCity={ciudadFromUrl}
                        onLocationChange={handleLocationChange}
                      />

                      <Separator />

                      <CategoryFilter
                        selectedCategory={filters.category}
                        onCategoryChange={handleCategoryChange}
                      />

                      <Separator />

                      <AgeFilter
                        ageRange={filters.features?.ageRange}
                        onAgeRangeChange={(range) => updateFilter('ageRange', range)}
                      />
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>

            {/* Componente de perfiles */}
            <SearchProfilesSSG
              viewMode={viewMode}
              profilesData={currentProfilesData}
              filters={normalizedFiltersForDisplay}
              onPageChange={(page) => {
                // Implementar navegación con parámetros de página si es necesario
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}