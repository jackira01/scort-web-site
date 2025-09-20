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

// Rutas que requieren que el usuario tenga contraseña configurada
const PASSWORD_REQUIRED_ROUTES = [
  '/cuenta/crear-perfil',
  '/cuenta/configuracion',
  '/cuenta/facturacion',
  '/cuenta/suscripcion',
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

  // ===== CONFIGURACIÓN DE HEADERS DE SEGURIDAD =====
  const response = NextResponse.next();

  // Content Security Policy
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self' http://localhost:5000; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://accounts.google.com https://apis.google.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' http://localhost:5000; frame-src 'self' https://accounts.google.com;"
  );

  // ===== AUTENTICACIÓN ACTIVADA =====
  // Rate limiting para rutas protegidas
  if (PROTECTED_ROUTES.some(route => pathname.startsWith(route))) {
    const rateLimitResult = await checkRateLimit(request);
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult);
    }
  }

  // Obtener token JWT
  const token = await getToken({ 
    req: request, 
    secret: process.env.AUTH_SECRET 
  });

  // Verificar si la ruta requiere autenticación
  const requiresAuth = AUTH_REQUIRED_ROUTES.some(route => pathname.startsWith(route));
  
  if (requiresAuth) {
    if (!token) {
      // Redirigir a la ruta raíz para rutas protegidas sin sesión
      const homeUrl = new URL('/', request.url);
      return NextResponse.redirect(homeUrl);
    }
  }

  // ===== PROTECCIÓN ESPECÍFICA PARA POST-REGISTER =====
  if (pathname === '/autenticacion/post-register') {
    console.log('🔍 Middleware - Verificando acceso a post-register:', {
      timestamp: new Date().toISOString(),
      hasToken: !!token,
      tokenHasPassword: token?.hasPassword,
      tokenHasPasswordType: typeof token?.hasPassword
    });

    if (!token) {
      // Usuario no autenticado, redirigir al login
      console.log('🚫 Middleware - Usuario no autenticado intentando acceder a post-register, redirigiendo a login');
      const loginUrl = new URL('/autenticacion/ingresar', request.url);
      return NextResponse.redirect(loginUrl);
    }
    
    if (token.hasPassword === true) {
      // Usuario ya tiene contraseña, redirigir al home
      console.log('🔒 Middleware - Usuario con contraseña intentando acceder a post-register:', {
        timestamp: new Date().toISOString(),
        hasPassword: token.hasPassword,
        type: typeof token.hasPassword,
        userId: token.id,
        email: token.email
      });
      console.log('🚀 Middleware - Redirigiendo a home desde post-register');
      const homeUrl = new URL('/', request.url);
      return NextResponse.redirect(homeUrl);
    }
    
    console.log('✅ Middleware - Usuario sin contraseña puede acceder a post-register:', {
      timestamp: new Date().toISOString(),
      hasPassword: token.hasPassword,
      type: typeof token.hasPassword,
      userId: token.id
    });
  }

  // Verificar si el usuario está en una ruta que requiere password
  if (PASSWORD_REQUIRED_ROUTES.some(route => pathname.startsWith(route))) {
    if (!token?.hasPassword) {
      // Redirigir a post-register si no tiene password
      const postRegisterUrl = new URL('/auth/post-register', request.url);
      return NextResponse.redirect(postRegisterUrl);
    }
  }

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

  // Headers de seguridad adicionales
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin');
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self' http://localhost:5000; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://accounts.google.com https://apis.google.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' http://localhost:5000; frame-src 'self' https://accounts.google.com;"
  );

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
     * - robots.txt, sitemap.xml (SEO files)
     * - images (static images)
     * - placeholder files
     * - autenticacion (auth pages)
     * - perfil, adminboard (protected pages)
     * - buscar, faq, precios, etc. (static pages)
     * - file extensions (.js, .css, .map, etc.)
     * - installHook
     */
    '/((?!api/auth|_next/static|_next/image|favicon\.ico|robots\.txt|sitemap\.xml|images|placeholder|autenticacion|perfil|adminboard|buscar|faq|precios|terminos|terms|blog|plans|.*\.js\.map$|.*\.css\.map$|.*\.js$|.*\.css$|.*\.ico$|.*\.png$|.*\.jpg$|.*\.jpeg$|.*\.svg$|.*\.gif$|.*\.webp$|installHook).*)',
  ],
};