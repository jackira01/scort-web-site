# 🧪 Guía de Testing - Optimización de /api/auth/session

## 🎯 Objetivo del Testing

Validar que las optimizaciones implementadas han reducido exitosamente las peticiones a `/api/auth/session` sin afectar la funcionalidad.

---

## ✅ PRE-REQUISITOS

1. Código compilado sin errores TypeScript ✅
2. Servidor backend corriendo en el puerto configurado
3. Base de datos MongoDB accesible
4. Cuenta de admin creada para testing

---

## 📋 PLAN DE TESTING

### FASE 1: Testing Básico de Compilación ✅

```bash
# Ya ejecutado - Sin errores en archivos migrados
cd frontend
npx tsc --noEmit
```

**Resultado:** ✅ Compilación exitosa

---

### FASE 2: Testing de Carga Inicial

#### 2.1. Levantar el servidor

```bash
cd frontend
npm run dev
```

#### 2.2. Preparar DevTools

1. Abrir Chrome/Edge en modo incógnito (sesión limpia)
2. F12 → Network
3. Click en "Clear" (limpiar log)
4. Filtrar por: `session` o `/api/auth/session`

#### 2.3. Cargar la homepage

```
http://localhost:3000
```

**Métricas esperadas:**
- ✅ **0-1 petición** a `/api/auth/session` en carga inicial
- ✅ Session cargada desde SSR (sin petición)

**Comparar con ANTES:**
- ❌ ANTES: 2-3 peticiones en homepage sin auth

---

### FASE 3: Testing de Login

#### 3.1. Hacer login

```
http://localhost:3000/autenticacion/login
```

1. Ingresar credenciales de admin
2. Click en "Iniciar Sesión"
3. Observar Network tab

**Métricas esperadas:**
- ✅ **1-2 peticiones** a `/api/auth/session` durante login
- ✅ Session establecida correctamente
- ✅ Redirección exitosa

**Comparar con ANTES:**
- ❌ ANTES: 3-5 peticiones durante y después del login

---

### FASE 4: Testing de /adminboard (CRÍTICO) 🔴

#### 4.1. Navegar a adminboard

```
http://localhost:3000/adminboard
```

**Observar Network tab durante:**
- Carga inicial del dashboard
- Los primeros 5 segundos

**Métricas esperadas:**
- ✅ **0-1 petición** a `/api/auth/session`
- ✅ AdminProtection valida correctamente
- ✅ Sidebar y contenido cargan sin errores

**Comparar con ANTES:**
- ❌ ANTES: 10-20 peticiones en los primeros segundos

#### 4.2. Navegar entre secciones

Hacer click en cada sección del sidebar:
1. Usuarios
2. Perfiles
3. Facturas
4. Grupos de Atributos
5. Planes
6. Blogs
7. Cupones

**Por cada sección:**

**Métricas esperadas:**
- ✅ **0 peticiones adicionales** a `/api/auth/session`
- ✅ Datos cargan correctamente
- ✅ Sin errores en consola

**Comparar con ANTES:**
- ❌ ANTES: 2-5 peticiones por cada cambio de sección

#### 4.3. Testing de operaciones CRUD

**En sección "Usuarios":**
- Cargar listado de usuarios
- Buscar/filtrar usuarios
- Ver detalles de un usuario

**En sección "Grupos de Atributos":**
- Cargar grupos existentes
- Crear nueva variante
- Editar variante
- Eliminar variante

**Métricas esperadas:**
- ✅ **0 peticiones** a `/api/auth/session` durante operaciones
- ✅ Todas las operaciones funcionan correctamente
- ✅ Datos se actualizan en tiempo real

---

### FASE 5: Testing de Sincronización entre Pestañas

#### 5.1. Abrir 2 pestañas

**Pestaña 1:**
```
http://localhost:3000/adminboard
```

**Pestaña 2:**
```
http://localhost:3000/cuenta
```

#### 5.2. Logout en Pestaña 1

1. Click en perfil → Cerrar sesión
2. Observar **ambas pestañas**

**Resultado esperado:**
- ✅ Pestaña 1: Redirige a home
- ✅ Pestaña 2: Cierra sesión automáticamente
- ✅ Pestaña 2: Redirige a home
- ✅ Sin errores en consola de ninguna pestaña

**Logs esperados en consola:**
```
🚪 [AuthSync] Iniciando logout broadcast...
📤 [AuthSync] Emitiendo logout a otras pestañas
📨 [AuthSync] Mensaje recibido: {type: 'logout', timestamp: ...}
🚪 [AuthSync] Cerrando sesión en esta pestaña...
```

---

### FASE 6: Testing de Performance

#### 6.1. Lighthouse Audit

1. Abrir DevTools → Lighthouse
2. Seleccionar:
   - ✅ Performance
   - ✅ Best Practices
   - Device: Desktop
3. Generar reporte para `/adminboard`

**Métricas esperadas (mejora):**
- Performance Score: +5-10 puntos
- Time to Interactive: Reducción de 200-500ms
- Total Blocking Time: Reducción de 100-300ms

#### 6.2. Memory Profiling

1. DevTools → Memory
2. Tomar snapshot inicial
3. Navegar por adminboard (5 secciones)
4. Tomar snapshot final
5. Comparar

**Resultado esperado:**
- ✅ No hay memory leaks significativos
- ✅ Listeners limpios correctamente

---

### FASE 7: Testing de Casos Edge

#### 7.1. Session Expiration

1. Login como admin
2. Ir a `/adminboard`
3. Esperar que la sesión expire (o forzar en backend)
4. Intentar una operación

**Resultado esperado:**
- ✅ Redirección automática a login
- ✅ Mensaje de sesión expirada
- ✅ Sin errores en consola

