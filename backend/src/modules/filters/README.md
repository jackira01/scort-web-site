# Módulo de Filtros

Este módulo proporciona endpoints para filtrar perfiles de manera eficiente.

## Endpoints Disponibles

### 1. Obtener Perfiles Filtrados
```
GET /api/filters/profiles
```

**Parámetros de consulta:**
- `category` (string): Filtrar por categoría
- `country` (string): Filtrar por país
- `state` (string): Filtrar por estado/departamento
- `city` (string): Filtrar por ciudad
- `features` (string): JSON stringificado con características. Ejemplo: `{"gender":"female","age":["18-25","26-35"]}`
- `minPrice` (number): Precio mínimo
- `maxPrice` (number): Precio máximo
- `dayOfWeek` (string): Día de la semana para disponibilidad
- `timeStart` (string): Hora de inicio (formato HH:mm)
- `timeEnd` (string): Hora de fin (formato HH:mm)
- `isActive` (boolean): Solo perfiles activos (default: true)
- `isVerified` (boolean): Solo perfiles verificados
- `page` (number): Número de página (default: 1)
- `limit` (number): Elementos por página (default: 20, max: 100)
- `sortBy` (string): Campo para ordenar ('createdAt', 'updatedAt', 'name', 'price')
- `sortOrder` (string): Orden ('asc', 'desc')

**Ejemplo de uso:**
```
GET /api/filters/profiles?category=escort&city=Bogotá&minPrice=100&maxPrice=500&page=1&limit=20
GET /api/filters/profiles?features={"gender":"female","age":["18-25","26-35"]}&isVerified=true
```

### 2. Obtener Opciones de Filtros
```
GET /api/filters/options
```

Retorna todas las opciones disponibles para los filtros:
- Categorías disponibles
- Ubicaciones (países, estados, ciudades)
- Características por grupo de atributos
- Rango de precios (mínimo y máximo)

### 3. Obtener Conteo de Perfiles
```
GET /api/filters/profiles/count
```

Retorna el número total de perfiles que coinciden con los filtros especificados (sin paginación).

## Estructura de Respuesta

### Perfiles Filtrados
```json
{
  "success": true,
  "data": {
    "profiles": [...],
    "totalCount": 150,
    "currentPage": 1,
    "totalPages": 8,
    "hasNextPage": true,
    "hasPrevPage": false
  },
  "message": "Perfiles obtenidos exitosamente"
}
```

### Opciones de Filtros
```json
{
  "success": true,
  "data": {
    "categories": ["escort", "masajes", "acompañantes"],
    "locations": {
      "countries": ["Colombia", "México", "Argentina"],
      "states": ["Bogotá", "Antioquia", "Valle del Cauca"],
      "cities": ["Bogotá", "Medellín", "Cali"]
    },
    "features": {
      "gender": ["female", "male", "trans"],
      "age": ["18-25", "26-35", "36-45"],
      "hairColor": ["rubio", "moreno", "pelirrojo"]
    },
    "priceRange": {
      "min": 50000,
      "max": 1000000
    }
  },
  "message": "Opciones de filtros obtenidas exitosamente"
}
```

## Notas Técnicas

- Los filtros de características (`features`) requieren que se especifique el `key` del grupo de atributos
- Los filtros de ubicación son independientes (se puede filtrar solo por país, solo por ciudad, etc.)
- Los filtros de precio buscan en el array `rates` del perfil
- Los filtros de disponibilidad buscan en el array `availability` del perfil
- Todos los filtros se combinan con operador AND
- La paginación es obligatoria para evitar sobrecarga del servidor
- Los resultados incluyen información de populate para `user` y `features.group_id`