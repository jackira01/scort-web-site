# Sistema de Sincronización de Autenticación Entre Pestañas

## Descripción General

Este sistema garantiza que cuando un usuario cierra sesión (logout) en una pestaña de la aplicación, **todas las demás pestañas abiertas** con la misma sesión también se deslogueen automáticamente **sin necesidad de recargar la página**.

## Arquitectura

### Tecnologías Utilizadas

1. **BroadcastChannel API** (Método Principal)
   - API nativa del navegador para comunicación entre pestañas
   - Más eficiente que `localStorage` events
   - No contamina el storage
   - Mejor rendimiento

2. **localStorage events** (Fallback/Legacy)
   - Sistema antiguo mantenido para compatibilidad
   - Se activa en navegadores que no soportan BroadcastChannel

### Componentes del Sistema

```
frontend/
├── src/
│   ├── hooks/
│   │   └── use-auth-sync.ts              # Hook principal con BroadcastChannel
│   └── components/
│       └── authentication/
│           ├── AuthSyncHandler.tsx       # Componente wrapper del hook
│           └── SessionSyncHandler.tsx    # Sistema legacy (fallback)
```

## Implementación Técnica

### 1. Hook: `use-auth-sync.ts`

**Responsabilidades:**
- Crear y gestionar el canal `BroadcastChannel` con nombre "auth"
- Escuchar mensajes de otras pestañas
- Detectar cambios en el estado de autenticación (`useSession`)
- Emitir mensajes cuando cambia el estado (login/logout)
- Ejecutar `signOut({ redirect: false })` al recibir mensaje de logout

**Flujo de Logout:**
```
Pestaña A                    Canal "auth"                    Pestaña B
    |                             |                              |
    | 1. Usuario hace logout      |                              |
    | 2. status: authenticated    |                              |
    |    → unauthenticated        |                              |
    |                             |                              |
    | 3. Emitir { type: 'logout' }|                              |
    |------------------------->   |                              |
    |                             |----------------------------->|
    |                             |   4. Recibir mensaje         |
    |                             |   5. signOut({ redirect: false })
    |                             |   6. Redirigir a '/'         |
```

**Código clave:**
```typescript
// Detectar cambio de estado
if (previousStatus === 'authenticated' && status === 'unauthenticated') {
  channelRef.current.postMessage({ type: 'logout', timestamp: Date.now() });
}

// Recibir mensaje
const handleMessage = async (event: MessageEvent) => {
  if (event.data.type === 'logout') {
    await signOut({ redirect: false });
    window.location.href = '/';
  }
};
```

### 2. Función Helper: `broadcastLogout()`

**Uso recomendado:** Llamar esta función en lugar de `signOut()` directamente.

```typescript
import { broadcastLogout } from '@/hooks/use-auth-sync';

// En tu botón de logout
<button onClick={() => broadcastLogout('/')}>
  Cerrar sesión
</button>
```

**Ventajas:**
- Notifica a otras pestañas ANTES de cerrar sesión
- Garantiza que el mensaje se envíe correctamente
- Fallback automático si falla el broadcast

### 3. Componente: `AuthSyncHandler.tsx`

**Ubicación:** Montado en `Providers` (global)

```typescript
// src/config/providers.tsx
<SessionProvider>
  <AuthSyncHandler />    {/* Sistema moderno */}
  <SessionSyncHandler /> {/* Fallback legacy */}
  {children}
</SessionProvider>
```

**Responsabilidad:** Wrapper simple que ejecuta el hook `useAuthSync()`

## Integración en la Aplicación

### Actualizado en:

1. **`src/components/authentication/sign-in.tsx`**
   - `SignOut` component
   - `handleSignOut` function exportada
   - Ahora usan `broadcastLogout()` en lugar de `signOut()`

2. **`src/config/providers.tsx`**
   - Agregado `<AuthSyncHandler />` junto a `<SessionSyncHandler />`
   - Sistema dual (moderno + legacy) para máxima compatibilidad

