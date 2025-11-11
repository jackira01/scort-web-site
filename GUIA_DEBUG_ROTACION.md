# 🐛 Guía de Debug: Sistema de Rotación de Perfiles

**Fecha**: Noviembre 2024  
**Estado**: Configurado para debugging con rotación cada 10 segundos

---

## 📍 Ubicación del Parámetro de Intervalo

El intervalo de rotación se configura en:

**Archivo**: `backend/src/modules/visibility/visibility.service.ts`  
**Función**: `getRotationSeed()`  
**Líneas**: ~30-33 (aproximadamente)

```typescript
/**
 * Calcula el intervalo de rotación actual
 * @returns Seed basado en timestamp redondeado a intervalos definidos
 * 
 * ⚠️ CONFIGURACIÓN DE ROTACIÓN:
 * Para PRODUCCIÓN: usar 15 * 60 * 1000 (15 minutos)
 * Para DEBUG: usar 10 * 1000 (10 segundos)
 */
function getRotationSeed(): number {
  const now = Date.now();
  // 🔧 CAMBIAR AQUÍ EL INTERVALO:
  // PRODUCCIÓN: const rotationInterval = 15 * 60 * 1000; // 15 minutos
  // DEBUG:      const rotationInterval = 10 * 1000;      // 10 segundos
  const rotationInterval = 10 * 1000; // ⚠️ ACTUALMENTE EN MODO DEBUG (10 segundos)
  
  const seed = Math.floor(now / rotationInterval);
  console.log(`🔄 [getRotationSeed] Intervalo: ${rotationInterval / 1000}s | Seed actual: ${seed} | Timestamp: ${now}`);
  return seed;
}
```

---

## 🔧 Cómo Cambiar el Intervalo

### Para Modo DEBUG (10 segundos - ACTUAL)
```typescript
const rotationInterval = 10 * 1000; // 10 segundos
```

### Para Modo PRODUCCIÓN (15 minutos)
```typescript
const rotationInterval = 15 * 60 * 1000; // 15 minutos
```

### Otros Intervalos Útiles
```typescript
// 30 segundos (para testing rápido)
const rotationInterval = 30 * 1000;

// 1 minuto (para testing moderado)
const rotationInterval = 60 * 1000;

// 5 minutos (para pre-producción)
const rotationInterval = 5 * 60 * 1000;
```

---

## 📊 Logs Generados en Consola

El sistema ahora genera logs detallados en cada etapa del proceso:

### 1. **Log de Seed de Rotación**
```
🔄 [getRotationSeed] Intervalo: 10s | Seed actual: 173123456 | Timestamp: 1731234567890
```
**Qué muestra**: 
- Intervalo configurado en segundos
- Seed actual (cambia cada 10 segundos)
- Timestamp completo

---

### 2. **Log de Cálculo de Nivel/Variante Efectivos**
```
⚡ [calculateEffectiveLevelAndVariant] Ana - Plan original: ESMERALDA (nivel 3), Variante: 30 días
🎯 [calculateEffectiveLevelAndVariant] Ana - DESTACADO activo: Nivel 3 → 2, Variante → 7 días
🚀 [calculateEffectiveLevelAndVariant] Ana - IMPULSO activo: Variante 7 días → 15 días
```
**Qué muestra**:
- Plan y nivel original del perfil
- Efecto de upgrade DESTACADO (cambio de nivel y variante)
- Efecto de upgrade IMPULSO (mejora de variante)

---

### 3. **Log de Cálculo de Score de Visibilidad**
```
📊 [calculateVisibilityScore] Ana - Nivel efectivo 2 (original: 3): +4000000 puntos
📊 [calculateVisibilityScore] Ana - Variante efectiva 15 días (original: 30) (rank 2): +20000 puntos
📊 [calculateVisibilityScore] Ana - DESTACADO + IMPULSO: +200 puntos
📊 [calculateVisibilityScore] Ana - Score final: 4020200
```
**Qué muestra**:
- Puntos por nivel efectivo (1M-5M)
- Puntos por variante efectiva (10K-30K)
- Bonificación por upgrades (100-200)
- Score total final

---

### 4. **Log de Distribución por Nivel**
```
📊 [sortProfiles] Distribución por nivel:
[
  {
    level: 1,
    count: 3,
    profiles: ['María (score: 5030000)', 'Juan (score: 5020000)', 'Pedro (score: 5010000)']
  },
  {
    level: 2,
    count: 5,
    profiles: ['Ana (score: 4020200)', 'Elena (score: 4020000)', ...]
  }
]
```
**Qué muestra**:
- Cuántos perfiles hay en cada nivel
- Nombres y scores de cada perfil
- Agrupación por nivel efectivo (1-5)

---

### 5. **Log de Grupos por Score**
```
🔢 [sortProfilesWithinLevel] Grupos por score:
[
  { score: 4020200, count: 1, profiles: ['Ana'] },
  { score: 4020000, count: 3, profiles: ['Elena', 'Diego', 'Laura'] }
]
```
**Qué muestra**:
- Perfiles agrupados por score exacto
- Cantidad de perfiles en cada grupo
- Nombres de perfiles en cada grupo

---

### 6. **Log de Mezclado (Shuffle)**
```
🎲 [shuffleArray] Mezclando 3 elementos con seed: 173123456
🔀 [sortProfilesWithinLevel] Grupo score 4020000 mezclado: Diego, Laura, Elena
```
**Qué muestra**:
- Cuántos elementos se están mezclando
- Seed usado (mismo seed = mismo orden)
- Orden resultante después del shuffle

