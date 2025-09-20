# Documentación: Estados de Perfiles - isActive, visible e isDeleted

## Resumen Ejecutivo

El sistema de perfiles utiliza tres campos booleanos principales para controlar el estado y visibilidad de los perfiles: `isActive`, `visible` e `isDeleted`. Cada uno tiene un propósito específico y trabajan en conjunto para proporcionar un control granular sobre el ciclo de vida de los perfiles.

## Definición de Campos

### 1. `isActive` (Boolean, default: false)
**Propósito**: Controla si un perfil está activo en el sistema desde el punto de vista administrativo.

**Casos de uso**:
- `true`: El perfil está activo y puede ser procesado por el sistema
- `false`: El perfil está inactivo (ej: pendiente de pago, suspendido administrativamente)

**Comportamiento**:
- Los perfiles con planes gratuitos se crean con `isActive: true`
- Los perfiles con planes de pago se crean con `isActive: false` hasta confirmar el pago
- Los administradores pueden cambiar este estado manualmente
- Se usa en validaciones de límites de perfiles por usuario

### 2. `visible` (Boolean, default: true)
**Propósito**: Controla si un perfil es visible públicamente en las búsquedas y listados.

**Casos de uso**:
- `true`: El perfil aparece en búsquedas públicas y listados
- `false`: El perfil está oculto del público pero sigue existiendo en el sistema

**Comportamiento**:
- Los perfiles se ocultan automáticamente cuando expira su plan de pago
- Los usuarios pueden ocultar sus propios perfiles temporalmente
- Los administradores pueden ocultar perfiles por moderación
- Se usa como filtro principal en las consultas públicas de perfiles

### 3. `isDeleted` (Boolean, default: false)
**Propósito**: Implementa el borrado lógico (soft delete) para mantener integridad referencial.

**Casos de uso**:
- `false`: El perfil existe normalmente en el sistema
- `true`: El perfil ha sido "eliminado" pero se mantiene en la base de datos

**Comportamiento**:
- Los perfiles marcados como eliminados no aparecen en ninguna consulta pública
- Se mantienen en la base de datos para preservar referencias e historial
- Solo los administradores pueden realizar borrado físico si es necesario
- Se usa como filtro de exclusión en todas las consultas

## Combinaciones de Estados

### Estados Comunes

| isActive | visible | isDeleted | Descripción | Caso de Uso |
|----------|---------|-----------|-------------|-------------|
| `true` | `true` | `false` | **Perfil Activo y Visible** | Perfil normal funcionando correctamente |
| `true` | `false` | `false` | **Perfil Activo pero Oculto** | Perfil temporalmente oculto por el usuario o admin |
| `false` | `false` | `false` | **Perfil Inactivo** | Perfil pendiente de pago o suspendido |
| `false` | `false` | `true` | **Perfil Eliminado** | Perfil eliminado por el usuario (soft delete) |

### Estados Especiales

| isActive | visible | isDeleted | Descripción | Notas |
|----------|---------|-----------|-------------|-------|
| `true` | `true` | `true` | **Inconsistente** | No debería ocurrir - requiere corrección |
| `false` | `true` | `false` | **Perfil Visible pero Inactivo** | Posible durante transiciones de estado |

## Flujos de Trabajo

### 1. Creación de Perfil

```typescript
// Perfil con plan gratuito
{
  isActive: true,    // Activo inmediatamente
  visible: true,     // Visible según límites de usuario
  isDeleted: false   // Nuevo perfil
}

// Perfil con plan de pago
{
  isActive: false,   // Inactivo hasta confirmar pago
  visible: false,    // Oculto hasta activación
  isDeleted: false   // Nuevo perfil
}
```

### 2. Expiración de Plan

```typescript
// Cuando expira un plan de pago
await ProfileModel.findByIdAndUpdate(profileId, {
  visible: false,    // Ocultar del público
  // isActive permanece true para admin
  // isDeleted permanece false
});
```

### 3. Ocultación por Usuario

```typescript
// Usuario oculta su perfil temporalmente
await ProfileModel.findByIdAndUpdate(profileId, {
  visible: false,    // Ocultar del público
  // isActive permanece true
  // isDeleted permanece false
});
```

### 4. Eliminación Lógica

```typescript
// Usuario elimina su perfil
await ProfileModel.findByIdAndUpdate(profileId, {
  isActive: false,   // Desactivar
  visible: false,    // Ocultar
  isDeleted: true    // Marcar como eliminado
});
```

## Consultas y Filtros

### Consultas Públicas (Frontend)
```typescript
// Solo perfiles visibles y no eliminados
const publicProfiles = await ProfileModel.find({
  visible: true,
  isDeleted: { $ne: true }
});
```

### Consultas Administrativas
```typescript
// Todos los perfiles excepto eliminados
const adminProfiles = await ProfileModel.find({
  isDeleted: { $ne: true }
});
```

### Validación de Límites de Usuario
```typescript
// Solo perfiles activos, visibles y no eliminados
const userActiveProfiles = await ProfileModel.find({
  user: userId,
  isActive: true,
  visible: true,
  isDeleted: { $ne: true }
});
```

## Servicios Relacionados

### `hideProfile()` - Ocultación Visual
- Cambia `visible: false`
- Mantiene `isActive: true`
- Mantiene `isDeleted: false`

### `hideExpiredProfiles()` - Limpieza Automática
- Oculta perfiles con planes expirados
- Cambia `visible: false`
- Mantiene otros campos intactos

### `getProfileVisibilityStats()` - Estadísticas
- Cuenta perfiles por cada estado
- Útil para monitoreo y reportes

## Mejores Prácticas

### 1. Orden de Verificación
Siempre verificar en este orden:
1. `isDeleted !== true` (excluir eliminados)
2. `visible === true` (solo visibles para público)
3. `isActive === true` (solo activos si es necesario)

### 2. Transiciones de Estado
- Usar servicios específicos para cambios de estado
- Evitar cambios directos en múltiples campos
- Mantener consistencia en las transiciones

### 3. Índices de Base de Datos
Los índices están optimizados para estas consultas:
- `{ visible: 1, isDeleted: 1 }` - Consultas públicas
- `{ isActive: 1 }` - Validaciones administrativas
- `{ isDeleted: 1 }` - Exclusión de eliminados

## Consideraciones de Rendimiento

- Las consultas públicas siempre deben filtrar por `visible: true` e `isDeleted: { $ne: true }`
- Los índices compuestos optimizan las consultas más frecuentes
- El borrado lógico preserva integridad pero requiere filtros consistentes

## Migración y Compatibilidad

- Los campos tienen valores por defecto seguros
- Las consultas existentes deben actualizarse para incluir filtros de `isDeleted`
- Los servicios de limpieza automática mantienen la consistencia del sistema