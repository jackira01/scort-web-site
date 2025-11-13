# Documentación General del Proyecto - Scort Web Site

## Índice
1. [Descripción General](#descripción-general)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Infraestructura](#infraestructura)
4. [Configuración de Redis](#configuración-de-redis)
5. [Sistema de Cupones](#sistema-de-cupones)
6. [Sistema de Rotación de Perfiles](#sistema-de-rotación-de-perfiles)
7. [Migración de Ubicaciones](#migración-de-ubicaciones)
8. [Despliegue](#despliegue)
9. [Troubleshooting](#troubleshooting)

---

## Descripción General

**Scort Web Site** es una plataforma web moderna y segura para servicios de acompañantes premium. El proyecto está dividido en dos partes principales:

- **Backend**: API RESTful construida con Node.js, Express y MongoDB
- **Frontend**: Aplicación web construida con Next.js 14 App Router

### Stack Tecnológico Global

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js 14)                │
│  React 18 + TypeScript + Tailwind + Shadcn/ui          │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ HTTP/REST
                     │
┌────────────────────▼────────────────────────────────────┐
│                  BACKEND (Node.js + Express)            │
│  TypeScript + MongoDB + Redis + Cloudinary + Mailjet   │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
┌───────▼──────┐        ┌────────▼──────┐
│   MongoDB    │        │     Redis      │
│   Database   │        │     Cache      │
└──────────────┘        └────────────────┘
```

---

## Arquitectura del Sistema

### Monorepo con pnpm Workspaces

El proyecto usa **pnpm workspaces** para gestionar el monorepo:

```
scort-web-site/
├── package.json              # Root workspace config
├── pnpm-workspace.yaml       # pnpm workspace config
├── backend/                  # Backend API
│   └── package.json
├── frontend/                 # Frontend Next.js
│   └── package.json
└── shared/                   # Código compartido (futuro)
```

#### Ventajas del Monorepo
- **Dependencias compartidas**: Un solo `node_modules` para todo el proyecto
- **Scripts unificados**: Ejecutar comandos en todos los workspaces
- **Versionado conjunto**: Un solo repositorio Git para todo
- **Types compartidos**: TypeScript compartido entre frontend y backend

### Comandos Globales

```bash
# Instalar todas las dependencias
pnpm install

# Ejecutar backend y frontend en paralelo
pnpm run dev

# Ejecutar solo backend
pnpm --filter backend dev

# Ejecutar solo frontend
pnpm --filter frontend dev

# Build de producción
pnpm run build

# Linting global
pnpm run lint
```

---

## Infraestructura

### Servicios Externos

#### 1. **MongoDB Atlas** (Base de Datos)
- **Propósito**: Almacenamiento principal de datos
- **Plan**: Shared Cluster (M0) o Dedicated (M10+)
- **Región**: Seleccionar la más cercana a tus usuarios
- **Configuración**:
  ```env
  MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/scort-web-site
  ```

#### 2. **Cloudinary** (Almacenamiento de Archivos)
- **Propósito**: Almacenamiento y optimización de imágenes/videos
- **Plan**: Free tier (25 créditos/mes) o Pro
- **Configuración**:
  ```env
  CLOUDINARY_CLOUD_NAME=tu_cloud_name
  CLOUDINARY_API_KEY=tu_api_key
  CLOUDINARY_API_SECRET=tu_api_secret
  ```
- **Features usadas**:
  - Transformación automática de imágenes
  - Compresión y optimización
  - CDN global integrado
  - Soporte para videos

#### 3. **Mailjet** (Email Transaccional)
- **Propósito**: Envío de emails (verificación, notificaciones, etc.)
- **Plan**: Free tier (200 emails/día) o Essential
- **Configuración**:
  ```env
  MAILJET_API_KEY=tu_mailjet_api_key
  MAILJET_SECRET_KEY=tu_mailjet_secret_key
  MAILJET_FROM_EMAIL=noreply@tudominio.com
  MAILJET_FROM_NAME=Scort Web Site
  ```

#### 4. **Stripe** (Pagos - Opcional)
- **Propósito**: Procesamiento de pagos y suscripciones
- **Plan**: Pay-as-you-go (2.9% + $0.30 por transacción)
- **Configuración**:
  ```env
  STRIPE_SECRET_KEY=sk_test_...
  STRIPE_PUBLISHABLE_KEY=pk_test_...
  STRIPE_WEBHOOK_SECRET=whsec_...
  ```

### Hosting y Despliegue

#### Opción 1: CapRover (Recomendado)
- **Propósito**: Hosting self-hosted con Docker
- **Pros**: Control total, económico, escalable
- **Configuración**: Ver `captain-definition` en raíz del proyecto

#### Opción 2: Vercel + Render
- **Frontend**: Vercel (Next.js optimizado)
- **Backend**: Render (Node.js)
- **Pros**: Deploy automático, zero-config

#### Opción 3: VPS (DigitalOcean, Linode, AWS EC2)
- **Setup manual**: Nginx + PM2 + Docker
- **Pros**: Control total, personalizable

---

## Configuración de Redis

Redis es el sistema de caché que mejora significativamente el rendimiento de la aplicación.

### ¿Qué se Cachea?

- **Perfiles de usuarios**: 10 minutos TTL
- **Filtros de búsqueda**: 5 minutos TTL
- **Configuraciones del sistema**: 30 minutos TTL
- **Estadísticas**: 15 minutos TTL
- **Departamentos y ciudades**: 60 minutos TTL

### Opciones de Instalación

#### Opción 1: Docker Compose (Recomendado para Desarrollo)

```bash
# Desde la raíz del proyecto
docker-compose up redis -d

# Verificar que está funcionando
docker-compose ps

# Ver logs
docker-compose logs -f redis

# Detener
docker-compose down
```

**Archivo `docker-compose.yml`**:
```yaml
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    command: redis-server --appendonly yes
    restart: unless-stopped

volumes:
  redis-data:
```

#### Opción 2: Instalación Local

**Windows**:
```bash
# Descargar desde:
# https://github.com/microsoftarchive/redis/releases

# O usar WSL2:
wsl --install
wsl
sudo apt update
sudo apt install redis-server
redis-server
```

**macOS**:
```bash
brew install redis
brew services start redis
```

**Linux (Ubuntu/Debian)**:
```bash
sudo apt update
sudo apt install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

#### Opción 3: Redis Cloud (Producción)

- **Servicio**: Redis Cloud (redis.com) o Upstash
- **Plan Free**: 30MB RAM, suficiente para desarrollo
- **Configuración**:
  ```env
  REDIS_URL=redis://default:password@endpoint.redis.cloud:12345
  ```

### Desarrollo sin Redis

La aplicación funciona sin Redis, pero con menor performance:

- Los errores de conexión Redis son normales y no afectan la funcionalidad
- Las operaciones de caché simplemente se omiten
- Ideal para desarrollo rápido sin dependencias extra

### Comandos Útiles de Redis

```bash
# Conectar al cliente Redis
redis-cli

# Verificar conexión
ping
# Respuesta: PONG

# Ver todas las claves
KEYS *

# Ver valor de una clave
GET clave

# Limpiar todo el caché
FLUSHALL

# Ver info del servidor
INFO

# Monitor en tiempo real
MONITOR
```

### Configuración en Backend

**Archivo**: `backend/src/config/redis.ts`

```typescript
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: true,
});

redis.on('connect', () => {
  console.log('✅ Redis conectado');
});

redis.on('error', (err) => {
  console.error('❌ Redis error:', err.message);
});

export default redis;
```

---

## Sistema de Cupones

### Arquitectura v2 (Actual)

El sistema de cupones usa **combinaciones exactas** de plan + variante para eliminar ambigüedades.

#### Problema que Resuelve

**v1 (Antiguo - Producto Cartesiano)**:
```javascript
{
  validPlanCodes: ["PREMIUM", "GOLD"],
  validVariantDays: [30, 90]
}
// Genera: PREMIUM-30, PREMIUM-90, GOLD-30, GOLD-90 (4 combinaciones)
// ⚠️ Si solo querías 3, la cuarta es incorrecta
```

**v2 (Nuevo - Combinaciones Exactas)**:
```javascript
{
  validPlanVariants: [
    { planCode: "PREMIUM", variantDays: 30 },
    { planCode: "PREMIUM", variantDays: 90 },
    { planCode: "GOLD", variantDays: 30 }
  ]
}
// ✅ Genera EXACTAMENTE lo que seleccionaste: 3 combinaciones
```

### Tipos de Cupones

#### 1. **Porcentual**
```json
{
  "type": "PERCENTAGE",
  "discountPercentage": 25,
  "validPlanVariants": [
    { "planCode": "PREMIUM", "variantDays": 30 }
  ]
}
```

#### 2. **Monto Fijo**
```json
{
  "type": "FIXED_AMOUNT",
  "discountAmount": 10000,
  "currency": "COP",
  "validPlanVariants": [
    { "planCode": "GOLD", "variantDays": 90 }
  ]
}
```

### Migración de Cupones Antiguos

Si tienes cupones con el formato antiguo, ejecuta:

```bash
cd backend
npx ts-node scripts/migrate-coupons-to-plan-variants.ts
```

**Lo que hace**:
- ✅ Encuentra cupones con `validPlanCodes` y `validVariantDays`
- ✅ Convierte a `validPlanVariants`
- ✅ Genera producto cartesiano completo (retrocompatibilidad)
- ✅ Mantiene campos antiguos para rollback seguro
- ✅ Genera reporte detallado

### Validación de Cupones

**Backend**: `coupon.service.ts`
```typescript
async validateCoupon(code: string, planCode: string, variantDays: number) {
  const coupon = await Coupon.findOne({ code, isActive: true });
  
  // Validar fecha
  if (coupon.expiresAt && new Date() > coupon.expiresAt) {
    return { valid: false, error: 'Cupón expirado' };
  }
  
  // Validar plan-variante
  const isValid = coupon.validPlanVariants.some(v => 
    v.planCode === planCode && v.variantDays === variantDays
  );
  
  if (!isValid) {
    return { valid: false, error: 'Cupón no válido para este plan' };
  }
  
  return { valid: true, discount: calcularDescuento(coupon) };
}
```

### Pruebas Automatizadas

```bash
cd backend
npx ts-node scripts/test-coupon-validation.ts
```

**Casos probados**:
- ✅ Cupón válido para combinación exacta
- ❌ Cupón inválido para combinación no incluida
- ❌ Cupón expirado
- ❌ Cupón inactivo
- ✅ Cupones con múltiples combinaciones

---

## Sistema de Rotación de Perfiles

### Propósito

El sistema de rotación asegura que los perfiles se muestren de forma **justa y pseudo-aleatoria**, evitando que siempre aparezcan los mismos primeros.

### Cómo Funciona

#### 1. **Cálculo de Score de Visibilidad**

Cada perfil recibe un score basado en:

```typescript
Score Total = Score Nivel + Score Variante + Bonificación Upgrades

Score Nivel (1M - 5M puntos):
- DIAMANTE (nivel 1): 5,000,000 puntos
- ORO (nivel 2):      4,000,000 puntos  
- PLATA (nivel 3):    3,000,000 puntos
- BRONCE (nivel 4):   2,000,000 puntos
- FREE (nivel 5):     1,000,000 puntos

Score Variante (10K - 30K puntos):
- 365 días: 30,000 puntos
- 180 días: 25,000 puntos
- 90 días:  20,000 puntos
- 30 días:  15,000 puntos
- 10 días:  10,000 puntos

Bonificación Upgrades:
- Solo DESTACADO: +100 puntos
- Solo IMPULSO:   +100 puntos
- Ambos:          +200 puntos
```

#### 2. **Efecto de Upgrades**

**DESTACADO**: Mejora el nivel efectivo en 1 posición y reduce la variante a 7 días
```typescript
// Ejemplo:
Plan original: PLATA (nivel 3), Variante 30 días
Con DESTACADO: ORO efectivo (nivel 2), Variante 7 días
Score: 4,000,000 + 10,000 + 100 = 4,010,100
```

**IMPULSO**: Mejora la variante efectiva 2 posiciones
```typescript
// Ejemplo:
Variante original: 30 días (rank 4)
Con IMPULSO: 90 días efectivo (rank 2)
Mejora: 15,000 → 20,000 puntos (+5,000)
```

#### 3. **Rotación con Seed Temporal**

Los perfiles con el **mismo score** rotan usando un seed basado en tiempo:

```typescript
function getRotationSeed(): number {
  const now = Date.now();
  const rotationInterval = 15 * 60 * 1000; // 15 minutos en producción
  return Math.floor(now / rotationInterval);
}
```

**Resultado**:
- Mismo orden durante 15 minutos
- Luego se re-mezclan automáticamente
- Usa algoritmo de shuffle determinístico (misma seed = mismo orden)

### Configuración del Intervalo

**Archivo**: `backend/src/modules/visibility/visibility.service.ts`

```typescript
// PRODUCCIÓN (recomendado)
const rotationInterval = 15 * 60 * 1000; // 15 minutos

// DESARROLLO/DEBUG
const rotationInterval = 10 * 1000; // 10 segundos

// TESTING
const rotationInterval = 30 * 1000; // 30 segundos
```

### Orden Final

```
1. Ordenar por nivel efectivo (1-5)
2. Dentro de cada nivel, ordenar por score de variante
3. Perfiles con mismo score: shuffle con seed temporal
4. Resultado: Lista ordenada y rotativa
```

### Debugging

El sistema genera logs detallados (deshabilitados en producción):

```javascript
// Para habilitar logs de debug:
const DEBUG_ROTATION = process.env.NODE_ENV === 'development';

if (DEBUG_ROTATION) {
  console.log('🔄 Seed actual:', seed);
  console.log('📊 Score de Ana:', score);
  console.log('🎲 Orden mezclado:', shuffledProfiles);
}
```

---

## Migración de Ubicaciones

### Contexto

Se migró desde un sistema de datos **estáticos** (hardcoded en código) a uno **dinámico** (base de datos + API REST).

### Antes vs Después

| Aspecto | Antes (Estático) | Después (Dinámico) |
|---------|------------------|-------------------|
| **Fuente de datos** | `colombiaData.ts` | MongoDB + API REST |
| **Actualización** | Redeploy completo | Admin panel |
| **Validación** | Local en frontend | Centralizada en backend |
| **Escalabilidad** | Limitada | Ilimitada |
| **Cache** | No disponible | React Query (5-10 min) |

### Estructura de Datos

**Modelo MongoDB** (`Location`):
```typescript
{
  type: 'country' | 'department' | 'city' | 'locality',
  value: 'bogota',              // Normalizado (sin tildes, lowercase)
  label: 'Bogotá',              // Display (con tildes)
  parent: ObjectId | null,      // Referencia al padre
  isActive: true,
  metadata: {
    population: 8000000,
    timezone: 'America/Bogota',
    coordinates: { lat: 4.7110, lng: -74.0721 }
  }
}
```

**Jerarquía**:
```
Colombia (country)
├── Bogotá (department)
│   ├── Usaquén (city)
│   ├── Chapinero (city)
│   └── ...
├── Antioquia (department)
│   ├── Medellín (city)
│   ├── Bello (city)
│   └── ...
└── ...
```

### Endpoints Disponibles

```typescript
// Obtener todos los departamentos
GET /api/locations/type/department

// Obtener ciudades de un departamento
GET /api/locations/children/:parentId

// Validar departamento
GET /api/locations/validate/department/:value

// Validar ciudad
GET /api/locations/validate/city/:dept/:city

// CRUD (Admin only)
GET    /api/locations
POST   /api/locations
PUT    /api/locations/:id
DELETE /api/locations/:id
POST   /api/locations/bulk-import
```

### Uso en Frontend

**Hooks disponibles**:
```typescript
import {
  useDepartments,
  useCitiesByDepartment,
  useLocations,
  useLocation
} from '@/hooks/use-locations';

// Ejemplo en componente
function LocationFilter() {
  const { data: departments, isLoading } = useDepartments();
  const { data: cities } = useCitiesByDepartment(selectedDept);
  
  return (
    <Select disabled={isLoading}>
      {departments?.map(dept => (
        <SelectItem value={dept.value}>{dept.label}</SelectItem>
      ))}
    </Select>
  );
}
```

### Archivo Deprecado

`frontend/src/utils/colombiaData.ts` ahora está **completamente deshabilitado**:
- Todas las exportaciones retornan valores vacíos
- Incluye warnings de deprecación en consola
- Se mantiene solo por compatibilidad temporal
- **NO USAR** en código nuevo

---

## Despliegue

### Despliegue en CapRover

#### Requisitos Previos
- Servidor con Docker instalado
- CapRover instalado y configurado
- Dominio apuntando al servidor

#### Configuración

**Archivo `captain-definition`** (raíz del proyecto):
```json
{
  "schemaVersion": 2,
  "dockerfileLines": [
    "FROM node:18-alpine",
    "WORKDIR /app",
    "COPY package*.json pnpm-lock.yaml ./",
    "RUN npm install -g pnpm",
    "RUN pnpm install --frozen-lockfile",
    "COPY . .",
    "RUN pnpm run build",
    "EXPOSE 3000 5000",
    "CMD [\"pnpm\", \"run\", \"start\"]"
  ]
}
```

#### Pasos de Despliegue

1. **Crear Apps en CapRover**:
```bash
# Backend
caprover deploy -a scort-backend

# Frontend
caprover deploy -a scort-frontend
```

2. **Configurar Variables de Entorno** en CapRover UI:
```env
# Backend
MONGODB_URI=mongodb+srv://...
REDIS_URL=redis://...
JWT_SECRET=...
CLOUDINARY_CLOUD_NAME=...
MAILJET_API_KEY=...

# Frontend
NEXT_PUBLIC_API_URL=https://api.tudominio.com
NEXTAUTH_URL=https://tudominio.com
NEXTAUTH_SECRET=...
```

3. **Configurar HTTPS** en CapRover:
- Habilitar HTTPS
- Force HTTPS redirect
- Certificado SSL automático con Let's Encrypt

4. **Deploy**:
```bash
# Desde raíz del proyecto
git push caprover main
```

### Despliegue en Vercel + Render

#### Frontend en Vercel

1. **Conectar repositorio** en vercel.com
2. **Configurar Build**:
   - Framework: Next.js
   - Root Directory: `frontend`
   - Build Command: `pnpm run build`
   - Output Directory: `.next`

3. **Variables de entorno**:
```env
NEXT_PUBLIC_API_URL=https://scort-backend.onrender.com
NEXTAUTH_URL=https://tu-app.vercel.app
NEXTAUTH_SECRET=...
```

#### Backend en Render

1. **Crear Web Service** en render.com
2. **Configurar**:
   - Root Directory: `backend`
   - Build Command: `pnpm install && pnpm run build`
   - Start Command: `pnpm run start`

3. **Variables de entorno**: Igual que CapRover

---

## Troubleshooting

### Problema: Redis no conecta

**Síntomas**:
```
❌ Error de conexión Redis: connect ECONNREFUSED 127.0.0.1:6379
```

**Soluciones**:
1. Verificar que Redis está corriendo:
   ```bash
   docker-compose ps
   # o
   redis-cli ping
   ```

2. Verificar variable de entorno:
   ```bash
   echo $REDIS_URL
   ```

3. La aplicación funciona sin Redis (con menor performance)

### Problema: Cupones no validan correctamente

**Verificar**:
1. Ejecutar script de migración:
   ```bash
   npx ts-node scripts/migrate-coupons-to-plan-variants.ts
   ```

2. Verificar en MongoDB que el cupón tiene `validPlanVariants`:
   ```javascript
   db.coupons.findOne({ code: "TU_CUPON" })
   ```

3. Ejecutar pruebas:
   ```bash
   npx ts-node scripts/test-coupon-validation.ts
   ```

### Problema: Perfiles no rotan

**Verificar intervalo**:
```typescript
// backend/src/modules/visibility/visibility.service.ts
const rotationInterval = 15 * 60 * 1000; // Debe estar en milisegundos
```

**Limpiar caché**:
```bash
redis-cli
> KEYS profile:*
> DEL profile:list:*
```

### Problema: Build falla en producción

**Verificar**:
1. Versión de Node.js (debe ser 18+):
   ```bash
   node --version
   ```

2. pnpm instalado:
   ```bash
   pnpm --version
   ```

3. Variables de entorno configuradas

4. MongoDB accesible desde el servidor

### Problema: Ubicaciones no cargan

**Verificar**:
1. Backend API funcionando:
   ```bash
   curl https://api.tudominio.com/api/locations/type/department
   ```

2. MongoDB tiene datos:
   ```javascript
   db.locations.countDocuments({ type: 'department' })
   ```

3. Importar datos si es necesario:
   ```bash
   npx ts-node backend/scripts/import-locations.ts
   ```

---

## Contacto y Soporte

Para preguntas o problemas:
- **Email**: soporte@tudominio.com
- **GitHub Issues**: [Crear issue](https://github.com/tu-usuario/scort-web-site/issues)
- **Documentación**: Ver `DOCUMENTACION_FRONTEND.md` y `DOCUMENTACION_BACKEND.md`

---

**Última actualización**: Noviembre 2024  
**Versión**: 2.0.0
