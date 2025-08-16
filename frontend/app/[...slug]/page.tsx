import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { ProfilesResponse } from '@/types/profile.types';
import { PAGINATION, API_URL } from '@/lib/config';
import { slugToText } from '@/utils/slug';
import { getDepartmentByNormalized, isValidDepartment as isValidDepartmentLocal, isValidCity as isValidCityLocal } from '@/utils/colombiaData';
import SearchPageClient from './SearchPageClient';

// Permitir rutas dinámicas que no estén pre-generadas
export const dynamicParams = true;

interface SearchPageProps {
  params: Promise<{
    slug: string[];
  }>;
}

// Función para obtener opciones de filtros de la API
async function getFilterOptions() {
  try {
    const res = await fetch(`${API_URL}/api/filters/options`, {
      next: { revalidate: 300 } // Cache por 5 minutos
    });
    if (!res.ok) throw new Error('Failed to fetch filter options');
    const data = await res.json();
    return data.success ? data.data : null;
  } catch (error) {
    console.error('Error fetching filter options:', error);
    return null;
  }
}

// Función para validar si una categoría es válida usando la API
async function isValidCategory(categoria: string): Promise<boolean> {
  const options = await getFilterOptions();
  if (!options) return false;
  return options.categories.some((cat: any) => cat.value === categoria);
}

// Función para validar si un departamento es válido usando datos locales
async function isValidDepartment(departamento: string): Promise<boolean> {
  // Usar validación local primero (más confiable)
  const isValidLocal = isValidDepartmentLocal(departamento);

  
  if (isValidLocal) {
    return true;
  }
  
  // Fallback a API si no está en datos locales
  const options = await getFilterOptions();
  if (!options) return false;
  const isValidAPI = options.locations.departments.includes(departamento);
  
  
  return isValidAPI;
}

// Función para validar si una ciudad es válida usando datos locales
async function isValidCity(ciudad: string): Promise<boolean> {
  // Para validar ciudad necesitamos el departamento, lo obtenemos del contexto
  // Por ahora usamos solo la API ya que necesitamos el contexto del departamento
  const options = await getFilterOptions();
  if (!options) return false;
  const isValidAPI = options.locations.cities.includes(ciudad);
  
  
  return isValidAPI;
}

// Generar metadata dinámico para SEO
export async function generateMetadata({
  params,
}: SearchPageProps): Promise<Metadata> {
  const { slug } = await params;
  const [categoria, departamento, ciudad] = slug || [];
  
  // Validar parámetros
  if (!categoria || !(await isValidCategory(categoria))) {
    return {
      title: 'Página no encontrada',
      description: 'La página que buscas no existe.',
    };
  }

  let pageTitle = '';
  let pageDescription = '';
  let keywords = categoria;

  if (ciudad && departamento) {
    // Ruta completa: /categoria/departamento/ciudad
    const deptLabel = slugToText(departamento);
    const cityLabel = slugToText(ciudad);
    
    pageTitle = `${slugToText(categoria)} en ${cityLabel}, ${deptLabel} - Perfiles Verificados`;
    pageDescription = `Encuentra los mejores perfiles de ${categoria} en ${cityLabel}, ${deptLabel}. Perfiles verificados y actualizados.`;
    keywords = `${categoria}, ${cityLabel}, ${deptLabel}, perfiles, verificados`;
  } else if (departamento) {
    // Ruta parcial: /categoria/departamento
    const deptData = getDepartmentByNormalized(departamento);
    const deptLabel = deptData?.original || departamento;
    
    pageTitle = `${categoria.charAt(0).toUpperCase() + categoria.slice(1)} en ${deptLabel} - Perfiles Verificados`;
    pageDescription = `Encuentra los mejores perfiles de ${categoria} en ${deptLabel}. Perfiles verificados y actualizados.`;
    keywords = `${categoria}, ${deptLabel}, perfiles, verificados`;
  } else {
    // Ruta básica: /categoria
    pageTitle = `${categoria.charAt(0).toUpperCase() + categoria.slice(1)} - Perfiles Verificados`;
    pageDescription = `Encuentra los mejores perfiles de ${categoria}. Perfiles verificados y actualizados en toda Colombia.`;
    keywords = `${categoria}, perfiles, verificados, Colombia`;
  }
  
  return {
    title: pageTitle,
    description: pageDescription,
    keywords,
    openGraph: {
      title: pageTitle,
      description: pageDescription,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description: pageDescription,
    },
  };
}

export default async function SearchPage({ params }: SearchPageProps) {
  const { slug } = await params;
  const [categoria, departamento, ciudad] = slug || [];



  // Validar parámetros obligatorios
  if (!categoria) {

    notFound();
  }

  // Verificar si la categoría es válida
  const isValidCat = await isValidCategory(categoria);

  
  if (!isValidCat) {

    notFound();
  }

  // Validar departamento si está presente
  if (departamento) {
    const isValidDept = await isValidDepartment(departamento);

    if (!isValidDept) {

      notFound();
    }
  }

  // Validar ciudad si está presente
  if (ciudad) {
    const isValidCit = await isValidCity(ciudad);
    
    if (!isValidCit) {
      
      notFound();
    }
  }

  // Obtener datos del servidor con ISR
  let profilesData: ProfilesResponse;
  
  try {
    // Construir URL con parámetros de consulta
    const queryParams = new URLSearchParams();
    // Convertir slug de categoría de vuelta a texto original para la API
    queryParams.append('category', slugToText(categoria));
    queryParams.append('isActive', 'true');
    queryParams.append('page', '1');
    queryParams.append('limit', PAGINATION.DEFAULT_LIMIT.toString());
    queryParams.append('sortBy', 'createdAt');
    queryParams.append('sortOrder', 'desc');

    // Agregar filtros de ubicación si están presentes
    // Convertir slugs de vuelta a texto original para la API
    if (departamento) {
      queryParams.append('location[department]', slugToText(departamento));
    }
    if (ciudad) {
      queryParams.append('location[city]', slugToText(ciudad));
    }

    // Fetch con revalidate para ISR
    const res = await fetch(
      `${API_URL}/api/filters/profiles?${queryParams.toString()}`,
      { next: { revalidate: 60 } }
    );

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const responseData = await res.json();
    
    // Transformar la estructura para que coincida con ProfilesResponse
    if (responseData.success && responseData.data) {
      const backendData = responseData.data;
      profilesData = {
        profiles: backendData.profiles,
        pagination: {
          currentPage: backendData.currentPage,
          totalPages: backendData.totalPages,
          totalProfiles: backendData.totalCount,
          hasNextPage: backendData.hasNextPage,
          hasPrevPage: backendData.hasPrevPage,
        },
      };
    } else {
      throw new Error(responseData.message || 'Error en la respuesta del servidor');
    }
  } catch (error) {
    // Error fetching profiles for SSG
    
    // En caso de error, devolver datos vacíos
    profilesData = {
      profiles: [],
      pagination: {
        currentPage: 1,
        totalPages: 0,
        totalProfiles: 0,
        hasNextPage: false,
        hasPrevPage: false,
      },
    };
  }

  return (
    <SearchPageClient 
      categoria={categoria}
      departamento={departamento}
      ciudad={ciudad}
      profilesData={profilesData}
    />
  );
}

// No pre-generar rutas en build time - se generarán on-demand
export async function generateStaticParams() {
  return [];
}

// Configurar revalidación para ISR (Incremental Static Regeneration)
// Las páginas se regenerarán cada 60 segundos cuando sean solicitadas
export const revalidate = 60;