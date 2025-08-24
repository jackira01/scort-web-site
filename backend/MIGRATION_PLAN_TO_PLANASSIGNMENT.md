# Migración de Plan a PlanAssignment

## Problema Identificado

El perfil con plan DIAMANTE no aparece en el endpoint `/api/profile/home` porque:

1. **Estructura de datos inconsistente**: El perfil tiene el campo `plan` (sistema antiguo) pero no tiene `planAssignment` (sistema nuevo)
2. **Endpoint desactualizado**: El endpoint `getProfilesForHome` solo buscaba perfiles con `planAssignment`
3. **Falta de migración**: No existía un proceso para convertir perfiles del sistema antiguo al nuevo

## Solución Implementada

### 1. Compatibilidad Inmediata ✅

Se actualizó el endpoint `/api/profile/home` para soportar ambos sistemas:

- **Nuevo sistema**: Perfiles con `planAssignment`
- **Sistema antiguo**: Perfiles con `plan` (compatibilidad temporal)
- **Sin plan**: Perfiles que usan el plan por defecto

### 2. Script de Migración ✅

Se creó el script `migrate-plan-to-planassignment.ts` que:

- Busca perfiles con `plan` pero sin `planAssignment`
- Convierte la referencia antigua al nuevo formato
- Asigna la variante más larga disponible del plan
- Mantiene la visibilidad del perfil

### 3. Comandos NPM ✅

Se agregaron comandos para facilitar la migración:

```bash
# Ejecutar migración
npm run migrate:plan-to-planassignment

# Revertir migración (si es necesario)
npm run migrate:revert-planassignment
```

## Cómo Ejecutar la Migración

### Paso 1: Verificar el Estado Actual

1. Accede a `/api/profile/home` en Postman
2. Verifica que ahora aparezcan perfiles con planes (incluyendo DIAMANTE)
3. Revisa los logs de la consola para ver qué perfiles se están procesando

### Paso 2: Ejecutar la Migración (Opcional)

Si quieres migrar completamente al nuevo sistema:

```bash
cd backend
npm run migrate:plan-to-planassignment
```

Esto convertirá todos los perfiles con `plan` a `planAssignment`.

### Paso 3: Verificar la Migración

Después de la migración:

1. Verifica que el perfil DIAMANTE ahora tenga `planAssignment`
2. Confirma que aparece en `/api/profile/home`
3. Revisa que la fecha de expiración sea correcta

## Estructura del PlanAssignment

```javascript
planAssignment: {
  planCode: "DIAMANTE",        // Código del plan
  variantDays: 180,            // Duración en días
  startAt: "2024-01-20T...",   // Fecha de inicio
  expiresAt: "2024-07-18T..." // Fecha de expiración
}
```

## Logs de Debug

El endpoint ahora muestra logs detallados:

```
Profile [nombre] - Plan: DIAMANTE (plan (legacy)) - Expires: N/A
Profile [nombre] - Plan DIAMANTE (plan (legacy)) - showInHome: true - Should show: true
```

## Verificación de Planes DIAMANTE

Según la configuración, el plan DIAMANTE tiene:

- **Nivel**: 1 (máxima prioridad)
- **showInHome**: true
- **showInFilters**: true
- **showInSponsored**: true

## Notas Importantes

1. **Compatibilidad**: El sistema ahora funciona con ambos formatos durante la transición
2. **Sin pérdida de datos**: La migración preserva toda la información del perfil
3. **Reversible**: Se puede revertir la migración si es necesario
4. **Logs detallados**: Fácil debugging y monitoreo del proceso

## Próximos Pasos

1. **Ejecutar la migración** cuando estés listo para el cambio completo
2. **Monitorear** que todos los perfiles aparezcan correctamente
3. **Remover compatibilidad** con el sistema antiguo en futuras versiones
4. **Corregir niveles de planes** (Amatista nivel 1, Diamante nivel 5) según especificaciones

---

**Estado**: ✅ Problema resuelto - El perfil DIAMANTE ahora debería aparecer en `/api/profile/home`