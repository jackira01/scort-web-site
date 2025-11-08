# Frontend Documentation - Scort Web Site

## Descripción General

Aplicación web Next.js 14 con App Router que implementa un sistema de perfiles con filtros avanzados, rutas dinámicas SEO-optimizadas y Static Site Generation (SSG).

## Tecnologías Principales

- **Next.js 14** - Framework React con App Router
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Framework de estilos
- **Shadcn/ui** - Componentes UI
- **React Query** - Gestión de estado del servidor
- **Zustand** - Gestión de estado global

## Configuración e Instalación

### Requisitos
- Node.js 18+
- npm o pnpm

### Instalación
```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local

# Desarrollo
npm run dev

# Construcción
npm run build

# Producción
npm start
```

### Variables de Entorno
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Estructura del Proyecto

```
frontend/
├── app/                    # App Router (Next.js 14)
│   ├── [...slug]/         # Rutas dinámicas catch-all
│   ├── [categoria]/       # Rutas de categoría (legacy)
│   ├── adminboard/        # Panel de administración
│   ├── api/               # API routes
│   ├── autenticacion/     # Páginas de auth
│   ├── buscar/            # Página de búsqueda (migrada)
│   ├── cuenta/            # Cuenta de usuario
│   ├── perfil/            # Gestión de perfiles
│   ├── layout.tsx         # Layout principal
│   └── page.tsx           # Página de inicio
├── src/
│   ├── components/        # Componentes reutilizables
│   ├── config/            # Configuraciones
│   ├── hooks/             # Custom hooks
│   ├── lib/               # Utilidades y configuraciones
│   ├── modules/           # Módulos de la aplicación
│   ├── services/          # Servicios API
│   ├── styles/            # Estilos globales
│   ├── types/             # Definiciones de tipos
│   └── utils/             # Funciones utilitarias
├── public/                # Archivos estáticos
├── components.json        # Configuración Shadcn/ui
├── next.config.mjs        # Configuración Next.js
├── tailwind.config.ts     # Configuración Tailwind
└── tsconfig.json          # Configuración TypeScript
```

## Rutas Dinámicas y SSG

### Sistema de Rutas Implementado

Se migró de un sistema basado en `/buscar` con client-side rendering a rutas dinámicas con SSG:

#### Estructura de Rutas
```
/[categoria]                    # Todos los perfiles de una categoría
/[categoria]/[departamento]     # Perfiles por categoría y departamento
/[categoria]/[departamento]/[ciudad] # Perfiles específicos por ubicación
```

#### Ejemplos de Rutas
- `/escort` - Todos los escorts
- `/escort/bogota` - Escorts en Bogotá
- `/escort/bogota/chapinero` - Escorts en Chapinero, Bogotá
- `/masajes/antioquia/medellin` - Masajistas en Medellín

### Implementación Técnica

#### Catch-All Routes (`[...slug]`)
```typescript
// app/[...slug]/page.tsx
interface SearchPageProps {
  params: {
    slug: string[]; // Array de segmentos de URL
  };
}

// Extracción de parámetros
const [categoria, departamento, ciudad] = params.slug || [];
```

#### Static Site Generation
```typescript
export async function generateStaticParams() {
  const staticParams: { slug: string[] }[] = [];

  // Rutas de solo categoría
  CATEGORIES.forEach(category => {
    staticParams.push({ slug: [category.value] });
  });

  // Rutas categoría + departamento
  CATEGORIES.forEach(category => {
    Object.keys(LOCATIONS).forEach(department => {
      staticParams.push({ slug: [category.value, department] });
    });
  });

  // Rutas populares completas
  POPULAR_ROUTES.forEach(route => {
    staticParams.push({ 
      slug: [route.categoria, route.departamento, route.ciudad] 
    });
  });

  return staticParams;
}
```

#### Metadata Dinámico para SEO
```typescript
export async function generateMetadata({ params }: SearchPageProps): Promise<Metadata> {
  const [categoria, departamento, ciudad] = params.slug || [];
  
  let pageTitle: string;
  let pageDescription: string;
  
  if (ciudad && departamento) {
    pageTitle = `${categoria} en ${cityLabel}, ${deptLabel} - Perfiles Verificados`;
    pageDescription = `Encuentra los mejores ${categoria} en ${cityLabel}, ${deptLabel}. Perfiles verificados y actualizados.`;
  } else if (departamento) {
    pageTitle = `${categoria} en ${deptLabel} - Perfiles Verificados`;
    pageDescription = `Descubre ${categoria} en ${deptLabel}. Amplia selección de perfiles verificados.`;
  } else {
    pageTitle = `${categoria} - Perfiles Verificados`;
    pageDescription = `Explora nuestra selección de ${categoria}. Perfiles verificados y de calidad.`;
  }

  return {
    title: pageTitle,
    description: pageDescription,
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
```

### Configuración de Rutas Populares

