import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { checkRateLimit, createRateLimitResponse } from '@/lib/rate-limit';
import { getToken } from 'next-auth/jwt';

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

// ===== CONFIGURACIÓN DE AUTENTICACIÓN =====
// Rutas protegidas por rate limiting
const PROTECTED_ROUTES = [
  '/api/auth/signin',
  '/api/auth/callback/credentials',
  '/api/auth/register',
];

// Rutas que requieren autenticación
const AUTH_REQUIRED_ROUTES = [
  '/dashboard',
  '/profile',
  '/settings',
  '/cuenta',
  '/perfil',
  '/adminboard',
];

// Rutas que deben ser accesibles sin contraseña configurada
const ALLOWED_WITHOUT_PASSWORD = [
  '/autenticacion/post-register',
  '/autenticacion/ingresar',
  '/autenticacion/registrarse',
  '/api/auth',
  '/_next',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  console.log('🔍 [MIDDLEWARE] Procesando ruta:', pathname);

  // ===== CONFIGURACIÓN DE HEADERS DE SEGURIDAD =====
  const response = NextResponse.next();
  
  // Content Security Policy
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self' http://localhost:5000; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://accounts.google.com https://apis.google.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' http://localhost:5000; frame-src 'self' https://accounts.google.com;"
  );
  
  // ===== AUTENTICACIÓN DESHABILITADA TEMPORALMENTE =====
  // TODO: Reactivar cuando se resuelvan los problemas de build
  /*
  // Rate limiting para rutas protegidas
  if (PROTECTED_ROUTES.some(route => pathname.startsWith(route))) {
    console.log('🔍 [MIDDLEWARE] Aplicando rate limiting...');
    const rateLimitResult = await checkRateLimit(request);
    if (!rateLimitResult.success) {
      console.log('⚠️ [MIDDLEWARE] Rate limit excedido');
      return createRateLimitResponse(rateLimitResult);
    }
  }

  // Obtener token JWT
  console.log('🔍 [MIDDLEWARE] Obteniendo token JWT...');
  const token = await getToken({ 
    req: request, 
    secret: process.env.NEXTAUTH_SECRET 
  });

  console.log('🔍 [MIDDLEWARE] Token obtenido:', {
    exists: !!token,
    userId: token?.userId,
    email: token?.email,
    provider: token?.provider,
    password: token?.password ? `[${typeof token.password}] ${typeof token.password === 'string' && token.password.length > 0 ? 'NO_EMPTY' : 'EMPTY'}` : 'undefined',
    action: token?.action
  });

  // Log completo del token para debugging
  if (token) {
    console.log('🔍 [MIDDLEWARE] TOKEN COMPLETO PARA DEBUG:', JSON.stringify({
      userId: token.userId,
      email: token.email,
      provider: token.provider,
      password: token.password,
      action: token.action,
      iat: token.iat,
      exp: token.exp,
      jti: token.jti
    }, null, 2));
  }

  // Verificar si la ruta requiere autenticación
  const requiresAuth = AUTH_REQUIRED_ROUTES.some(route => pathname.startsWith(route));
  
  if (requiresAuth) {
    console.log('🔍 [MIDDLEWARE] Ruta requiere autenticación');
    
    if (!token) {
      console.log('❌ [MIDDLEWARE] No hay token, redirigiendo a login');
      const loginUrl = new URL('/autenticacion/ingresar', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
    
    console.log('✅ [MIDDLEWARE] Token válido, acceso permitido');
  }
  */

  // ===== LÓGICA DE RUTAS DINÁMICAS (ORIGINAL) =====

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
  console.log('🔍 [MIDDLEWARE] ===== RESUMEN FINAL =====');
  console.log('🔍 [MIDDLEWARE] Ruta procesada:', pathname);
  console.log('🔍 [MIDDLEWARE] Era ruta protegida:', AUTH_REQUIRED_ROUTES.some(route => pathname.startsWith(route)));
  console.log('🔍 [MIDDLEWARE] ================================');
  
  // Headers de seguridad adicionales
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin');
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self' http://localhost:5000; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://accounts.google.com https://apis.google.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' http://localhost:5000; frame-src 'self' https://accounts.google.com;"
  );

  console.log('✅ [MIDDLEWARE] Procesamiento completado (autenticación deshabilitada), continuando con la request');
  return response;
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
     * - specific app routes that have their own pages (but NOT cuenta - we need auth there)
     */
    '/((?!api|_next/static|_next/image|favicon\.ico|robots\.txt|sitemap\.xml|images|placeholder|autenticacion|perfil|adminboard|buscar|faq|precios|terminos|terms|blog|plans|.*\.js\.map$|.*\.css\.map$|.*\.js$|.*\.css$|.*\.ico$|.*\.png$|.*\.jpg$|.*\.jpeg$|.*\.svg$|.*\.gif$|.*\.webp$|installHook).*)',
  ],
};