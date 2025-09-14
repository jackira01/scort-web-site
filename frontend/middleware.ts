import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Lista de categorías válidas (debe coincidir con el backend)
const VALID_CATEGORIES = ['escort', 'masajista', 'modelo', 'acompañante'];

// Lista hardcodeada de departamentos para evitar problemas en build
const VALID_DEPARTMENTS = [
  'bogota', 'medellin', 'cali', 'barranquilla', 'cartagena', 'cucuta', 'bucaramanga',
  'pereira', 'santa-marta', 'ibague', 'pasto', 'manizales', 'neiva', 'villavicencio',
  'armenia', 'valledupar', 'monteria', 'sincelejo', 'popayan', 'buenaventura',
  'palmira', 'floridablanca', 'soledad', 'malambo', 'bello', 'itagui', 'envigado',
  'soacha', 'dosquebradas', 'giron', 'tunja', 'florencia', 'riohacha', 'quibdo',
  'yopal', 'mocoa', 'leticia', 'inirida', 'san-jose-del-guaviare', 'mitu',
  'puerto-carreno', 'arauca', 'casanare', 'vichada', 'guainia', 'guaviare',
  'vaupes', 'amazonas', 'antioquia', 'atlantico', 'bolivar', 'boyaca', 'caldas',
  'caqueta', 'cauca', 'cesar', 'choco', 'cordoba', 'cundinamarca', 'huila',
  'la-guajira', 'magdalena', 'meta', 'narino', 'norte-de-santander', 'putumayo',
  'quindio', 'risaralda', 'san-andres-y-providencia', 'santander', 'sucre',
  'tolima', 'valle-del-cauca'
];

// Lista de rutas que NO deben ser procesadas por el sistema de búsqueda
const EXCLUDED_ROUTES = [
  'cuenta', 'perfil', 'autenticacion', 'adminboard', 'api',
  'buscar', 'faq', 'precios', 'terminos', 'terms', 'blog', 'plans',
  '_next', 'favicon.ico', 'robots.txt', 'sitemap.xml', 'images', 
  'placeholder-logo.png', 'placeholder-logo.svg', 'placeholder-user.jpg', 
  'placeholder.jpg', 'placeholder.svg', 'installHook.js.map', 'installHook'
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Excluir archivos estáticos y rutas especiales inmediatamente
  if (pathname.includes('.') || 
      pathname.startsWith('/_next/') || 
      pathname.startsWith('/api/') ||
      pathname === '/favicon.ico' ||
      pathname === '/robots.txt' ||
      pathname === '/sitemap.xml' ||
      pathname.includes('installHook') ||
      pathname.endsWith('.js') ||
      pathname.endsWith('.css') ||
      pathname.endsWith('.map') ||
      pathname.endsWith('.ico') ||
      pathname.endsWith('.png') ||
      pathname.endsWith('.jpg') ||
      pathname.endsWith('.svg')
  ) {
    return NextResponse.next();
  }

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
      return NextResponse.next();
    }

    // Verificar departamento si está presente
    if (departamento && !VALID_DEPARTMENTS.includes(departamento)) {
      return NextResponse.next();
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
     * - .js.map files (source maps)
     * - other static assets
     * - specific app routes that have their own pages
     */
    '/((?!api|_next/static|_next/image|favicon\.ico|robots\.txt|sitemap\.xml|images|placeholder|autenticacion|cuenta|perfil|adminboard|buscar|faq|precios|terminos|terms|blog|plans|.*\.js\.map$|.*\.css\.map$|.*\.js$|.*\.css$|.*\.ico$|.*\.png$|.*\.jpg$|.*\.jpeg$|.*\.svg$|.*\.gif$|.*\.webp$|installHook).*)',
  ],
};