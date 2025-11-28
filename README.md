# 🌟 Scort Web Site - Plataforma de Acompañantes Premium

[![Build Status](https://github.com/yourusername/scort-web-site/workflows/CI/CD/badge.svg)](https://github.com/yourusername/scort-web-site/actions)
[![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=scort-web-site&metric=security_rating)](https://sonarcloud.io/dashboard?id=scort-web-site)
[![Performance](https://img.shields.io/badge/lighthouse-95%2B-brightgreen)](https://web.dev/measure/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## 📋 Tabla de Contenidos

- [Descripción](#descripción)
- [Características](#características)
- [Arquitectura](#arquitectura)
- [Tecnologías](#tecnologías)
- [Instalación](#instalación)
- [Configuración](#configuración)
- [Despliegue](#despliegue)
- [API Documentation](#api-documentation)
- [Seguridad](#seguridad)
- [Monitoreo](#monitoreo)
- [Contribución](#contribución)
- [Licencia](#licencia)
- [Documentación Técnica](#documentación-técnica)
  - [Sistema Híbrido de Usuarios y Agencias](#sistema-híbrido-de-usuarios-y-agencias)
  - [Sistema de Configuración Flexible](#sistema-de-configuración-flexible)
  - [Sistema de Planes y Upgrades](#sistema-de-planes-y-upgrades)
  - [Módulo de Jerarquía de Perfiles](#módulo-de-jerarquía-de-perfiles)
  - [Datos Mockeados Pendientes](#datos-mockeados-pendientes)

## 🎯 Descripción

**Scort Web Site** es una plataforma web moderna y segura para servicios de acompañantes premium. Desarrollada con las mejores prácticas de la industria, ofrece una experiencia de usuario excepcional tanto para proveedores de servicios como para clientes.

### ✨ Características Principales

#### 🔐 Autenticación y Seguridad
- **Autenticación multifactor (2FA)** con Google Authenticator
- **Verificación de identidad** con documentos oficiales
- **Encriptación end-to-end** para mensajes privados
- **Rate limiting** y protección contra ataques DDoS
- **Auditoría completa** de acciones de usuario

#### 👤 Gestión de Perfiles
- **Perfiles verificados** con sistema de badges
- **Galería multimedia** con compresión automática
- **Geolocalización** para búsquedas por proximidad
- **Sistema de reseñas** y calificaciones
- **Disponibilidad en tiempo real**

#### 💳 Sistema de Pagos
- **Integración con Stripe** para pagos seguros
- **Suscripciones premium** con múltiples planes
- **Wallet interno** para transacciones rápidas
- **Facturación automática** y reportes financieros
- **Soporte para múltiples monedas**

#### 💬 Comunicación
- **Chat en tiempo real** con WebSockets
- **Videollamadas integradas** (WebRTC)
- **Notificaciones push** multiplataforma
- **Sistema de citas** con calendario integrado
- **Mensajes encriptados** para privacidad total

#### 📊 Panel de Administración
- **Dashboard analítico** con métricas en tiempo real
- **Gestión de usuarios** y moderación de contenido
- **Sistema de reportes** automatizado
- **Configuración dinámica** sin reinicio de servidor
- **Logs centralizados** y monitoreo de performance

## 🏗️ Arquitectura

### Arquitectura del Sistema

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Load Balancer │    │     CDN         │    │   Monitoring    │
│    (Nginx)      │    │  (Cloudflare)   │    │   (Grafana)     │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          ▼                      ▼                      ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Static Files  │    │   Logs & Metrics│
│   (Next.js)     │    │   (Images/CSS)  │    │   (ELK Stack)   │
└─────────┬───────┘    └─────────────────┘    └─────────────────┘
          │
          ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   API Gateway   │    │   Auth Service  │    │   File Storage  │
│   (Express)     │◄──►│   (JWT/OAuth)   │    │   (AWS S3)      │
└─────────┬───────┘    └─────────────────┘    └─────────────────┘
          │
          ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Backend API   │    │   WebSocket     │    │   Payment       │
│   (Node.js)     │◄──►│   (Socket.io)   │    │   (Stripe)      │
└─────────┬───────┘    └─────────────────┘    └─────────────────┘
          │
          ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Database      │    │   Cache Layer   │    │   Message Queue │
│   (MongoDB)     │    │   (Redis)       │    │   (Bull Queue)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Estructura del Proyecto

```
scort-web-site/
├── 📁 backend/                 # API Backend (Node.js + Express)
│   ├── 📁 src/
│   │   ├── 📁 controllers/      # Controladores de rutas
│   │   ├── 📁 middlewares/      # Middlewares personalizados
│   │   ├── 📁 models/           # Modelos de MongoDB
│   │   ├── 📁 routes/           # Definición de rutas
│   │   ├── 📁 services/         # Lógica de negocio
│   │   ├── 📁 utils/            # Utilidades y helpers
│   │   └── 📄 app.js            # Configuración principal
│   ├── 📁 tests/               # Tests unitarios e integración
│   ├── 📁 uploads/             # Archivos subidos por usuarios
│   └── 📄 package.json         # Dependencias del backend
├── 📁 frontend/                # Frontend (Next.js + React)
│   ├── 📁 src/
│   │   ├── 📁 components/       # Componentes React reutilizables
│   │   ├── 📁 pages/            # Páginas de Next.js
│   │   ├── 📁 hooks/            # Custom React hooks
│   │   ├── 📁 context/          # Context providers
│   │   ├── 📁 utils/            # Utilidades del frontend
│   │   └── 📁 styles/           # Estilos CSS/SCSS
│   ├── 📁 public/              # Archivos estáticos
│   └── 📄 package.json         # Dependencias del frontend
├── 📁 nginx/                   # Configuración de Nginx
│   ├── 📄 nginx.conf           # Configuración principal
│   └── 📁 ssl/                 # Certificados SSL
├── 📁 scripts/                 # Scripts de automatización
│   ├── 📄 deploy.sh            # Script de despliegue
│   ├── 📄 backup.sh            # Script de backup
│   └── 📄 health-check.sh      # Health checks
├── 📁 .github/workflows/       # GitHub Actions CI/CD
├── 📁 logs/                    # Logs de aplicación
├── 📄 docker-compose.prod.yml  # Docker Compose para producción
├── 📄 ecosystem.config.js      # Configuración de PM2
├── 📄 security.config.js       # Configuración de seguridad
├── 📄 monitoring.config.js     # Configuración de monitoreo
└── 📄 DEPLOYMENT.md            # Guía de despliegue
```

## 🛠️ Tecnologías

### Backend
- **Runtime**: Node.js 18+ con TypeScript
- **Framework**: Express.js con arquitectura modular
- **Base de Datos**: MongoDB 7.0+ con Mongoose ODM
- **Autenticación**: JWT + NextAuth.js + Google OAuth
- **Cache**: Redis para sesiones y cache de datos
- **WebSockets**: Socket.io para comunicación en tiempo real
- **Pagos**: Stripe API para procesamiento de pagos
- **Email**: Nodemailer con templates HTML
- **Validación**: Joi para validación de esquemas
- **Testing**: Jest + Supertest para testing

### Frontend
- **Framework**: Next.js 14+ con App Router
- **UI Library**: React 18+ con TypeScript
- **Styling**: Tailwind CSS + Styled Components
- **State Management**: Zustand + React Query
- **Forms**: React Hook Form + Zod validation
- **Charts**: Chart.js + React Chart.js 2
- **Maps**: Leaflet para geolocalización
- **PWA**: Service Workers + Web App Manifest
- **Testing**: Jest + React Testing Library

### DevOps & Infraestructura
- **Containerización**: Docker + Docker Compose
- **Orquestación**: PM2 para gestión de procesos
- **Proxy Reverso**: Nginx con SSL/TLS
- **CI/CD**: GitHub Actions con despliegue automatizado
- **Monitoreo**: Prometheus + Grafana + ELK Stack
- **Seguridad**: Helmet.js + Rate Limiting + OWASP
- **Performance**: Lighthouse CI + Web Vitals

## 🚀 Instalación

### Prerrequisitos

- **Node.js** 18.0.0 o superior
- **pnpm** 10.13.1 o superior (recomendado sobre npm)
- **MongoDB** 7.0+ (local o Atlas)
- **Redis** 6.0+ (opcional, para cache)
- **Docker** 24.0+ (para despliegue con contenedores)

### Instalación Local

```bash
# 1. Clonar el repositorio
git clone https://github.com/yourusername/scort-web-site.git
cd scort-web-site

# 2. Instalar dependencias
pnpm install
pnpm run install:all

# 3. Configurar variables de entorno
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local

# 4. Configurar base de datos
# Editar backend/.env con tu URI de MongoDB

# 5. Inicializar base de datos
pnpm run db:seed

# 6. Ejecutar en modo desarrollo
pnpm run dev
```

### Instalación con Docker

```bash
# 1. Clonar y configurar
git clone https://github.com/yourusername/scort-web-site.git
cd scort-web-site

# 2. Configurar variables de entorno
cp backend/.env.example backend/.env.production
cp frontend/.env.example frontend/.env.production

# 3. Ejecutar con Docker Compose
docker-compose -f docker-compose.prod.yml up -d --build

# 4. Verificar servicios
docker-compose -f docker-compose.prod.yml ps
curl http://localhost/api/health
```

## ⚙️ Configuración

### Variables de Entorno del Backend

```bash
# Base de datos
MONGO_URI=mongodb://localhost:27017/scort-web-site
REDIS_URL=redis://localhost:6379

# Autenticación
JWT_SECRET=your-super-secure-jwt-secret-here
SESSION_SECRET=your-super-secure-session-secret-here
NEXTAUTH_SECRET=your-nextauth-secret-here

# OAuth Providers
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Pagos
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Almacenamiento
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_S3_BUCKET=your-s3-bucket-name

# Configuración de aplicación
NODE_ENV=development
PORT=5000
ORIGIN_ALLOWED=["http://localhost:3000"]
```

### 🔴 Configuración de Redis

Redis es **opcional** pero **recomendado** para mejorar el rendimiento del caché. La aplicación funciona perfectamente sin Redis.

#### Opción 1: Docker Compose (Recomendado)
```bash
# Iniciar Redis para desarrollo
docker-compose up redis -d

# Verificar que está funcionando
docker-compose ps
```

#### Opción 2: Sin Redis
Si no usas Redis, verás estos mensajes en los logs (son normales):
```
❌ Error de conexión Redis: Error: connect ECONNREFUSED 127.0.0.1:6379
⚠️ Redis desconectado
```

> 📖 **Documentación completa:** Ver [REDIS_SETUP.md](./REDIS_SETUP.md) para más opciones de instalación.

### Variables de Entorno del Frontend

```bash
# API
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_WS_URL=ws://localhost:5000

# Autenticación
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-here

# Servicios externos
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-publishable-key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=GA_MEASUREMENT_ID

# Configuración
NEXT_PUBLIC_ENV=development
NEXT_PUBLIC_APP_NAME="Scort Web Site"
NEXT_PUBLIC_APP_VERSION=1.0.0
```

## 🚢 Despliegue

Para información detallada sobre despliegue en producción, consulta [DEPLOYMENT.md](./DEPLOYMENT.md).

### Despliegue Rápido

```bash
# Usando el script automatizado
chmod +x scripts/deploy.sh
./scripts/deploy.sh production

# O manualmente con Docker
docker-compose -f docker-compose.prod.yml up -d --build
```

### Despliegue con PM2

```bash
# Instalar PM2
npm install -g pm2

# Desplegar aplicación
pm2 start ecosystem.config.js --env production

# Monitorear
pm2 monit
pm2 logs
```

## 📚 API Documentation

### Endpoints Principales

#### Autenticación
```http
POST /api/auth/register     # Registro de usuario
POST /api/auth/login        # Inicio de sesión
POST /api/auth/logout       # Cerrar sesión
POST /api/auth/refresh      # Renovar token
POST /api/auth/verify-2fa   # Verificar 2FA
```

#### Perfiles
```http
GET    /api/profiles        # Listar perfiles
POST   /api/profiles        # Crear perfil
GET    /api/profiles/:id    # Obtener perfil
PUT    /api/profiles/:id    # Actualizar perfil
DELETE /api/profiles/:id    # Eliminar perfil
POST   /api/profiles/:id/verify  # Verificar perfil
```

#### Pagos
```http
POST /api/payments/create-intent    # Crear intención de pago
POST /api/payments/confirm          # Confirmar pago
GET  /api/payments/history          # Historial de pagos
POST /api/subscriptions/create      # Crear suscripción
```

#### Chat
```http
GET  /api/chat/conversations        # Listar conversaciones
POST /api/chat/conversations        # Crear conversación
GET  /api/chat/messages/:convId     # Obtener mensajes
POST /api/chat/messages             # Enviar mensaje
```

### WebSocket Events

```javascript
// Cliente se conecta
socket.emit('join', { userId, token });

// Enviar mensaje
socket.emit('message', { conversationId, content, type });

// Recibir mensaje
socket.on('message', (data) => {
  console.log('Nuevo mensaje:', data);
});

// Notificaciones
socket.on('notification', (notification) => {
  console.log('Nueva notificación:', notification);
});
```

## 🔒 Seguridad

### Medidas Implementadas

- **Encriptación**: HTTPS obligatorio en producción
- **Autenticación**: JWT con refresh tokens
- **Autorización**: RBAC (Role-Based Access Control)
- **Rate Limiting**: Límites por IP y usuario
- **Validación**: Sanitización de inputs
- **Headers de Seguridad**: Helmet.js configurado
- **CORS**: Configuración restrictiva
- **CSP**: Content Security Policy estricta
- **Auditoría**: Logs de seguridad completos

### Configuración de Seguridad

La configuración de seguridad se encuentra en `security.config.js` e incluye:

- Content Security Policy (CSP)
- Rate limiting por endpoint
- Headers de seguridad
- Configuración CORS
- Detección de amenazas
- Logging de eventos de seguridad

## 📊 Monitoreo

### Métricas del Sistema

- **Performance**: Tiempo de respuesta, throughput
- **Recursos**: CPU, memoria, disco, red
- **Aplicación**: Errores, usuarios activos, transacciones
- **Negocio**: Registros, suscripciones, ingresos

### Health Checks

```bash
# Verificar estado de la aplicación
curl http://localhost:5000/api/health

# Verificar estado detallado
curl http://localhost:5000/api/health/detailed
```

### Logs

```bash
# Ver logs en tiempo real
tail -f logs/backend-error.log
tail -f logs/frontend-error.log

# Logs con Docker
docker-compose -f docker-compose.prod.yml logs -f backend
```

## 🧪 Testing

### Ejecutar Tests

```bash
# Tests del backend
cd backend
pnpm test
pnpm test:coverage
pnpm test:e2e

# Tests del frontend
cd frontend
pnpm test
pnpm test:coverage
pnpm test:e2e

# Tests completos
pnpm run test:all
```

### Cobertura de Tests

- **Backend**: >90% cobertura de líneas
- **Frontend**: >85% cobertura de componentes
- **E2E**: Flujos críticos cubiertos

## 🔧 Scripts Disponibles

```bash
# Desarrollo
pnpm run dev              # Ejecutar en modo desarrollo
pnpm run dev:backend      # Solo backend
pnpm run dev:frontend     # Solo frontend

# Build
pnpm run build            # Build completo
pnpm run build:backend    # Build backend
pnpm run build:frontend   # Build frontend

# Testing
pnpm run test             # Tests unitarios
pnpm run test:e2e         # Tests end-to-end
pnpm run test:coverage    # Cobertura de tests

# Linting
pnpm run lint             # Linter completo
pnpm run lint:fix         # Corregir automáticamente

# Base de datos
pnpm run db:seed          # Poblar base de datos
pnpm run db:migrate       # Ejecutar migraciones
pnpm run db:backup        # Backup de base de datos

# Despliegue
pnpm run deploy:staging   # Desplegar a staging
pnpm run deploy:prod      # Desplegar a producción

# Utilidades
pnpm run clean            # Limpiar archivos temporales
pnpm run security:audit   # Auditoría de seguridad
pnpm run performance      # Tests de performance
```

## 🤝 Contribución

### Proceso de Contribución

1. **Fork** el repositorio
2. **Crear** una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. **Commit** tus cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. **Push** a la rama (`git push origin feature/nueva-funcionalidad`)
5. **Crear** un Pull Request

### Estándares de Código

- **ESLint**: Configuración estricta para JavaScript/TypeScript
- **Prettier**: Formateo automático de código
- **Husky**: Git hooks para validación pre-commit
- **Conventional Commits**: Formato estándar para commits
- **JSDoc**: Documentación de funciones y clases

### Estructura de Commits

```
type(scope): description

[optional body]

[optional footer]
```

Tipos válidos: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

## 📄 Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## 👥 Equipo

- **Lead Developer**: [Tu Nombre](https://github.com/yourusername)
- **Backend Developer**: [Nombre](https://github.com/username)
- **Frontend Developer**: [Nombre](https://github.com/username)
- **DevOps Engineer**: [Nombre](https://github.com/username)

## 📞 Soporte

- **Email**: support@scortwebsite.com
- **Discord**: [Servidor de Discord](https://discord.gg/scortwebsite)
- **Issues**: [GitHub Issues](https://github.com/yourusername/scort-web-site/issues)
- **Documentación**: [Wiki del Proyecto](https://github.com/yourusername/scort-web-site/wiki)

## 🗺️ Roadmap

### v1.1.0 (Q1 2024)
- [ ] Aplicación móvil (React Native)
- [ ] Sistema de recomendaciones con IA
- [ ] Integración con más pasarelas de pago
- [ ] Chat de voz y video mejorado

### v1.2.0 (Q2 2024)
- [ ] Marketplace de servicios adicionales
- [ ] Sistema de afiliados
- [ ] API pública para terceros
- [ ] Soporte multiidioma completo

### v2.0.0 (Q3 2024)
- [ ] Arquitectura de microservicios
- [ ] Blockchain para verificaciones
- [ ] IA para moderación de contenido
- [ ] Realidad aumentada para perfiles

---

# 📖 Documentación Técnica

---

## Sistema Híbrido de Usuarios y Agencias

### Descripción General

Este sistema permite que los usuarios comunes puedan convertirse en agencias con límites y privilegios diferenciados para la creación y gestión de perfiles.

### Características Implementadas

#### 1. Modelo de Usuario Híbrido
- **Usuarios Comunes**: Cuentas estándar con límites básicos de perfiles
- **Agencias**: Cuentas con límites extendidos y verificación independiente

#### 2. Proceso de Conversión a Agencia
- Solicitud de conversión desde configuración de cuenta
- Validación administrativa requerida
- Estados: `pending`, `approved`, `rejected`

#### 3. Límites Diferenciados
- **Usuarios Comunes**: Límites estándar configurables
- **Agencias**: Límites extendidos específicos
- Verificación independiente requerida para agencias

### Configuración Inicial

#### Backend

1. **Ejecutar migraciones de configuración**:
   ```bash
   cd backend
   npm run init:agency-limits
   ```

2. **Verificar parámetros creados**:
   Los siguientes parámetros se crearán automáticamente:
   - `profiles.limits.agency.free_profiles_max`: 10
   - `profiles.limits.agency.paid_profiles_max`: 50
   - `profiles.limits.agency.total_visible_max`: 25
   - `profiles.limits.agency.independent_verification_required`: true

#### Frontend

1. **Acceso administrativo**:
   - Ir a `/adminboard/config-manager`
   - Usar la pestaña "Límites de Agencias" para ajustar configuraciones
   - Usar la pestaña "Conversiones de Agencias" para gestionar solicitudes

---

## Sistema de Configuración Flexible

### Descripción General

El sistema ConfigParameter permite gestionar de forma centralizada y flexible todos los parámetros de configuración de la aplicación, incluyendo ubicaciones, textos variables, planes de membresía y configuraciones del sistema.

### Características Principales

- **Gestión Centralizada**: Todos los parámetros de configuración en un solo lugar
- **Tipos Flexibles**: Soporte para múltiples tipos de datos (location, text, membership, number, boolean, array, object, json)
- **Categorización**: Organización por categorías para mejor gestión
- **Versionado**: Control de versiones automático para cambios
- **Metadatos Ricos**: Información adicional para validación y UI
- **Sistema de Tags**: Etiquetado para búsqueda y filtrado
- **Dependencias**: Gestión de dependencias entre parámetros
- **Auditoría**: Registro de cambios con usuario y timestamp
- **Cache TTL**: Control de caché por parámetro
- **Activación/Desactivación**: Control de estado sin eliminar datos

### Estructura del Backend

#### Modelo de Datos

```typescript
interface IConfigParameter {
  key: string;                    // Clave única del parámetro
  name: string;                   // Nombre descriptivo
  type: ConfigParameterType;      // Tipo de dato
  category: string;               // Categoría de organización
  value: any;                     // Valor del parámetro
  metadata?: ConfigMetadata;      // Metadatos adicionales
  isActive: boolean;              // Estado activo/inactivo
  version: number;                // Número de versión
  lastModified: Date;             // Fecha de última modificación
  modifiedBy: ObjectId;           // Usuario que modificó
  tags?: string[];                // Etiquetas para búsqueda
  dependencies?: string[];        // Dependencias de otros parámetros
}
```

#### API Endpoints

##### Rutas Públicas
- `GET /api/config-parameters/value/:key` - Obtener valor por clave
- `POST /api/config-parameters/values` - Obtener múltiples valores

##### Rutas Autenticadas
- `GET /api/config-parameters` - Listar con filtros y paginación

---

## Sistema de Planes y Upgrades

### Resumen Ejecutivo

Este documento describe la arquitectura completa del sistema de planes y upgrades implementado en la plataforma, incluyendo la jerarquía de visibilidad, reglas de negocio y componentes UI.

### Jerarquía de Planes

#### Estructura de Niveles

Los planes están organizados en 5 niveles de visibilidad, donde **nivel 1 = máxima visibilidad** y **nivel 5 = mínima visibilidad**:

| Nivel | Nombre | Icono | Color | Descripción |
|-------|--------|-------|-------|-------------|
| 1 | AMATISTA | 👑 Crown | Púrpura | Máxima visibilidad y todas las características premium |
| 2 | ZAFIRO | 💎 Gem | Azul | Excelente visibilidad con características avanzadas |
| 3 | ESMERALDA | 🛡️ Shield | Verde | Buena visibilidad con características estándar |
| 4 | ORO | ⭐ Star | Naranja | Visibilidad estándar con características básicas |
| 5 | DIAMANTE | ⚡ Zap | Amarillo | Plan básico para comenzar |

#### Características por Nivel

Cada plan incluye:
- **Features**: `showInHome`, `showInFilters`, `showInSponsored`
- **Content Limits**: `maxPhotos`, `maxVideos`, `maxAudios`, `maxProfiles`, `storiesPerDayMax`
- **Included Upgrades**: Lista de upgrades incluidos automáticamente

### Sistema de Upgrades

#### Tipos de Upgrades

1. **HIGHLIGHT (Destacado)**
   - Mejora la visibilidad del perfil
   - Aparece en secciones destacadas

2. **BOOST (Impulso)** 🚀
   - **Upgrade temporal más importante**
   - Mejora temporalmente la posición en el feed
   - Aparece al final de la jerarquía visual
   - Puede aplicarse a cualquier plan base

3. **FEATURE_ACCESS**
   - Desbloquea funcionalidades específicas

4. **CONTENT_LIMIT**
   - Modifica límites de contenido temporalmente

---

## Módulo de Jerarquía de Perfiles

### Descripción General

Este módulo implementa un sistema de jerarquía y ordenamiento automático para perfiles basado en planes, upgrades y actividad del usuario. El sistema prioriza la visibilidad de perfiles según su nivel de plan y upgrades activos.

### Arquitectura del Sistema

#### Backend

##### Endpoint Principal
- **Ruta**: `GET /api/profiles/home`
- **Controlador**: `profile.controller.js::getProfilesForHome`
- **Servicio**: `profile.service.js::getProfilesForHome`
- **Modelo**: `profile.model.js`, `plan.model.js`

##### Lógica de Jerarquía

1. **Filtrado Inicial**:
   - Solo perfiles activos (`isActive: true`)
   - Solo perfiles visibles (`visible: true`)
   - Excluye perfiles con `lastShownAt` en las últimas 24 horas

2. **Mapeo de Planes**:
   ```javascript
   const planLevelMap = {
     'premium': 3,
     'plus': 2,
     'free': 1
   };
   ```

3. **Enriquecimiento de Datos**:
   - Nivel del plan actual
   - Upgrades activos (boost, highlight)
   - Fecha de última actividad
   - Fecha de creación

4. **Ordenamiento Jerárquico**:
   1. **Boost activo** (descendente)
   2. **Highlight activo** (descendente)
   3. **Nivel del plan** (descendente: Premium > Plus > Free)
   4. **Última actividad** (descendente)
   5. **Fecha de creación** (descendente)

5. **Paginación**:
- **Línea**: 57
- **Descripción**: `AVAILABLE_PLANS` - Array hardcodeado de planes disponibles
- **Estado**: ✅ **CORREGIDO** - Ahora usa `getAvailablePlans()` desde el backend

### ❌ PENDIENTES DE CORRECCIÓN

#### 2. MockedData.ts
- **Ubicación**: `frontend/src/data/MockedData.ts`
- **Descripción**: Archivo completo con datos mockeados:
  - `categories` - Categorías de perfiles
  - `featuredProfiles` - Perfiles destacados
  - `userProfiles` - Perfiles de usuario
  - `paymentHistoryData` - Historial de pagos

#### 3. useStories.ts
- **Ubicación**: `frontend/src/hooks/useStories.ts`
- **Línea**: Variable `mockData`
- **Descripción**: Datos mockeados para historias

#### 4. AccountContent.tsx
- **Ubicación**: `frontend/src/components/account/AccountContent.tsx`
- **Descripción**: Importa `paymentHistoryData` desde `MockedData`
- **Uso**: Historial de pagos mockeado

#### 5. CategoriesFilter.tsx
- **Ubicación**: `frontend/src/components/filters/CategoriesFilter.tsx`
- **Descripción**: Importa `categories` desde `MockedData`
- **Uso**: Categorías de filtros mockeadas

#### 6. ProfileDetailLayout.tsx
- **Ubicación**: `frontend/src/components/profile/ProfileDetailLayout.tsx`
- **Descripción**: Comentario indica uso de datos mockeados para perfiles

#### 7. AvailabilityProfile.tsx
- **Ubicación**: `frontend/src/components/profile/AvailabilityProfile.tsx`
- **Descripción**: Comentario indica datos mockeados de disponibilidad

### 🔧 COMENTARIOS TODO RELACIONADOS CON AUTENTICACIÓN

#### 8. Tokens de Autenticación
- **Ubicaciones múltiples**: Varios archivos contienen comentarios `TODO` relacionados con tokens de autenticación
- **Descripción**: Implementaciones pendientes de autenticación real

### RECOMENDACIONES

1. **Priorizar la eliminación de datos mockeados** en `MockedData.ts`
2. **Implementar endpoints reales** para categorías, perfiles destacados e historial de pagos
3. **Completar la implementación de autenticación** según los comentarios TODO
4. **Migrar gradualmente** cada componente de datos mockeados a datos reales del backend

---

## Instalación y Configuración

### Requisitos Previos
- Node.js 18+
- MongoDB
- pnpm (recomendado)

### Instalación

```bash
# Clonar el repositorio
git clone <repository-url>
cd scort-web-site

# Instalar dependencias
pnpm install

# Configurar variables de entorno
cp backend/.env.example backend/.env
# Editar backend/.env con tus configuraciones

# Ejecutar migraciones iniciales
cd backend
npm run init:agency-limits
npm run init:default-plans

# Iniciar el proyecto
pnpm dev
```

### Scripts Disponibles

- `pnpm dev` - Inicia frontend y backend en modo desarrollo
- `pnpm build` - Construye el proyecto para producción
- `pnpm test` - Ejecuta las pruebas
- `pnpm lint` - Ejecuta el linter

---

## Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.