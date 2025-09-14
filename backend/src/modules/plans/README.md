# Módulo de Planes y Upgrades

Este módulo implementa el sistema de definiciones de planes y upgrades para el motor de visibilidad.

## Estructura de Archivos

- `plan.model.ts` - Modelo de PlanDefinition con esquema Mongoose
- `upgrade.model.ts` - Modelo de UpgradeDefinition con esquema Mongoose
- `plans.service.ts` - Lógica de negocio y CRUD para planes y upgrades
- `plans.controller.ts` - Controladores REST para los endpoints
- `plans.routes.ts` - Definición de rutas y validaciones
- `plans.seed.ts` - Script de carga inicial de datos

## Ejecución del Seed

### Opción 1: Usando npm script (recomendado)
```bash
cd backend
pnpm run seed:plans
```

### Opción 2: Ejecución directa
```bash
cd backend
FEATURE_VISIBILITY_ENGINE=true ts-node ./src/modules/plans/plans.seed.ts
```

### Características del Seed
- **Idempotente**: Re-ejecutar no duplica datos (verifica por código)
- **Completo**: Carga 5 planes y 2 upgrades predefinidos
- **Configurable**: Respeta la variable `FEATURE_VISIBILITY_ENGINE`

## Datos Cargados

### Planes
1. **DIAMANTE** (Nivel 1) - Premium con todas las features
2. **ORO** (Nivel 2) - Alto nivel sin sponsored
3. **ESMERALDA** (Nivel 3) - Nivel medio
4. **ZAFIRO** (Nivel 4) - Nivel básico sin home
5. **AMATISTA** (Nivel 5) - Nivel mínimo

Cada plan incluye:
- Variantes de duración: 7, 15, 30, 180 días
- Features específicas (showInHome, showInFilters, showInSponsored)
- Límites de contenido (fotos, videos, stories)

### Upgrades
1. **DESTACADO**
   - Duración: 24 horas
   - Efecto: levelDelta -1, priorityBonus 150, positionRule BY_SCORE
   - Sin dependencias

2. **IMPULSO**
   - Duración: 12 horas
   - Efecto: setLevelTo 1, priorityBonus 10, positionRule BACK
   - Requiere: DESTACADO

## Endpoints Disponibles

### Planes
- `GET /api/plans` - Listar planes (con paginación)
- `GET /api/plans/:id` - Obtener plan por ID
- `GET /api/plans/code/:code` - Obtener plan por código
- `GET /api/plans/level/:level` - Obtener planes por nivel
- `POST /api/plans` - Crear nuevo plan
- `PUT /api/plans/:id` - Actualizar plan
- `DELETE /api/plans/:id` - Eliminar plan
- `GET /api/plans/:code/validate-upgrades` - Validar upgrades de un plan

### Upgrades
- `GET /api/plans/upgrades` - Listar upgrades (con paginación)
- `GET /api/plans/upgrades/:id` - Obtener upgrade por ID
- `GET /api/plans/upgrades/code/:code` - Obtener upgrade por código
- `POST /api/plans/upgrades` - Crear nuevo upgrade
- `PUT /api/plans/upgrades/:id` - Actualizar upgrade
- `DELETE /api/plans/upgrades/:id` - Eliminar upgrade
- `GET /api/plans/upgrades/:code/dependency-tree` - Obtener árbol de dependencias

## Validaciones Implementadas

### Planes
- Código único (solo letras mayúsculas y guiones bajos)
- Nivel entre 1-5
- Al menos una variante con días > 0 y precio > 0
- Features booleanas requeridas
- Límites de contenido válidos

### Upgrades
- Código único (solo letras mayúsculas y guiones bajos)
- durationHours > 0
- stackingPolicy válido (extend, replace, reject)
- Efecto con al menos una propiedad válida
- Validación de dependencias circulares

## Ejemplos de Uso

### Verificar que el seed funcionó
```bash
# Listar planes
curl http://localhost:4000/api/plans

# Listar upgrades
curl http://localhost:4000/api/plans/upgrades

# Obtener plan específico
curl http://localhost:4000/api/plans/code/DIAMANTE

# Obtener upgrade específico
curl http://localhost:4000/api/plans/upgrades/code/DESTACADO
```

### Crear un nuevo plan
```bash
curl -X POST http://localhost:4000/api/plans \
  -H "Content-Type: application/json" \
  -d '{
    "code": "PLATINO",
    "name": "Plan Platino",
    "level": 1,
    "variants": [
      { "days": 7, "price": 60000, "durationRank": 1 }
    ],
    "features": {
      "showInHome": true,
      "showInFilters": true,
      "showInSponsored": true
    },
    "contentLimits": {
      "photos": { "min": 15, "max": 60 },
      "videos": { "min": 8, "max": 25 },
      "storiesPerDayMax": 15
    }
  }'
```

## Notas Técnicas

- Los modelos incluyen hooks de pre-save para validaciones automáticas
- Se implementa validación de dependencias circulares en upgrades
- Los códigos son únicos y se validan automáticamente
- El servicio incluye métodos para validar upgrades incluidos en planes
- Todas las operaciones incluyen manejo robusto de errores