#### 7.2. Network Offline

1. Login como admin
2. Ir a `/adminboard`
3. DevTools → Network → Offline
4. Intentar navegar entre secciones

**Resultado esperado:**
- ✅ UI muestra mensaje de error de red
- ✅ No hay peticiones infinitas a `/api/auth/session`
- ✅ Al volver online, se recupera automáticamente

#### 7.3. Refresh en adminboard

1. Login como admin
2. Ir a `/adminboard?section=usuarios`
3. F5 (refresh)

**Resultado esperado:**
- ✅ **0-1 petición** a `/api/auth/session`
- ✅ Section activa se mantiene
- ✅ Datos cargan correctamente

---

## 📊 HOJA DE RESULTADOS

### Resumen de Peticiones a /api/auth/session

| Escenario | ANTES | DESPUÉS | Reducción |
|-----------|-------|---------|-----------|
| Homepage sin auth | 2-3 | 0-1 | ~75% |
| Login | 3-5 | 1-2 | ~60% |
| /adminboard carga inicial | 10-20 | 0-1 | ~95% |
| Navegar entre secciones | 2-5/sección | 0 | 100% |
| Operaciones CRUD | 1-3/operación | 0 | 100% |
| **TOTAL (1 minuto uso)** | **20-40** | **1-3** | **~92%** |

### Checklist de Funcionalidad

- [ ] ✅ Login/Logout funciona correctamente
- [ ] ✅ AdminProtection valida permisos
- [ ] ✅ Sincronización entre pestañas funciona
- [ ] ✅ Todas las secciones de adminboard cargan
- [ ] ✅ CRUD de usuarios funciona
- [ ] ✅ CRUD de atributos funciona
- [ ] ✅ No hay errores en consola
- [ ] ✅ Performance mejorada
- [ ] ✅ No hay memory leaks

---

## 🐛 TROUBLESHOOTING

### Problema: "useCentralizedSession debe usarse dentro de SessionContextProvider"

**Causa:** Componente usando el hook fuera del provider.

**Solución:** 
1. Verificar que `SessionContextProvider` está en `providers.tsx`
2. Verificar orden de providers (debe estar dentro de `SessionProvider`)

### Problema: Session es null pero usuario está logueado

**Causa:** Session no se pasó desde el servidor.

**Solución:**
1. Verificar `layout.tsx` tiene `const session = await auth();`
2. Verificar que se pasa a `<Providers session={session}>`

### Problema: Muchas peticiones a /api/auth/session aún

**Causa:** Componentes no migrados o axios sin optimizar.

**Solución:**
1. Buscar `import { useSession }` en codebase
2. Migrar componentes restantes según `MIGRACION_SESSION_CENTRALIZADA.md`
3. Verificar que servicios usan `axios-auth.ts`

### Problema: AuthSyncHandler no sincroniza

**Causa:** BroadcastChannel no soportado (navegador antiguo).

**Solución:**
1. Verificar logs en consola
2. Considerar restaurar `SessionSyncHandler` como fallback

---

## 📸 EVIDENCIA REQUERIDA

Para documentar el éxito de la optimización, capturar:

1. **Screenshot del Network tab:**
   - Filtro: `/api/auth/session`
   - Timeframe: 1 minuto de uso en `/adminboard`
   - Mostrar: Número total de peticiones

2. **Screenshot de Lighthouse:**
   - Scores ANTES (si existe baseline)
   - Scores DESPUÉS de optimización

3. **Video corto (opcional):**
   - 30 segundos navegando en `/adminboard`
   - Mostrar Network tab simultáneamente

---

## ✅ CRITERIOS DE ÉXITO

### MÍNIMO (debe cumplirse):
- ✅ Reducción >80% en peticiones a `/api/auth/session`
- ✅ Cero regresiones funcionales
- ✅ Cero errores en consola durante uso normal

### ÓPTIMO (objetivo):
- ✅ Reducción >90% en peticiones a `/api/auth/session`
- ✅ Mejora +5 puntos en Lighthouse Performance
- ✅ Sincronización entre pestañas funciona perfectamente

### EXCELENTE (bonus):
- ✅ Reducción >95% en peticiones
- ✅ Mejora +10 puntos en Lighthouse
- ✅ Zero peticiones durante navegación normal

---

## 🚀 SIGUIENTE PASO DESPUÉS DEL TESTING

### Si todo funciona correctamente:

1. **Commit los cambios:**
   ```bash
   git add .
   git commit -m "feat: optimize NextAuth session requests - reduce by 95%"
   ```

2. **Documentar resultados:**
   - Actualizar README con benchmarks
   - Agregar métricas al CHANGELOG

3. **Deploy a staging:**
   - Testing en ambiente similar a producción
   - Monitorear por 24-48 horas

4. **Migración gradual Fase 3:**
   - Continuar migrando componentes restantes
   - Seguir guía en `MIGRACION_SESSION_CENTRALIZADA.md`

### Si hay problemas:

1. **Rollback selectivo:**
   - Revertir solo archivos problemáticos
   - Mantener optimizaciones que funcionan

2. **Debug específico:**
   - Logs detallados del componente afectado
   - Verificar diferencias con version anterior

3. **Solicitar ayuda:**
   - Compartir logs de consola
   - Compartir screenshot del Network tab
   - Indicar pasos exactos para reproducir

---

## 📞 CONTACTO

Para reportar issues o consultas sobre esta optimización:
- Revisar: `RESUMEN_OPTIMIZACION_SESSION.md`
- Revisar: `MIGRACION_SESSION_CENTRALIZADA.md`
- Logs detallados en consola del navegador
