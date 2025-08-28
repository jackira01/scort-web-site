'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Filter, Grid, List, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import SearchProfilesSSG from '@/modules/catalogs/components/SearchProfilesSSG';
import SponsoredProfilesCarousel from '@/components/sponsored/SponsoredProfilesCarousel';
import AgeFilter from '@/modules/filters/components/AgeFilter';
import FilterToglles from '@/modules/filters/components/FilterToglles';
import GenderFilter from '@/modules/filters/components/GenderFilter';
import CategoryFilter from '@/modules/filters/components/CategoryFilter';
import SexFilter from '@/modules/filters/components/SexFilter';
import LocationFilter from '@/modules/filters/components/LocationFIlter';
import { useSearchFilters } from '@/hooks/use-search-filters';
import type { ProfilesResponse } from '@/types/profile.types';
import { LOCATIONS } from '@/lib/config';

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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filtersOpen, setFiltersOpen] = useState(false);
  
  // Hook para manejar filtros (mantenemos la funcionalidad existente)
  const initialFilters = {
    category: categoria,
    location: {
      department: departamento,
      city: ciudad,
    },
  };
  

  
  const {
    filters,
    updateFilter,
    clearFilters,
    activeFiltersCount,
  } = useSearchFilters(initialFilters);
  

  

  

  
  // Función wrapper para limpiar filtros
  const handleClearFilters = () => {
    clearFilters();
  };
  
  // Función wrapper para actualizar filtros
  const handleUpdateFilter = (key: string, value: any) => {
    updateFilter(key, value);
  };

  // Función para construir la URL basada en los parámetros
  const buildUrl = (cat: string, dept?: string, city?: string) => {
    const segments = [cat];
    if (dept) segments.push(dept);
    if (city) segments.push(city);
    return `/${segments.join('/')}`;
  };

  // Manejar cambio de ubicación
  const handleLocationChange = (newDepartment?: string, newCity?: string) => {
    const newUrl = buildUrl(categoria, newDepartment, newCity);
    router.push(newUrl);
  };

  // Manejar cambio de categoría
  const handleCategoryChange = (newCategory: string) => {
    const newUrl = buildUrl(newCategory, departamento, ciudad);
    router.push(newUrl);
  };

  // Obtener información de ubicación para mostrar
  const getLocationInfo = () => {
    if (!departamento) return null;
    
    const deptInfo = LOCATIONS[departamento as keyof typeof LOCATIONS];
    if (!deptInfo) return null;

    const cityInfo = ciudad ? deptInfo.cities.find(c => c.value === ciudad) : null;
    
    return {
      department: deptInfo.label,
      city: cityInfo?.label,
    };
  };

  const locationInfo = getLocationInfo();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50">
      {/* Header con información de ubicación */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-purple-100 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col gap-4">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Inicio</span>
              <span>/</span>
              <span className="capitalize font-medium text-purple-600">{categoria}</span>
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
            </div>

            {/* Título principal */}
            <div className="flex flex-col gap-2">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                <span className="capitalize">{categoria}</span>
                {locationInfo?.city && locationInfo?.department && (
                  <span> en {locationInfo.city}, {locationInfo.department}</span>
                )}
                {locationInfo?.department && !locationInfo?.city && (
                  <span> en {locationInfo.department}</span>
                )}
              </h1>
              
              {profilesData.pagination.totalProfiles > 0 && (
                <p className="text-gray-600">
                  {profilesData.pagination.totalProfiles} perfiles encontrados
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar de filtros - Desktop */}
          <div className="hidden lg:block w-80 flex-shrink-0">
            <Card className="sticky top-32">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">Filtros</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearFilters}
                    className="text-purple-600 hover:text-purple-700"
                  >
                    Restaurar filtros
                  </Button>
                </div>

                <div className="space-y-6">
                  <LocationFilter
                    selectedDepartment={departamento}
                    selectedCity={ciudad}
                    onLocationChange={handleLocationChange}
                  />
                  
                  <Separator />
                  
                  <CategoryFilter
                    selectedCategory={filters.category}
                    onCategoryChange={(category) => handleUpdateFilter('category', category)}
                  />
                  
                  <Separator />
                  
                  <GenderFilter
                    selectedGender={filters.features?.gender}
                    onGenderChange={(gender) => handleUpdateFilter('gender', gender)}
                  />
                  
                  <Separator />
                  
                  <SexFilter
                    selectedSex={filters.features?.sex}
                    onSexChange={(sex) => handleUpdateFilter('sex', sex)}
                  />
                  
                  <Separator />
                  
                  <AgeFilter
                    ageRange={filters.features?.ageRange}
                    onAgeRangeChange={(range) => handleUpdateFilter('ageRange', range)}
                  />
                  
                  <Separator />
                  
                  <FilterToglles
                    filters={{
                      verified: filters.isVerified,
                      video: filters.hasVideos,
                      destacado: filters.hasDestacadoUpgrade,
                    }}
                    onFilterChange={handleUpdateFilter}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contenido principal */}
          <div className="flex-1 min-w-0">
            {/* Controles superiores */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              {/* Filtros móviles */}
              <div className="flex items-center gap-3 lg:hidden">
                <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="relative">
                      <Filter className="h-4 w-4 mr-2" />
                      Filtros
                      {activeFiltersCount > 0 && (
                        <Badge 
                          variant="secondary" 
                          className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs bg-purple-100 text-purple-700"
                        >
                          {activeFiltersCount}
                        </Badge>
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-80 overflow-y-auto max-h-screen">
                    <SheetHeader className="sticky top-0 bg-white z-10 pb-4">
                      <SheetTitle className="flex items-center justify-between">
                        Filtros
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleClearFilters}
                          className="text-purple-600 hover:text-purple-700"
                        >
                          Restaurar filtros
                        </Button>
                      </SheetTitle>
                    </SheetHeader>
                    
                    <div className="mt-6 space-y-6 pb-20 px-1">
                      <LocationFilter
                        selectedDepartment={departamento}
                        selectedCity={ciudad}
                        onLocationChange={handleLocationChange}
                      />
                      
                      <Separator />
                      
                      <CategoryFilter
                        selectedCategory={filters.category}
                        onCategoryChange={(category) => updateFilter('category', category)}
                      />
                      
                      <Separator />
                      
                      <GenderFilter
                        selectedGender={filters.features?.gender}
                        onGenderChange={(gender) => updateFilter('gender', gender)}
                      />
                      
                      <Separator />
                      
                      <SexFilter
                        selectedSex={filters.features?.sex}
                        onSexChange={(sex) => updateFilter('sex', sex)}
                      />
                      
                      <Separator />
                      
                      <AgeFilter
                         ageRange={filters.features?.ageRange}
                         onAgeRangeChange={(range) => updateFilter('ageRange', range)}
                       />
                       
                       <Separator />
                       
                       <FilterToglles
                         filters={{
                           verified: filters.isVerified,
                           video: filters.hasVideos,
                           destacado: filters.hasDestacadoUpgrade,
                         }}
                         onFilterChange={handleUpdateFilter}
                       />
                    </div>
                  </SheetContent>
                </Sheet>
              </div>

              {/* Controles de vista */}
              <div className="flex items-center gap-2">
                <Select value={viewMode} onValueChange={(value: 'grid' | 'list') => setViewMode(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grid">
                      <div className="flex items-center gap-2">
                        <Grid className="h-4 w-4" />
                        Cuadrícula
                      </div>
                    </SelectItem>
                    <SelectItem value="list">
                      <div className="flex items-center gap-2">
                        <List className="h-4 w-4" />
                        Lista
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Carrusel de perfiles destacados */}
            <SponsoredProfilesCarousel className="mb-8" />

            {/* Componente de perfiles */}
            <SearchProfilesSSG
              viewMode={viewMode}
              profilesData={profilesData}
              filters={filters}
              onPageChange={(page) => {
                // Aquí podrías implementar navegación con parámetros de página
                // Por ahora mantenemos la funcionalidad básica
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}