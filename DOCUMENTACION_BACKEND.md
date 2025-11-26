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

**Sistema de Ordenamiento con Scoring Ponderado y Rotación Aleatoria**:

El motor de visibilidad asigna un **score numérico entero** a cada perfil basado en múltiples factores con pesos específicos que garantizan la jerarquía de niveles. Los perfiles se agrupan por nivel efectivo y dentro de cada nivel se aplica una lógica de ordenamiento especial.

#### **Componentes del Score (en orden de importancia)**:

1. **Nivel del Plan Base: 1,000,000 - 5,000,000 puntos**
   - Nivel 1: 5,000,000 puntos
   - Nivel 2: 4,000,000 puntos
   - Nivel 3: 3,000,000 puntos
   - Nivel 4: 2,000,000 puntos
   - Nivel 5: 1,000,000 puntos
   
   Este peso garantiza que **matemáticamente** un perfil de nivel inferior NUNCA supere a uno de nivel superior.

2. **Subcategorías (Saltos de 250,000 puntos)**:
   - **Nativo (sin upgrades)**: +500,000 puntos
   - **DESTACADO + IMPULSO**: +250,000 puntos
   - **DESTACADO solo**: +0 puntos
   
   **⚠️ Nota**: No puede existir "Nativo + IMPULSO" porque IMPULSO requiere DESTACADO activo, y DESTACADO hace que el perfil deje de ser nativo del nivel (lo sube 1 nivel). Por lo tanto, solo existen estas tres combinaciones posibles.
   
   Estas subcategorías permiten diferenciar perfiles dentro del mismo nivel efectivo.

3. **Duración del Plan: 0 - 249,000 puntos**
   - Máximo 249 días × 1,000 puntos
   - Ejemplo: 30 días = +30,000 puntos, 15 días = +15,000 puntos, 7 días = +7,000 puntos
   
   La duración se multiplica por 1,000 para dar peso suficiente dentro del mismo nivel, pero insuficiente para superar las subcategorías o cruzar niveles.


4. **Otros Upgrades: Variable**
   - Cada upgrade con `priorityBonus` suma: priorityBonus × 10,000 puntos
   - Típicamente entre 10,000 y 50,000 puntos adicionales

**⚠️ IMPORTANTE**: El cálculo del score **NO incluye penalización por recency** (visualizaciones recientes). Esto fue eliminado para evitar decimales que fragmentaban los grupos de shuffle, permitiendo grupos más grandes y estables para la rotación aleatoria.

**Ejemplo de Cálculo**:
```typescript
// Perfil: ESMERALDA 30 días + DESTACADO activo
effectiveLevel = 3 - 1 = 2  // DESTACADO sube 1 nivel
effectiveVariantDays = 30   // Mantiene duración original
isNative = false            // No es nativo del nivel 2
hasDestacado = true
hasImpulso = false

score = (6 - 2) * 1_000_000  // Nivel: 4,000,000
      + 0                    // DESTACADO solo: +0
      + (30 * 1_000)         // Duración: +30,000
      = 4,030,000 puntos

// Perfil: ORO 15 días sin upgrades (nativo)
effectiveLevel = 2
effectiveVariantDays = 15
isNative = true
hasImpulso = false

score = (6 - 2) * 1_000_000  // Nivel: 4,000,000
      + 500_000              // Nativo sin IMPULSO: +500,000
      + (15 * 1_000)         // Duración: +15,000
      = 4,515,000 puntos

// RESULTADO: ORO 15 nativo aparece ANTES que ESMERALDA+DESTACADO
// Los perfiles nativos tienen prioridad sobre los promovidos con DESTACADO
```

#### **Efecto de Upgrades en Nivel y Variante**:

**DESTACADO**:
- Sube el perfil **1 nivel** durante 24 horas desde activación
- **NO modifica** la variante de días (mantiene la duración original del plan)
- Ejemplo: ESMERALDA 30 (nivel 3, 30 días) → nivel 2, 30 días

**IMPULSO**:
- Requiere **DESTACADO activo** simultáneamente
- **NO modifica** el nivel ni la variante de días
- Su efecto principal es el **ordenamiento especial** (ver sección siguiente)

**Combinación DESTACADO + IMPULSO**:
```typescript
// Perfil: ESMERALDA 30 días original
Plan: ESMERALDA (nivel 3)
Variante: 30 días

// Usuario activa DESTACADO
effectiveLevel = 3 - 1 = 2  // Sube a nivel 2
effectiveVariantDays = 30   // Mantiene 30 días
isNative = false

// Usuario activa IMPULSO (requiere DESTACADO)
effectiveLevel = 2          // Mantiene nivel 2
effectiveVariantDays = 30   // Mantiene 30 días
hasImpulso = true

score = 4,000,000 (nivel 2)
      + 250,000 (DESTACADO + IMPULSO)
      + 30,000 (30 días)
      = 4,280,000 puntos
```

#### **Sistema de Ordenamiento Especial para IMPULSO**:

Los perfiles con **IMPULSO activo** tienen un tratamiento especial en el ordenamiento:

**1. Separación de Perfiles**:
- Los perfiles se separan en dos grupos: **con IMPULSO** y **sin IMPULSO**

**2. Ordenamiento de Perfiles con IMPULSO**:
- Se aplica **shuffle aleatorio** (Fisher-Yates con seed)
- **NO se ordenan por fecha de compra** ni por score
- La rotación cambia cada 15 minutos usando un seed determinístico
- Todos los perfiles con IMPULSO rotan de forma equitativa

