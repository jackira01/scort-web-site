import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { ProfilesResponse } from '@/types/profile.types';
import { REVALIDATE_TIME, PAGINATION, CATEGORIES, LOCATIONS, API_URL } from '@/lib/config';
import { isValidDepartment, isValidCity, getDepartmentByNormalized, getCityByNormalized } from '@/utils/colombiaData';
import SearchPageClient from './SearchPageClient';

// Permitir rutas dinámicas que no estén pre-generadas
export const dynamicParams = true;

interface SearchPageProps {
  params: {
    slug: string[];
  };
}

// Función para validar si una categoría es válida
function isValidCategory(categoria: string): boolean {
  return CATEGORIES.some(cat => cat.value === categoria);
}

// Las funciones isValidDepartment e isValidCity ahora se importan desde colombiaData

// Generar metadata dinámico para SEO
export async function generateMetadata({
  params,
}: SearchPageProps): Promise<Metadata> {
  const [categoria, departamento, ciudad] = params.slug || [];
  
  // Validar parámetros
  if (!categoria || !isValidCategory(categoria)) {
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
    const deptData = getDepartmentByNormalized(departamento);
    const cityData = getCityByNormalized(departamento, ciudad);
    const deptLabel = deptData?.original || departamento;
    const cityLabel = cityData?.original || ciudad;
    
    pageTitle = `${categoria.charAt(0).toUpperCase() + categoria.slice(1)} en ${cityLabel}, ${deptLabel} - Perfiles Verificados`;
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
  const [categoria, departamento, ciudad] = params.slug || [];

  // Validar parámetros obligatorios
  if (!categoria || !isValidCategory(categoria)) {
    notFound();
  }

  // Validar departamento si está presente
  if (departamento && !isValidDepartment(departamento)) {
    notFound();
  }

  // Validar ciudad si está presente
  if (ciudad && departamento && !isValidCity(departamento, ciudad)) {
    notFound();
  }

  // Obtener datos del servidor con ISR
  let profilesData: ProfilesResponse;
  
  try {
    // Construir URL con parámetros de consulta
    const queryParams = new URLSearchParams();
    queryParams.append('category', categoria);
    queryParams.append('isActive', 'true');
    queryParams.append('page', '1');
    queryParams.append('limit', PAGINATION.DEFAULT_LIMIT.toString());
    queryParams.append('sortBy', 'createdAt');
    queryParams.append('sortOrder', 'desc');

    // Agregar filtros de ubicación si están presentes
    if (departamento) {
      queryParams.append('location[department]', departamento);
    }
    if (ciudad) {
      queryParams.append('location[city]', ciudad);
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
    console.error('Error fetching profiles for SSG:', error);
    
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