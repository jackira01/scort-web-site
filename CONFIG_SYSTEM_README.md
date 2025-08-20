# Sistema de Configuración Flexible - ConfigParameter

Este documento describe el sistema de configuración flexible implementado para la plataforma Scort Web Site.

## Descripción General

El sistema ConfigParameter permite gestionar de forma centralizada y flexible todos los parámetros de configuración de la aplicación, incluyendo ubicaciones, textos variables, planes de membresía y configuraciones del sistema.

## Características Principales

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

## Estructura del Backend

### Modelo de Datos

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

### API Endpoints

#### Rutas Públicas
- `GET /api/config-parameters/value/:key` - Obtener valor por clave
- `POST /api/config-parameters/values` - Obtener múltiples valores

#### Rutas Autenticadas
- `GET /api/config-parameters` - Listar con filtros y paginación
- `GET /api/config-parameters/meta/categories` - Obtener categorías
- `GET /api/config-parameters/meta/tags` - Obtener tags
- `GET /api/config-parameters/category/:category` - Filtrar por categoría
- `GET /api/config-parameters/type/:type` - Filtrar por tipo
- `GET /api/config-parameters/key/:key` - Obtener por clave
- `GET /api/config-parameters/:id` - Obtener por ID

#### Rutas de Administrador
- `POST /api/config-parameters` - Crear parámetro
- `PUT /api/config-parameters/:id` - Actualizar parámetro
- `DELETE /api/config-parameters/:id` - Eliminar parámetro
- `PATCH /api/config-parameters/:id/toggle` - Activar/desactivar
- `POST /api/config-parameters/validate` - Validar configuración

## Estructura del Frontend

### Componentes de Administración

1. **ConfigManager** - Componente principal de gestión
2. **ConfigParameterList** - Lista de parámetros con filtros
3. **ConfigParameterForm** - Formulario de creación/edición
4. **ConfigParameterFilters** - Filtros avanzados
5. **LocationManager** - Gestión específica de ubicaciones
6. **TextManager** - Gestión específica de textos
7. **MembershipManager** - Gestión específica de membresías

### Hooks React Query

- `useConfigParameters` - Listar parámetros
- `useConfigParameter` - Obtener parámetro individual
- `useCreateConfigParameter` - Crear parámetro
- `useUpdateConfigParameter` - Actualizar parámetro
- `useDeleteConfigParameter` - Eliminar parámetro
- `useToggleConfigParameterActive` - Activar/desactivar
- `useConfigParameterValue` - Obtener valor por clave
- `useConfigParameterValues` - Obtener múltiples valores

## Tipos de Configuración Soportados

### 1. Ubicaciones (location)
```typescript
interface LocationConfig {
  country: string;
  state: string;
  city: string;
  coordinates: { lat: number; lng: number };
  timezone: string;
  currency: string;
  language: string;
}
```

### 2. Textos Variables (text)
```typescript
interface TextConfig {
  content: string;
  defaultLanguage: string;
  richText?: boolean;
  maxLength?: number;
  translations?: Record<string, string>;
}
```

### 3. Membresías (membership)
```typescript
interface MembershipConfig {
  displayName: string;
  level: number;
  price: number;
  currency: string;
  duration: number;
  durationType: 'days' | 'months' | 'years';
  features: string[];
  limits: Record<string, number>;
  color?: string;
  icon?: string;
  popular?: boolean;
}
```

### 4. Otros Tipos
- **number**: Valores numéricos
- **boolean**: Valores verdadero/falso
- **array**: Listas de valores
- **object**: Objetos complejos
- **json**: Datos JSON arbitrarios

## Migración de Datos

### Script de Migración

Se incluye un script completo para migrar datos existentes:

```bash
# Migración básica con datos de ejemplo
npm run migrate:config-parameters

# Migración con archivo de datos específico
npm run migrate:config-parameters -- --file=./data/migration-data.json

# Simulación sin cambios (dry-run)
npm run migrate:config-parameters -- --dry-run

# Limpiar duplicados antes de migrar
npm run migrate:config-parameters -- --clean-duplicates
```

### Utilidades de Migración

La clase `MigrationUtils` proporciona métodos para:
- Migrar ubicaciones existentes
- Migrar textos variables
- Migrar planes de membresía
- Migrar configuraciones del sistema
- Validar datos de migración
- Limpiar duplicados
- Generar reportes de migración

## Integración en el Panel de Administración

El sistema se integra completamente en el panel de administración existente:

1. **Nueva sección "Configuración"** en el sidebar
2. **Navegación por pestañas** entre diferentes tipos de configuración
3. **Filtros avanzados** para búsqueda y organización
4. **Formularios dinámicos** que se adaptan al tipo de configuración
5. **Validación en tiempo real** de datos
6. **Exportación/importación** de configuraciones

## Casos de Uso

### Gestión de Ubicaciones
- Agregar nuevas ciudades y departamentos
- Configurar coordenadas geográficas
- Establecer zonas horarias y monedas
- Gestionar idiomas por región

### Textos Variables
- Mensajes de la interfaz de usuario
- Contenido dinámico por región
- Textos de marketing y promociones
- Términos y condiciones

### Planes de Membresía
- Configurar precios y características
- Gestionar límites por plan
- Definir duraciones y renovaciones
- Controlar disponibilidad por región

### Configuraciones del Sistema
- Parámetros de funcionamiento
- Límites y restricciones
- Configuraciones de terceros
- Flags de características

## Seguridad y Permisos

- **Rutas públicas**: Solo lectura de valores específicos
- **Usuarios autenticados**: Lectura completa de configuraciones
- **Administradores**: CRUD completo y gestión avanzada
- **Auditoría**: Registro de todos los cambios
- **Validación**: Esquemas estrictos para cada tipo

## Rendimiento y Cache

- **TTL configurable** por parámetro
- **Índices optimizados** para consultas frecuentes
- **Paginación** para listas grandes
- **Filtrado eficiente** por múltiples criterios
- **Lazy loading** en componentes frontend

## Mantenimiento

### Monitoreo
- Logs detallados de operaciones
- Métricas de uso por parámetro
- Alertas de dependencias rotas
- Reportes de configuraciones inactivas

### Backup y Restauración
- Exportación completa de configuraciones
- Importación con validación
- Versionado automático
- Rollback de cambios

## Extensibilidad

El sistema está diseñado para ser fácilmente extensible:

1. **Nuevos tipos**: Agregar tipos de configuración personalizados
2. **Validaciones**: Implementar reglas de validación específicas
3. **UI personalizada**: Componentes de interfaz especializados
4. **Integraciones**: Conectar con sistemas externos
5. **Workflows**: Procesos de aprobación y revisión

## Conclusión

Este sistema de configuración flexible proporciona una base sólida para gestionar todos los aspectos configurables de la aplicación de manera centralizada, segura y eficiente. Su diseño modular permite adaptarse a las necesidades cambiantes del negocio mientras mantiene la integridad y consistencia de los datos.