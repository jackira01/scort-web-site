# 📜 Documentación: Sistema Anterior de Ordenamiento de Perfiles

**Fecha de documentación**: Noviembre 2024  
**Estado**: Reemplazado por sistema de scoring ponderado

---

## 🔍 Resumen Ejecutivo

El sistema anterior ordenaba perfiles mediante una función llamada `getEffectiveLevel()` que calculaba un "nivel efectivo" sumando modificadores de upgrades. Este enfoque tenía limitaciones que permitían casos donde perfiles de menor nivel superaban a los de mayor nivel.

---

## 📊 Estructura del Sistema Anterior

### **Función Principal: `getEffectiveLevel()`**

```typescript
const getEffectiveLevel = (planLevel: number, upgrades: any[]): number => {
  let effectiveLevel = planLevel;
  
  // Aplicar modificadores de upgrades
  upgrades.forEach(upgrade => {
    if (upgrade.effect?.priorityBonus) {
      effectiveLevel -= upgrade.effect.priorityBonus; // Restar para mejorar nivel
    }
  });
  
  return Math.max(1, effectiveLevel); // Mínimo nivel 1
};
```

**Ejemplo de cálculo:**
```
Perfil A: ORO (nivel 2) + upgrade priorityBonus: 2
  → effectiveLevel = 2 - 2 = 0 → 1 (limitado a mínimo 1)

Perfil B: DIAMANTE (nivel 1) sin upgrades
  → effectiveLevel = 1

Resultado: Perfil A nivel "1" vs Perfil B nivel "1" → ❌ Empate no deseado
```

---

### **Función de Ordenamiento: `sortProfiles()`**

```typescript
export const sortProfiles = (profiles: IProfile[]): IProfile[] => {
  return profiles.sort((a, b) => {
    // 1. Comparar por nivel efectivo
    const levelDiff = getEffectiveLevel(a, a.upgrades) - getEffectiveLevel(b, b.upgrades);
    if (levelDiff !== 0) return levelDiff;
    
    // 2. Si mismo nivel, ordenar por variantDays (descendente)
    const daysA = a.planAssignment?.variantDays || 0;
    const daysB = b.planAssignment?.variantDays || 0;
    if (daysA !== daysB) return daysB - daysA;
    
    // 3. Si mismo nivel y días, ordenar por lastShownAt
    const dateA = a.lastShownAt ? new Date(a.lastShownAt).getTime() : 0;
    const dateB = b.lastShownAt ? new Date(b.lastShownAt).getTime() : 0;
    if (dateA !== dateB) return dateA - dateB;
    
    // 4. Finalmente por fecha de creación
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  };
};
```

---

## ❌ Problemas Identificados

### **1. Niveles Colisionan con Upgrades**

**Escenario problemático:**
```
- DIAMANTE nivel 1 sin upgrades → effectiveLevel = 1
- ORO nivel 2 con priorityBonus: 1 → effectiveLevel = 1
- PLATA nivel 3 con priorityBonus: 2 → effectiveLevel = 1

Resultado: Los 3 perfiles compiten en "nivel 1" ❌
```

**Problema**: Los upgrades podían igualar niveles que deberían ser distintos.

---

### **2. Sin Rotación Aleatoria**

El ordenamiento era **determinístico puro**:
```typescript
// Siempre el mismo orden si los criterios son iguales
Perfil A: DIAMANTE 30 días, lastShownAt: 2024-01-01
Perfil B: DIAMANTE 30 días, lastShownAt: 2024-01-01

→ Siempre se ordenaban por createdAt (el más antiguo primero)
→ ❌ No había rotación justa
```

**Efecto**: Los perfiles creados primero siempre aparecían antes.

---

### **3. Prioridad de Variantes No Clara**

```typescript
// Solo ordenaba por días, sin considerar "importancia comercial"
30 días > 15 días > 7 días

// Pero no había pesos para diferenciar claramente:
// ¿30 días es 2x mejor que 15 días o 4x mejor?
```

**Problema**: No había granularidad en la diferenciación.

---

### **4. DESTACADO e IMPULSO Mal Implementados**

**Según las reglas del negocio:**
- DESTACADO: Sube 1 nivel, asigna 7 días
- IMPULSO: Mejora de 7 a 15 días (requiere DESTACADO)

