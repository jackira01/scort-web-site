import { Metadata } from 'next';
import type { ProfilesResponse } from '@/types/profile.types';
import { PAGINATION, API_URL } from '@/lib/config';
import { slugToText } from '@/utils/slug';
import { getDepartmentByNormalized, isValidDepartment as isValidDepartmentLocal, isValidCity as isValidCityLocal } from '@/utils/colombiaData';
import SearchPageClient from './SearchPageClient';

// Forzar renderizado dinámico para evitar DYNAMIC_SERVER_USAGE
export const dynamic = 'force-dynamic';
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
    // Durante el build, evitar llamadas a la API
    if (process.env.NODE_ENV === 'production' && !process.env.VERCEL_URL) {
      return null;
    }
    
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
  try {
    const options = await getFilterOptions();
    if (!options) return true; // Durante build, permitir todas las categorías
    return options.categories.some((cat: any) => cat.value === categoria);
  } catch (error) {
    console.error('Error validating category:', error);
    return true; // Durante build, permitir todas las categorías
  }
}

// Función para validar si un departamento es válido usando datos locales
async function isValidDepartment(departamento: string): Promise<boolean> {
  try {
    // Usar validación local primero (más confiable y rápida)
    const isValidLocal = isValidDepartmentLocal(departamento);
    
    if (isValidLocal) {
      return true;
    }
    
    // Fallback a API solo si es necesario
    const options = await getFilterOptions();
    if (!options) return true; // Durante build, permitir todos los departamentos
    return options.locations?.departments?.includes(departamento) || true;
  } catch (error) {
    console.error('Error validating department via API:', error);
    return true; // Durante build, permitir todos los departamentos
  }
}

// Función para validar si una ciudad es válida usando datos locales
async function isValidCity(ciudad: string, departamento?: string): Promise<boolean> {
  try {
    // Si tenemos el departamento, usar validación local primero
    if (departamento) {
      const isValidLocal = isValidCityLocal(departamento, ciudad);
      if (isValidLocal) {
        return true;
      }
    }
    
    // Fallback a API
    const options = await getFilterOptions();
    if (!options) return true; // Durante build, permitir todas las ciudades
    return options.locations?.cities?.includes(ciudad) || true;
  } catch (error) {
    console.error('Error validating city via API:', error);
    return true; // Durante build, permitir todas las ciudades
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

  // Verificar si es un archivo estático - renderizar contenido por defecto
  if (categoria && (
        categoria.includes('.') || // Archivos con extensión
        categoria.startsWith('_') || // Archivos del sistema Next.js
        categoria === 'favicon.ico' ||
        categoria === 'robots.txt' ||
        categoria === 'sitemap.xml' ||
        categoria.endsWith('.js') ||
        categoria.endsWith('.css') ||
        categoria.endsWith('.map') ||
        categoria.endsWith('.ico') ||
        categoria.endsWith('.png') ||
        categoria.endsWith('.jpg') ||
        categoria.endsWith('.svg')
    )) {
    // Renderizar página por defecto en lugar de notFound
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold">Página no encontrada</h1>
        <p>El recurso solicitado no está disponible.</p>
      </div>
    );
  }

  // Validaciones simplificadas sin verificaciones dinámicas
  if (!categoria) {
    // Missing category parameter
    // Renderizar contenido por defecto en lugar de notFound
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold">Categoría requerida</h1>
        <p>Por favor especifica una categoría válida.</p>
      </div>
    );
  }

  // Validaciones de categoría, departamento y ciudad sin verificaciones dinámicas
  const isValidCat = await isValidCategory(categoria);
  if (!isValidCat) {
    // Invalid category
  }

  if (departamento) {
    const isValidDept = await isValidDepartment(departamento);
    if (!isValidDept) {
      // Invalid department
    }
  }

  if (ciudad) {
    const isValidCit = await isValidCity(ciudad, departamento);
    if (!isValidCit) {
      // Invalid city
    }
  }

  // Obtener datos del servidor con ISR
  let profilesData: ProfilesResponse;
  
  try {
    // Preparar el body para la petición POST directamente
    // Params received: { categoria, departamento, ciudad }
    
    const requestBody: any = {
      page: 1,
      limit: PAGINATION.DEFAULT_LIMIT,
      sortBy: 'createdAt',
      sortOrder: 'desc',
      isActive: true
    };

    if (categoria) {
      // Adding category: slugToText(categoria)
      requestBody.category = slugToText(categoria);
    } else {
      // No category provided
    }
    if (departamento) {
      requestBody.location = { department: slugToText(departamento) };
      if (ciudad) {
        requestBody.location.city = slugToText(ciudad);
      }
    }

    console.log('🔍 [DEBUG] Request body to backend:', JSON.stringify(requestBody, null, 2));

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
    
    console.log('🔍 [DEBUG] Response from backend:', responseData);
    console.log('🔍 [DEBUG] Response success:', responseData.success);
    console.log('🔍 [DEBUG] Response data:', responseData.data);
    
    // Transformar la estructura para que coincida con ProfilesResponse
    if (responseData.success && responseData.data) {
      const backendData = responseData.data;
      console.log('🔍 [DEBUG] Backend profiles count:', backendData.profiles?.length);
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
      
      console.log('🔍 [DEBUG] Final profilesData:', profilesData);
    } else {
      console.log('❌ [ERROR] Backend response not successful:', responseData);
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