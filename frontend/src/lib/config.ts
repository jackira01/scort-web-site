// Configuración centralizada para URLs y constantes

// URL del API - funciona tanto en cliente como en servidor
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// URL base para rutas internas
export const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

// Configuración de revalidación para SSG
export const REVALIDATE_TIME = {
  PROFILES: 3600, // 1 hora
  CATEGORIES: 86400, // 24 horas
  LOCATIONS: 86400, // 24 horas
};

// Configuración de paginación
export const PAGINATION = {
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
};

// Categorías disponibles
export const CATEGORIES = [
  { value: 'escort', label: 'Escorts' },
  { value: 'masajes', label: 'Masajes' },
  { value: 'trans', label: 'Trans' },
  { value: 'maduras', label: 'Maduras' },
];

import { getAllDepartments, getCitiesByDepartment } from '@/utils/colombiaData';

// Convertir datos de Colombia al formato esperado por la aplicación
function createLocationsFromColombiaData() {
  const locations: Record<string, { label: string; cities: { value: string; label: string }[] }> = {};
  
  getAllDepartments().forEach(department => {
    locations[department.value] = {
      label: department.label,
      cities: getCitiesByDepartment(department.value)
    };
  });
  
  return locations;
}

// Departamentos y ciudades generados automáticamente desde colombiaData
export const LOCATIONS = createLocationsFromColombiaData();

// Rutas populares para pre-generación
export const POPULAR_ROUTES = [
  { categoria: 'escort', departamento: 'bogota', ciudad: 'chapinero' },
  { categoria: 'escort', departamento: 'medellin', ciudad: 'el-poblado' },
  { categoria: 'escort', departamento: 'cali', ciudad: 'cali-aguacatal' },
  { categoria: 'masajes', departamento: 'bogota', ciudad: 'usaquen' },
  { categoria: 'masajes', departamento: 'medellin', ciudad: 'laureles' },
  { categoria: 'trans', departamento: 'bogota', ciudad: 'chapinero' },
];

// Rutas adicionales para pre-generación (solo categoría y categoría + departamento)
export const ADDITIONAL_ROUTES = {
  // Rutas de solo categoría
  categories: CATEGORIES.map(cat => ({ categoria: cat.value })),
  // Rutas de categoría + departamento
  categoryDepartments: CATEGORIES.flatMap(cat => 
    Object.keys(LOCATIONS).map(dept => ({
      categoria: cat.value,
      departamento: dept
    }))
  ),
};