**Implementación anterior:**
```typescript
// Solo restaba priorityBonus al nivel
effectiveLevel -= upgrade.effect.priorityBonus;

// ❌ No cambiaba los días de variante
// ❌ No validaba que IMPULSO requiera DESTACADO
```

---

## 🔄 Flujo de Ordenamiento Anterior

```
┌─────────────────────────────────────┐
│ 1. Obtener perfiles visibles       │
│    (isActive=true, visible=true)    │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│ 2. Para cada perfil:                │
│    - Calcular effectiveLevel        │
│      (nivel - priorityBonus)        │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│ 3. Ordenar por:                     │
│    a) effectiveLevel (ascendente)   │
│    b) variantDays (descendente)     │
│    c) lastShownAt (ascendente)      │
│    d) createdAt (descendente)       │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│ 4. Retornar array ordenado          │
│    (sin rotación aleatoria)         │
└─────────────────────────────────────┘
```

---

## 📊 Ejemplo Real del Sistema Anterior

**Input:**
```javascript
[
  { name: "Ana",    plan: "DIAMANTE", level: 1, days: 30, upgrades: [] },
  { name: "Pedro",  plan: "ORO",      level: 2, days: 30, upgrades: [{ priorityBonus: 1 }] },
  { name: "María",  plan: "DIAMANTE", level: 1, days: 15, upgrades: [] },
  { name: "Carlos", plan: "PLATA",    level: 3, days: 30, upgrades: [{ priorityBonus: 2 }] }
]
```

**Cálculo de effectiveLevel:**
```
Ana:    effectiveLevel = 1 - 0 = 1
Pedro:  effectiveLevel = 2 - 1 = 1  ← ❌ Iguala a DIAMANTE
María:  effectiveLevel = 1 - 0 = 1
Carlos: effectiveLevel = 3 - 2 = 1  ← ❌ Iguala a DIAMANTE
```

**Ordenamiento final (INCORRECTO):**
```
1. Ana    (nivel 1, 30 días)  ← Correcto
2. Pedro  (nivel 1*, 30 días) ← ❌ Debería ir después
3. Carlos (nivel 1*, 30 días) ← ❌ Debería ir último
4. María  (nivel 1, 15 días)  ← Correcto
```

**Problema**: Pedro y Carlos compiten en igualdad con DIAMANTE.

---

## 🔧 Limitaciones Técnicas

| Aspecto | Limitación |
|---------|-----------|
| **Escalabilidad** | Niveles 1-5 hardcodeados |
| **Granularidad** | Solo 4 criterios de ordenamiento |
| **Rotación** | ❌ No existe (siempre mismo orden) |
| **Transparencia** | Difícil predecir posición final |
| **Upgrades** | No valida lógica de negocio (DESTACADO/IMPULSO) |

---

## 📈 Comparación: Anterior vs Nuevo

| Característica | Sistema Anterior | Sistema Nuevo |
|----------------|------------------|---------------|
| **Método** | Nivel efectivo con restas | Score ponderado (1M-5M) |
| **Colisiones** | ❌ Sí (upgrades igualaban niveles) | ✅ No (pesos garantizan jerarquía) |
| **Rotación** | ❌ No existe | ✅ Cada 15 min con seed |
| **DESTACADO** | ⚠️ Parcial (solo nivel) | ✅ Completo (nivel + días) |
| **IMPULSO** | ❌ No implementado | ✅ Implementado (7→15 días) |
| **Escalabilidad** | ⚠️ Limitada | ✅ Automática (nuevos niveles) |
| **Debugging** | ⚠️ Difícil | ✅ Logs detallados con puntos |

---

## 🎯 Razones del Cambio

1. **Jerarquía Matemáticamente Garantizada**: Imposible que nivel inferior supere a superior
2. **Rotación Justa**: Todos los perfiles del mismo grupo tienen igual oportunidad
3. **Implementación Correcta de Upgrades**: DESTACADO e IMPULSO funcionan según reglas de negocio
4. **Escalabilidad**: Agregar nivel 6, 7, etc. no requiere cambios de código
5. **Transparencia**: Logs muestran cómo se calculó cada posición

---

## 📝 Notas Finales

Este documento preserva el conocimiento del sistema anterior para:
- Auditorías futuras
- Comprensión de decisiones arquitectónicas
- Referencia en caso de rollback (no recomendado)

**Estado actual**: Sistema reemplazado completamente en Noviembre 2024.

---

**Mantenido por**: Sistema de Visibilidad v2.0  
**Última actualización**: Noviembre 2024
