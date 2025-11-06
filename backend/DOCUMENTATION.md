# Backend Documentation - Scort Web Site# Backend Documentation - Scort Web Site



## Descripción General## Descripción General



Backend desarrollado con Node.js, Express y TypeScript para una plataforma de perfiles de acompañantes. El sistema incluye gestión de usuarios, perfiles, planes de suscripción, pagos, verificaciones, y un motor de filtros avanzado.Este proyecto es un backend Node.js con Express y Mongoose para una API REST que maneja perfiles de escorts, filtros, autenticación y verificaciones.



## Stack Tecnológico## Configuración e Instalación



- **Runtime**: Node.js 18+### Requisitos

- **Framework**: Express 5.x- Node.js 18+

- **Lenguaje**: TypeScript- MongoDB 5.0+

- **Base de Datos**: MongoDB 6.x con Mongoose- npm o pnpm

- **Autenticación**: JWT (jsonwebtoken)

- **Email**: Mailjet### Instalación

- **Almacenamiento**: Cloudinary```bash

- **Caché**: Redis (ioredis)# Instalar dependencias

- **Seguridad**: Helmet, express-rate-limitnpm install

- **Gestión de Paquetes**: pnpm

# Configurar variables de entorno

## Configuración e Instalacióncp .env.example .env



### Requisitos Previos# Iniciar servidor de desarrollo

npm run dev

- Node.js 18+

- MongoDB 6.0+# Iniciar servidor de producción

- pnpm (gestor de paquetes)npm start

- Redis (opcional, para caché)```



### Instalación### Variables de Entorno

```env

```bashMONGO_URI='mongodb://localhost:27017/scort-web-site'

# Instalar pnpm globalmente (si no lo tienes)PORT=5000

npm install -g pnpmJWT_SECRET=your_jwt_secret

```

# Instalar dependencias

pnpm install## Estructura del Proyecto



# Configurar variables de entorno```

cp .env.example .envbackend/

# Editar .env con tus credenciales├── src/

```│   ├── app.ts              # Configuración principal de Express

│   ├── server.ts           # Servidor HTTP

### Variables de Entorno│   ├── config/             # Configuraciones

│   ├── middlewares/        # Middlewares personalizados

```env│   └── modules/            # Módulos de la aplicación

# Base de datos│       ├── auth/           # Autenticación y autorización

MONGODB_URI=mongodb://localhost:27017/scort-web-site│       ├── profile/        # Gestión de perfiles

│       ├── filters/        # Sistema de filtros

# Servidor│       ├── attribute-group/ # Grupos de atributos

PORT=5000│       ├── user/           # Gestión de usuarios

NODE_ENV=development│       └── profile-verification/ # Verificación de perfiles

├── config/                 # Configuraciones adicionales

# JWT├── package.json

JWT_SECRET=tu_jwt_secret_super_seguro└── tsconfig.json

JWT_EXPIRES_IN=7d```



# Email (Mailjet)## Módulos Principales

MAILJET_API_KEY=tu_mailjet_api_key

MAILJET_SECRET_KEY=tu_mailjet_secret_key### 1. Perfiles (Profile)



# Cloudinary#### Estructura de Datos

CLOUDINARY_CLOUD_NAME=tu_cloud_name```typescript

