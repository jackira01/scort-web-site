# Scort Web Site - Documentación Completa

## Índice

1. [Sistema Híbrido de Usuarios y Agencias](#sistema-híbrido-de-usuarios-y-agencias)
2. [Sistema de Configuración Flexible](#sistema-de-configuración-flexible)
3. [Sistema de Planes y Upgrades](#sistema-de-planes-y-upgrades)
4. [Módulo de Jerarquía de Perfiles](#módulo-de-jerarquía-de-perfiles)
5. [Datos Mockeados Pendientes](#datos-mockeados-pendientes)

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
   - Parámetros: `page` (default: 1), `limit` (default: 12)
   - Respuesta incluye metadatos de paginación

---

## Datos Mockeados Pendientes

### ✅ CORREGIDO

#### 1. ManagePlansModal.tsx
- **Ubicación**: `frontend/src/components/plans/ManagePlansModal.tsx`
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