```typescript
// src/lib/config.ts
export const POPULAR_ROUTES = [
  { categoria: 'escort', departamento: 'bogota', ciudad: 'chapinero' },
  { categoria: 'escort', departamento: 'antioquia', ciudad: 'el-poblado' },
  { categoria: 'escort', departamento: 'valle-del-cauca', ciudad: 'cali-aguacatal' },
  { categoria: 'masajes', departamento: 'bogota', ciudad: 'bogota' },
  { categoria: 'masajes', departamento: 'antioquia', ciudad: 'medellin' },
  { categoria: 'trans', departamento: 'bogota', ciudad: 'bogota' },
];

export const CATEGORIES = [
  { value: 'escort', label: 'Escorts' },
  { value: 'masajes', label: 'Masajes' },
  { value: 'trans', label: 'Trans' },
  { value: 'maduras', label: 'Maduras' },
];
```

## Corrección de Inconsistencias

### Problema de Categoría 'escorts' vs 'escort'

**Problema Identificado**: Inconsistencia entre frontend y backend en el nombre de la categoría.

- **Backend**: Usaba `'escort'` (singular) en la base de datos
- **Frontend**: Usaba `'escorts'` (plural) en la configuración

**Solución Implementada**:
```typescript
// Antes
export const CATEGORIES = [
  { value: 'escorts', label: 'Escorts' }, // ❌ Plural
];

// Después
export const CATEGORIES = [
  { value: 'escort', label: 'Escorts' }, // ✅ Singular (coincide con backend)
];
```

**Resultado**:
- ✅ URLs: `/escort/bogota/chapinero` funcionan correctamente
- ✅ Filtros: `category=escort` coincide con la base de datos
- ✅ El label sigue siendo "Escorts" (plural) para mostrar al usuario

### Solución para Rutas Dinámicas - Error 404

**Problema**: El sistema interpretaba incorrectamente rutas como `/bogota` (departamento sin categoría).

**Soluciones Implementadas**:

1. **Middleware Inteligente**:
```typescript
// middleware.ts
if (categoria && !VALID_CATEGORIES.includes(categoria)) {
  // Si es un departamento, redirige a /escort/departamento
  if (VALID_DEPARTMENTS.includes(categoria)) {
    const redirectUrl = new URL(`/escort/${categoria}`, request.url);
    return NextResponse.redirect(redirectUrl);
  }
}
```

2. **Validación Mejorada**:
```typescript
// Validación más detallada con logs de debug
const isValidCat = await isValidCategory(categoria);
if (!isValidCat) {
  notFound();
}
```

3. **Página 404 Personalizada** con sugerencias inteligentes basadas en la ruta solicitada.

## Módulos Principales

### 1. Filtros (Filters)

#### Componentes
- `FilterBar.tsx` - Barra principal de filtros
- `LocationFilter.tsx` - Filtro de ubicación
- `CategoriesBar.tsx` - Barra de categorías
- `FilterSidebar.tsx` - Panel lateral de filtros

#### Servicios
```typescript
// services/filters.service.ts
export const getFilteredProfilesPost = async (filters: FilterParams) => {
  const response = await fetch(`${API_URL}/api/filters/profiles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(filters),
  });
  return response.json();
};

export const getProfilesCountPost = async (filters: FilterParams) => {
  const response = await fetch(`${API_URL}/api/filters/profiles/count`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(filters),
  });
  return response.json();
};
```

### 2. Perfiles (Profiles)

#### Estructura de Datos
```typescript
interface Profile {
  _id: string;
  name: string;
  description: string;
  location: {
    country: { value: string; label: string };
    department: { value: string; label: string };
    city: { value: string; label: string };
  };
  features: {
    group_id: string;
    value: string[];
  }[];
  age: string;
  contact: {
    number: string;
    whatsapp: boolean;
    telegram: boolean;
  };
  media: {
    gallery: string[];
    videos: string[];
    stories: string[];
    audios: string[];
  };
  // ... otros campos
}
```

#### Componentes
- `ProfileCard.tsx` - Tarjeta de perfil
- `ProfileDetail.tsx` - Vista detallada del perfil
- `ProfileForm.tsx` - Formulario de creación/edición
- `ProfileGallery.tsx` - Galería de medios

### 3. Autenticación (Auth)

#### Páginas
- `/autenticacion/login` - Inicio de sesión
- `/autenticacion/register` - Registro
- `/autenticacion/forgot-password` - Recuperar contraseña

#### Hooks
```typescript
// hooks/useAuth.ts
export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const login = async (credentials: LoginCredentials) => {
    // Lógica de login
  };

  const logout = () => {
    // Lógica de logout
  };

  return { user, loading, login, logout };
};
```

### 4. Administración (Admin)

#### Panel de Control
- `/adminboard` - Dashboard principal
- `/adminboard/profiles` - Gestión de perfiles
- `/adminboard/users` - Gestión de usuarios
- `/adminboard/verifications` - Verificaciones pendientes

## Optimizaciones de Performance

### Static Site Generation (SSG)
- Pre-generación de rutas populares en build time
- Incremental Static Regeneration (ISR) cada hora
- Metadata dinámico para SEO

### Configuración de Revalidación
```typescript
// Configuración en page.tsx
export const revalidate = 3600; // 1 hora