**3. Ordenamiento de Perfiles sin IMPULSO**:
- Se agrupan por **score exacto**
- Dentro de cada grupo de score, se aplica **shuffle aleatorio** con el mismo seed
- Los grupos se ordenan por score (mayor a menor)

**4. Combinación Final**:
- Los perfiles con IMPULSO aparecen **primero**
- Seguidos por los perfiles sin IMPULSO ordenados por score

```typescript
// Ejemplo de ordenamiento dentro de un nivel:

// Perfiles con IMPULSO (shuffled aleatoriamente):
1. Perfil A (IMPULSO) - Score: 4,280,000
2. Perfil C (IMPULSO) - Score: 4,250,000
3. Perfil B (IMPULSO) - Score: 4,280,000

// Perfiles sin IMPULSO (agrupados por score y shuffled):
4. Perfil D (Score: 4,515,000) ← Grupo score alto
5. Perfil E (Score: 4,515,000) ← Mismo grupo, shuffled
6. Perfil F (Score: 4,030,000) ← Grupo score medio
7. Perfil G (Score: 4,030,000) ← Mismo grupo, shuffled
```

#### **Sistema de Rotación con Intervalos de 15 Minutos**:

El shuffle aleatorio usa **Fisher-Yates con seed determinístico**:

```typescript
// Seed basado en timestamp redondeado a intervalos de 15 minutos
seed = Math.floor(Date.now() / (15 * 60 * 1000))

// Ejemplo: 3 perfiles con IMPULSO
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
- ✅ Los perfiles con IMPULSO rotan equitativamente sin depender de fechas

#### **Algoritmo Completo**:

```typescript
1. Obtener perfiles visibles (isActive, visible, plan no expirado)

2. Para cada perfil:
   a. Calcular nivel y variante efectivos con upgrades
   b. Calcular score ponderado total (SIN recency penalty)

3. Agrupar perfiles por nivel efectivo

4. Para cada nivel:
   a. Separar perfiles con IMPULSO de los sin IMPULSO
   b. Shuffle perfiles con IMPULSO (seed de 15 min)
   c. Agrupar perfiles sin IMPULSO por score exacto
   d. Shuffle cada grupo de score (seed de 15 min)
   e. Ordenar grupos por score (DESC)
   f. Combinar: [IMPULSO shuffled] + [Sin IMPULSO por score]

5. Concatenar todos los niveles (nivel 1 primero, nivel 5 último)

6. Aplicar paginación

7. Actualizar lastShownAt de perfiles servidos
```

**Ejemplo Visual Completo**:
```
Entrada: 12 perfiles con diferentes planes y upgrades

Después del scoring y rotación:

┌─ NIVEL 1 (DIAMANTE) ───────────────────────────┐
│ 1. Ana       (DIAMANTE 30d)    ← Shuffled     │
│ 2. Juan      (DIAMANTE 30d)    seed 15min     │
│ 3. María     (DIAMANTE 15d)                    │
└────────────────────────────────────────────────┘

┌─ NIVEL 2 (ORO) ────────────────────────────────┐
│ === CON IMPULSO (Shuffled) ===                │
│ 4. Elena     (ESMERALDA+DESTACADO+IMPULSO)    │
│              Score: 4,280,000                  │
│                                                 │
│ === SIN IMPULSO (Por Score) ===               │
│ ┌─ Score: 4,515,000 ─────────────────────┐   │
│ │ 5. Diego   (ORO 15d nativo) ← Shuffled │   │
│ │ 6. Laura   (ORO 15d nativo)            │   │
│ └────────────────────────────────────────┘   │
│ ┌─ Score: 4,030,000 ─────────────────────┐   │
│ │ 7. Pedro   (ESMERALDA 30d+DESTACADO)   │   │
│ └────────────────────────────────────────┘   │
└────────────────────────────────────────────────┘

┌─ NIVEL 3 (ESMERALDA) ──────────────────────────┐
│ ┌─ Score: 3,530,000 ─────────────────────┐   │
│ │ 8. Ricardo   (ESMERALDA 30d) ← Shuffled│   │
│ │ 9. Valentina (ESMERALDA 30d)           │   │
│ └────────────────────────────────────────┘   │
└────────────────────────────────────────────────┘

┌─ NIVEL 5 (AMATISTA) ───────────────────────────┐
│ ┌─ Score: 1,507,000 ─────────────────────┐   │
│ │ 10. Andrea (AMATISTA 7d)   ← Shuffled  │   │
│ │ 11. Mateo  (AMATISTA 7d)               │   │
│ │ 12. Luis   (AMATISTA 7d)               │   │
│ └────────────────────────────────────────┘   │
└────────────────────────────────────────────────┘
```

**Factores que Afectan la Visibilidad**:
- ✅ Plan activo (no expirado)
- ✅ Nivel del plan (1-5) - **Factor más importante**
- ✅ Duración del plan (7, 15, 30+ días) - **Factor secundario**
- ✅ Upgrades activos:
  - **DESTACADO**: Sube 1 nivel (no modifica duración)
  - **IMPULSO**: Ordenamiento especial por shuffle (requiere DESTACADO)
- ✅ Otros upgrades con priorityBonus
- ✅ Intervalo de rotación actual (seed cada 15 minutos)
- ✅ Perfil activo (`isActive: true`)
- ✅ Perfil visible (`visible: true`)
- ✅ No eliminado (`isDeleted: false`)
- ❌ **NO se usa**: Penalización por visualizaciones recientes (eliminado)

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
