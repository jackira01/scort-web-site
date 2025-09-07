# 📋 Ejemplo de Salida de Debug en Consola

## Escenario: Creación de Perfil con Plan de Pago

### Request POST /api/profiles
```json
{
  "user": "64f7b1234567890abcdef123",
  "name": "María García",
  "description": "Escort profesional en Bogotá",
  "planCode": "PREMIUM",
  "planDays": 30,
  "orderId": "ORD-2024-001"
}
```

### Salida de Consola Completa:

```
🔵 [PROFILE CONTROLLER] Datos recibidos para crear perfil: {
  userId: '64f7b1234567890abcdef123',
  planCode: 'PREMIUM',
  planDays: 30,
  orderId: 'ORD-2024-001',
  bodyKeys: [ 'user', 'name', 'description', 'planCode', 'planDays', 'orderId' ]
}

🔵 [PROFILE CONTROLLER] Validando plan de pago: { planCode: 'PREMIUM', planDays: 30 }
✅ [PROFILE CONTROLLER] Validación de plan completada

🔵 [PROFILE CONTROLLER] Iniciando creación de perfil con facturación automática

🟡 [PROFILE SERVICE] Iniciando createProfileWithInvoice: {
  planCode: 'PREMIUM',
  planDays: 30,
  userId: '64f7b1234567890abcdef123',
  profileName: 'María García'
}

🟡 [PROFILE SERVICE] Creando perfil base...
✅ [PROFILE SERVICE] Perfil base creado: {
  profileId: '64f7b9876543210fedcba987',
  name: 'María García'
}

🟡 [PROFILE SERVICE] Procesando plan de pago: { planCode: 'PREMIUM', planDays: 30 }
🟡 [PROFILE SERVICE] Buscando definición del plan: PREMIUM
✅ [PROFILE SERVICE] Plan encontrado: { name: 'Plan Premium', variants: 3 }
✅ [PROFILE SERVICE] Variante encontrada: { days: 30, price: 150000 }

💰 [PROFILE SERVICE] Plan de pago detectado, generando factura...

🟠 [INVOICE SERVICE] Iniciando generación de factura: {
  profileId: '64f7b9876543210fedcba987',
  userId: '64f7b1234567890abcdef123',
  planCode: 'PREMIUM',
  planDays: 30,
  upgradeCodes: [],
  notes: 'Factura generada automáticamente para nuevo perfil María García'
}

✅ [INVOICE SERVICE] IDs validados correctamente

🟠 [INVOICE SERVICE] Procesando plan para factura: { planCode: 'PREMIUM', planDays: 30 }
✅ [INVOICE SERVICE] Plan encontrado: { name: 'Plan Premium', code: 'PREMIUM' }
✅ [INVOICE SERVICE] Variante encontrada: { days: 30, price: 150000 }
✅ [INVOICE SERVICE] Item de plan agregado: {
  type: 'plan',
  code: 'PREMIUM',
  name: 'Plan Premium',
  days: 30,
  price: 150000,
  quantity: 1
}

🟠 [INVOICE SERVICE] Resumen de items procesados: {
  totalItems: 1,
  totalAmount: 150000,
  items: [ { type: 'plan', code: 'PREMIUM', price: 150000 } ]
}

🟠 [INVOICE SERVICE] Fecha de expiración calculada: 2024-01-31T18:30:00.000Z

🟠 [INVOICE SERVICE] Creando factura con datos: {
  profileId: '64f7b9876543210fedcba987',
  userId: '64f7b1234567890abcdef123',
  status: 'pending',
  totalAmount: 150000,
  expiresAt: 2024-01-31T18:30:00.000Z,
  itemsCount: 1
}

✅ [INVOICE SERVICE] Factura creada y guardada exitosamente: {
  invoiceId: '64f7c1111222333444555666',
  totalAmount: 150000,
  status: 'pending',
  expiresAt: 2024-01-31T18:30:00.000Z
}

✅ [PROFILE SERVICE] Factura generada exitosamente: {
  invoiceId: '64f7c1111222333444555666',
  totalAmount: 150000,
  expiresAt: 2024-01-31T18:30:00.000Z,
  profileId: '64f7b9876543210fedcba987'
}

🟡 [PROFILE SERVICE] Actualizando perfil con estado pendiente de pago...
✅ [PROFILE SERVICE] Perfil actualizado con estado pendiente de pago

🏁 [PROFILE SERVICE] Finalizando createProfileWithInvoice: {
  profileId: '64f7b9876543210fedcba987',
  hasInvoice: true,
  invoiceId: '64f7c1111222333444555666'
}

💰 [PROFILE CONTROLLER] Perfil creado con factura pendiente: {
  profileId: '64f7b9876543210fedcba987',
  invoiceId: '64f7c1111222333444555666',
  totalAmount: 150000,
  expiresAt: 2024-01-31T18:30:00.000Z
}
```

### Response 201 Created:
```json
{
  "success": true,
  "message": "Perfil creado exitosamente. Se ha generado una factura pendiente.",
  "profile": {
    "_id": "64f7b9876543210fedcba987",
    "name": "María García",
    "description": "Escort profesional en Bogotá",
    "visible": false,
    "planAssignment": {
      "planCode": "PREMIUM",
      "variantDays": 30,
      "startAt": null,
      "expiresAt": null,
      "pendingPayment": true
    }
  },
  "invoice": {
    "_id": "64f7c1111222333444555666",
    "profileId": "64f7b9876543210fedcba987",
    "userId": "64f7b1234567890abcdef123",
    "status": "pending",
    "totalAmount": 150000,
    "items": [
      {
        "type": "plan",
        "code": "PREMIUM",
        "name": "Plan Premium",
        "days": 30,
        "price": 150000,
        "quantity": 1
      }
    ],
    "expiresAt": "2024-01-31T18:30:00.000Z",
    "createdAt": "2024-01-30T18:30:00.000Z"
  },
  "paymentRequired": true,
  "expiresAt": "2024-01-31T18:30:00.000Z"
}
```

