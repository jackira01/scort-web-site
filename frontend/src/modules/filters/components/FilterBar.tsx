'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { useFilterOptions } from '@/hooks/use-filter-options';
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

const FilterBar = () => {
  const router = useRouter();
  const [categoria, setCategoria] = useState('');
  const [departamento, setDepartamento] = useState('');
  const [ciudad, setCiudad] = useState('');
  
  // Función para manejar cambio de departamento
  const handleDepartmentChange = (value: string) => {
    setDepartamento(value);
    // Limpiar ciudad cuando se cambie el departamento
    setCiudad('');
  };
  
  // Obtener opciones de filtros de la API
  const { data: filterOptions, loading: optionsLoading, error: optionsError } = useFilterOptions();
  


  const handleSearch = () => {
    // Validar que al menos la categoría esté seleccionada
    if (!categoria) {
      alert('Por favor selecciona al menos una categoría para buscar');
      return;
    }

    // Construir la ruta dinámica basada en los parámetros seleccionados
    // Convertir los nombres de la API a slugs amigables para URLs
    const segments = [createSlug(categoria)];
    if (departamento) segments.push(createSlug(typeof departamento === 'string' ? departamento : departamento.value || departamento.label));
    if (ciudad && departamento) segments.push(createSlug(typeof ciudad === 'string' ? ciudad : ciudad.value || ciudad.label));
    

    
    // Navegar a la nueva ruta dinámica
    router.push(`/${segments.join('/')}`);
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
            {optionsLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : optionsError || !filterOptions?.categories ? (
              <Select disabled>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Error al cargar categorías" />
                </SelectTrigger>
              </Select>
            ) : (
              <Select value={categoria} onValueChange={setCategoria}>
                <SelectTrigger className="w-full hover:border-purple-500 transition-all duration-200 focus:border-purple-500 focus:shadow-lg focus:shadow-purple-500/10">
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  {filterOptions.categories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Departamento */}
          <div
            className="animate-in slide-in-from-bottom-2"
            style={{ animationDelay: '100ms' }}
          >
            <Select value={departamento} onValueChange={handleDepartmentChange}>
              <SelectTrigger className="w-full hover:border-purple-500 transition-all duration-200 focus:border-purple-500 focus:shadow-lg focus:shadow-purple-500/10">
                <SelectValue placeholder="Seleccionar departamento" />
              </SelectTrigger>
              <SelectContent>
                 {filterOptions?.locations?.departments?.map((department) => (
                   <SelectItem key={typeof department === 'string' ? department : department.value} value={typeof department === 'string' ? department : department.value}>
                     {typeof department === 'string' ? department : department.label}
                   </SelectItem>
                 ))}
               </SelectContent>
            </Select>
          </div>

          {/* Ciudad */}
          <div
            className="animate-in slide-in-from-bottom-2"
            style={{ animationDelay: '200ms' }}
          >
            <Select value={ciudad} onValueChange={setCiudad} disabled={!departamento}>
              <SelectTrigger className="w-full hover:border-purple-500 transition-all duration-200 focus:border-purple-500 focus:shadow-lg focus:shadow-purple-500/10">
                <SelectValue placeholder="Seleccionar ciudad" />
              </SelectTrigger>
              <SelectContent>
                 {filterOptions?.locations?.cities?.map((city) => (
                   <SelectItem key={typeof city === 'string' ? city : city.value} value={typeof city === 'string' ? city : city.value}>
                     {typeof city === 'string' ? city : city.label}
                   </SelectItem>
                 ))}
               </SelectContent>
            </Select>
          </div>

          {/* Botón Buscar */}
          <div
            className="animate-in slide-in-from-bottom-2"
            style={{ animationDelay: '300ms' }}
          >
            <Button
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
              onClick={handleSearch}
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
