# 📍 Sistema de Ubicaciones - Guía de Importación

## 🎯 Descripción

Este módulo reemplaza el sistema de ubicaciones estáticas (`colombiaData.ts`) con un sistema dinámico basado en base de datos que soporta jerarquías ilimitadas.

## 🗄️ Estructura de Base de Datos

```
Location {
  value: string        // "bogota", "medellin" (normalizado, para URLs)
  label: string        // "Bogotá", "Medellín" (original, para mostrar)
  type: LocationType   // 'country' | 'department' | 'city' | 'locality'
  parentId: ObjectId   // Referencia al padre
  path: string         // "colombia/antioquia/medellin" (generado automáticamente)
  level: number        // 0, 1, 2, 3... (generado automáticamente)
  ancestorIds: []      // [countryId, deptId] (generado automáticamente)
  isActive: boolean    // Para soft delete
  hasChildren: boolean // Calculado automáticamente
}
```

## 📦 Importación Masiva con Postman

### Paso 1: Registrar las rutas en tu aplicación

Agrega en tu archivo principal de rutas (ej: `src/app.ts` o `src/routes/index.ts`):

```typescript
import locationRoutes from './modules/location/location.routes';

// ... otras rutas
app.use('/api/locations', locationRoutes);
```

### Paso 2: Preparar el archivo JSON

El archivo `location-import-example.json` contiene la estructura completa de Colombia con departamentos y ciudades.

**Estructura del JSON:**
```json
{
  "country": {
    "value": "colombia",
    "label": "Colombia"
  },
  "departments": [
    {
      "value": "antioquia",
      "label": "Antioquia",
      "cities": [
        {
          "value": "medellin",
          "label": "Medellín",
          "localities": [  // ⭐ Opcional: puedes agregar localidades/barrios
            {
              "value": "el-poblado",
              "label": "El Poblado"
            }
          ]
        }
      ]
    }
  ]
}
```

### Paso 3: Hacer la petición con Postman

**Configuración de Postman:**

1. **Método:** `POST`
2. **URL:** `http://localhost:5000/api/locations/bulk-import`
3. **Headers:**
   ```
   Content-Type: application/json
   ```
4. **Body (raw - JSON):**
   - Copia todo el contenido de `location-import-example.json`
   - O modifica según tus necesidades

**Ejemplo de petición:**

```bash
POST http://localhost:5000/api/locations/bulk-import
Content-Type: application/json

{
  "country": {
    "value": "colombia",
    "label": "Colombia"
  },
  "departments": [
    {
      "value": "antioquia",
      "label": "Antioquia",
      "cities": [
        { "value": "medellin", "label": "Medellín" },
        { "value": "envigado", "label": "Envigado" }
      ]
    },
    {
      "value": "bogota",
      "label": "Bogotá",
      "cities": [
        { 
          "value": "usaquen", 
          "label": "Usaquén",
          "localities": [
            { "value": "santa-barbara", "label": "Santa Bárbara" }
          ]
        }
      ]
    }
  ]
}
```

### Paso 4: Respuesta esperada

**Success (201):**
```json
{
  "success": true,
  "message": "Importación completada exitosamente",
  "stats": {
    "country": 1,
    "departments": 23,
    "cities": 234,
    "localities": 10,
    "total": 268
  }
}
```

**Error (500):**
```json
{
  "success": false,
  "error": "Error message",
  "details": "Stack trace..."
}
```

## 🔌 Endpoints Disponibles

### Públicos (Frontend)

```bash
# Obtener país
GET /api/locations/country
# Response: { value: "colombia", label: "Colombia" }

# Obtener departamentos
GET /api/locations/departments
# Response: [{ value: "antioquia", label: "Antioquia" }, ...]

# Obtener ciudades de un departamento
GET /api/locations/antioquia/children
# Response: [{ value: "medellin", label: "Medellín" }, ...]

# Obtener localidades de una ciudad
GET /api/locations/medellin/children
# Response: [{ value: "el-poblado", label: "El Poblado" }, ...]

# Buscar ubicaciones
GET /api/locations/search?q=medellin&limit=10
# Response: [{ value: "medellin", label: "Medellín", type: "city", ... }]

# Validar departamento
GET /api/locations/validate/department/antioquia
# Response: { value: "antioquia", isValid: true }

# Validar ciudad
GET /api/locations/validate/city/antioquia/medellin
# Response: { department: "antioquia", city: "medellin", isValid: true }
```

### Admin (Requiere autenticación)