// ISR para rutas dinámicas
export const dynamicParams = true;
```

### Lazy Loading
- Componentes cargados bajo demanda
- Imágenes optimizadas con Next.js Image
- Code splitting automático

## Datos de Colombia

### Estructura de Ubicaciones
```typescript
// src/utils/colombiaData.ts
export const getAllDepartments = (): LocationValue[] => {
  return Object.entries(LOCATIONS).map(([key, value]) => ({
    value: key,
    label: value.name
  }));
};

export const getCitiesByDepartment = (department: string): LocationValue[] => {
  const dept = LOCATIONS[department];
  if (!dept) return [];
  
  return dept.cities.map(city => ({
    value: createSlug(city),
    label: city
  }));
};
```

### Normalización de Datos
```typescript
// Función para crear slugs normalizados
export const createSlug = (text: string): string => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remover tildes
    .replace(/[^a-z0-9\s-]/g, '') // Remover caracteres especiales
    .replace(/\s+/g, '-') // Espacios a guiones
    .trim();
};
```

## Testing y Debugging

### Scripts de Verificación
```bash
# Verificar configuración de categorías
node test-category-fix.js

# Probar rutas dinámicas
curl http://localhost:3000/escort
curl http://localhost:3000/escort/bogota
curl http://localhost:3000/escort/bogota/chapinero
```

### Logs de Debug
- `🔍 [DEBUG]` - Logs de validación de rutas
- `✅ [SUCCESS]` - Operaciones exitosas
- `❌ [ERROR]` - Errores y validaciones fallidas

## SEO y Metadata

### Meta Tags Dinámicos
- Títulos específicos por ruta
- Descripciones contextuales
- Open Graph y Twitter Cards
- Canonical URLs

### Sitemap y Robots
```typescript
// Generación automática de sitemap
export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [];
  
  // Agregar rutas estáticas
  routes.push({
    url: `${SITE_URL}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 1,
  });
  
  // Agregar rutas dinámicas
  POPULAR_ROUTES.forEach(route => {
    routes.push({
      url: `${SITE_URL}/${route.categoria}/${route.departamento}/${route.ciudad}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    });
  });
  
  return routes;
}
```

## Próximos Pasos

### Funcionalidades Pendientes
1. **Implementar breadcrumbs** para navegación
2. **Agregar structured data** para rich snippets
3. **Optimizar imágenes** con Next.js Image
4. **Implementar PWA** con service workers
5. **Agregar analytics** y tracking
6. **Implementar chat en tiempo real**
7. **Sistema de favoritos** para usuarios

### Optimizaciones Técnicas
1. **Caché de API responses** con React Query
2. **Optimización de bundle size**
3. **Implementar CDN** para assets
4. **Monitoring y error tracking**
5. **Tests unitarios y e2e**
6. **Accessibility improvements**

### SEO y Marketing
1. **Schema markup** para perfiles
2. **Sitemap XML** automático
3. **Meta tags** más específicos
4. **Canonical URLs** para evitar duplicados
5. **Implementar AMP** para páginas móviles

## Configuración Backend

### Redis (Temporalmente Deshabilitado)

**Estado actual**: Redis está deshabilitado para evitar logs innecesarios de reconexión durante el desarrollo.

**Ubicación**: `backend/src/services/cache.service.ts`

```typescript
constructor() {
  // Redis desactivado temporalmente
  // this.initializeRedis();
  logger.info('⚠️ Redis desactivado - Modo sin caché');
}
```

**Impacto**:
- La aplicación funciona sin caché
- Sin impacto en funcionalidad core
- Sin logs de reconexión en consola

**Para reactivar Redis**:
```typescript
constructor() {
  this.initializeRedis(); // Descomentar esta línea
}
```

Asegúrate de tener Redis ejecutándose:
```bash
# Con Docker
docker run -d -p 6379:6379 redis:alpine

# O instalar localmente
# Windows: Usar WSL2 o Redis para Windows
# macOS: brew install redis && brew services start redis
# Linux: sudo apt-get install redis-server
```

## Notas Importantes

- **Rutas**: Usar siempre valores normalizados (sin tildes) en URLs
- **SEO**: Mantener consistencia en meta tags y títulos
- **Performance**: Monitorear Core Web Vitals
- **Accesibilidad**: Seguir estándares WCAG
- **Seguridad**: Validar siempre datos del cliente
- **Mobile**: Diseño mobile-first

---

**Última actualización**: Diciembre 2024
**Versión**: 1.0.0
**Framework**: Next.js 14 con App Router
**Mantenedor**: Equipo de Desarrollo