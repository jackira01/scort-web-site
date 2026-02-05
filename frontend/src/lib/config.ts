// Configuración centralizada para URLs y constantes

// URL del API - funciona tanto en cliente como en servidor
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

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
  { value: 'escort', label: 'Scort' },
  { value: 'masajista', label: 'Masajista' },
  { value: 'modelo', label: 'Modelo' },
  { value: 'acompanante', label: 'Acompañante' },
];

// NOTA: Las ubicaciones ahora se obtienen dinámicamente del backend
// Mantener LOCATIONS como objeto vacío para compatibilidad con código legacy
export const LOCATIONS: Record<string, { label: string; cities: { value: string; label: string }[] }> = {};

// Rutas populares para pre-generación
// NOTA: Estas rutas se generarán dinámicamente en runtime usando datos del backend
export const POPULAR_ROUTES = [
  { categoria: 'escort', departamento: 'bogota', ciudad: 'chapinero' },
  { categoria: 'escort', departamento: 'antioquia', ciudad: 'medellin' },
  { categoria: 'escort', departamento: 'valle-del-cauca', ciudad: 'cali' },
  { categoria: 'masajista', departamento: 'bogota', ciudad: 'usaquen' },
  { categoria: 'modelo', departamento: 'bogota', ciudad: 'chapinero' },
  { categoria: 'acompañante', departamento: 'bogota', ciudad: 'chapinero' },
];

// Rutas adicionales para pre-generación (solo categoría)
export const ADDITIONAL_ROUTES = {
  // Rutas de solo categoría
  categories: CATEGORIES.map(cat => ({ categoria: cat.value })),
  // Las rutas de categoría + departamento se generarán dinámicamente
  categoryDepartments: [],
};