3. **`src/components/header/Header.tsx`**
   - Ya usa `handleSignOut` importado de `sign-in.tsx`
   - No requiere cambios adicionales

## Casos de Uso

### Escenario 1: Logout Manual
```
1. Usuario hace clic en "Cerrar sesión" en Pestaña A
2. Se ejecuta broadcastLogout('/')
3. BroadcastChannel emite mensaje { type: 'logout' }
4. Pestañas B, C, D reciben el mensaje
5. Todas ejecutan signOut({ redirect: false })
6. Todas redirigen a '/'
```

### Escenario 2: Token Expirado
```
1. API responde 401 en Pestaña A
2. apiClient interceptor ejecuta signOut()
3. useAuthSync detecta status: unauthenticated
4. Emite { type: 'logout' } por BroadcastChannel
5. Otras pestañas se desloguean automáticamente
```

### Escenario 3: Login en Pestaña Nueva
```
1. Usuario hace login en Pestaña B
2. useAuthSync detecta status: authenticated
3. Emite { type: 'login' } por BroadcastChannel
4. Pestaña A recibe mensaje
5. Pestaña A ejecuta window.location.reload() para obtener nueva sesión
```

## Compatibilidad

### Navegadores con BroadcastChannel
- ✅ Chrome 54+
- ✅ Firefox 38+
- ✅ Safari 15.4+
- ✅ Edge 79+

### Navegadores sin BroadcastChannel
- ⚠️ Se activa automáticamente `SessionSyncHandler` (localStorage)
- Console mostrará: `⚠️ [AuthSync] BroadcastChannel no está disponible en este navegador`

## Debugging

### Logs de Consola

El sistema emite logs detallados:

```
✅ [AuthSync] Canal de autenticación inicializado
📤 [AuthSync] Emitiendo logout a otras pestañas: { type: 'logout', timestamp: 1234567890 }
📨 [AuthSync] Mensaje recibido: { type: 'logout', timestamp: 1234567890 }
🚪 [AuthSync] Cerrando sesión en esta pestaña...
✅ [AuthSync] Sesión cerrada exitosamente
🧹 [AuthSync] Cerrando canal de autenticación
```

### Verificar que Funciona

1. Abrir 2 pestañas con la aplicación
2. Iniciar sesión en ambas
3. Hacer logout en Pestaña 1
4. Verificar que Pestaña 2 se desloguea automáticamente
5. Revisar consola de Pestaña 2 para ver logs

### Troubleshooting

**Problema:** Otras pestañas no se desloguean
- Verificar que BroadcastChannel esté disponible en el navegador
- Revisar consola para errores
- Verificar que `AuthSyncHandler` esté montado en `Providers`

**Problema:** Redirección múltiple
- Asegurarse de usar `signOut({ redirect: false })` en listeners
- Solo la pestaña que inicia el logout debería redirigir con `redirect: true`

**Problema:** Canal no se cierra
- Verificar que el `useEffect` cleanup se ejecute correctamente
- `channel.close()` debe llamarse al desmontar

## Mejoras Futuras

1. **Sincronizar datos de sesión actualizados**
   - Cuando un usuario actualiza su perfil en una pestaña
   - Propagar cambios a otras pestañas sin recargar

2. **Mensajes personalizados**
   - Toast notifications al recibir logout forzado
   - "Tu sesión ha sido cerrada en otra pestaña"

3. **Heartbeat system**
   - Detectar pestañas "zombies" que no responden
   - Cerrar canales inactivos

4. **Métricas**
   - Trackear cuántas pestañas están abiertas
   - Analizar patrones de uso multi-pestaña

## Referencias

- [BroadcastChannel API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/BroadcastChannel)
- [NextAuth.js Session Handling](https://next-auth.js.org/getting-started/client#signout)
- [Can I Use - BroadcastChannel](https://caniuse.com/broadcastchannel)

## Autores

- Implementación inicial: Sistema legacy con localStorage
- Mejora con BroadcastChannel: [Tu nombre/fecha]

---

**Última actualización:** 2 de noviembre de 2025
