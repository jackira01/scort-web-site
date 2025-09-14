# 🔍 Debug del Flujo de Creación de Perfil y Facturación

## Descripción del Flujo

Este documento describe el flujo completo desde que se recibe una solicitud para crear un perfil hasta la generación de la factura y notificación por WhatsApp, incluyendo todos los logs de debug implementados.

## 📋 Flujo Completo

### 1. **Controlador de Perfiles** (`profile.controller.ts`)
**Punto de entrada:** `POST /api/profiles`

```
🔵 [PROFILE CONTROLLER] Datos recibidos para crear perfil
🔵 [PROFILE CONTROLLER] Validando plan de pago (si aplica)
✅ [PROFILE CONTROLLER] Validación de plan completada
🔵 [PROFILE CONTROLLER] Iniciando creación de perfil con facturación automática
```

### 2. **Servicio de Perfiles** (`profile.service.ts`)
**Función:** `createProfileWithInvoice()`

```
🟡 [PROFILE SERVICE] Iniciando createProfileWithInvoice
🟡 [PROFILE SERVICE] Creando perfil base...
✅ [PROFILE SERVICE] Perfil base creado
🟡 [PROFILE SERVICE] Procesando plan de pago (si aplica)
🟡 [PROFILE SERVICE] Buscando definición del plan
✅ [PROFILE SERVICE] Plan encontrado
✅ [PROFILE SERVICE] Variante encontrada
```

#### Para Planes de Pago:
```
💰 [PROFILE SERVICE] Plan de pago detectado, generando factura...
✅ [PROFILE SERVICE] Factura generada exitosamente
🟡 [PROFILE SERVICE] Actualizando perfil con estado pendiente de pago...
✅ [PROFILE SERVICE] Perfil actualizado con estado pendiente de pago
```

#### Para Planes Gratuitos:
```
🆓 [PROFILE SERVICE] Plan gratuito detectado, asignando directamente...
✅ [PROFILE SERVICE] Plan gratuito asignado exitosamente
```

### 3. **Servicio de Facturas** (`invoice.service.ts`)
**Función:** `generateInvoice()`

```
🟠 [INVOICE SERVICE] Iniciando generación de factura
✅ [INVOICE SERVICE] IDs validados correctamente
🟠 [INVOICE SERVICE] Procesando plan para factura
✅ [INVOICE SERVICE] Plan encontrado
✅ [INVOICE SERVICE] Variante encontrada
✅ [INVOICE SERVICE] Item de plan agregado
🟠 [INVOICE SERVICE] Resumen de items procesados
🟠 [INVOICE SERVICE] Fecha de expiración calculada
🟠 [INVOICE SERVICE] Creando factura con datos
✅ [INVOICE SERVICE] Factura creada y guardada exitosamente
```

### 4. **Servicio de WhatsApp** (`whatsapp.service.ts`)
**Función:** `generateWhatsAppMessageData()`

```
📱 [WHATSAPP SERVICE] Generando mensaje completo de WhatsApp
📱 [WHATSAPP SERVICE] Generando datos para WhatsApp
✅ [WHATSAPP SERVICE] Datos de WhatsApp generados
📱 [WHATSAPP SERVICE] Generando mensaje de compra...
📱 [WHATSAPP SERVICE] Generando URL de WhatsApp...
✅ [WHATSAPP SERVICE] Mensaje de WhatsApp completo generado
```

### 5. **Respuesta Final** (`profile.controller.ts`)

#### Con Factura Generada:
```
💰 [PROFILE CONTROLLER] Perfil creado con factura pendiente
🏁 [PROFILE SERVICE] Finalizando createProfileWithInvoice
```

#### Sin Factura (Plan Gratuito):
```
✅ [PROFILE CONTROLLER] Perfil creado sin factura (plan gratuito)
🏁 [PROFILE SERVICE] Finalizando createProfileWithInvoice
```

## 🎯 Información de Debug Capturada

### Datos de Entrada
- **userId**: ID del usuario que crea el perfil
- **planCode**: Código del plan seleccionado
- **planDays**: Días de duración del plan
- **orderId**: ID de orden (si aplica)
- **Datos del perfil**: Nombre, descripción, etc.

### Validaciones
- **IDs válidos**: Verificación de formato ObjectId
- **Plan existente**: Búsqueda en PlanDefinitionModel
- **Variante válida**: Verificación de días disponibles
- **Precio del plan**: Validación de costo

### Proceso de Facturación
- **Items procesados**: Detalles de cada item agregado
- **Cálculo total**: Suma de precios
- **Fecha de expiración**: 24 horas desde creación
- **Estado de factura**: Siempre 'pending' al crear

### Notificación WhatsApp
- **Datos extraídos**: Información del perfil, usuario y factura
- **Mensaje generado**: Texto completo del mensaje
- **URL de WhatsApp**: Link directo para envío

## 🚨 Manejo de Errores

Todos los errores se registran con el prefijo `❌` seguido del contexto:

```
❌ [PROFILE SERVICE] Plan no encontrado
❌ [PROFILE SERVICE] Variante no encontrada
❌ [INVOICE SERVICE] ID de perfil inválido
❌ [INVOICE SERVICE] Plan no encontrado
❌ [INVOICE SERVICE] No se pueden crear facturas sin items
```

## 📊 Cómo Usar los Logs

### Para Debugging:
1. **Buscar por prefijo**: Filtra por `[PROFILE CONTROLLER]`, `[PROFILE SERVICE]`, etc.
2. **Seguir el flujo**: Los emojis indican el estado (🔵 inicio, 🟡 proceso, ✅ éxito, ❌ error)
3. **Verificar datos**: Cada log incluye los datos relevantes del contexto

### Ejemplo de Búsqueda en Logs:
```bash
# Ver todo el flujo de un perfil específico
grep "profileId: 64f7b1234567890abcdef123" logs/app.log

# Ver solo errores
grep "❌" logs/app.log

# Ver proceso de facturación
grep "INVOICE SERVICE" logs/app.log
```

## 🔄 Estados del Flujo

1. **Recepción**: Datos llegan al controlador
2. **Validación**: Se verifican planes y límites
3. **Creación Base**: Se crea el perfil sin plan
4. **Procesamiento Plan**: Se evalúa si requiere factura
5. **Facturación**: Se genera factura si es plan de pago
6. **Asignación**: Se asigna plan o se marca como pendiente
7. **Notificación**: Se preparan datos para WhatsApp
8. **Respuesta**: Se envía resultado al cliente

## 📝 Notas Importantes

- Los logs están diseñados para **no afectar el rendimiento**
- Incluyen **solo información necesaria** para debugging
- **No exponen datos sensibles** como tokens o passwords
- Usan **emojis** para facilitar la identificación visual
- Mantienen **consistencia** en el formato de mensajes