# Documentación General del Proyecto - Scort Web Site

## Índice
1. [Descripción General](#descripción-general)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Sistema de Autenticación y Registro](#sistema-de-autenticación-y-registro)
4. [Infraestructura](#infraestructura)
5. [Configuración de Redis](#configuración-de-redis)
6. [Sistema de Cupones](#sistema-de-cupones)
7. [Sistema de Rotación de Perfiles](#sistema-de-rotación-de-perfiles)
8. [Migración de Ubicaciones](#migración-de-ubicaciones)
9. [Despliegue](#despliegue)
10. [Troubleshooting](#troubleshooting)

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

## Sistema de Autenticación y Registro

### Descripción General

El sistema de autenticación es un flujo híbrido que soporta dos mecanismos de registro y login:

1. **Registro directo con email**: El usuario proporciona email y contraseña, con posterior verificación por código
2. **Registro/Login con Google OAuth**: Autenticación mediante Google usando Google Sign-In

El sistema utiliza **NextAuth.js** en el frontend para gestionar sesiones y **JWT** en el backend para tokens de acceso.

---

### Diagrama de Flujo General

```
┌──────────────────────────────────────────────────────────────┐
│                   USUARIO EN FRONTEND (Next.js)              │
└────────────────┬─────────────────────────────┬───────────────┘
                 │                             │
        ┌────────▼────────┐          ┌────────▼────────┐
        │ Opción 1:       │          │ Opción 2:       │
        │ Email + Pass    │          │ Google OAuth    │
        └────────┬────────┘          └────────┬────────┘
                 │                             │
                 │ POST /api/user/register     │ Redirige a Google
                 │                             │
        ┌────────▼─────────────────────────────▼────────┐
        │    BACKEND (Node.js + Express)                │
        │ - Crear usuario o verificar existencia        │
        │ - Hashear contraseña (bcrypt, 12 rounds)      │
        │ - Guardar en MongoDB                          │
        │ - Generar token JWT                           │
        │ - Enviar correo de verificación               │
        └────────┬─────────────────────────────────────┘
                 │
        ┌────────▼─────────────────────────────┐
        │    NEXTAUTH.JS (Callback signIn)     │
        │ - Procesa respuesta del backend      │
        │ - Actualiza sesión JWT               │
        │ - Redirige a aplicación              │
        └────────┬─────────────────────────────┘
                 │
        ┌────────▼─────────────────────────────┐
        │  Usuario autenticado en la app       │
        │  Acceso a recursos protegidos        │
        └─────────────────────────────────────┘
```

---

### 1. Modelo de Datos de Usuario (MongoDB)

#### Esquema Completo

```typescript
interface IUser {
  // Autenticación básica
  email: string;                      // Único, requerido, en minúsculas
  password?: string;                  // Hash bcrypt, solo para credentials
  name: string;                       // Nombre del usuario
  image?: string;                     // URL de foto de perfil
  
  // Verificación y proveedores
  providers: string[];                // ['google'], ['credentials'], o ambos
  hasPassword: boolean;               // ¿Tiene contraseña configurada?
  emailVerified?: Date;               // Timestamp de verificación
  isVerified: boolean;                // ¿Cuenta verificada?
  verification_in_progress?: boolean; // En proceso de verificación
  
  // Roles y permisos
  role: 'admin' | 'user' | 'guest';  // Rol del usuario
  accountType: 'common' | 'agency';   // Tipo de cuenta
  
  // Información de agencia (opcional)
  agencyInfo?: {
    businessName?: string;
    businessDocument?: string;
    conversionRequestedAt?: Date;
    conversionApprovedAt?: Date;
    conversionApprovedBy?: ObjectId;
    conversionStatus: 'pending' | 'approved' | 'rejected';
    rejectionReason?: string;
  };
  
  // Recuperación de contraseña
  resetPasswordCode?: string;         // Código OTP de 6 dígitos
  resetPasswordExpires?: Date;        // Expira en 15 minutos
  resetPasswordToken?: string;        // Token temporal para cambio
  resetPasswordTokenExpires?: Date;   // Expira en 10 minutos
  
  // Auditoría
  lastLogin: {
    date: Date;                       // Fecha del último login
    isVerified: boolean;              // ¿Verificado en ese login?
  };
  
  // Relaciones
  profiles: ObjectId[];               // IDs de perfiles del usuario
  verificationDocument?: string[];    // Documentos de verificación
}
```

#### Índices de Base de Datos

```mongodb
// Búsquedas por usuario verificado
db.users.createIndex({ isVerified: 1 })

// Búsquedas por rol
db.users.createIndex({ role: 1 })

// Búsquedas por tipo de cuenta
db.users.createIndex({ accountType: 1 })

// Ordenar por último login
db.users.createIndex({ 'lastLogin.date': -1 })
```

---

### 2. Flujo de Registro con Email y Contraseña

#### Endpoint: `POST /api/user/register`

**Request Body:**
```json
{
  "email": "usuario@example.com",
  "password": "Password123",
  "name": "Juan Pérez"
}
```

**Proceso Backend:**

```
1. VALIDACIÓN
   ├─ Verificar que email y password son requeridos
   ├─ Normalizar email (lowercase, trim)
   └─ Validar que no exista usuario con ese email

2. CREACIÓN DE USUARIO
   ├─ Hash de contraseña (bcrypt, 12 rounds)
   ├─ Crear documento en MongoDB con:
   │  ├─ email: normalizado
   │  ├─ password: hasheada
   │  ├─ name: desde request o extraído del email
   │  ├─ providers: ['credentials']
   │  ├─ hasPassword: true
   │  ├─ emailVerified: null (NO verificado)
   │  ├─ isVerified: false
   │  └─ role: 'user' (default)
   │
   └─ Guardar en BD

3. GENERACIÓN DE CÓDIGO DE VERIFICACIÓN
   ├─ Generar código OTP de 6 dígitos (100000-999999)
   ├─ Guardar en colección EmailVerification con:
   │  ├─ email: email del usuario
   │  ├─ code: código generado
   │  ├─ expiresAt: Date.now() + 15 minutos
   │  └─ attempts: 0
   │
   └─ TTL Index en MongoDB: expiración automática a los 15 min

4. ENVÍO DE EMAIL
   ├─ Usar Mailjet para enviar email
   ├─ Template con código de 6 dígitos
   ├─ Incluir instrucciones de verificación
   └─ [OPCIONAL] Log del código en console si falla email

5. RESPUESTA AL CLIENTE
   ├─ status: 201 New Resource
   ├─ success: true
   ├─ user: { _id, email, name, role, emailVerified }
   └─ message: "Usuario registrado. Verifica tu email."
```

**Response:**
```json
{
  "success": true,
  "message": "Usuario registrado exitosamente. Revisa tu email para verificar tu cuenta.",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "usuario@example.com",
    "name": "Juan Pérez",
    "isVerified": false,
    "role": "user",
    "emailVerified": null
  }
}
```

---

### 3. Flujo de Verificación de Email

#### Endpoint: `POST /api/auth/verify-email`

**Request Body:**
```json
{
  "email": "usuario@example.com",
  "code": "123456"
}
```

**Proceso Backend:**

```
1. ENTRADA Y NORMALIZACIÓN
   ├─ Validar que email y code son requeridos
   └─ Normalizar email

2. BÚSQUEDA DEL REGISTRO DE VERIFICACIÓN
   ├─ Buscar en EmailVerification por email
   ├─ Si no existe: throw error "Código inválido o expirado"
   └─ Si existe: continuar

3. VALIDACIONES
   ├─ ¿Ha expirado? (expiresAt < now)
   │  ├─ Si: Eliminar registro y throw error
   │  └─ No: continuar
   │
   ├─ ¿Intentos >= 5? (límite anti-fuerza bruta)
   │  ├─ Si: Eliminar registro y throw error "Demasiados intentos"
   │  └─ No: continuar
   │
   └─ ¿Coinciden códigos?
      ├─ Si: Eliminar registro de EmailVerification
      └─ No: Incrementar attempts y throw error

4. ACTUALIZACIÓN EN MONGODB
   └─ UPDATE Users.findOneAndUpdate(
      { email: normalizedEmail },
      { emailVerified: new Date() }
   )

5. RESPUESTA
   ├─ status: 200 OK
   ├─ success: true
   └─ message: "Email verificado exitosamente"
```

**Response:**
```json
{
  "success": true,
  "message": "Email verificado exitosamente"
}
```

#### Endpoint: `POST /api/auth/resend-verification`

Reenvía el código de verificación si:
- El usuario existe pero no está verificado
- No hay un código activo ya (anti-spam)
- Genera nuevo código y lo envía por email

---

### 4. Flujo de Login con Email y Contraseña

#### Endpoint: `POST /api/user/login`

**Request Body:**
```json
{
  "email": "usuario@example.com",
  "password": "Password123"
}
```

**Proceso Backend:**

```
1. VALIDACIÓN INICIAL
   ├─ Verificar que email y password son requeridos
   └─ Normalizar email

2. BÚSQUEDA DEL USUARIO
   ├─ findUserByEmail(normalizedEmail)
   ├─ Si no existe: return 401 "Credenciales inválidas"
   └─ Si existe: continuar

3. VERIFICACIÓN DE MÉTODO DE LOGIN
   ├─ ¿Usuario tiene password? (hasPassword && password)
   │  ├─ Si es false: return 401 "Esta cuenta no tiene contraseña"
   │  └─ Si es true: continuar
   │
   └─ Nota: Usado para detectar usuarios solo-Google

4. VALIDACIÓN DE CONTRASEÑA
   ├─ bcrypt.compare(password, user.password)
   ├─ Si no coincide: return 401 "Credenciales inválidas"
   └─ Si coincide: continuar

5. ACTUALIZACIÓN DE ÚLTIMO LOGIN
   ├─ UPDATE Users.findByIdAndUpdate(userId, {
   │  'lastLogin.date': new Date(),
   │  'lastLogin.isVerified': true
   │ })
   └─ Nota: También actualiza ProfileVerification del usuario

6. GENERACIÓN DE JWT TOKEN
   ├─ JWTService.generateToken({
   │  userId: user._id,
   │  role: user.role,
   │  isVerified: user.isVerified,
   │  verification_in_progress: user.verification_in_progress
   │ })
   └─ Token válido por: 30 días (configurable)

7. RESPUESTA AL CLIENTE
   ├─ status: 200 OK
   ├─ token: JWT token (para NextAuth)
   ├─ success: true
   └─ user: { _id, email, name, role, isVerified, emailVerified, hasPassword }
```

**Response:**
```json
{
  "success": true,
  "message": "Login exitoso",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "usuario@example.com",
    "name": "Juan Pérez",
    "role": "user",
    "isVerified": true,
    "emailVerified": "2024-03-10T15:30:00.000Z",
    "hasPassword": true
  }
}
```

---

### 5. Flujo de Registro/Login con Google OAuth

#### Flow Diagram:

```
Usuario               Frontend (Next.js)         Backend           Google
   │                        │                       │                │
   ├─ Click "Login Google"──│                       │                │
   │                        │                       │                │
   │                        ├─────────────────────────────────────────>│
   │                        │   Redirige al consent de Google        │
   │                        │   (prompt: 'consent', access: 'offline')
   │                        │                       │                │
   │<─────────────────────────────────────────────────────────────────│
   │ [Usuario autoriza en Google]                  │                │
   │                        │<─ Redirige con código │                │
   │                        │   authorization code  │                │
   │                        │                       │                │
   │                        ├─> POST /api/user/auth_google          │
   │                        │   { email, name, image, googleId }   │
   │                        │                       │                │
   │                        │                       ├─ Verificar si existe
   │                        │                       │                │
   │                        │<─ Respuesta JWT token─┤                │
   │                        │                       │                │
   │                        ├─ NextAuth Callback    │                │
   │                        │ (signIn y jwt)        │                │
   │                        │                       │                │
   │<──────────────────────── Sesión creada        │                │
   │                        │                       │                │
```

#### Endpoint: `POST /api/user/auth_google`

**Request Body:**
```json
{
  "email": "usuario@google.com",
  "name": "Juan Pérez",
  "image": "https://lh3.googleusercontent.com/...",
  "googleId": "1234567890"
}
```

**Proceso Backend:**

```
1. VALIDACIÓN
   ├─ Verificar que email es requerido
   └─ Normalizar email (lowercase, trim)

2. BÚSQUEDA DE USUARIO EXISTENTE
   ├─ findUserByEmail(normalizedEmail)
   │
   ├─ SI EXISTE: (Login con Google)
   │  └─ ¿Google ya es un provider?
   │     ├─ Si: Solo actualizar nombre si es diferente
   │     └─ No: Agregar 'google' a array de providers
   │
   └─ SI NO EXISTE: (Nuevo usuario con Google)
      └─ Crear en MongoDB con:
         ├─ email: normalizado
         ├─ name: desde Google
         ├─ image: URL de Google
         ├─ providers: ['google']
         ├─ hasPassword: false (sin contraseña)
         ├─ emailVerified: new Date() (verificado automáticamente)
         ├─ isVerified: false (solo email verificado)
         ├─ role: 'user' (default)
         └─ accountType: 'common' (default)

3. ENVÍO DE EMAIL DE BIENVENIDA (solo si nuevo usuario)
   ├─ Usar sendWelcomeEmail()
   ├─ [OPCIONAL] Incluir opción de "Establecer contraseña"
   └─ [FALLBACK] Si falla el email, no afecta el login

4. GENERACIÓN DE JWT TOKEN
   ├─ JWTService.generateToken({
   │  userId: user._id,
   │  role: user.role,
   │  isVerified: user.isVerified,
   │  verification_in_progress: user.verification_in_progress
   │ })
   └─ Token válido por: 30 días

5. RESPUESTA AL CLIENTE
   ├─ status: 200 OK
   ├─ success: true
   ├─ token: JWT token
   └─ user: { _id, email, name, role, image, emailVerified, hasPassword }
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "usuario@google.com",
    "name": "Juan Pérez",
    "image": "https://lh3.googleusercontent.com/...",
    "role": "user",
    "isVerified": false,
    "emailVerified": "2024-03-10T15:30:00.000Z",
    "hasPassword": false
  }
}
```

---

### 6. Flujo Posterior al Login: NextAuth.js Callbacks

Una vez que el backend responde con el token JWT, NextAuth.js procesa dos callbacks importantes:

#### Callback `signIn` (en `frontend/src/auth.ts`)

```typescript
async signIn({ user, account, profile }) {
  if (account?.provider === 'google') {
    // Llamar nuevamente a POST /api/user/auth_google para sincronizar
    // Actualizar objeto user con datos del backend
    user.id = result.user._id;
    user.accessToken = result.token;
    return true; // Permitir login
  }
  return true;
}
```

**Propósito:**
- Validar que el user es legítimo
- Actualizar datos del usuario antes de crear sesión
- Capturar token JWT del backend

#### Callback `jwt` (Token Persistence)

```typescript
async jwt({ token, user, account, trigger }) {
  if (user) {
    // Primera vez: guardar datos del usuario en el token
    token.id = user.id;
    token.email = user.email;
    token.name = user.name;
    token.isVerified = user.isVerified;
    token.hasPassword = user.hasPassword;
    token.accessToken = user.accessToken; // Token JWT del backend
  }
  
  if (trigger === 'update') {
    // Actualizar sesión a partir de cambios en DB
    // Sincroniza cambios como: cambio de contraseña, verificación, etc.
  }
  
  return token;
}
```

**Propósito:**
- Persistir datos de user en JWT token de NextAuth
- Mantener sincronizado el estado del usuario
- Capturar accessToken para enviar al backend en requests

#### Callback `session` (Session Object)

```typescript
async session({ session, token }) {
  if (token) {
    session.user.id = token.id;
    session.user.email = token.email;
    session.user.isVerified = token.isVerified;
    session.user.hasPassword = token.hasPassword;
    session.user.accessToken = token.accessToken;
  }
  return session;
}
```

**Propósito:**
- Disponibilizar datos del usuario en `useSession()` del frontend
- Incluir el accessToken para hacer requests autenticados
- Mantener sincronización cliente-servidor

---

### 7. Flujo de Protección de Rutas y Middleware

#### Backend Middleware: `authMiddleware`

```typescript
export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  // Intenta extraer userId de dos fuentes:
  
  // 1. Bearer Token JWT en Authorization header
  const authHeader = req.header('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = jwtService.extractTokenFromHeader(authHeader);
    const payload = jwtService.verifyToken(token);
    userId = payload.userId;
  }
  
  // 2. Fallback a X-User-ID header (desarrollo)
  if (!userId) {
    userId = req.header('X-User-ID');
  }
  
  // Validar que se encontró userId
  if (!userId) {
    return res.status(401).json({ message: 'Usuario no autenticado' });
  }
  
  // Obtener usuario de BD
  const user = await UserModel.findById(userId);
  if (!user) {
    return res.status(401).json({ message: 'Usuario no encontrado' });
  }
  
  // Agregar usuario a request y proceder
  req.user = user;
  next();
};
```

**Uso:**
```typescript
router.put('/:id/update-profile', authMiddleware, updateProfileController);
router.delete('/:id', authMiddleware, authorize(['admin']), deleteUserController);
```

#### Frontend: Rutas Protegidas con Next.js

```typescript
// En app/cuenta/layout.tsx
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function CuentaLayout({ children }) {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/autenticacion/ingresar');
  }
  
  return <>{children}</>;
}
```

---

### 8. Recuperación de Contraseña

#### Endpoint 1: `POST /api/user/request-password-reset`

**Solicita código para cambiar contraseña:**

```
1. Validar que email existe
2. Generar código OTP de 6 dígitos
3. Guardar en user con resetPasswordCode y resetPasswordExpires (15 min)
4. Enviar email con código
5. Respuesta: Siempre "Si el email existe, recibirá un código" (seguridad)
```

#### Endpoint 2: `POST /api/user/verify-reset-code`

**Verifica el código y retorna token temporal:**

```
1. Validar que código coincide y no ha expirado
2. Generar resetPasswordToken temporal (válido 10 min)
3. Responder con resetToken
```

#### Endpoint 3: `POST /api/user/reset-password`

**Cambia la contraseña usando el token:**

```
1. Validar que token es válido y no ha expirado
2. Validar formato de nueva contraseña:
   - Mínimo 8 caracteres
   - Mínimo 1 mayúscula
   - Mínimo 1 minúscula
   - Mínimo 1 número
3. Hash de nueva contraseña (bcrypt, 12 rounds)
4. Actualizar password y hasPassword: true
5. Limpiar todos los tokens de recuperación
```

---

### 9. Seguridad y Mejores Prácticas

#### Hash de Contraseñas

```typescript
// bcrypt con 12 rounds (2^12 = 4096 iteraciones)
const saltRounds = 12;
const hashedPassword = await bcrypt.hash(password, saltRounds);

// Tiempo: ~300ms por hash (suficiente para ser seguro pero rápido)
// Si toma < 50ms, aumentar rounds. Si > 500ms, disminuir.
```

#### JWT Token Expiration

```typescript
// Token válido por 30 días
const token = jwtService.generateToken({...}, 30 * 24 * 60 * 60);

// Almacenado en sesión segura (httpOnly cookie + CSRF token)
// NextAuth maneja esto automáticamente
```

#### Validación de Email

```
- Normalización: lowercase() + trim()
- Validar formato con regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
- No permitir duplicados (índice unique en MongoDB)
```

#### Rate Limiting

```
- Verificación de código: máximo 5 intentos antes de expirar
- Reenvío de código: máximo 1 código activo por email
- [TODO] Agregar rate limiting global en auth endpoints
```

#### Contraseña

```
Requisitos:
- Mínimo 8 caracteres
- Mínimo 1 mayúscula (A-Z)
- Mínimo 1 minúscula (a-z)
- Mínimo 1 número (0-9)

Validación: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/
```

---

### 10. Estado del Usuario: `isVerified` vs `emailVerified`

| Campo | Significado | Cuándo es true |
|-------|-------------|-----------------|
| `emailVerified` | Email confirmado | Después de verificar código o login con Google |
| `isVerified` | Cuenta completa verificada | [Depende del negocio - podría ser Kyc/verificación de documentos] |
| `verification_in_progress` | En proceso de verificación | Mientras se verifica identidad |

---

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
