# Backend Documentation - Scort Web Site

## Descripción General

Este proyecto es un backend Node.js con Express y Mongoose para una API REST que maneja perfiles de escorts, filtros, autenticación y verificaciones.

## Configuración e Instalación

### Requisitos
- Node.js 18+
- MongoDB 5.0+
- npm o pnpm

### Instalación
```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env

# Iniciar servidor de desarrollo
npm run dev

# Iniciar servidor de producción
npm start
```

### Variables de Entorno
```env
MONGO_URI='mongodb://localhost:27017/scort-web-site'
PORT=5000
JWT_SECRET=your_jwt_secret
```

## Estructura del Proyecto

```
backend/
├── src/
│   ├── app.ts              # Configuración principal de Express
│   ├── server.ts           # Servidor HTTP
│   ├── config/             # Configuraciones
│   ├── middlewares/        # Middlewares personalizados
│   └── modules/            # Módulos de la aplicación
│       ├── auth/           # Autenticación y autorización
│       ├── profile/        # Gestión de perfiles
│       ├── filters/        # Sistema de filtros
│       ├── attribute-group/ # Grupos de atributos
│       ├── user/           # Gestión de usuarios
│       └── profile-verification/ # Verificación de perfiles
├── config/                 # Configuraciones adicionales
├── package.json
└── tsconfig.json
```

## Módulos Principales

### 1. Perfiles (Profile)

#### Estructura de Datos
```typescript
interface IProfile {
  user: Types.ObjectId;
  name: string;
  description: string;
  isActive: boolean;
  location: {
    country: {
      value: string; // Valor normalizado (sin tildes, minúsculas)
      label: string; // Valor para mostrar (con tildes, formato original)
    };
    department: {
      value: string;
      label: string;
    };
    city: {
      value: string;
      label: string;
    };
  };
  features: {
    group_id: Types.ObjectId;
    value: string | string[];
  }[];
  age: string;
  contact: {
    number: string;
    whatsapp: boolean;
    telegram: boolean;
    changedAt: Date;
  };
  // ... otros campos
}
```

#### Endpoints
- `POST /api/profiles` - Crear perfil
- `GET /api/profiles` - Listar perfiles
- `GET /api/profiles/:id` - Obtener perfil por ID
- `PUT /api/profiles/:id` - Actualizar perfil
- `DELETE /api/profiles/:id` - Eliminar perfil

### 2. Filtros (Filters)

#### Endpoints
- `POST /api/filters/profiles` - Filtrar perfiles
- `POST /api/filters/profiles/count` - Contar perfiles filtrados
- `GET /api/filters/options` - Obtener opciones de filtros

#### Estructura de Filtros
```typescript
interface FilterParams {
  category?: string;
  gender?: string;
  location?: {
    department?: string;
    city?: string;
  };
  age?: {
    min?: number;
    max?: number;
  };
  // ... otros filtros
}
```

### 3. Grupos de Atributos (AttributeGroup)

Maneja las categorías, géneros y otros atributos de los perfiles.

#### Estructura
```typescript
interface IAttributeGroup {
  name: string;
  key: string; // 'category', 'gender', etc.
  variants: {
    label: string;
    value: string;
    active: boolean;
  }[];
}
```

## Migración de Estructura de Ubicación

### Problema Resuelto
Se migró la estructura de ubicación de strings simples a objetos con `value` y `label` para resolver problemas de case sensitivity y tildes.

### Antes
```javascript
location: {
  country: "Colombia",
  department: "Bogotá",
  city: "Chapinero"
}
```

### Después
```javascript
location: {
  country: {
    value: "colombia",
    label: "Colombia"
  },
  department: {
    value: "bogota",
    label: "Bogotá"
  },
  city: {
    value: "chapinero",
    label: "Chapinero"
  }
}
```

### Beneficios
- Búsquedas consistentes sin problemas de tildes
- Visualización correcta con formato original
- Escalabilidad para futuras expansiones

## Solución de Problemas

### Filtro de Categorías No Funciona

**Problema**: El filtro `/api/filters/profiles?category=escort` no devuelve resultados.

**Causa**: Error en la consulta MongoDB para arrays en el campo `features.value`.

**Solución**: Usar `$in` para buscar dentro del array:
```javascript
// Antes (INCORRECTO)
'value': normalizedValue

// Después (CORRECTO)
'value': { $in: [normalizedValue] }
```

### Inconsistencia en Métodos HTTP

**Problema**: Mezcla de métodos GET y POST para filtros.

**Solución**: Unificación a métodos POST para todos los filtros:
- `POST /api/filters/profiles`
- `POST /api/filters/profiles/count`

### Problemas de Conexión MongoDB

**Síntomas**: Error ECONNREFUSED en puerto 27017

**Soluciones**:
1. Verificar que MongoDB esté ejecutándose
2. Comprobar variables de entorno (`MONGO_URI`)
3. Verificar que el archivo `.env` esté cargado correctamente

## Scripts Útiles

```bash
# Verificar conexión a base de datos
node check-db.js

# Inicializar grupos de atributos
node seed-attribute-groups.js

# Verificar y poblar datos
node verify-and-seed.js

# Desarrollo con recarga automática
npm run dev

# Construcción para producción
npm run build

# Iniciar en producción
npm start
```

## Validaciones y Seguridad

### Validación de Perfiles
- Validación de features contra AttributeGroups
- Verificación de nombres únicos (opcional)
- Validación de estructura de datos

### Autenticación
- JWT para autenticación de usuarios
- Middleware de autorización
- Protección de rutas sensibles

### Verificación de Perfiles
- Sistema automático de verificación
- Estados: pending, verified, rejected
- Pasos de verificación múltiples

## API Reference

### Respuestas Estándar

#### Éxito
```json
{
  "success": true,
  "data": {...},
  "message": "Operación exitosa"
}
```

#### Error
```json
{
  "success": false,
  "error": "Mensaje de error",
  "details": {...}
}
```

### Paginación
```json
{
  "docs": [...],
  "totalCount": 100,
  "currentPage": 1,
  "totalPages": 10,
  "hasNextPage": true,
  "hasPrevPage": false,
  "limit": 10
}
```

## Desarrollo y Debug

### Logs de Debug
El sistema incluye logs detallados para debugging:
- `🔍 [BACKEND FILTERS DEBUG]` - Logs de filtros
- `🚨 [ERROR]` - Logs de errores
- `✅ [SUCCESS]` - Logs de éxito

### Testing
```bash
# Probar filtros
curl -X POST http://localhost:5000/api/filters/profiles \
  -H "Content-Type: application/json" \
  -d '{"category":"escort"}'

# Probar conteo
curl -X POST http://localhost:5000/api/filters/profiles/count \
  -H "Content-Type: application/json" \
  -d '{"category":"escort"}'
```

## Próximos Pasos

1. Implementar caché para consultas frecuentes
2. Agregar tests unitarios y de integración
3. Optimizar consultas de base de datos
4. Implementar rate limiting
5. Agregar documentación OpenAPI/Swagger
6. Implementar logging estructurado
7. Configurar monitoreo y alertas

## Notas Importantes

- **Backup**: Siempre hacer backup antes de migraciones
- **Environment**: Usar variables de entorno para configuración
- **Security**: No commitear secrets al repositorio
- **Performance**: Monitorear consultas lentas en MongoDB
- **Logs**: Mantener logs para debugging y auditoría

---

**Última actualización**: Diciembre 2024
**Versión**: 1.0.0
**Mantenedor**: Equipo de Desarrollo