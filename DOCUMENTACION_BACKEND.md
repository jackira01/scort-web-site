# Documentación del Backend - Scort Web Site

## Índice
1. [Descripción General](#descripción-general)
2. [Stack Tecnológico](#stack-tecnológico)
3. [Configuración e Instalación](#configuración-e-instalación)
4. [Estructura del Proyecto](#estructura-del-proyecto)
5. [Módulos Principales](#módulos-principales)
6. [Sistema de Autenticación](#sistema-de-autenticación)
7. [Sistema de Email](#sistema-de-email)
8. [Almacenamiento de Archivos](#almacenamiento-de-archivos)
9. [Seguridad](#seguridad)
10. [Despliegue en CapRover](#despliegue-en-caprover)
11. [API Reference](#api-reference)

---

## Descripción General

Backend desarrollado con **Node.js**, **Express** y **TypeScript** para una plataforma de perfiles de acompañantes. El sistema incluye gestión completa de usuarios, perfiles, planes de suscripción, pagos con Stripe, verificaciones multi-paso, sistema de cupones, y un motor de filtros avanzado.

**Características Principales**:
- Sistema de autenticación con JWT
- Gestión de perfiles con verificación multi-paso
- Sistema de planes (FREE, BRONCE, PLATA, ORO, DIAMANTE)
- Upgrades (DESTACADO, IMPULSO)
- Sistema de pagos e invoices
- Motor de filtros avanzado
- Sistema de cupones y descuentos
- Email transaccional con Mailjet
- Almacenamiento en Cloudinary

---

## Stack Tecnológico

- **Runtime**: Node.js 18+
- **Framework**: Express 5.x
- **Lenguaje**: TypeScript
- **Base de Datos**: MongoDB 6.x con Mongoose ODM
- **Autenticación**: JWT (jsonwebtoken)
- **Email**: Mailjet
- **Almacenamiento**: Cloudinary
- **Caché**: Redis (ioredis)
- **Pagos**: Stripe (opcional)
- **Seguridad**: Helmet, express-rate-limit, bcryptjs
- **Validación**: express-validator, Zod
- **Gestión de Paquetes**: pnpm 10.x

---

## Configuración e Instalación

### Requisitos Previos

- Node.js 18+
- MongoDB 6.0+
- pnpm (gestor de paquetes)
- Redis (opcional, para caché)

### Instalación

```bash
# Instalar pnpm globalmente (si no lo tienes)
npm install -g pnpm

# Navegar a la carpeta backend
cd backend

# Instalar dependencias
pnpm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales
```

### Variables de Entorno

```env
# Base de datos
MONGODB_URI=mongodb://localhost:27017/scort-web-site

# Servidor
PORT=5000
NODE_ENV=development

# JWT
JWT_SECRET=tu_jwt_secret_super_seguro
JWT_EXPIRES_IN=7d

# Email (Mailjet)
MAILJET_API_KEY=tu_mailjet_api_key
MAILJET_SECRET_KEY=tu_mailjet_secret_key

# Cloudinary
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_cloudinary_api_key
CLOUDINARY_API_SECRET=tu_cloudinary_api_secret

# Frontend
FRONTEND_URL=http://localhost:3000

# Configuración de la empresa
COMPANY_EMAIL=contacto@tuempresa.com
COMPANY_NAME=Tu Empresa

# Redis (opcional)
REDIS_URL=redis://localhost:6379

# Stripe (opcional)
STRIPE_SECRET_KEY=tu_stripe_secret_key
STRIPE_WEBHOOK_SECRET=tu_webhook_secret
```

### Scripts de Desarrollo

```bash
# Desarrollo con hot-reload
pnpm dev

# Build para producción
pnpm build

# Iniciar en producción
pnpm start

# Limpiar build
pnpm clean
```

---

## Estructura del Proyecto

```
backend/
├── src/
│   ├── app.ts                    # Configuración de Express
│   ├── server.ts                 # Punto de entrada HTTP
│   ├── config/
│   │   └── db.ts                 # Configuración de MongoDB
│   ├── controllers/              # Controladores HTTP
│   │   ├── auth.controller.ts
│   │   ├── email.controller.ts
│   │   └── agency-conversion.controller.ts
│   ├── middlewares/              # Middlewares personalizados
│   │   ├── auth.middleware.ts    # Verificación JWT
│   │   ├── admin.middleware.ts   # Verificación de rol admin
│   │   ├── security.middleware.ts
│   │   ├── validation.middleware.ts
│   │   ├── visibility.middleware.ts
│   │   └── coupon.middleware.ts
│   ├── services/                 # Servicios compartidos
│   │   └── email.service.ts      # Servicio de emails con Mailjet
│   ├── jobs/                     # Trabajos programados
│   │   └── invoice-expiry.job.ts # Expiración de invoices
│   ├── routes/                   # Definición de rutas
│   ├── types/                    # Tipos TypeScript globales
│   ├── utils/                    # Utilidades y helpers
│   └── modules/                  # Módulos de negocio
│       ├── profile/              # Gestión de perfiles
│       ├── profile-verification/ # Verificación de perfiles
│       ├── rates/                # Sistema de valoraciones
│       ├── sponsored-profiles/   # Perfiles patrocinados
│       ├── systemConfig/         # Configuración del sistema
│       ├── user/                 # Gestión de usuarios
│       ├── validation/           # Validaciones personalizadas
│       └── visibility/           # Motor de visibilidad
├── .dockerignore                 # Exclusiones específicas del backend
├── .env.example                  # Template de variables de entorno
├── package.json
├── pnpm-lock.yaml
└── tsconfig.json
```

---

## Módulos Principales

### 1. Usuarios (`/modules/user`)

**Responsabilidades**:
- Registro y autenticación de usuarios
- Gestión de roles (user, admin, agency)
- Verificación de identidad con documentos
- Conversión de usuario a agencia
- Gestión de múltiples perfiles por usuario

**Modelo Principal**:
```typescript
interface IUser {
  email: string;
  password: string;
  name: string;
  role: 'user' | 'admin' | 'agency';
  accountType: 'personal' | 'agency';
  profiles: ObjectId[];
  isVerified: boolean;
  verification_in_progress: boolean;
  verificationDocument: string[]; // URLs de Cloudinary
  lastLogin: {
    date: Date;
    isVerified: boolean;
  };
  createdAt: Date;
}
```

**Endpoints Principales**:
- `POST /api/users/register` - Registrar nuevo usuario
- `POST /api/users/login` - Iniciar sesión (devuelve JWT)
- `GET /api/users/me` - Obtener usuario actual (auth requerido)
- `PUT /api/users/:id` - Actualizar usuario
- `GET /api/users/:id/profiles` - Obtener perfiles del usuario
- `DELETE /api/users/:id` - Eliminar usuario completamente
- `PUT /api/users/:id/last-login` - Actualizar último login

### 2. Perfiles (`/modules/profile`)

**Responsabilidades**:
- Creación y edición de perfiles
- Sistema de verificación multi-paso
- Asignación de planes de suscripción
- Gestión de upgrades (DESTACADO, IMPULSO)
- Control de visibilidad en búsquedas
- Media (fotos y videos en Cloudinary)

**Modelo Principal**:
```typescript
interface IProfile {
  user: ObjectId;
  name: string;
  age: string;
  category: string;
  gender: string;
  location: {
    country: { value: string; label: string };
    department: { value: string; label: string };
    city: { value: string; label: string };
  };
  description: string;
  features: {
    group_id: ObjectId;
    value: string | string[];
  }[];
  media: {
    photos: string[];
    videos: string[];
  };
  contact: {
    number: string;
    whatsapp: boolean;
    telegram: boolean;
    changedAt: Date;
  };
  socialMedia: {
    instagram?: string;
    twitter?: string;
    onlyfans?: string;
  };
  verification: ObjectId; // Referencia a ProfileVerification
  planAssignment: {
    planCode: string;
    startDate: Date;
    endDate: Date;
    isActive: boolean;
  };
  upgrades: {
    code: string; // 'DESTACADO' o 'IMPULSO'
    startAt: Date;
    endAt: Date;
  }[];
  visible: boolean;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: Date;
}
```

**Endpoints Principales**:
- `POST /api/profiles` - Crear perfil nuevo
- `GET /api/profiles` - Listar perfiles (paginado)
- `GET /api/profiles/:id` - Obtener perfil específico
- `PUT /api/profiles/:id` - Actualizar perfil
- `DELETE /api/profiles/:id` - Eliminar perfil (soft delete)
- `POST /api/profiles/:id/purchase-upgrade` - Comprar upgrade
- `POST /api/profiles/:profileId/assign-plan` - Asignar plan

### 3. Planes (`/modules/plans`)

**Responsabilidades**:
- Definición de planes de suscripción
- Configuración de características por plan
- Upgrades disponibles
- Reglas de visibilidad y posicionamiento

**Planes Disponibles**:

| Plan | Código | Precio | Duración | Características |
|------|--------|--------|----------|-----------------|
| FREE | FREE | $0 | 30 días | Básico, límite de fotos/videos |
| BRONCE | BRONCE | Variable | 30 días | Más fotos/videos |
| PLATA | PLATA | Variable | 30 días | Mayor visibilidad |
| ORO | ORO | Variable | 30 días | Prioridad en búsquedas |
| DIAMANTE | DIAMANTE | Variable | 30 días | Incluye DESTACADO automático |

**Upgrades Disponibles**:
- **DESTACADO**: Perfil destacado en listados
- **IMPULSO**: Impulso temporal en posicionamiento

**Modelo**:
```typescript
interface IPlan {
  name: string;
  code: string;
  price: number;
  duration: number; // días
  features: {
    maxPhotos: number;
    maxVideos: number;
    highlighted: boolean;
    prioritySupport: boolean;
  };
  active: boolean;
}
```

**Endpoints**:
- `GET /api/plans` - Listar planes disponibles
- `GET /api/plans/:id` - Obtener plan específico
- `GET /api/upgrades` - Listar upgrades disponibles

### 4. Verificación de Perfiles (`/modules/profile-verification`)

**Responsabilidades**:
- Verificación de identidad de perfiles
- Sistema de pasos múltiples
- Validación de documentos
- Estados de verificación

**Pasos de Verificación**:
1. **Documento de identidad (frente)**: Foto clara del frente del documento
2. **Foto con documento al lado del rostro**: Selfie con documento visible
3. **Foto/video con cartel de verificación**: Cartel con nombre y fecha
4. **Video de verificación**: Video confirmando identidad
5. **Documento de identidad (reverso)**: Foto del reverso del documento

**Estados**:
- `pending`: Pendiente de verificación
- `in_progress`: En proceso de revisión
- `verified`: Verificado exitosamente
- `rejected`: Rechazado

**Modelo**:
```typescript
interface IProfileVerification {
  profile: ObjectId;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  verificationProgress: number; // 0-100
  steps: {
    documentFront: { isVerified: boolean; imageUrl?: string };
    documentWithFace: { isVerified: boolean; imageUrl?: string };
    verificationPhoto: { isVerified: boolean; imageUrl?: string };
    verificationVideo: { isVerified: boolean; videoUrl?: string };
    documentBack: { isVerified: boolean; imageUrl?: string };
    lastLogin: { isVerified: boolean; date?: Date };
  };
  rejectionReason?: string;
  verifiedAt?: Date;
}
```

### 5. Filtros (`/modules/filters`)

**Responsabilidades**:
- Motor de búsqueda avanzado
- Filtrado por múltiples criterios
- Conteo de resultados
- Optimización de consultas

**Filtros Disponibles**:
- Categoría (escort, masajista, etc.)
- Género (femenino, masculino, trans, etc.)
- Ubicación (país, departamento, ciudad)
- Edad (rango mín-máx)
- Atributos dinámicos por categoría
- Planes activos
- Estado de verificación
- Disponibilidad

**Endpoints**:
- `POST /api/filters/profiles` - Filtrar perfiles
- `POST /api/filters/profiles/count` - Contar resultados
- `GET /api/filters/options` - Opciones de filtros disponibles

**Ejemplo de Uso**:
```javascript
POST /api/filters/profiles
{
  "category": "escort",
  "gender": "female",
  "location": {
    "department": "bogota",
    "city": "chapinero"
  },
  "age": {
    "min": 18,
    "max": 30
  },
  "features": {
    "servicio": ["a-domicilio", "hotel"]
  },
  "page": 1,
  "limit": 20
}
```

### 6. Pagos e Invoices (`/modules/payments`)

**Responsabilidades**:
- Generación de facturas
- Estados de pago
- Integración con Stripe (opcional)
- Mensajes de WhatsApp automáticos
- Expiración de invoices

**Características**:
- Múltiples conceptos (planes, upgrades, verificación)
- Estados: pending, paid, cancelled
- Notificaciones automáticas
- Generación de links de pago WhatsApp

**Modelo**:
```typescript
interface IInvoice {
  user: ObjectId;
  profile?: ObjectId;
  concept: 'plan' | 'upgrade' | 'verification';
  amount: number;
  status: 'pending' | 'paid' | 'cancelled';
  paymentMethod?: string;
  details: {
    planCode?: string;
    upgradeCode?: string;
    duration?: number;
  };
  whatsappData?: {
    phoneNumber: string;
    message: string;
  };
  expiresAt: Date;
  paidAt?: Date;
  createdAt: Date;
}
```

**Endpoints**:
- `POST /api/invoices` - Crear invoice
- `GET /api/invoices/:id` - Obtener invoice
- `PUT /api/invoices/:id/pay` - Marcar como pagado
- `GET /api/invoices/user/:userId` - Invoices por usuario

### 7. Cupones (`/modules/coupons`)

**Responsabilidades**:
- Sistema de cupones de descuento
- Validaciones de uso
- Restricciones por plan/upgrade
- Límites de uso

**Tipos de Cupones**:
- Porcentaje de descuento
- Monto fijo
- Específico por plan
- Específico por upgrade

**Validaciones**:
- Fecha de expiración
- Límite de usos totales
- Límite de usos por usuario
- Restricciones por tipo de concepto
- Usuario único/múltiple

**Modelo**:
```typescript
interface ICoupon {
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  description: string;
  validFrom: Date;
  validTo: Date;
  maxUses?: number;
  usedCount: number;
  usesPerUser: number;
  applicableTo: {
    plans?: string[];
    upgrades?: string[];
  };
  active: boolean;
}
```

### 8. Parámetros de Configuración (`/modules/config-parameter`)

**Responsabilidades**:
- Configuración dinámica del sistema
- Parámetros de la empresa
- Límites de perfiles
- Plan por defecto

**Parámetros Principales**:
- `company.email`: Email de la empresa
- `company.name`: Nombre de la empresa
- `default.plan.code`: Plan asignado por defecto
- `profile.limits.max`: Límite máximo de perfiles por usuario
- `agency.profile.limits.max`: Límite para agencias

**Endpoints**:
- `GET /api/config-parameters/:key` - Obtener valor
- `PUT /api/config-parameters/:key` - Actualizar valor (admin)

### 9. Motor de Visibilidad (`/modules/visibility`)

**Responsabilidades**:
- Control de visibilidad de perfiles en home y filtros
- Ordenamiento jerárquico por niveles y variantes
- Rotación consistente por intervalos de 15 minutos
- Aplicación de efectos de upgrades (DESTACADO, IMPULSO)
- Integración con planes y upgrades

**Sistema de Ordenamiento con Scoring Ponderado**:

El motor de visibilidad asigna un **score numérico** a cada perfil basado en múltiples factores con pesos específicos que garantizan la jerarquía de niveles:

#### **Componentes del Score (en orden de importancia)**:

1. **Nivel del Plan Base: 1,000,000 - 5,000,000 puntos**
   - Nivel 1: 5,000,000 puntos
   - Nivel 2: 4,000,000 puntos
   - Nivel 3: 3,000,000 puntos
   - Nivel 4: 2,000,000 puntos
   - Nivel 5: 1,000,000 puntos
   
   Este peso garantiza que **matemáticamente** un perfil de nivel inferior NUNCA supere a uno de nivel superior.

2. **Variante de Duración: 10,000 - 30,000 puntos**
   - 30 días: +30,000 puntos
   - 15 días: +20,000 puntos
   - 7 días: +10,000 puntos
   
   Peso suficiente para diferenciar variantes dentro del mismo nivel, pero insuficiente para cruzar niveles.

3. **Upgrades Especiales: +100 a +200 puntos**
   - **DESTACADO + IMPULSO activos**: +200 puntos
   - **DESTACADO solo**: +100 puntos
   - **Otros upgrades**: priorityBonus × 10 (típicamente 10-50 puntos)
   
   Ventaja visible pero que no rompe la jerarquía de niveles.

4. **Penalización por Visualizaciones Recientes: -1 a -50 puntos**
   - Basado en vistas recientes (últimas 24 horas)
   - Evita que los mismos perfiles aparezcan siempre primero

**Ejemplo de Cálculo**:
```typescript
// Perfil: ESMERALDA 30 días + DESTACADO activo
effectiveLevel = 3 - 1 = 2  // DESTACADO sube 1 nivel
effectiveVariant = 7         // DESTACADO asigna 7 días por 24h

score = (6 - 2) * 1_000_000  // Nivel: 4,000,000
      + (7 === 7 ? 10_000 : 0)  // Variante 7 días: +10,000
      + 100                    // DESTACADO: +100
      - 0                      // Sin penalización
      = 4,010,100 puntos

// Perfil: ORO 15 días sin upgrades
effectiveLevel = 2
effectiveVariant = 15

score = (6 - 2) * 1_000_000  // Nivel: 4,000,000
      + (15 === 15 ? 20_000 : 0)  // Variante 15 días: +20,000
      + 0                      // Sin upgrades
      - 0                      // Sin penalización
      = 4,020,000 puntos

// RESULTADO: ORO 15 aparece ANTES que ESMERALDA+DESTACADO
// Ambos están en nivel 2, pero ORO 15 tiene mejor variante (+20K vs +10K)
```

#### **Efecto de Upgrades en Nivel y Variante**:

**DESTACADO**:
- Sube el perfil **1 nivel** durante 24 horas desde activación
- Asigna variante de **7 días** en el nuevo nivel
- Ejemplo: ESMERALDA 30 (nivel 3) → ORO 7 (nivel 2)

**IMPULSO**:
- Requiere **DESTACADO activo** simultáneamente
- Mejora variante de **7 días a 15 días**
- Ejemplo: ORO 7 + IMPULSO → ORO 15

**Combinación DESTACADO + IMPULSO**:
```typescript
// Perfil: ESMERALDA 30 días original
Plan: ESMERALDA (nivel 3)
Variante: 30 días

// Usuario activa DESTACADO
effectiveLevel = 3 - 1 = 2  // Sube a nivel 2 (ORO)
effectiveVariant = 7         // Se asigna 7 días
// Resultado temporal: ORO 7

// Usuario activa IMPULSO (requiere DESTACADO)
effectiveLevel = 2           // Mantiene nivel 2
effectiveVariant = 15        // Mejora de 7 a 15 días
// Resultado temporal: ORO 15

score = 4,000,000 (nivel 2)
      + 20,000 (variante 15)
      + 200 (DESTACADO + IMPULSO)
      = 4,020,200 puntos
```

#### **Sistema de Rotación con Intervalos de 15 Minutos**:

Los perfiles con **el mismo score** se agrupan y rotan usando **Fisher-Yates shuffle con seed**:

```typescript
// Seed basado en timestamp redondeado a intervalos de 15 minutos
seed = Math.floor(Date.now() / (15 * 60 * 1000))

// Ejemplo: 3 perfiles con score 4,020,000
Intervalo 09:00-09:14: [María, Juan, Ana]
Intervalo 09:15-09:29: [Ana, María, Juan]  ← Cambio de orden
Intervalo 09:30-09:44: [Juan, Ana, María]  ← Nuevo cambio
```

**Ventajas**:
- ✅ El orden permanece **consistente** durante 15 minutos
- ✅ Todos los usuarios ven el **mismo orden** en el mismo intervalo
- ✅ Evita cambios aleatorios en cada request
- ✅ No requiere Redis ni caché externa (usa seed determinístico)
- ✅ Rotación justa que previene perfiles "estancados"

#### **Algoritmo Completo**:

```typescript
1. Obtener perfiles visibles (isActive, visible, plan no expirado)

2. Para cada perfil:
   a. Calcular nivel y variante efectivos con upgrades
   b. Calcular score ponderado total

3. Agrupar perfiles por score exacto

4. Para cada grupo:
   a. Aplicar shuffle con seed basado en intervalo de 15 min
   b. Ordenar por lastShownAt (ASC) para favorecer no mostrados

5. Ordenar grupos por score (DESC)

6. Concatenar todos los perfiles respetando jerarquía

7. Aplicar paginación

8. Actualizar lastShownAt de perfiles servidos
```

**Ejemplo Visual Completo**:
```
Entrada: 12 perfiles con diferentes planes y upgrades

Después del scoring y rotación:

┌─ SCORE: 5,030,200 ─────────────────────────────┐
│ 1. Ana       (DIAMANTE 30d)    ← Aleatorio    │
│ 2. Juan      (DIAMANTE 30d)    seed 15min     │
└────────────────────────────────────────────────┘

┌─ SCORE: 5,020,000 ─────────────────────────────┐
│ 3. María     (DIAMANTE 15d)                    │
└────────────────────────────────────────────────┘

┌─ SCORE: 4,020,200 ─────────────────────────────┐
│ 4. Elena     (ESMERALDA 30d + DESTACADO+IMPULSO) │
│              → ORO 15 (nivel 2, 15 días)       │
└────────────────────────────────────────────────┘

┌─ SCORE: 4,020,000 ─────────────────────────────┐
│ 5. Diego     (ORO 15d)         ← Aleatorio     │
│ 6. Laura     (ORO 15d)         seed 15min      │
└────────────────────────────────────────────────┘

┌─ SCORE: 4,010,100 ─────────────────────────────┐
│ 7. Pedro     (IRIS 7d + DESTACADO)             │
│              → ORO 7 (nivel 2, 7 días)         │
└────────────────────────────────────────────────┘

┌─ SCORE: 3,030,000 ─────────────────────────────┐
│ 8. Ricardo   (ESMERALDA 30d)   ← Aleatorio     │
│ 9. Valentina (ESMERALDA 30d)   seed 15min      │
└────────────────────────────────────────────────┘

┌─ SCORE: 1,010,000 ─────────────────────────────┐
│ 10. Andrea   (AMATISTA 7d)     ← Aleatorio     │
│ 11. Mateo    (AMATISTA 7d)     seed 15min      │
│ 12. Luis     (AMATISTA 7d)                     │
└────────────────────────────────────────────────┘
```

**Factores que Afectan la Visibilidad**:
- ✅ Plan activo (no expirado)
- ✅ Nivel del plan (1-5) - **Factor más importante**
- ✅ Variante de días (7, 15, 30) - **Factor secundario**
- ✅ Upgrades activos (DESTACADO: -1 nivel + 7 días, IMPULSO: 7→15 días)
- ✅ Otros upgrades con priorityBonus
- ✅ Visualizaciones recientes (penalización leve)
- ✅ Intervalo de rotación actual (seed cada 15 minutos)
- ✅ Perfil activo (`isActive: true`)
- ✅ Perfil visible (`visible: true`)
- ✅ No eliminado (`isDeleted: false`)
- ✅ Tiempo desde última visualización (`lastShownAt`)

**Endpoints que Usan el Motor de Visibilidad**:
- `GET /api/profiles/home` - Perfiles para la página principal
- `POST /api/filters/profiles` - Búsqueda con filtros
- `GET /api/sponsored-profiles` - Perfiles patrocinados

**Archivos Clave**:
- `backend/src/modules/visibility/visibility.service.ts` - Lógica principal
- `backend/src/modules/profile/profile.service.ts` - Integración con perfiles
- `backend/src/modules/filters/filters.service.ts` - Integración con filtros

### 10. Atributos (`/modules/attribute-group`)

**Responsabilidades**:
- Gestión de categorías
- Gestión de géneros
- Atributos dinámicos por categoría
- Servicios disponibles

**Estructura**:
```typescript
interface IAttributeGroup {
  name: string;
  key: string; // 'category', 'gender', 'servicio', etc.
  variants: {
    label: string;
    value: string;
    active: boolean;
  }[];
  order: number;
}
```

**Ejemplos**:
- **Categorías**: escort, masajista, modelo, etc.
- **Géneros**: femenino, masculino, trans, etc.
- **Servicios**: a-domicilio, hotel, virtual, etc.

---

## Sistema de Autenticación

### JWT (JSON Web Tokens)

El sistema usa JWT para autenticación stateless.

**Flow de Autenticación**:

1. **Registro/Login**: Usuario envía credenciales
2. **Generación de Token**: Backend genera JWT con payload:
   ```javascript
   {
     userId: string,
     email: string,
     role: 'user' | 'admin' | 'agency'
   }
   ```
3. **Envío al Cliente**: Token enviado en respuesta
4. **Almacenamiento**: Cliente guarda token (localStorage, cookie)
5. **Requests Subsecuentes**: Token enviado en header:
   ```
   Authorization: Bearer <token>
   ```
6. **Verificación**: Middleware verifica token en cada request

### Middlewares de Autenticación

**authMiddleware**: Verifica que el token JWT sea válido
```typescript
// Uso: Proteger rutas que requieren autenticación
router.get('/protected', authMiddleware, controller);
```

**adminMiddleware**: Verifica que el usuario tenga rol de administrador
```typescript
// Uso: Solo administradores
router.post('/admin-only', authMiddleware, adminMiddleware, controller);
```

**Ejemplo de Protección de Rutas**:
```typescript
// Ruta pública
router.get('/public', publicController);

// Ruta requiere autenticación
router.get('/profile', authMiddleware, getProfile);

// Ruta solo para admins
router.delete('/users/:id', authMiddleware, adminMiddleware, deleteUser);
```

---

## Sistema de Email

### Servicio de Email (Mailjet)

El sistema usa **Mailjet** para envío de emails transaccionales.

**Clase Principal**: `EmailService` (`/src/services/email.service.ts`)

**Tipos de Email Implementados**:

1. **Email de Bienvenida**: Al registrarse
2. **Verificación de Email**: Código de verificación
3. **Notificación de Verificación de Perfil**: Cuando se actualiza verificación
4. **Notificación de Actualización de Documentos**: Cuando usuario actualiza documentos
5. **Recordatorios de Factura**: Facturas pendientes

**Métodos Principales**:

```typescript
class EmailService {
  // Enviar email simple
  async sendSingleEmail(request: SingleEmailRequest): Promise<EmailResponse>
  
  // Enviar emails en bulk
  async sendBulkEmail(request: BulkEmailRequest): Promise<BulkEmailResponse>
  
  // Enviar notificación de verificación de perfil
  async sendProfileVerificationNotification(
    profileName: string,
    profileId: string,
    changes: string
  ): Promise<EmailResponse>
  
  // Enviar notificación de actualización de documentos de usuario
  async sendUserVerificationUpdateNotification(
    userName: string,
    userEmail: string,
    userId: string
  ): Promise<EmailResponse>
  
  // Enviar código de verificación
  async sendEmailVerificationCode(
    email: string,
    code: string,
    userName?: string
  ): Promise<EmailResponse>
}
```

**Ejemplo de Uso**:
```typescript
import EmailService from './services/email.service';

const emailService = new EmailService();

// Enviar notificación
await emailService.sendUserVerificationUpdateNotification(
  'Juan Pérez',
  'juan@example.com',
  '507f1f77bcf86cd799439011'
);
```

**Configuración**:
- Variables de entorno: `MAILJET_API_KEY`, `MAILJET_SECRET_KEY`
- Email de la empresa: `COMPANY_EMAIL`
- Nombre de la empresa: `COMPANY_NAME`

---

## Almacenamiento de Archivos

### Cloudinary

Todas las imágenes y videos se almacenan en **Cloudinary**.

**Configuración**:
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

**Características**:
- Carpetas organizadas por tipo (perfiles, documentos, etc.)
- Transformaciones automáticas de imágenes
- URLs optimizadas con CDN
- Compresión automática
- Formatos responsivos (webp, etc.)

**Tipos de Archivos**:
- Fotos de perfil
- Videos de perfil
- Documentos de identidad (verificación)
- Fotos de verificación

**URLs Generadas**:
```
https://res.cloudinary.com/[cloud_name]/image/upload/v[version]/[folder]/[filename]
```

---

## Seguridad

### Implementaciones de Seguridad

**Helmet**: Headers de seguridad HTTP
- Content Security Policy
- X-Frame-Options
- X-XSS-Protection
- HSTS

**CORS**: Configurado para permitir solo el frontend
```typescript
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
```

**Rate Limiting**: Protección contra ataques DDoS
```typescript
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // límite de requests
});
```

**Bcrypt**: Hash de contraseñas
- Sal aleatoria por contraseña
- 10 rondas de hashing

**JWT**: Tokens con expiración
- Tokens firmados con secret
- Expiración configurable (7 días por defecto)

**Validación de Inputs**: express-validator y Zod
- Sanitización de datos
- Validación de tipos
- Prevención de inyección

**Usuario no-root en Docker**:
- Contenedor corre con usuario no privilegiado
- Mayor seguridad en producción

### Best Practices Implementadas

✅ Variables de entorno para secrets  
✅ HTTPS en producción (Let's Encrypt)  
✅ Validación estricta de inputs  
✅ Sanitización de datos HTML  
✅ Logging de actividades sensibles  
✅ Separación de concerns (MVC)  
✅ Principio de menor privilegio  
✅ Auditoría de dependencias  

---

## Despliegue en CapRover

### Arquitectura de Archivos (Monorepo)

Este proyecto usa una configuración **centralizada en la raíz** para despliegues con CapRover, siguiendo el **Enfoque 2** recomendado para monorepos.

**Estructura de Archivos**:

```
SCORT-WEB-SITE/                        # 🔹 Raíz del proyecto
├── Dockerfile                         # ✅ Dockerfile centralizado
├── captain-definition-backend         # ✅ Configuración CapRover para backend
├── .dockerignore                      # ✅ Exclusiones globales
├── backend/                           # 📁 Código del backend
│   ├── src/
│   ├── package.json
│   ├── pnpm-lock.yaml
│   └── .dockerignore                 # Exclusiones específicas del backend
└── frontend/                          # 📁 Código del frontend
    └── ...
```

**⚠️ Nota Importante**: Los archivos `Dockerfile` y `captain-definition-backend` están en la **raíz del proyecto**, NO dentro de `backend/`. Esto es el enfoque recomendado para monorepos.

### Archivos de Configuración

**1. captain-definition-backend** (en la raíz):
```json
{
  "schemaVersion": 2,
  "dockerfilePath": "./Dockerfile",
  "imageName": "scort-web-backend"
}
```

**2. Dockerfile** (en la raíz):

```dockerfile
# Etapa base: instala dependencias
FROM node:18-alpine AS base
RUN npm install -g pnpm@10.13.1
WORKDIR /app
COPY ./backend/package.json ./backend/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Etapa builder: compila TypeScript
FROM base AS builder
COPY ./backend .
RUN pnpm run build:prod

# Etapa producción: imagen final optimizada
FROM node:18-alpine AS production
RUN npm install -g pnpm@10.13.1
WORKDIR /app
COPY ./backend/package.json ./backend/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod --ignore-scripts
COPY --from=builder /app/dist ./dist

# Usuario no-root para seguridad
RUN addgroup -g 1001 -S nodejs \
 && adduser -S backend -u 1001 \
 && mkdir -p /app/logs \
 && chown -R backend:nodejs /app/logs
USER backend

EXPOSE 5000
ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 5000) + '/ping', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["pnpm", "run", "start:prod"]
```

**3. .dockerignore** (en la raíz):
```
node_modules
frontend/
.git
.env
.env.*
*.log
.DS_Store
coverage
```

### Pasos de Despliegue

```bash
# 1. Instalar CLI de CapRover
npm install -g caprover

# 2. Login en tu servidor CapRover
caprover login

# 3. Deploy desde la RAÍZ del proyecto (NO desde backend/)
cd SCORT-WEB-SITE
caprover deploy -c captain-definition-backend

# ⚠️ Importante: El contexto debe ser la raíz del proyecto
```

**Notas Críticas**:
- ✅ Ejecutar `caprover deploy` desde la **raíz del proyecto**
- ✅ Usar el flag `-c captain-definition-backend` para especificar el archivo de definición
- ✅ El contexto de Docker es la raíz, permitiendo copiar desde `./backend/`
- ❌ NO hacer `cd backend` antes de desplegar

### Variables de Entorno en CapRover

Configurar en **App Configs → Environment Variables**:

```env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/scort-web-site
JWT_SECRET=tu_jwt_secret_super_seguro
JWT_EXPIRES_IN=7d
MAILJET_API_KEY=tu_mailjet_api_key
MAILJET_SECRET_KEY=tu_mailjet_secret_key
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_cloudinary_api_key
CLOUDINARY_API_SECRET=tu_cloudinary_api_secret
FRONTEND_URL=https://tu-frontend.com
COMPANY_EMAIL=contacto@tuempresa.com
COMPANY_NAME=Tu Empresa
NODE_ENV=production
PORT=5000
```

### Health Check

El Dockerfile incluye un health check que verifica el endpoint `/ping` cada 30 segundos.

**Asegúrate de tener este endpoint en tu backend**:
```typescript
app.get('/ping', (req, res) => {
  res.status(200).json({ status: 'ok' });
});
```

### SSL/HTTPS

CapRover incluye **Let's Encrypt** para SSL automático:
1. Ve a **HTTP Settings** en tu app
2. Agrega tu dominio personalizado
3. Habilita "Enable HTTPS"
4. Habilita "Force HTTPS"

### Comandos Útiles

```bash
# Ver logs en tiempo real
caprover logs --app scort-backend --follow

# Ver logs de las últimas 100 líneas
caprover logs --app scort-backend --lines 100

# Restart de la app
caprover restart --app scort-backend

# Ver información de la app
caprover info --app scort-backend
```

---

## API Reference

### Formato de Respuestas Estándar

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

Todas las listas usan paginación con este formato:

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

**Parámetros de Query**:
- `page`: Número de página (default: 1)
- `limit`: Items por página (default: 20)
- `sort`: Campo de ordenamiento
- `order`: Dirección (asc, desc)

### Headers Requeridos

**Autenticación**:
```
Authorization: Bearer <jwt_token>
```

**Content-Type**:
```
Content-Type: application/json
```

---


## Cambios recientes en visibilidad y upgrades (Noviembre 2025)

### 1. Nuevo ordenamiento de perfiles con IMPULSO

Los perfiles que tienen el upgrade IMPULSO activo ya no se ordenan por score, sino exclusivamente por la fecha de compra del IMPULSO:

- **Perfiles con IMPULSO**: Se agrupan y se ordenan por `impulsoPurchaseDate` (más reciente primero).
- Solo un nuevo IMPULSO puede mover la posición de otro perfil con IMPULSO. El score y el shuffle no afectan el orden de estos perfiles mientras el upgrade esté activo.
- Cuando expira el IMPULSO, el perfil vuelve a la lógica de score y rotación normal.

### 2. Lógica de upgrades y reglas

- **DESTACADO**: Sube el perfil 1 nivel y le asigna variante de 7 días durante 24h.
- **IMPULSO**: Requiere DESTACADO activo. El perfil se posiciona en el primer lugar de su grupo, pero solo puede ser desplazado por un IMPULSO más reciente.
- La combinación DESTACADO + IMPULSO otorga máxima prioridad temporal, pero el orden entre perfiles con ambos upgrades depende únicamente de la fecha de compra del IMPULSO.

### 3. Cambios en la API de upgrades

- El endpoint para obtener upgrades disponibles ahora es `/api/plans/upgrades`.
- El frontend debe consumir este endpoint para mostrar los upgrades en el modal de compra y administración.

### 4. Visualización y rotación

- Los perfiles sin upgrades siguen la lógica de score ponderado y rotación por intervalos de 15 minutos (Fisher-Yates shuffle con seed).
- Los upgrades no afectan la rotación de los perfiles con IMPULSO activo, solo la fecha de compra.

### 5. Ejemplo de ordenamiento actualizado

```
// Perfiles con IMPULSO activo:
1. Perfil A (IMPULSO comprado 25/11/2025 10:00)
2. Perfil B (IMPULSO comprado 25/11/2025 09:00)
3. Perfil C (IMPULSO comprado 24/11/2025 22:00)

// Perfiles sin IMPULSO:
... (ordenados por score y rotación)
```

### 6. Consideraciones adicionales

- El sistema garantiza que ningún perfil de nivel inferior supere a uno de nivel superior, salvo por upgrades activos.
- La lógica de upgrades y ordenamiento se encuentra en `backend/src/modules/visibility/visibility.service.ts`.

---
## Monitoreo y Logs

### Logs de Consola

El sistema incluye logs descriptivos con prefijos:

- `[INFO]`: Información general
- `[ERROR]`: Errores del sistema
- `[DEBUG]`: Información de debugging
- `[AUTH]`: Eventos de autenticación
- `[DB]`: Eventos de base de datos
- `[PAYMENT]`: Transacciones de pago

**Ejemplo**:
```
[INFO] Server started on port 5000
[DB] MongoDB connected successfully
[AUTH] User logged in: user@example.com
[ERROR] Failed to process payment: Invalid card
```

### Recomendaciones de Monitoreo

- **PM2**: Para gestión de procesos en producción
- **Winston/Pino**: Logging estructurado
- **Sentry**: Tracking de errores
- **Prometheus**: Métricas del sistema
- **Grafana**: Dashboards de monitoreo

---

## Contribución

### Convenciones de Código

- **Lenguaje**: TypeScript estricto
- **Nomenclatura**: Inglés para código, español para comentarios
- **Interfaces**: Prefijo `I` (ej: `IUser`, `IProfile`)
- **Async/Await**: Preferir sobre callbacks
- **Modularidad**: Separación clara de concerns

### Estructura de Commits

```
tipo(módulo): descripción corta

Descripción larga (opcional)

Referencia a issue (opcional): #123
```

**Tipos**: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`

**Ejemplos**:
```
feat(auth): agregar autenticación con JWT
fix(profiles): corregir filtro por ubicación
docs(readme): actualizar instrucciones de instalación
refactor(users): simplificar lógica de validación
```

---

## Recursos Adicionales

### Documentación Externa

- [Express.js Docs](https://expressjs.com/)
- [Mongoose Docs](https://mongoosejs.com/)
- [JWT.io](https://jwt.io/)
- [Mailjet API](https://dev.mailjet.com/)
- [Cloudinary Docs](https://cloudinary.com/documentation)
- [CapRover Docs](https://caprover.com/docs/)

### Soporte

Para preguntas o problemas:
- **Email**: ${COMPANY_EMAIL}
- **GitHub Issues**: Repositorio del proyecto

---

**Versión**: 2.0.0  
**Última Actualización**: Noviembre 2025  
**Mantenedor**: Equipo de Desarrollo
