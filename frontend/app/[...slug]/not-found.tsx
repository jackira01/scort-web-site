'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Home, Search, ArrowRight } from 'lucide-react';
import { useFilterOptions } from '@/hooks/use-filter-options';
import { createSlug } from '@/utils/slug';

export default function NotFound() {
  const router = useRouter();
  const pathname = usePathname();
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const { data: filterOptions } = useFilterOptions();

  useEffect(() => {
    if (filterOptions && pathname) {
      const pathSegments = pathname.split('/').filter(Boolean);
      const firstSegment = pathSegments[0];

      // Generar sugerencias basadas en el primer segmento
      const newSuggestions: string[] = [];

      // Si el primer segmento parece ser un departamento, sugerir rutas con categorías
      const isDepartment = filterOptions.locations.departments.some(dept =>
        createSlug(dept) === firstSegment
      );

      if (isDepartment && filterOptions.categories.length > 0) {
        // Sugerir categorías populares con este departamento
        const popularCategories = ['escort', 'masajista', 'modelo'];
        popularCategories.forEach(cat => {
          const categoryExists = filterOptions.categories.some(c => c.value === cat);
          if (categoryExists) {
            newSuggestions.push(`/${cat}/${firstSegment}`);
          }
        });
      } else {
        // Sugerir categorías populares
        const popularCategories = ['escort', 'masajista', 'modelo', 'acompañante'];
        popularCategories.forEach(cat => {
          const categoryExists = filterOptions.categories.some(c => c.value === cat);
          if (categoryExists) {
            newSuggestions.push(`/${cat}`);
          }
        });
      }

      setSuggestions(newSuggestions.slice(0, 4)); // Máximo 4 sugerencias
    }
  }, [filterOptions, pathname]);

  const handleSuggestionClick = (suggestion: string) => {
    router.push(suggestion);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mb-4">
            <Search className="w-8 h-8 text-pink-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Página no encontrada
          </CardTitle>
          <CardDescription className="text-lg text-gray-600">
            La ruta que buscas no existe o no es válida.
            {pathname && (
              <span className="block mt-2 font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                Ruta solicitada: {pathname}
              </span>
            )}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {suggestions.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                ¿Quizás buscabas alguna de estas opciones?
              </h3>
              <div className="grid gap-2">
                {suggestions.map((suggestion, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="justify-between h-auto p-4 text-left"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    <span className="font-medium">{suggestion}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => router.push('/')}
              className="flex-1"
            >
              <Home className="w-4 h-4 mr-2" />
              Ir al inicio
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/buscar')}
              className="flex-1"
            >
              <Search className="w-4 h-4 mr-2" />
              Buscar perfiles
            </Button>
          </div>

          <div className="text-center text-sm text-gray-500">
            <p>Las rutas válidas siguen el formato:</p>
            <code className="bg-gray-100 px-2 py-1 rounded text-xs">
              /categoria/departamento/ciudad
            </code>
            <p className="mt-1">Ejemplo: /escort/bogota/chapinero</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}