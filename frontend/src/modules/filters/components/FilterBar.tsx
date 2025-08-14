'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { CATEGORIES, LOCATIONS } from '@/lib/config';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const FilterBar = () => {
  const router = useRouter();
  const [categoria, setCategoria] = useState('');
  const [departamento, setDepartamento] = useState('');
  const [ciudad, setCiudad] = useState('');

  const handleSearch = () => {
    // Validar que al menos la categoría esté seleccionada
    if (!categoria) {
      alert('Por favor selecciona al menos una categoría para buscar');
      return;
    }

    // Construir la ruta dinámica basada en los parámetros seleccionados
    const segments = [categoria];
    if (departamento) segments.push(departamento);
    if (ciudad && departamento) segments.push(ciudad);
    
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
            <Select value={categoria} onValueChange={setCategoria}>
              <SelectTrigger className="w-full hover:border-purple-500 transition-all duration-200 focus:border-purple-500 focus:shadow-lg focus:shadow-purple-500/10">
                <SelectValue placeholder="Seleccionar categoría" />
              </SelectTrigger>
              <SelectContent>
                 {CATEGORIES.map((category) => (
                   <SelectItem key={category.value} value={category.value}>
                     {category.label}
                   </SelectItem>
                 ))}
               </SelectContent>
            </Select>
          </div>

          {/* Departamento */}
          <div
            className="animate-in slide-in-from-bottom-2"
            style={{ animationDelay: '100ms' }}
          >
            <Select value={departamento} onValueChange={setDepartamento}>
              <SelectTrigger className="w-full hover:border-purple-500 transition-all duration-200 focus:border-purple-500 focus:shadow-lg focus:shadow-purple-500/10">
                <SelectValue placeholder="Seleccionar departamento" />
              </SelectTrigger>
              <SelectContent>
                 {Object.entries(LOCATIONS).map(([key, location]) => (
                   <SelectItem key={key} value={key}>
                     {location.label}
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
            <Select value={ciudad} onValueChange={setCiudad}>
              <SelectTrigger className="w-full hover:border-purple-500 transition-all duration-200 focus:border-purple-500 focus:shadow-lg focus:shadow-purple-500/10">
                <SelectValue placeholder="Seleccionar ciudad" />
              </SelectTrigger>
              <SelectContent>
                 {departamento && LOCATIONS[departamento as keyof typeof LOCATIONS]?.cities.map((city) => (
                   <SelectItem key={city.value} value={city.value}>
                     {city.label}
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