CLOUDINARY_API_KEY=tu_cloudinary_api_keyinterface IProfile {

CLOUDINARY_API_SECRET=tu_cloudinary_api_secret  user: Types.ObjectId;

  name: string;

# Frontend  description: string;

FRONTEND_URL=http://localhost:3000  isActive: boolean;

  location: {

# Configuración de la empresa    country: {

COMPANY_EMAIL=contacto@tuempresa.com      value: string; // Valor normalizado (sin tildes, minúsculas)

COMPANY_NAME=Tu Empresa      label: string; // Valor para mostrar (con tildes, formato original)

    };

# Redis (opcional)    department: {

REDIS_URL=redis://localhost:6379      value: string;

      label: string;

# Stripe (opcional, para pagos)    };

STRIPE_SECRET_KEY=tu_stripe_secret_key    city: {

```      value: string;

      label: string;

### Scripts de Desarrollo    };

  };

```bash  features: {

# Desarrollo con hot-reload    group_id: Types.ObjectId;

pnpm dev    value: string | string[];

  }[];

# Build para producción  age: string;

pnpm build  contact: {

    number: string;

# Iniciar en producción    whatsapp: boolean;

pnpm start    telegram: boolean;

    changedAt: Date;

# Limpiar build  };

pnpm clean  // ... otros campos

```}

```

### Scripts de Inicialización

#### Endpoints

```bash- `POST /api/profiles` - Crear perfil

# Migrar parámetros de configuración- `GET /api/profiles` - Listar perfiles

pnpm migrate:config-parameters- `GET /api/profiles/:id` - Obtener perfil por ID

- `PUT /api/profiles/:id` - Actualizar perfil

# Inicializar planes por defecto- `DELETE /api/profiles/:id` - Eliminar perfil

pnpm init:default-plan

### 2. Filtros (Filters)

# Inicializar límites de perfil

pnpm init:profile-limits#### Endpoints

- `POST /api/filters/profiles` - Filtrar perfiles

# Inicializar límites para agencias- `POST /api/filters/profiles/count` - Contar perfiles filtrados

pnpm init:agency-limits- `GET /api/filters/options` - Obtener opciones de filtros



# Seed de planes (con motor de visibilidad)#### Estructura de Filtros

pnpm seed:plans```typescript

```interface FilterParams {

  category?: string;

## Estructura del Proyecto  gender?: string;

  location?: {

```    department?: string;

backend/    city?: string;

├── src/  };

│   ├── app.ts                    # Configuración de Express  age?: {

│   ├── server.ts                 # Punto de entrada HTTP    min?: number;

│   ├── config/    max?: number;

│   │   └── db.ts                 # Configuración de MongoDB  };

│   ├── controllers/              # Controladores HTTP  // ... otros filtros

│   │   ├── auth.controller.ts}

│   │   ├── email.controller.ts```

│   │   └── agency-conversion.controller.ts

│   ├── middlewares/              # Middlewares personalizados### 3. Grupos de Atributos (AttributeGroup)

│   │   ├── auth.middleware.ts    # Verificación JWT

│   │   ├── admin.middleware.ts   # Verificación de rol adminManeja las categorías, géneros y otros atributos de los perfiles.

│   │   ├── security.middleware.ts

│   │   ├── validation.middleware.ts#### Estructura

│   │   ├── visibility.middleware.ts```typescript

│   │   └── coupon.middleware.tsinterface IAttributeGroup {

│   ├── services/                 # Servicios compartidos  name: string;

│   │   └── email.service.ts      # Servicio de emails  key: string; // 'category', 'gender', etc.

│   ├── jobs/                     # Trabajos programados  variants: {

│   │   └── invoice-expiry.job.ts    label: string;

│   ├── routes/                   # Definición de rutas    value: string;

│   ├── types/                    # Tipos TypeScript    active: boolean;

│   ├── utils/                    # Utilidades  }[];

│   └── modules/                  # Módulos de negocio}

│       ├── attribute-group/      # Atributos y categorías```

│       ├── blog/                 # Sistema de blog

│       ├── cleanup/              # Limpieza de datos## Migración de Estructura de Ubicación

│       ├── config-parameter/     # Parámetros de configuración

│       ├── content/              # Contenido estático### Problema Resuelto

│       ├── coupons/              # Sistema de cuponesSe migró la estructura de ubicación de strings simples a objetos con `value` y `label` para resolver problemas de case sensitivity y tildes.

│       ├── email-inbox/          # Bandeja de entrada de emails

│       ├── email-log/            # Registro de emails enviados### Antes

│       ├── feeds/                # Feeds RSS/XML```javascript

│       ├── filters/              # Motor de filtros avanzadolocation: {

│       ├── news/                 # Sistema de noticias  country: "Colombia",

│       ├── payments/             # Pagos y facturas  department: "Bogotá",

│       ├── plans/                # Planes de suscripción  city: "Chapinero"

│       ├── profile/              # Gestión de perfiles}

│       ├── profile-verification/ # Verificación de perfiles```

│       ├── rates/                # Sistema de valoraciones

│       ├── sponsored-profiles/   # Perfiles patrocinados### Después

│       ├── systemConfig/         # Configuración del sistema```javascript

│       ├── user/                 # Gestión de usuarioslocation: {

│       ├── validation/           # Validaciones  country: {

│       └── visibility/           # Motor de visibilidad    value: "colombia",

├── scripts/                      # Scripts de utilidad    label: "Colombia"

├── captain-definition            # Config para CapRover  },

├── Dockerfile                    # Imagen Docker  department: {

├── .dockerignore    value: "bogota",

├── package.json    label: "Bogotá"

└── tsconfig.json  },

```  city: {

    value: "chapinero",

## Módulos Principales    label: "Chapinero"

  }

### 1. Usuarios (User)}

```

Gestión de usuarios de la plataforma.

### Beneficios

**Características**:- Búsquedas consistentes sin problemas de tildes

- Registro y autenticación- Visualización correcta con formato original

- Roles: user, admin, agency- Escalabilidad para futuras expansiones

- Verificación de identidad con documentos

- Gestión de múltiples perfiles por usuario## Solución de Problemas

- Sistema de verificación por email

### Filtro de Categorías No Funciona

**Modelo**:

```typescript**Problema**: El filtro `/api/filters/profiles?category=escort` no devuelve resultados.

interface IUser {

  email: string;**Causa**: Error en la consulta MongoDB para arrays en el campo `features.value`.

  password: string;

  name: string;**Solución**: Usar `$in` para buscar dentro del array:

  role: 'user' | 'admin' | 'agency';```javascript

  accountType: 'personal' | 'agency';// Antes (INCORRECTO)

  profiles: ObjectId[];'value': normalizedValue

  isVerified: boolean;

  verification_in_progress: boolean;// Después (CORRECTO)

  verificationDocument: string[];'value': { $in: [normalizedValue] }

  lastLogin: {```

    date: Date;

    isVerified: boolean;### Inconsistencia en Métodos HTTP

  };

  createdAt: Date;**Problema**: Mezcla de métodos GET y POST para filtros.

}

```**Solución**: Unificación a métodos POST para todos los filtros:

- `POST /api/filters/profiles`

**Endpoints**:- `POST /api/filters/profiles/count`

- `POST /api/users/register` - Registrar usuario

- `POST /api/users/login` - Iniciar sesión### Problemas de Conexión MongoDB

- `GET /api/users/me` - Obtener usuario actual

- `PUT /api/users/:id` - Actualizar usuario**Síntomas**: Error ECONNREFUSED en puerto 27017

- `GET /api/users/:id/profiles` - Obtener perfiles del usuario

**Soluciones**:

### 2. Perfiles (Profile)1. Verificar que MongoDB esté ejecutándose

2. Comprobar variables de entorno (`MONGO_URI`)

Gestión de perfiles de acompañantes.3. Verificar que el archivo `.env` esté cargado correctamente



**Características**:## Scripts Útiles

- Creación y edición de perfiles

- Sistema de verificación multi-paso```bash

- Ubicación con estructura normalizada# Verificar conexión a base de datos

- Atributos dinámicos por categoríanode check-db.js

- Media (fotos y videos)

- Sistema de visibilidad# Inicializar grupos de atributos

- Upgrades (DESTACADO, IMPULSO)node seed-attribute-groups.js

- Planes de suscripción

# Verificar y poblar datos

**Modelo**:node verify-and-seed.js

```typescript

interface IProfile {# Desarrollo con recarga automática

  user: ObjectId;npm run dev

  name: string;

  age: string;# Construcción para producción

  category: string;npm run build

  gender: string;

  location: {# Iniciar en producción

    country: { value: string; label: string };npm start

    department: { value: string; label: string };```

    city: { value: string; label: string };

  };## Validaciones y Seguridad

  description: string;

  features: {### Validación de Perfiles

    group_id: ObjectId;- Validación de features contra AttributeGroups

    value: string | string[];- Verificación de nombres únicos (opcional)

  }[];- Validación de estructura de datos

  media: {

    photos: string[];### Autenticación

    videos: string[];- JWT para autenticación de usuarios

  };- Middleware de autorización

  contact: {- Protección de rutas sensibles

    number: string;

    whatsapp: boolean;### Verificación de Perfiles

    telegram: boolean;- Sistema automático de verificación

    changedAt: Date;- Estados: pending, verified, rejected

  };- Pasos de verificación múltiples

  socialMedia: {

    instagram?: string;## API Reference

    twitter?: string;

    onlyfans?: string;### Respuestas Estándar

  };

  verification: ObjectId;#### Éxito

  planAssignment: {```json

    planCode: string;{

    startDate: Date;  "success": true,

    endDate: Date;  "data": {...},

    isActive: boolean;  "message": "Operación exitosa"

  };}

  upgrades: {```

    code: string;

    startAt: Date;#### Error

    endAt: Date;```json

  }[];{

  visible: boolean;  "success": false,

  isActive: boolean;  "error": "Mensaje de error",

  isDeleted: boolean;  "details": {...}

}}

``````



**Endpoints**:### Paginación

- `POST /api/profiles` - Crear perfil```json

- `GET /api/profiles` - Listar perfiles (paginado){

- `GET /api/profiles/:id` - Obtener perfil  "docs": [...],

- `PUT /api/profiles/:id` - Actualizar perfil  "totalCount": 100,

- `DELETE /api/profiles/:id` - Eliminar perfil  "currentPage": 1,

- `POST /api/profiles/:id/purchase-upgrade` - Comprar upgrade  "totalPages": 10,

  "hasNextPage": true,

### 3. Planes (Plans)  "hasPrevPage": false,

  "limit": 10

Sistema de planes de suscripción para perfiles.}

```

**Planes Disponibles**:

- **FREE**: Plan gratuito básico## Desarrollo y Debug

- **BRONCE**: Plan básico de pago

- **PLATA**: Plan intermedio### Logs de Debug

- **ORO**: Plan avanzadoEl sistema incluye logs detallados para debugging:

- **DIAMANTE**: Plan premium (incluye DESTACADO)- `🔍 [BACKEND FILTERS DEBUG]` - Logs de filtros

- `🚨 [ERROR]` - Logs de errores

**Características**:- `✅ [SUCCESS]` - Logs de éxito

- Duración configurable

- Límites de fotos y videos### Testing

- Posicionamiento en búsquedas```bash

- Upgrades incluidos# Probar filtros

- Precios dinámicoscurl -X POST http://localhost:5000/api/filters/profiles \

  -H "Content-Type: application/json" \

**Modelo**:  -d '{"category":"escort"}'

```typescript

interface IPlan {# Probar conteo

  name: string;curl -X POST http://localhost:5000/api/filters/profiles/count \

  code: string;  -H "Content-Type: application/json" \

  price: number;  -d '{"category":"escort"}'

  duration: number; // días```

  features: {

    maxPhotos: number;## Próximos Pasos

    maxVideos: number;

    highlighted: boolean;1. Implementar caché para consultas frecuentes

    prioritySupport: boolean;2. Agregar tests unitarios y de integración

  };3. Optimizar consultas de base de datos

  active: boolean;4. Implementar rate limiting

}5. Agregar documentación OpenAPI/Swagger

```6. Implementar logging estructurado

7. Configurar monitoreo y alertas

### 4. Verificación de Perfiles (Profile Verification)

## Notas Importantes

Sistema automático de verificación de perfiles.

- **Backup**: Siempre hacer backup antes de migraciones

**Pasos de Verificación**:- **Environment**: Usar variables de entorno para configuración

1. Documento de identidad (frente)- **Security**: No commitear secrets al repositorio

2. Foto con documento al lado del rostro- **Performance**: Monitorear consultas lentas en MongoDB

3. Foto/video con cartel de verificación- **Logs**: Mantener logs para debugging y auditoría

4. Video de verificación

5. Documento de identidad (reverso)---



**Estados**:**Última actualización**: Diciembre 2024

- `pending`: Pendiente de verificación**Versión**: 1.0.0

- `in_progress`: En proceso**Mantenedor**: Equipo de Desarrollo

- `verified`: Verificado## Despliegue en Producción con CapRover

- `rejected`: Rechazado

### ¿Qué es CapRover?

**Modelo**:

```typescriptCapRover es una plataforma de despliegue self-hosted que simplifica el proceso de deployment de aplicaciones. Funciona como un PaaS (Platform as a Service) similar a Heroku pero auto-hospedado.

interface IProfileVerification {

  profile: ObjectId;### Configuración de Archivos

  verificationStatus: 'pending' | 'verified' | 'rejected';

  verificationProgress: number;#### 1. captain-definition

  steps: {

    documentFront: { isVerified: boolean; imageUrl?: string };El archivo `captain-definition` en la raíz del backend indica a CapRover cómo construir la aplicación:

    documentWithFace: { isVerified: boolean; imageUrl?: string };

    verificationPhoto: { isVerified: boolean; imageUrl?: string };```json

    verificationVideo: { isVerified: boolean; videoUrl?: string };{

    documentBack: { isVerified: boolean; imageUrl?: string };  \"schemaVersion\": 2,

    lastLogin: { isVerified: boolean; date?: Date };  \"dockerfilePath\": \"./Dockerfile\"

  };}

}```

```

- **schemaVersion**: Versión del esquema de CapRover (siempre 2)

### 5. Filtros (Filters)- **dockerfilePath**: Ruta al Dockerfile que se usará para construir la imagen



Motor de filtros avanzado para búsqueda de perfiles.#### 2. Dockerfile Optimizado



**Filtros Disponibles**:El Dockerfile está optimizado con:

- Categoría (escort, masajista, etc.)- **Multi-stage build**: Reduce el tamaño de la imagen final

- Género- **pnpm**: Gestor de paquetes eficiente

- Ubicación (país, departamento, ciudad)- **Usuario no-root**: Mejora la seguridad

- Edad (rango)- **Health check**: Permite a CapRover verificar que la app está funcionando

- Atributos dinámicos- **Variables de entorno**: Compatible con inyección dinámica de CapRover

- Planes activos

- Verificación#### 3. .dockerignore



**Endpoints**:Archivo que excluye archivos innecesarios del build Docker.

- `POST /api/filters/profiles` - Filtrar perfiles

- `POST /api/filters/profiles/count` - Contar resultados### Pasos para Desplegar en CapRover

- `GET /api/filters/options` - Opciones de filtros

#### 1. Preparación Inicial

**Ejemplo de Uso**:

```javascript```bash

POST /api/filters/profiles# Instalar CapRover CLI globalmente

{npm install -g caprover

  "category": "escort",

  "gender": "female",# Verificar instalación

  "location": {caprover --version

    "department": "bogota",```

    "city": "chapinero"

  },#### 2. Conectar con tu Servidor CapRover

  "age": {

    "min": 18,```bash

    "max": 30# Iniciar login (solo la primera vez)

  },caprover login

  "page": 1,```

  "limit": 20

}#### 3. Crear Aplicación en CapRover

```

Desde la Web UI o CLI, crea una nueva app (ej: `scort-backend`).

### 6. Pagos (Payments)

#### 4. Configurar Variables de Entorno

Sistema de pagos e invoices.

En el panel de CapRover, configura las variables necesarias: MONGODB_URI, JWT_SECRET, MAILJET_API_KEY, CLOUDINARY_*, FRONTEND_URL, etc.

**Características**:

- Generación de facturas#### 5. Desplegar

- Estados: pending, paid, cancelled

- Múltiples conceptos (planes, upgrades)```bash

- Integración con pasarelas de pago# En la carpeta backend

- Mensajes de WhatsApp automáticoscaprover deploy

```

**Modelo**:

```typescript### Checklist de Despliegue

interface IInvoice {

  user: ObjectId;- [ ] captain-definition creado en `/backend`

  profile?: ObjectId;- [ ] Dockerfile optimizado con health check

  concept: 'plan' | 'upgrade' | 'verification';- [ ] .dockerignore configurado

  amount: number;- [ ] Variables de entorno configuradas en CapRover

  status: 'pending' | 'paid' | 'cancelled';- [ ] Dominio personalizado configurado

  paymentMethod?: string;- [ ] HTTPS habilitado

  details: {- [ ] Health check funcionando

    planCode?: string;- [ ] Logs monitoreados

    upgradeCode?: string;

    duration?: number;
  };
  expiresAt: Date;
  paidAt?: Date;
}
```

### 7. Cupones (Coupons)

Sistema de cupones de descuento.

**Tipos**:
- Porcentaje
- Monto fijo
- Específicos por plan
- Usos limitados

**Validaciones**:
- Fecha de expiración
- Límite de usos
- Restricciones por plan/upgrade
- Usuario único/múltiple

### 8. Parámetros de Configuración (Config Parameter)

Configuración dinámica del sistema.

**Parámetros**:
- `company.email`: Email de la empresa
- `company.name`: Nombre de la empresa
- `default.plan.code`: Plan por defecto
- `profile.limits.*`: Límites de perfiles
- `agency.profile.limits.*`: Límites para agencias

### 9. Motor de Visibilidad (Visibility)

Sistema que controla la visibilidad de perfiles en búsquedas.

**Factores**:
- Plan activo
- Upgrades activos
- Estado de verificación
- Reglas de negocio

### 10. Atributos (Attribute Group)

Gestión de atributos dinámicos por categoría.

**Grupos**:
- Categorías (escort, masajista, etc.)
- Géneros (femenino, masculino, etc.)
- Atributos específicos por categoría
- Servicios disponibles

## Autenticación y Autorización

### JWT

El sistema usa JSON Web Tokens para autenticación.

**Flow**:
1. Usuario se registra/inicia sesión
2. Backend genera JWT con payload:
   ```javascript
   {
     userId: string,
     email: string,
     role: string
   }
   ```
3. Cliente envía token en header:
   ```
   Authorization: Bearer <token>
   ```

### Middlewares

**authMiddleware**: Verifica token JWT
```typescript
// Proteger ruta
router.get('/protected', authMiddleware, controller);
```

**adminMiddleware**: Verifica rol de administrador
```typescript
// Solo admins
router.post('/admin-only', authMiddleware, adminMiddleware, controller);
```

## Sistema de Email

### Servicio de Email

Basado en Mailjet para envío de emails transaccionales.

**Tipos de Email**:
- Bienvenida
- Verificación de email
- Notificación de verificación de perfil
- Notificación de actualización de documentos
- Recordatorios de factura

**Ejemplo**:
```typescript
import EmailService from './services/email.service';

const emailService = new EmailService();
await emailService.sendUserVerificationUpdateNotification(
  userName,
  userEmail,
  userId
);
```

## Almacenamiento de Archivos

### Cloudinary

Todas las imágenes y videos se suben a Cloudinary.

**Configuración**:
- Carpetas organizadas por tipo
- Transformaciones automáticas
- URLs optimizadas
- CDN integrado

## Seguridad

### Implementaciones

- **Helmet**: Headers de seguridad HTTP
- **CORS**: Configurado para frontend
- **Rate Limiting**: Protección contra DDoS
- **Bcrypt**: Hash de contraseñas
- **JWT**: Tokens con expiración
- **Validación**: express-validator
- **Usuario no-root**: En Docker

### Best Practices

- Variables de entorno para secrets
- HTTPS en producción
- Validación de inputs
- Sanitización de datos
- Logging de actividades sensibles

## Despliegue en Producción con CapRover

### Requisitos

- Servidor con CapRover instalado
- Dominio personalizado (opcional)
- MongoDB (Atlas recomendado)
- Variables de entorno configuradas

### Arquitectura de Archivos (Monorepo)

Este proyecto usa una configuración centralizada en la raíz para despliegues con CapRover:

```
SCORT-WEB-SITE/                    # Raíz del proyecto
├── Dockerfile                     # ✅ Dockerfile centralizado
├── captain-definition-backend     # ✅ Configuración CapRover
├── .dockerignore                  # ✅ Exclusiones globales
├── backend/                       # Código del backend
│   ├── src/
│   ├── package.json
│   ├── pnpm-lock.yaml
│   └── .dockerignore             # Exclusiones específicas del backend
└── frontend/                      # Código del frontend
    └── ...
```

**Nota importante**: Los archivos `Dockerfile` y `captain-definition` están en la **raíz del proyecto**, no dentro de `backend/`. Esto es el enfoque recomendado para monorepos.

### Archivos de Configuración

**captain-definition-backend** (en la raíz):
```json
{
  "schemaVersion": 2,
  "dockerfilePath": "./Dockerfile",
  "imageName": "scort-web-backend"
}
```

**Dockerfile** (en la raíz):
- Multi-stage build optimizado
- Copia archivos desde `./backend/`
- Usuario no-root para seguridad
- Health check integrado
- Contexto de build desde la raíz del proyecto

**Estructura del Dockerfile**:
```dockerfile
# Etapa base: instala dependencias
FROM node:18-alpine AS base
COPY ./backend/package.json ./backend/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Etapa builder: compila TypeScript
FROM base AS builder
COPY ./backend .
RUN pnpm run build:prod

# Etapa producción: imagen final optimizada
FROM node:18-alpine AS production
COPY ./backend/package.json ./backend/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod
COPY --from=builder /app/dist ./dist
CMD ["pnpm", "run", "start:prod"]
```

### Pasos de Despliegue

```bash
# 1. Instalar CLI de CapRover
npm install -g caprover

# 2. Login en tu servidor CapRover
caprover login

# 3. Deploy desde la RAÍZ del proyecto
cd SCORT-WEB-SITE
caprover deploy -c captain-definition-backend

# Nota: NO hacer cd backend, el contexto debe ser la raíz
```

**Importante**: 
- El comando `caprover deploy` se ejecuta desde la **raíz del proyecto**
- Se usa el flag `-c captain-definition-backend` para especificar el archivo de definición
- El contexto de Docker es la raíz, permitiendo copiar desde `./backend/`

### Variables de Entorno en CapRover

Configurar en App Configs → Environment Variables:
- MONGODB_URI
- JWT_SECRET
- MAILJET_API_KEY
- MAILJET_SECRET_KEY
- CLOUDINARY_CLOUD_NAME
- CLOUDINARY_API_KEY
- CLOUDINARY_API_SECRET
- FRONTEND_URL
- COMPANY_EMAIL
- COMPANY_NAME
- NODE_ENV=production
- PORT=5000

### Health Check

El Dockerfile incluye health check que verifica el endpoint `/ping` cada 30 segundos:

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 5000) + '/ping', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"
```

Asegúrate de que tu backend tenga un endpoint `/ping` o ajusta el health check.

### SSL/HTTPS

CapRover incluye Let's Encrypt para SSL automático.

### Migración desde Configuración Anterior

Si tenías archivos `Dockerfile` y `captain-definition` dentro de `backend/`, estos han sido migrados a la raíz:

**Antes** (Enfoque 1 - NO recomendado para monorepos):
```
backend/
├── Dockerfile              # ❌ Eliminado
├── captain-definition      # ❌ Eliminado
└── src/
```

**Después** (Enfoque 2 - Recomendado):
```
SCORT-WEB-SITE/
├── Dockerfile                     # ✅ Nuevo
├── captain-definition-backend     # ✅ Nuevo
├── .dockerignore                  # ✅ Nuevo
└── backend/
    └── src/
```

**Beneficios del Enfoque 2**:
- ✅ Mejor organización para monorepos
- ✅ Contexto de build desde la raíz permite acceso a múltiples carpetas
- ✅ Preparado para agregar `captain-definition-frontend` en el futuro
- ✅ Configuración centralizada y clara

## API Reference

### Formato de Respuestas

**Éxito**:
```json
{
  "success": true,
  "data": {...},
  "message": "Operación exitosa"
}
```

**Error**:
```json
{
  "success": false,
  "message": "Mensaje de error",
  "error": "Detalle técnico"
}
```

### Paginación

```json
{
  "docs": [...],
  "totalDocs": 100,
  "limit": 20,
  "page": 1,
  "totalPages": 5,
  "hasNextPage": true,
  "hasPrevPage": false,
  "nextPage": 2,
  "prevPage": null
}
```

## Monitoreo y Logs

### Logs de Consola

El sistema incluye logs descriptivos:
- `[INFO]`: Información general
- `[ERROR]`: Errores del sistema
- `[DEBUG]`: Información de debugging
- `[AUTH]`: Eventos de autenticación
- `[DB]`: Eventos de base de datos

### Recomendaciones

- Usar herramientas como PM2 para gestión de procesos
- Configurar rotación de logs
- Monitorear métricas de servidor
- Configurar alertas para errores críticos

## Testing

### Endpoints de Prueba

```bash
# Health check
curl http://localhost:5000/health

# Filtrar perfiles
curl -X POST http://localhost:5000/api/filters/profiles \
  -H "Content-Type: application/json" \
  -d '{"category":"escort","limit":10}'

# Obtener perfil
curl http://localhost:5000/api/profiles/:id
```

## Contribución

### Convenciones de Código

- TypeScript estricto
- Nomenclatura en inglés para código
- Comentarios en español
- Interfaces con prefijo `I`
- Usar async/await sobre callbacks

### Estructura de Commits

```
tipo(módulo): descripción corta

Descripción larga (opcional)
```

Tipos: `feat`, `fix`, `docs`, `refactor`, `test`

---

**Versión**: 2.0.0  
**Última actualización**: Noviembre 2025  
**Mantenedor**: Equipo de Desarrollo