---

### 7. **Log de Orden Final**
```
✅ [sortProfiles] Orden final: 
1. María
2. Juan
3. Pedro
4. Ana
5. Diego
6. Laura
7. Elena
```
**Qué muestra**:
- Lista completa de perfiles en orden final
- Numeración secuencial desde 1
- Resultado que verá el usuario en frontend

---

## 🧪 Cómo Probar la Rotación

### Paso 1: Iniciar el servidor
```bash
cd backend
pnpm run dev
```

### Paso 2: Hacer solicitudes a la API
```bash
# Endpoint de perfiles (ajustar según tu ruta)
curl http://localhost:5000/api/profiles

# O desde el frontend
# Abrir http://localhost:3000 y ver la lista de perfiles
```

### Paso 3: Observar logs en consola
Verás logs como:
```
🔄 [getRotationSeed] Intervalo: 10s | Seed actual: 173123456
🎯 [sortProfiles] Iniciando ordenamiento de 12 perfiles
📊 [calculateVisibilityScore] Ana - Nivel efectivo 2: +4000000 puntos
...
✅ [sortProfiles] Orden final: 1. María, 2. Juan, 3. Pedro...
```

### Paso 4: Esperar 10 segundos
El seed cambiará automáticamente:
```
🔄 [getRotationSeed] Intervalo: 10s | Seed actual: 173123457  ← Cambió!
```

### Paso 5: Hacer otra solicitud
Verás que el orden de perfiles con el mismo score cambió:
```
Antes (seed 173123456): Diego, Laura, Elena
Ahora (seed 173123457): Elena, Diego, Laura  ← Rotó!
```

---

## 📈 Qué Esperar en los Logs

### ✅ Comportamiento Correcto

1. **Seed cambia cada 10 segundos**
   ```
   10:00:00 → seed: 173123456
   10:00:10 → seed: 173123457  ← Cambió correctamente
   10:00:20 → seed: 173123458  ← Cambió correctamente
   ```

2. **Orden consistente dentro del mismo seed**
   ```
   Request 1 (10:00:05, seed 173123456): [Ana, Pedro, María]
   Request 2 (10:00:08, seed 173123456): [Ana, Pedro, María]  ← Mismo orden
   ```

3. **Orden cambia con nuevo seed**
   ```
   Request 3 (10:00:12, seed 173123457): [María, Ana, Pedro]  ← Cambió
   ```

4. **Jerarquía de niveles respetada**
   ```
   ✅ DIAMANTE nivel 1 SIEMPRE antes que ORO nivel 2
   ✅ ORO nivel 2 SIEMPRE antes que ESMERALDA nivel 3
   ```

5. **Upgrades aplicados correctamente**
   ```
   ESMERALDA 30 + DESTACADO → ORO 7 (nivel 2, 7 días)
   ESMERALDA 30 + DESTACADO + IMPULSO → ORO 15 (nivel 2, 15 días)
   ```

---

### ❌ Problemas a Vigilar

1. **Seed no cambia**
   ```
   ❌ Todos los logs muestran el mismo seed después de 10 segundos
   → Verificar que getRotationSeed() se llame en cada request
   ```

2. **Orden cambia en mismo seed**
   ```
   ❌ Mismo seed genera órdenes diferentes
   → Verificar que seededRandom() funcione correctamente
   ```

3. **Nivel inferior supera a superior**
   ```
   ❌ ORO nivel 2 aparece antes que DIAMANTE nivel 1
   → Verificar cálculo de score (pesos correctos)
   ```

4. **DESTACADO no cambia nivel**
   ```
   ❌ Perfil con DESTACADO mantiene nivel original
   → Verificar calculateEffectiveLevelAndVariant()
   ```

---

## 🔍 Debug Avanzado

### Ver Score Detallado de un Perfil Específico
Buscar en logs:
```bash
grep "calculateVisibilityScore.*NombrePerfil" logs.txt
```

### Verificar Cambios de Seed
```bash
grep "getRotationSeed" logs.txt | tail -10
```

### Ver Orden Final de Múltiples Requests
```bash
grep "Orden final" logs.txt
```

---

## ⚠️ Recordatorio Importante

**ANTES DE SUBIR A PRODUCCIÓN**:

1. Cambiar intervalo de 10 segundos a 15 minutos:
   ```typescript
   const rotationInterval = 15 * 60 * 1000; // 15 minutos
   ```

2. Comentar o reducir logs de debug si es necesario (opcional):
   ```typescript
   // Comentar logs muy verbosos en producción
   // console.log(`🎲 [shuffleArray] Mezclando...`);
   ```

3. Compilar y probar antes de deploy:
   ```bash
   pnpm run build
   ```

---

## 📝 Checklist de Verificación

- [ ] Servidor arrancado sin errores de TypeScript
- [ ] Logs de `getRotationSeed` aparecen en consola
- [ ] Seed cambia cada 10 segundos
- [ ] Orden permanece igual durante los 10 segundos
- [ ] Orden cambia después de 10 segundos
- [ ] DIAMANTE nivel 1 siempre aparece antes que otros niveles
- [ ] DESTACADO sube el nivel correctamente
- [ ] IMPULSO mejora variante de 7 a 15 días
- [ ] Perfiles con mismo score rotan aleatoriamente
- [ ] Logs muestran score detallado de cada perfil

---

**Última actualización**: Noviembre 2024  
**Configuración actual**: Rotación cada 10 segundos (DEBUG)  
**Configuración producción**: Rotación cada 15 minutos
