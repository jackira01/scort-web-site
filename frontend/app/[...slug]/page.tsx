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
  // Usar validación local primero (más confiable y rápida)
  const isValidLocal = isValidDepartmentLocal(departamento);
  
  if (isValidLocal) {
    return true;
  }
  
  // Fallback a API solo si es necesario
  try {
    const options = await getFilterOptions();
    if (!options) return false;
    return options.locations.departments.includes(departamento);
  } catch (error) {
    console.error('Error validating department via API:', error);
    return false;
  }
}

// Función para validar si una ciudad es válida usando datos locales
async function isValidCity(ciudad: string, departamento?: string): Promise<boolean> {
  // Si tenemos el departamento, usar validación local primero
  if (departamento) {
    const isValidLocal = isValidCityLocal(departamento, ciudad);
    if (isValidLocal) {
      return true;
    }
  }
  
  // Fallback a API
  try {
    const options = await getFilterOptions();
    if (!options) return false;
    return options.locations.cities.includes(ciudad);
  } catch (error) {
    console.error('Error validating city via API:', error);
    return false;
  }
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
    console.log('❌ [VALIDATION] Missing category parameter');
    notFound();
  }

  // Verificar si la categoría es válida
  const isValidCat = await isValidCategory(categoria);
  
  if (!isValidCat) {
    console.log(`❌ [VALIDATION] Invalid category: ${categoria}`);
    notFound();
  }

  // Validar departamento si está presente
  if (departamento) {
    const isValidDept = await isValidDepartment(departamento);

    if (!isValidDept) {
      console.log(`❌ [VALIDATION] Invalid department: ${departamento}`);
      notFound();
    }
  }

  // Validar ciudad si está presente (necesita departamento para validación local)
  if (ciudad) {
    const isValidCit = await isValidCity(ciudad, departamento);
    
    if (!isValidCit) {
      console.log(`❌ [VALIDATION] Invalid city: ${ciudad} in department: ${departamento}`);
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

    // Preparar el body para la petición POST
    const requestBody: any = {
      page: parseInt(queryParams.get('page') || '1'),
      limit: parseInt(queryParams.get('limit') || '20')
    };

    if (categoria) requestBody.category = categoria;
    if (departamento) {
      requestBody.location = { department: slugToText(departamento) };
      if (ciudad) {
        requestBody.location.city = slugToText(ciudad);
      }
    }

    // Fetch con revalidate para ISR usando POST
    const res = await fetch(
      `${API_URL}/api/filters/profiles`,
      { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody),
        next: { revalidate: 3600 } // 1 hora
      }
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
    console.error('❌ [ERROR] Failed to fetch profiles for ISR:', error);
    
    // En caso de error, devolver datos vacíos para evitar crash
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
// Las páginas se regenerarán cada hora cuando sean solicitadas
export const revalidate = 3600; // 1 hora