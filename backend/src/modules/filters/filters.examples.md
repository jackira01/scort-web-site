# Ejemplos de Uso del Módulo de Filtros

El servidor está corriendo en `http://localhost:5000`

## 1. Obtener todas las opciones de filtros disponibles

```bash
curl -X GET "http://localhost:5000/api/filters/options"
```

**Respuesta esperada:**
```json
{
  "success": true,
  "data": {
    "categories": ["escort", "masajes", "acompañantes"],
    "locations": {
      "countries": ["Colombia", "México", "Argentina"],
      "departments": ["Bogotá", "Antioquia", "Valle del Cauca"],
      "cities": ["Bogotá", "Medellín", "Cali"]
    },
    "features": {
      "gender": ["female", "male", "trans"],
      "age": ["18-25", "26-35", "36-45"]
    },
    "priceRange": {
      "min": 50000,
      "max": 1000000
    }
  }
}
```

## 2. Obtener todos los perfiles (sin filtros)

```bash
curl -X GET "http://localhost:5000/api/filters/profiles"
```

## 3. Filtrar perfiles por ubicación

### Por ciudad específica:
```bash
curl -X GET "http://localhost:5000/api/filters/profiles?city=Bogotá"
```

### Por estado/departamento (devuelve todos los perfiles del estado):
```bash
curl -X GET "http://localhost:5000/api/filters/profiles?department=Antioquia"
```

### Por estado y ciudad específica:
```bash
curl -X GET "http://localhost:5000/api/filters/profiles?department=Antioquia&city=Medellín"
```

## 4. Filtrar perfiles por categoría y rango de precios

```bash
curl -X GET "http://localhost:5000/api/filters/profiles?category=escort&minPrice=100000&maxPrice=500000"
```

## 5. Filtrar perfiles por características específicas

```bash
curl -X GET "http://localhost:5000/api/filters/profiles?features={\"gender\":\"female\",\"age\":[\"18-25\",\"26-35\"]}"
```

## 6. Filtrar perfiles con paginación y ordenamiento

```bash
curl -X GET "http://localhost:5000/api/filters/profiles?page=1&limit=10&sortBy=createdAt&sortOrder=desc"
```

## 7. Filtrar perfiles por disponibilidad

```bash
curl -X GET "http://localhost:5000/api/filters/profiles?dayOfWeek=lunes&timeStart=09:00&timeEnd=18:00"
```

## 8. Filtrar solo perfiles verificados

```bash
curl -X GET "http://localhost:5000/api/filters/profiles?isVerified=true"
```

## 9. Obtener conteo de perfiles que coinciden con filtros

```bash
curl -X GET "http://localhost:5000/api/filters/profiles/count?city=Bogotá&isVerified=true"
```

## 10. Filtro complejo combinando múltiples parámetros

```bash
curl -X GET "http://localhost:5000/api/filters/profiles?category=escort&city=Bogotá&features={\"gender\":\"female\",\"age\":\"18-25\"}&minPrice=100000&maxPrice=300000&isVerified=true&page=1&limit=20&sortBy=price&sortOrder=asc"
```

## Usando JavaScript/Fetch

```javascript
// Obtener opciones de filtros
fetch('http://localhost:5000/api/filters/options')
  .then(response => response.json())
  .then(data => console.log(data));

// Filtrar perfiles
const filters = {
  category: 'escort',
  'location[department]': 'Antioquia',
  'location[city]': 'Medellín',
  features: JSON.stringify({
    gender: 'female',
    age: ['18-25', '26-35']
  }),
  minPrice: 100000,
  maxPrice: 500000,
  isVerified: true,
  page: 1,
  limit: 20
};

const queryString = new URLSearchParams(filters).toString();
fetch(`http://localhost:5000/api/filters/profiles?${queryString}`)
  .then(response => response.json())
  .then(data => console.log(data));

// Ejemplo: Filtrar solo por estado (sin ciudad)
const departmentOnlyFilters = {
  category: 'escorts',
  'location[department]': 'Antioquia', // Devuelve todos los perfiles de Antioquia
};

const departmentQueryString = new URLSearchParams(departmentOnlyFilters).toString();
fetch(`http://localhost:5000/api/filters/profiles?${departmentQueryString}`)
  .then(response => response.json())
  .then(data => console.log('Perfiles de Antioquia:', data));
```

## Notas Importantes

1. **Features**: El parámetro `features` debe ser un JSON stringificado
2. **Paginación**: Por defecto `page=1` y `limit=20`
3. **Ordenamiento**: Por defecto `sortBy=createdAt` y `sortOrder=desc`
4. **Filtros activos**: Por defecto solo se muestran perfiles con `isActive=true`
5. **Límite de resultados**: El límite máximo por página es 100

## Códigos de Error Comunes

- **400**: Parámetros inválidos (ej: features con JSON malformado)
- **500**: Error interno del servidor
- **200**: Éxito, incluso si no hay resultados (array vacío)