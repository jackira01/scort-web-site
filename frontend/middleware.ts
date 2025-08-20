import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getAllDepartments } from '@/utils/colombiaData';

// Lista de categorías válidas (debe coincidir con el backend)
const VALID_CATEGORIES = ['escort', 'masajista', 'modelo', 'acompañante'];

// Lista completa de departamentos válidos de Colombia
const VALID_DEPARTMENTS = getAllDepartments().map(dept => dept.value);

// Lista de rutas que NO deben ser procesadas por el sistema de búsqueda
const EXCLUDED_ROUTES = [
  'cuenta', 'perfil', 'autenticacion', 'adminboard', 'api', 
  'buscar', 'faq', 'precios', 'terminos', '_next', 'favicon.ico'
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Solo procesar rutas que coincidan con el patrón de slug dinámico
  const slugMatch = pathname.match(/^\/([^/]+)(?:\/([^/]+))?(?:\/([^/]+))?$/);
  
  if (slugMatch) {
    const [, categoria, departamento, ciudad] = slugMatch;
    
    // Excluir rutas que no son de búsqueda/filtrado
    if (EXCLUDED_ROUTES.includes(categoria)) {
  
      return NextResponse.next();
    }
    
  
    
    // Verificar si es una ruta de categoría válida
    if (categoria && !VALID_CATEGORIES.includes(categoria)) {
  
      
      // Si parece ser un departamento, redirigir a una categoría por defecto
      if (VALID_DEPARTMENTS.includes(categoria)) {
    
        const redirectUrl = new URL(`/escort/${categoria}`, request.url);
        return NextResponse.redirect(redirectUrl);
      }
      
      // Si no es ni categoría ni departamento válido, continuar al 404
  
    }
    
    // Verificar departamento si está presente
    if (departamento && !VALID_DEPARTMENTS.includes(departamento)) {
  
    }
  }
  
  // Continuar con la petición normal
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|images|placeholder).*)',
  ],
};