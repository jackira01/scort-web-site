# Documentación del Sistema de Planes y Upgrades

## Resumen Ejecutivo

Este documento describe la arquitectura completa del sistema de planes y upgrades implementado en la plataforma, incluyendo la jerarquía de visibilidad, reglas de negocio y componentes UI.

## Jerarquía de Planes

### Estructura de Niveles

Los planes están organizados en 5 niveles de visibilidad, donde **nivel 1 = máxima visibilidad** y **nivel 5 = mínima visibilidad**:

| Nivel | Nombre | Icono | Color | Descripción |
|-------|--------|-------|-------|--------------|
| 1 | AMATISTA | 👑 Crown | Púrpura | Máxima visibilidad y todas las características premium |
| 2 | ZAFIRO | 💎 Gem | Azul | Excelente visibilidad con características avanzadas |
| 3 | ESMERALDA | 🛡️ Shield | Verde | Buena visibilidad con características estándar |
| 4 | ORO | ⭐ Star | Naranja | Visibilidad estándar con características básicas |
| 5 | DIAMANTE | ⚡ Zap | Amarillo | Plan básico para comenzar |

### Características por Nivel

Cada plan incluye:
- **Features**: `showInHome`, `showInFilters`, `showInSponsored`
- **Content Limits**: `maxPhotos`, `maxVideos`, `maxAudios`, `maxProfiles`, `storiesPerDayMax`
- **Included Upgrades**: Lista de upgrades incluidos automáticamente

## Sistema de Upgrades

### Tipos de Upgrades

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

### Efectos de Upgrades

```typescript
interface UpgradeEffect {
  levelDelta?: number;        // -1 sube un nivel (mejora)
  setLevelTo?: number;        // salto directo a un nivel específico
  priorityBonus?: number;     // suma al score dentro del nivel
  positionRule?: 'FRONT' | 'BACK' | 'BY_SCORE'; // regla de inserción
}
```

### Políticas de Stacking

- **extend**: Extiende la duración del upgrade existente
- **replace**: Reemplaza el upgrade existente
- **reject**: Rechaza el nuevo upgrade si ya existe uno activo

## Algoritmo de Feed y Visibilidad

### Orden de Aparición en Home Feed

1. **IMPULSO** (Upgrades activos) - Posición prioritaria temporal
2. **PREMIUM** (Nivel 1-2: AMATISTA, ZAFIRO)
3. **DESTACADO** (Nivel 3: ESMERALDA)
4. **BÁSICO** (Nivel 4-5: ORO, DIAMANTE)

### Sistema de Fairness Rotation

- Actualización de `lastShownAt` para rotación equitativa
- Algoritmo de scoring que combina nivel + tiempo + upgrades activos
- Separadores visuales por grupos de nivel

## Componentes UI Implementados

### Frontend Components

#### 1. HomeProfiles.tsx
```typescript
// Renderiza perfiles con separadores por nivel
const levelSeparators = {
  'IMPULSO': '🚀 IMPULSO',
  'PREMIUM': '⭐ PREMIUM', 
  'DESTACADO': '💎 DESTACADO',
  'BASICO': '👤 BÁSICO'
};
```

#### 2. Step5Finalize.tsx
- Selección de plan en creación de perfil
- Muestra jerarquía visual con iconos y colores
- Información de upgrade IMPULSO disponible

#### 3. AccountSettings.tsx
- Muestra plan actual del usuario
- Badge de IMPULSO si está activo
- Iconos y colores por nivel

### Admin Components

#### 1. PlansManager.tsx
- Gestión completa de planes
- CRUD operations
- Validación de niveles

#### 2. UpgradesManager.tsx
- Gestión de upgrades
- Configuración de efectos
- Políticas de stacking

## Servicios Backend

### feeds.service.ts
```typescript
// Endpoint principal para feed ordenado
getHomeFeed(options: HomeFeedOptions): Promise<HomeFeedResponse>

// Estadísticas del feed
getHomeFeedStats(): Promise<FeedStatsResponse>
```

### plans.service.ts
```typescript
// CRUD operations para planes
createPlan(data: CreatePlanRequest): Promise<Plan>
updatePlan(id: string, data: UpdatePlanRequest): Promise<Plan>
deletePlan(id: string): Promise<void>
getPlans(filters: PlansFilters): Promise<PlansResponse>
```

## Reglas de Negocio

### 1. Jerarquía de Visibilidad
- Nivel 1 (AMATISTA) = Máxima prioridad
- Nivel 5 (DIAMANTE) = Mínima prioridad
- IMPULSO upgrade puede elevar temporalmente cualquier nivel

### 2. Rotación Equitativa
- Perfiles del mismo nivel rotan basado en `lastShownAt`
- Evita que los mismos perfiles aparezcan siempre primero

### 3. Separadores Visuales
- Grupos claramente diferenciados en el feed
- IMPULSO siempre aparece al final como upgrade especial

### 4. Límites de Contenido
- Cada plan tiene límites específicos
- Validación en tiempo real durante creación/edición

## Configuración del Sistema

### Plan por Defecto
```typescript
interface DefaultPlanConfig {
  enabled: boolean;
  planId: string | null;
  planCode: string | null;
}
```

### Parámetros Configurables
- `system.default_plan`: Configuración del plan automático
- Límites de contenido por plan
- Duración de upgrades

## Testing

### Endpoints de Prueba
- `/api/feeds/test/fairness-rotation`: Prueba del sistema de rotación
- Validación de algoritmos de scoring
- Tests de integración para componentes UI

## Consideraciones de Performance

### Optimizaciones Implementadas
- Índices en base de datos para `level` y `lastShownAt`
- Caché de configuraciones frecuentes
- Paginación eficiente en feeds
- React Query para caché de datos en frontend

### Métricas de Monitoreo
- Tiempo de respuesta de feeds
- Distribución de visibilidad por nivel
- Efectividad de upgrades IMPULSO

## Roadmap y Mejoras Futuras

### Próximas Funcionalidades
1. Analytics de performance por plan
2. A/B testing para algoritmos de visibilidad
3. Upgrades automáticos basados en métricas
4. Sistema de recomendaciones de upgrades

### Optimizaciones Técnicas
1. Implementación de Redis para caché distribuido
2. Algoritmos ML para scoring personalizado
3. Real-time updates para cambios de plan
4. Métricas avanzadas de engagement

---

**Última actualización**: Enero 2025  
**Versión**: 1.0  
**Mantenido por**: Equipo de Desarrollo Fullstack