---

## Escenario: Creación de Perfil con Plan Gratuito

### Request POST /api/profiles
```json
{
  "user": "64f7b1234567890abcdef456",
  "name": "Ana López",
  "description": "Nuevo perfil",
  "planCode": "AMATISTA",
  "planDays": 7
}
```

### Salida de Consola:

```
🔵 [PROFILE CONTROLLER] Datos recibidos para crear perfil: {
  userId: '64f7b1234567890abcdef456',
  planCode: 'AMATISTA',
  planDays: 7,
  orderId: undefined,
  bodyKeys: [ 'user', 'name', 'description', 'planCode', 'planDays' ]
}

🔵 [PROFILE CONTROLLER] Iniciando creación de perfil con facturación automática

🟡 [PROFILE SERVICE] Iniciando createProfileWithInvoice: {
  planCode: 'AMATISTA',
  planDays: 7,
  userId: '64f7b1234567890abcdef456',
  profileName: 'Ana López'
}

🟡 [PROFILE SERVICE] Creando perfil base...
✅ [PROFILE SERVICE] Perfil base creado: {
  profileId: '64f7b9876543210fedcba999',
  name: 'Ana López'
}

🟡 [PROFILE SERVICE] Procesando plan de pago: { planCode: 'AMATISTA', planDays: 7 }
🟡 [PROFILE SERVICE] Buscando definición del plan: AMATISTA
✅ [PROFILE SERVICE] Plan encontrado: { name: 'Plan Amatista', variants: 2 }
✅ [PROFILE SERVICE] Variante encontrada: { days: 7, price: 0 }

🆓 [PROFILE SERVICE] Plan gratuito detectado, asignando directamente...
✅ [PROFILE SERVICE] Plan gratuito asignado exitosamente: {
  profileId: '64f7b9876543210fedcba999',
  planCode: 'AMATISTA',
  planDays: 7
}

✅ [PROFILE CONTROLLER] Perfil creado sin factura (plan gratuito): {
  profileId: '64f7b9876543210fedcba999'
}
```

---

## Escenario: Error - Plan No Encontrado

### Request POST /api/profiles
```json
{
  "user": "64f7b1234567890abcdef789",
  "name": "Carlos Ruiz",
  "planCode": "INEXISTENTE",
  "planDays": 30
}
```

### Salida de Consola:

```
🔵 [PROFILE CONTROLLER] Datos recibidos para crear perfil: {
  userId: '64f7b1234567890abcdef789',
  planCode: 'INEXISTENTE',
  planDays: 30,
  orderId: undefined,
  bodyKeys: [ 'user', 'name', 'planCode', 'planDays' ]
}

🔵 [PROFILE CONTROLLER] Validando plan de pago: { planCode: 'INEXISTENTE', planDays: 30 }
✅ [PROFILE CONTROLLER] Validación de plan completada

🔵 [PROFILE CONTROLLER] Iniciando creación de perfil con facturación automática

🟡 [PROFILE SERVICE] Iniciando createProfileWithInvoice: {
  planCode: 'INEXISTENTE',
  planDays: 30,
  userId: '64f7b1234567890abcdef789',
  profileName: 'Carlos Ruiz'
}

🟡 [PROFILE SERVICE] Creando perfil base...
✅ [PROFILE SERVICE] Perfil base creado: {
  profileId: '64f7b9876543210fedcba111',
  name: 'Carlos Ruiz'
}

🟡 [PROFILE SERVICE] Procesando plan de pago: { planCode: 'INEXISTENTE', planDays: 30 }
🟡 [PROFILE SERVICE] Buscando definición del plan: INEXISTENTE
❌ [PROFILE SERVICE] Plan no encontrado: INEXISTENTE

❌ [PROFILE SERVICE] Error al procesar plan para nuevo perfil: {
  error: 'Plan con código INEXISTENTE no encontrado',
  planCode: 'INEXISTENTE',
  planDays: 30,
  profileId: '64f7b9876543210fedcba111'
}

🏁 [PROFILE SERVICE] Finalizando createProfileWithInvoice: {
  profileId: '64f7b9876543210fedcba111',
  hasInvoice: false,
  invoiceId: undefined
}

✅ [PROFILE CONTROLLER] Perfil creado sin factura (plan gratuito): {
  profileId: '64f7b9876543210fedcba111'
}
```

---

## 🔍 Análisis de los Logs

### Información Clave Capturada:

1. **Datos de Entrada**: Todos los parámetros recibidos
2. **Validaciones**: Verificación de planes y variantes
3. **Proceso de Creación**: Cada paso del flujo
4. **Cálculos**: Precios, fechas de expiración
5. **Estados**: Cambios en el perfil y factura
6. **Errores**: Detalles específicos de fallos
7. **Resultados**: IDs generados y datos finales

### Beneficios del Debug:

- **Trazabilidad Completa**: Seguimiento paso a paso
- **Identificación Rápida de Errores**: Logs específicos con contexto
- **Monitoreo de Performance**: Tiempos entre pasos
- **Auditoría**: Registro de todas las operaciones
- **Debugging Eficiente**: Información precisa para resolver problemas