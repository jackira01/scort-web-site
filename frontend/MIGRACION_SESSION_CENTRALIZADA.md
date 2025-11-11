# 🎯 Guía de Migración a useCentralizedSession

## ✅ Componentes ya migrados (COMPLETADOS)

Los siguientes componentes ya usan `useCentralizedSession()`:

1. ✅ `AdminProtection.tsx` - Protección de rutas admin
2. ✅ `Header.tsx` - Header global
3. ✅ `AuthRedirectHandler.tsx` - Redirección post-registro
4. ✅ `use-auth-sync.ts` - Sincronización entre pestañas

## 📋 Componentes pendientes de migración

### PRIORIDAD ALTA (componentes globales o frecuentemente renderizados)

Los siguientes componentes usan `useSession()` y deberían migrarse:

```typescript
// ANTES:
import { useSession } from 'next-auth/react';
const { data: session } = useSession();

// DESPUÉS:
import { useCentralizedSession } from '@/hooks/use-centralized-session';
const { session } = useCentralizedSession();
```

#### Lista de archivos a migrar:

1. **`src/hooks/use-user.ts`** ⭐ ALTA PRIORIDAD
   - Usado por muchos componentes
   - Línea 10: `const { data: session } = useSession();`
   - Cambiar a: `const { session } = useCentralizedSession();`

2. **`src/components/SeedUserCache.tsx`**
   - Línea 9: `const { data: session, status } = useSession();`
   - Cambiar a: `const { session, status } = useCentralizedSession();`

3. **`src/hooks/use-pending-invoices.ts`**
   - Línea 17: `const { data: session } = useSession();`
   - Cambiar a: `const { session } = useCentralizedSession();`

4. **`src/hooks/use-user-invoices.ts`**
   - Línea 33: `const { data: session } = useSession();`
   - Cambiar a: `const { session } = useCentralizedSession();`

5. **`src/hooks/use-email-users.ts`** (3 lugares)
   - Línea 17: `const { data: session } = useSession();`
   - Línea 44: `const { data: session } = useSession();`
   - Línea 62: `const { data: session } = useSession();`
   - Cambiar todos a: `const { session } = useCentralizedSession();`

### PRIORIDAD MEDIA (módulos específicos)

6. **`src/modules/settings/components/AccountSettings.tsx`**
   - Solo se carga cuando el usuario accede a settings

7. **`src/modules/profileDetails/components/ProfileDetailLayout.tsx`**
   - Línea 20: `const { data: session } = useSession();`

8. **`src/modules/payments/components/InvoiceList.tsx`**
   - Línea 37: `const { data: session } = useSession();`

9. **`src/modules/edit-profile/components/EditProfileLayout.tsx`**
   - Línea 47: `const { data: session } = useSession();`

10. **`src/modules/create-profile/components/CreateProfileLayout.tsx`**
    - Línea 82: `const { data: session } = useSession();`

11. **`src/modules/create-profile/components/Step4Plan.tsx`**
    - Línea 58: `const { data: session } = useSession();`

12. **`src/modules/account/components/UploadStoryModal.tsx`**
    - Línea 60: `const { data: session } = useSession();`

### PRIORIDAD BAJA (componentes poco usados)

13. **`src/components/authentication/post-register.tsx`**
    - Línea 26: `const { data: session, status, update } = useSession();`
    - Nota: También usa `update`, verificar compatibilidad

14. **`src/components/plans/ManagePlansModal.tsx`**
    - Línea 162: `const { data: session } = useSession();`

15. **`src/components/payments/PaymentManager.tsx`**
    - Línea 18: `const { data: session } = useSession();`

16. **`src/components/admin/emails/EmailManager.tsx`**
    - Línea 35: `const { data: session } = useSession();`

17. **`src/app/autenticacion/verificar-email/page.tsx`**
    - Línea 14: `const { data: session, update } = useSession();`
    - Nota: También usa `update`, verificar compatibilidad

## 🔧 Migración de servicios HTTP

### Para servicios que usan axios:

**ANTES:**
```typescript
import axiosInstance from '@/lib/axios';

export async function getUsers() {
  const response = await axiosInstance.get('/api/users');
  return response.data;
}
```

**DESPUÉS (Opción 1 - Hook en componente):**
```typescript
import { useCentralizedSession } from '@/hooks/use-centralized-session';
import { createAuthenticatedAxios } from '@/lib/axios-auth';

function MyComponent() {
  const { accessToken, userId } = useCentralizedSession();
  
  const fetchUsers = async () => {
    const api = createAuthenticatedAxios(accessToken, userId);
    const response = await api.get('/api/users');
    return response.data;
  };
}
```

**DESPUÉS (Opción 2 - Hook helper):**
```typescript
import { useAuthenticatedAxios } from '@/lib/axios-auth';

function MyComponent() {
  const api = useAuthenticatedAxios();
  
  const fetchUsers = async () => {
    const response = await api.get('/api/users');
    return response.data;
  };
}
```

## ⚠️ CASOS ESPECIALES

### Componentes que usan `session.update()`

Algunos componentes como `post-register.tsx` y `verificar-email/page.tsx` usan el método `update` de NextAuth:

```typescript
const { data: session, update } = useSession();
```

Para estos casos, necesitas **mantener useSession()** temporalmente o migrar a un enfoque diferente:

```typescript
// Opción 1: Mantener useSession solo para estos componentes
import { useSession } from 'next-auth/react';
const { data: session, update } = useSession();

// Opción 2: Extender useCentralizedSession para exponer update
// (requiere modificar el hook)
```

## 📊 Impacto esperado

- **ANTES:** ~45 suscripciones a `useSession()` → 45 peticiones potenciales a `/api/auth/session`
- **DESPUÉS (Fase 1):** ~6 suscripciones (componentes críticos migrados) → ~6 peticiones
- **DESPUÉS (Fase 2):** ~1-2 suscripciones (componentes con `update()`) → 1-2 peticiones
- **REDUCCIÓN TOTAL:** ~95% de peticiones eliminadas

## 🚀 Plan de migración sugerido

### Fase 1 - INMEDIATA (ya completada) ✅
- AdminProtection
- Header
- AuthRedirectHandler
- use-auth-sync

### Fase 2 - PRÓXIMA (hacer ahora)
Migrar hooks globales:
1. use-user.ts
2. SeedUserCache.tsx
3. use-pending-invoices.ts
4. use-user-invoices.ts
5. use-email-users.ts

### Fase 3 - GRADUAL (según necesidad)
Migrar módulos específicos uno por uno cuando se trabaje en ellos.

### Fase 4 - FINAL (opcional)
Buscar alternativa para componentes que usan `update()`.

## 🧪 Testing

Después de cada migración:

1. Cargar la aplicación
2. Abrir DevTools → Network
3. Filtrar por `/api/auth/session`
4. Navegar por la aplicación
5. Verificar reducción de peticiones

**Meta:** Reducir de 10-20 peticiones iniciales a 0-2 peticiones.
