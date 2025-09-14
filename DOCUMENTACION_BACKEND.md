# Documentación Completa del Backend - Scort Web Site

## Índice
1. [Arquitectura General](#arquitectura-general)
2. [Módulos Principales](#módulos-principales)
3. [Sistema de Autenticación](#sistema-de-autenticación)
4. [Sistema de Perfiles](#sistema-de-perfiles)
5. [Sistema de Planes y Facturación](#sistema-de-planes-y-facturación)
6. [Sistema de Verificación](#sistema-de-verificación)
7. [Sistema de Pagos](#sistema-de-pagos)
8. [APIs y Endpoints](#apis-y-endpoints)
9. [Base de Datos](#base-de-datos)
10. [Servicios Externos](#servicios-externos)
11. [Configuración y Deployment](#configuración-y-deployment)

---

## Arquitectura General

### Stack Tecnológico
- **Runtime**: Node.js
- **Framework**: Express.js
- **Base de Datos**: MongoDB con Mongoose ODM
- **Autenticación**: JWT + NextAuth
- **Validación**: express-validator
- **Documentación**: Swagger/OpenAPI
- **Testing**: Jest
- **Deployment**: Docker

### Estructura del Proyecto
```
backend/
├── src/
│   ├── modules/           # Módulos de negocio
│   ├── controllers/       # Controladores HTTP
│   ├── services/          # Lógica de negocio
│   ├── models/           # Modelos de datos
│   ├── routes/           # Definición de rutas
│   ├── middleware/       # Middlewares personalizados
│   ├── utils/            # Utilidades y helpers
│   └── config/           # Configuraciones
├── scripts/              # Scripts de migración y utilidades
└── tests/               # Tests unitarios e integración
```

---

## Módulos Principales

### 1. Módulo de Usuarios (`/modules/user`)
**Responsabilidades:**
- Gestión de cuentas de usuario
- Verificación de identidad
- Conversión a agencia
- Subida de documentos

**Modelos:**
- `User.model.ts`: Usuario principal
- `User-verification.model.ts`: Verificación de usuario

**Endpoints principales:**
- `POST /api/user/register` - Registro de usuario
- `POST /api/user/login` - Inicio de sesión
- `POST /api/user/upload_user_document` - Subir documentos
- `GET /api/user/profile` - Obtener perfil de usuario

### 2. Módulo de Perfiles (`/modules/profile`)
**Responsabilidades:**
- Creación y gestión de perfiles de acompañantes
- Asignación de planes
- Control de visibilidad
- Historial de pagos

**Modelos:**
- `profile.model.ts`: Perfil principal
- `profile.types.ts`: Tipos TypeScript

**Endpoints principales:**
- `POST /api/profiles` - Crear perfil
- `GET /api/profiles` - Listar perfiles
- `PUT /api/profiles/:id` - Actualizar perfil
- `DELETE /api/profiles/:id` - Eliminar perfil

### 3. Módulo de Planes (`/modules/plans`)
**Responsabilidades:**
- Definición de planes de suscripción
- Gestión de upgrades
- Cálculo de precios
- Reglas de visibilidad

**Modelos:**
- `plan.model.ts`: Definición de planes
- `upgrade.model.ts`: Definición de upgrades

**Endpoints principales:**
- `GET /api/plans` - Listar planes disponibles
- `GET /api/plans/:id` - Obtener plan específico
- `GET /api/upgrades` - Listar upgrades disponibles

### 4. Módulo de Pagos (`/modules/payments`)
**Responsabilidades:**
- Generación de facturas
- Procesamiento de pagos
- Webhooks de confirmación
- Historial de transacciones

**Modelos:**
- `invoice.model.ts`: Facturas
- `payment-history.model.ts`: Historial de pagos

**Endpoints principales:**
- `POST /api/invoices` - Crear factura
- `GET /api/invoices` - Listar facturas
- `GET /api/invoices/user/:userId` - **NUEVO** Todas las facturas de un usuario
- `GET /api/invoices/user/:userId/pending` - Facturas pendientes
- `POST /api/invoices/webhook/payment-confirmed` - Confirmar pago
- `POST /api/invoices/webhook/payment-cancelled` - Cancelar pago

### 5. Módulo de Verificación (`/modules/profile-verification`)
**Responsabilidades:**
- Verificación de perfiles
- Validación de documentos
- Estados de verificación
- Progreso de verificación

**Modelos:**
- `profile-verification.model.ts`: Verificación de perfil
- `profile-verification.types.ts`: Tipos de verificación

**Endpoints principales:**
- `POST /api/profile-verification` - Crear verificación
- `GET /api/profile-verification/:profileId` - Estado de verificación
- `PUT /api/profile-verification/:id` - Actualizar verificación

---

## Sistema de Autenticación

### Flujo de Autenticación
1. **Registro**: Usuario se registra con email y contraseña
2. **Verificación**: Email de confirmación (opcional)
3. **Login**: Generación de JWT token
4. **Autorización**: Middleware valida token en rutas protegidas

### Roles y Permisos
- **user**: Usuario estándar
- **agency**: Usuario agencia (múltiples perfiles)
- **admin**: Administrador del sistema

### Middleware de Autenticación
```typescript
// Ejemplo de uso
router.get('/protected', authenticateToken, (req, res) => {
  // Ruta protegida
});
```

---

## Sistema de Perfiles

### Flujo de Creación de Perfil

#### 1. Solicitud Inicial
```http
POST /api/profiles
{
  "name": "Nombre del perfil",
  "planCode": "DIAMANTE",
  "planDays": 30,
  "upgradeCodes": ["DESTACADO"],
  "basicInfo": { ... },
  "contactInfo": { ... }
}
```

#### 2. Proceso de Creación
1. **Validación**: Verificar datos de entrada
2. **Creación Base**: Perfil con estado `isActive: false`, `visible: false`
3. **Plan por Defecto**: Asignar plan "AMATISTA" temporalmente
4. **Determinación de Facturación**:
   - Plan gratuito → Activar perfil inmediatamente
   - Plan de pago → Generar factura y mantener inactivo
5. **Actualización de Historial**: Agregar invoice ID a `paymentHistory`
6. **Notificación**: Enviar mensaje WhatsApp con detalles

#### 3. Estados del Perfil
- **Perfil Gratuito**: `isActive: true`, `visible: true/false` (según límites)
- **Perfil de Pago**: `isActive: false`, `visible: false` (hasta pago)
- **Perfil Pagado**: `isActive: true`, `visible: true`

### Estructura del Modelo Profile
```typescript
interface IProfile {
  _id: ObjectId;
  user: ObjectId;           // Referencia al usuario
  name: string;
  isActive: boolean;        // Estado de activación
  visible: boolean;         // Visibilidad en búsquedas
  planAssignment: {
    planId: ObjectId;       // Plan asignado
    expiresAt: Date;        // Fecha de expiración
    isActive: boolean;
  };
  paymentHistory: ObjectId[]; // Historial de facturas
  basicInfo: { ... };
  contactInfo: { ... };
  // ... otros campos
}
```

---

## Sistema de Planes y Facturación

### Jerarquía de Planes
1. **AMATISTA** (Gratuito) - Plan por defecto
2. **ESMERALDA** (Pago) - Plan básico
3. **ZAFIRO** (Pago) - Plan intermedio
4. **DIAMANTE** (Pago) - Plan premium

### Upgrades Disponibles
- **DESTACADO**: Mayor visibilidad
- **PREMIUM_PHOTOS**: Fotos premium
- **PRIORITY_SUPPORT**: Soporte prioritario

### Flujo de Facturación

#### 1. Generación de Factura
```typescript
// Servicio de facturación
const invoice = await invoiceService.generateInvoice({
  profileId: profile._id,
  userId: user._id,
  planCode: 'DIAMANTE',
  planDays: 30,
  upgradeCodes: ['DESTACADO']
});
```

#### 2. Estructura de Factura
```typescript
interface IInvoice {
  _id: ObjectId;
  profileId: ObjectId;
  userId: ObjectId;
  invoiceNumber: string;    // Número único
  status: 'pending' | 'paid' | 'cancelled' | 'expired';
  items: InvoiceItem[];     // Detalles de items
  totalAmount: number;
  paymentData?: any;        // Datos flexibles de pago
  createdAt: Date;
  paidAt?: Date;
}

interface InvoiceItem {
  type: 'plan' | 'upgrade';
  code: string;
  name: string;
  days?: number;
  price: number;
  quantity: number;
}
```

#### 3. Confirmación de Pago
```http
POST /api/invoices/webhook/payment-confirmed
{
  "invoiceId": "invoice_id",
  "paymentData": {
    "paymentMethod": "credit_card",
    "paymentReference": "ref_123456",
    "transactionId": "txn_789012",
    "amount": 50000,
    "currency": "COP"
  }
}
```

### Nuevo Endpoint: Todas las Facturas de Usuario
```http
GET /api/invoices/user/:userId?page=1&limit=10&status=paid
```

**Parámetros de consulta:**
- `page`: Número de página (default: 1)
- `limit`: Elementos por página (default: 10, max: 100)
- `status`: Filtrar por estado (pending, paid, cancelled, expired)

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "invoices": [...],
    "totalCount": 25,
    "currentPage": 1,
    "totalPages": 3,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

---

## Sistema de Verificación

### Tipos de Verificación

#### 1. Verificación de Usuario
- **Documentos de identidad**: Cédula, pasaporte, etc.
- **Foto con documento**: Selfie sosteniendo documento
- **Verificación de edad**: Confirmar mayoría de edad

#### 2. Verificación de Perfil
- **Fotos de documentos**: Hasta 2 documentos
- **Selfie con documento**: Foto de verificación
- **Selfie con cartel**: Foto con cartel personalizado
- **Fotos del perfil**: Validación de autenticidad

### Flujo de Verificación
```typescript
// Estructura de verificación
interface ProfileVerificationSteps {
  documentPhotos: {
    documents: string[];      // URLs de documentos
    isVerified: boolean;
    verifiedAt?: Date;
  };
  selfieWithDoc: {
    photo: string;           // URL de selfie
    isVerified: boolean;
    verifiedAt?: Date;
  };
  selfieWithPoster: {
    photo: string;
    isVerified: boolean;
    verifiedAt?: Date;
  };
  profilePhotos: {
    photos: string[];
    isVerified: boolean;
    verifiedAt?: Date;
  };
}
```

### Estados de Verificación
- **pending**: Pendiente de revisión
- **in_review**: En proceso de revisión
- **verified**: Verificado exitosamente
- **rejected**: Rechazado (requiere corrección)

---

## Sistema de Pagos

### Procesadores de Pago Soportados
- **Mercado Pago**
- **PayU**
- **Wompi**
- **Transferencias bancarias**
- **Pago en efectivo**

### Webhooks de Pago

#### Confirmación de Pago
```http
POST /api/invoices/webhook/payment-confirmed
```

**Proceso:**
1. Validar `invoiceId`
2. Verificar estado de factura
3. Marcar como pagada
4. Guardar `paymentData`
5. Activar perfil
6. Asignar plan comprado
7. Notificar usuario

#### Cancelación de Pago
```http
POST /api/invoices/webhook/payment-cancelled
```

**Proceso:**
1. Validar `invoiceId`
2. Marcar factura como cancelada
3. Mantener perfil con plan actual
4. Reactivar perfil si estaba inactivo

### Estructura de paymentData
```typescript
// Estructura flexible para diferentes procesadores
interface PaymentData {
  paymentMethod?: string;      // 'credit_card', 'bank_transfer', etc.
  paymentReference?: string;   // Referencia del procesador
  transactionId?: string;      // ID único de transacción
  amount?: number;            // Monto pagado
  currency?: string;          // Moneda (COP, USD, etc.)
  processorData?: any;        // Datos específicos del procesador
  timestamp?: Date;           // Fecha/hora del pago
  [key: string]: any;         // Campos adicionales flexibles
}
```

---

## APIs y Endpoints

### Endpoints de Usuarios
```http
# Autenticación
POST   /api/user/register              # Registro
POST   /api/user/login                 # Login
POST   /api/user/logout                # Logout
GET    /api/user/profile               # Perfil actual
PUT    /api/user/profile               # Actualizar perfil

# Verificación
POST   /api/user/upload_user_document  # Subir documentos
GET    /api/user/verification-status   # Estado de verificación

# Conversión a agencia
POST   /api/user/request-agency-conversion  # Solicitar conversión
GET    /api/user/agency-status             # Estado de conversión
```

### Endpoints de Perfiles
```http
# CRUD básico
POST   /api/profiles                   # Crear perfil
GET    /api/profiles                   # Listar perfiles
GET    /api/profiles/:id               # Obtener perfil
PUT    /api/profiles/:id               # Actualizar perfil
DELETE /api/profiles/:id               # Eliminar perfil

# Gestión específica
POST   /api/profiles/:id/subscribe     # Suscribir a plan
PUT    /api/profiles/:id/visibility    # Cambiar visibilidad
GET    /api/profiles/user/:userId      # Perfiles de usuario
```

### Endpoints de Planes
```http
GET    /api/plans                      # Listar planes
GET    /api/plans/:id                  # Obtener plan
GET    /api/upgrades                   # Listar upgrades
GET    /api/upgrades/:id               # Obtener upgrade
```

### Endpoints de Facturas
```http
# CRUD básico
POST   /api/invoices                   # Crear factura
GET    /api/invoices                   # Listar con filtros
GET    /api/invoices/:id               # Obtener factura

# Por usuario
GET    /api/invoices/user/:userId              # 🆕 TODAS las facturas
GET    /api/invoices/user/:userId/pending      # Solo pendientes

# Gestión de pagos
PUT    /api/invoices/:id/pay           # Marcar como pagada
PUT    /api/invoices/:id/cancel        # Cancelar factura

# Webhooks
POST   /api/invoices/webhook/payment-confirmed  # Confirmar pago
POST   /api/invoices/webhook/payment-cancelled  # Cancelar pago

# Estadísticas
GET    /api/invoices/stats             # Estadísticas de facturas
```

### Endpoints de Verificación
```http
POST   /api/profile-verification       # Crear verificación
GET    /api/profile-verification/:profileId  # Estado de verificación
PUT    /api/profile-verification/:id   # Actualizar verificación
POST   /api/profile-verification/:id/approve   # Aprobar verificación
POST   /api/profile-verification/:id/reject    # Rechazar verificación
```

---

## Base de Datos

### Colecciones Principales

#### Users
```javascript
{
  _id: ObjectId,
  email: String,
  password: String,
  name: String,
  phone: String,
  accountType: 'user' | 'agency',
  verificationDocument: [String],
  agencyInfo: {
    businessName: String,
    businessDocument: String,
    conversionStatus: 'pending' | 'approved' | 'rejected'
  },
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

#### Profiles
```javascript
{
  _id: ObjectId,
  user: ObjectId,
  name: String,
  isActive: Boolean,
  visible: Boolean,
  planAssignment: {
    planId: ObjectId,
    expiresAt: Date,
    isActive: Boolean
  },
  paymentHistory: [ObjectId],
  basicInfo: { ... },
  contactInfo: { ... },
  createdAt: Date,
  updatedAt: Date
}
```

#### Invoices
```javascript
{
  _id: ObjectId,
  profileId: ObjectId,
  userId: ObjectId,
  invoiceNumber: String,
  status: 'pending' | 'paid' | 'cancelled' | 'expired',
  items: [{
    type: 'plan' | 'upgrade',
    code: String,
    name: String,
    days: Number,
    price: Number,
    quantity: Number
  }],
  totalAmount: Number,
  paymentData: Schema.Types.Mixed,
  createdAt: Date,
  paidAt: Date
}
```

#### PlanDefinitions
```javascript
{
  _id: ObjectId,
  code: String,
  name: String,
  description: String,
  price: Number,
  features: [String],
  visibilityLevel: Number,
  active: Boolean,
  createdAt: Date
}
```

### Índices Recomendados
```javascript
// Users
db.users.createIndex({ email: 1 }, { unique: true })
db.users.createIndex({ accountType: 1 })

// Profiles
db.profiles.createIndex({ user: 1 })
db.profiles.createIndex({ visible: 1, isActive: 1 })
db.profiles.createIndex({ "planAssignment.expiresAt": 1 })

// Invoices
db.invoices.createIndex({ userId: 1 })
db.invoices.createIndex({ profileId: 1 })
db.invoices.createIndex({ status: 1 })
db.invoices.createIndex({ createdAt: -1 })
```

---

## Servicios Externos

### WhatsApp Business API
**Uso**: Notificaciones automáticas
- Confirmación de registro
- Detalles de facturación
- Estados de verificación
- Recordatorios de pago

### Servicios de Almacenamiento
**Cloudinary/AWS S3**: Almacenamiento de imágenes
- Fotos de perfil
- Documentos de verificación
- Imágenes de productos

### Servicios de Email
**SendGrid/Mailgun**: Notificaciones por email
- Confirmación de registro
- Recuperación de contraseña
- Notificaciones administrativas

---

## Configuración y Deployment

### Variables de Entorno
```bash
# Base de datos
MONGODB_URI=mongodb://localhost:27017/scort

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

# WhatsApp
WHATSAPP_API_URL=https://api.whatsapp.com
WHATSAPP_TOKEN=your_whatsapp_token

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Pagos
MERCADOPAGO_ACCESS_TOKEN=your_mp_token
PAYU_API_KEY=your_payu_key
```

### Docker Configuration
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

### Scripts de Migración
```bash
# Migrar datos de planCode a planId
node scripts/migrate-plan-to-planassignment.ts

# Seed de planes iniciales
node scripts/plans-seed.ts

# Limpieza de datos
node scripts/cleanup-expired-profiles.ts
```

---

## Consideraciones Técnicas

### Seguridad
- **Validación de entrada**: express-validator en todas las rutas
- **Sanitización**: Limpieza de datos de entrada
- **Rate limiting**: Límites de peticiones por IP
- **CORS**: Configuración restrictiva
- **Helmet**: Headers de seguridad

### Performance
- **Paginación**: Todas las listas con paginación
- **Índices**: Índices optimizados en MongoDB
- **Caching**: Redis para datos frecuentes
- **Compresión**: Gzip en respuestas

### Monitoreo
- **Logs estructurados**: Winston logger
- **Métricas**: Prometheus/Grafana
- **Health checks**: Endpoints de salud
- **Error tracking**: Sentry

### Testing
- **Unit tests**: Jest para lógica de negocio
- **Integration tests**: Supertest para APIs
- **E2E tests**: Cypress para flujos completos
- **Coverage**: Mínimo 80% de cobertura

---

## Próximas Mejoras

### Funcionalidades Pendientes
1. **Sistema de notificaciones push**
2. **API de estadísticas avanzadas**
3. **Sistema de cupones y descuentos**
4. **Integración con más procesadores de pago**
5. **Sistema de reviews y calificaciones**
6. **API GraphQL**
7. **Microservicios architecture**

### Optimizaciones Técnicas
1. **Implementar caching con Redis**
2. **Optimizar consultas de base de datos**
3. **Implementar CDN para imágenes**
4. **Mejorar sistema de logs**
5. **Implementar circuit breakers**
6. **Añadir más tests automatizados**

---

*Documentación actualizada: Enero 2024*
*Versión: 2.0.0*