```bash
# Importación masiva (⚠️ ELIMINA todos los datos existentes)
POST /api/locations/bulk-import

# Crear ubicación individual
POST /api/locations
Body: {
  "value": "el-poblado",
  "label": "El Poblado",
  "type": "locality",
  "parentValue": "medellin"
}

# Actualizar ubicación
PUT /api/locations/:id
Body: { "label": "Nueva Etiqueta" }

# Eliminar ubicación (soft delete)
DELETE /api/locations/:id

# Obtener jerarquía completa
GET /api/locations/hierarchy
```

## 🔄 Migración desde colombiaData.ts

### Opción 1: Usar el JSON de ejemplo

1. Usa el archivo `location-import-example.json` incluido
2. Contiene todos los departamentos y ciudades de Colombia
3. Haz POST a `/api/locations/bulk-import`

### Opción 2: Generar JSON personalizado

Crea un script para convertir `colombiaData.ts`:

```typescript
import { colombiaDepartments } from './frontend/src/utils/colombiaData';
import fs from 'fs';

const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ñ/g, 'n')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
};

const data = {
  country: { value: 'colombia', label: 'Colombia' },
  departments: Object.entries(colombiaDepartments).map(([dept, cities]) => ({
    value: normalizeText(dept),
    label: dept,
    cities: cities.map(city => ({
      value: normalizeText(city),
      label: city
    }))
  }))
};

fs.writeFileSync('custom-import.json', JSON.stringify(data, null, 2));
```

## 🎨 Uso en Frontend

### Actualizar imports

**Antes:**
```typescript
import { getAllDepartments, getCitiesByDepartment } from '@/utils/colombiaData';
```

**Después:**
```typescript
import { locationService } from '@/services/location.service';
```

### Ejemplos de uso

```typescript
// Obtener departamentos
const departments = await locationService.getDepartments();
// [{ value: "antioquia", label: "Antioquia" }, ...]

// Obtener ciudades
const cities = await locationService.getCitiesByDepartment('antioquia');
// [{ value: "medellin", label: "Medellín" }, ...]

// Obtener localidades (si existen)
const localities = await locationService.getChildren('medellin');
// [{ value: "el-poblado", label: "El Poblado" }, ...]

// Validar
const isValid = await locationService.isValidDepartment('antioquia');
// true

// Buscar
const results = await locationService.search('mede');
// [{ value: "medellin", label: "Medellín", type: "city", ... }]
```

### Hooks de React Query (actualizar)

```typescript
// En use-filter-options-query.ts
export const useDepartmentsQuery = () => {
  return useQuery({
    queryKey: ['departments'],
    queryFn: () => locationService.getDepartments(),
    staleTime: 1000 * 60 * 60, // 1 hora
  });
};

export const useCitiesByDepartmentQuery = (departmentValue?: string) => {
  return useQuery({
    queryKey: ['cities', departmentValue],
    queryFn: () => {
      if (!departmentValue) return [];
      return locationService.getChildren(departmentValue);
    },
    enabled: !!departmentValue,
    staleTime: 1000 * 60 * 60,
  });
};
```

## ⚠️ Importante

1. **El endpoint de importación masiva ELIMINA todos los datos existentes** antes de importar los nuevos
2. **Usa con precaución** en producción
3. **Considera hacer backup** de la colección antes de importar
4. **Los middlewares de autenticación están comentados** en las rutas - descoméntalos en producción

## 🔐 Seguridad

Para producción, asegúrate de descomentar los middlewares en `location.routes.ts`:

```typescript
router.post(
  '/bulk-import', 
  authMiddleware,      // ✅ Descomentar
  adminMiddleware,     // ✅ Descomentar
  locationController.bulkImport.bind(locationController)
);
```

## 📊 Ventajas del Nuevo Sistema

✅ Jerarquías ilimitadas (país → departamento → ciudad → localidad → barrio...)  
✅ Administrable desde panel admin  
✅ Búsqueda optimizada con índices  
✅ Validación de ubicaciones desde la API  
✅ Soft delete (no se pierden datos)  
✅ Cacheable con Redis  
✅ Extensible a múltiples países  
✅ Paths automáticos para SEO  

## 🐛 Troubleshooting

### Error: "Parent location not found"
- Verifica que el `parentValue` exista antes de crear hijos
- El orden de creación debe ser: país → departamentos → ciudades → localidades

### Error: "Duplicate key error"
- Ya existe una ubicación con el mismo `value` y `parentId`
- Cambia el `value` o verifica que no esté duplicado

### Los datos no aparecen en el frontend
- Verifica que la API esté corriendo
- Revisa la URL en `NEXT_PUBLIC_API_URL`
- Verifica que los datos se hayan importado correctamente con GET `/api/locations/hierarchy`

## 📞 Soporte

Si tienes problemas con la importación:
1. Verifica los logs del servidor
2. Revisa que MongoDB esté corriendo
3. Confirma que las rutas estén registradas correctamente
4. Verifica el formato del JSON
