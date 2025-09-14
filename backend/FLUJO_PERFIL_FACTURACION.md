# Flujo Completo: Creación de Perfil, Facturación y Confirmación de Pago

## Resumen General

Este documento describe el flujo completo desde la creación de un perfil hasta la confirmación del pago, incluyendo la generación de facturas, asignación de planes y actualización del historial de pagos.

## 1. Creación de Perfil

### 1.1 Endpoint Principal
- **Endpoint**: `POST /api/profiles`
- **Función**: `createProfile()` en `profile.service.ts`

### 1.2 Proceso de Creación

#### Paso 1: Validaciones Iniciales
```typescript
// Validar que el nombre del perfil no exista
await checkProfileNameExists(name);

// Validar límites de perfiles por usuario
await validateUserProfileLimits(userId, planCode);
```

#### Paso 2: Creación del Perfil Base
```typescript
// Excluir planAssignment de los datos del perfil
const { planAssignment, ...profileData } = data;

// Crear perfil con datos básicos
const profile = new ProfileModel({
  ...profileData,
  user: new Types.ObjectId(userId),
  isActive: false,  // Inicialmente inactivo
  visible: false    // Inicialmente no visible
});

await profile.save();
```

#### Paso 3: Asignación de Plan por Defecto
```typescript
// Obtener configuración del plan por defecto
const defaultPlanConfig = await getDefaultPlanConfig();

if (defaultPlanConfig.enabled && defaultPlanConfig.planId) {
  // Asignar plan por defecto (generalmente "AMATISTA")
  const subscriptionResult = await subscribeProfile(
    profile._id.toString(),
    defaultPlan.code,  // Usar defaultPlan.code, no defaultPlanConfig.planCode
    30,  // Días por defecto
    false // No generar factura para plan gratuito
  );
}
```

## 2. Determinación del Flujo de Facturación

### 2.1 Evaluación del Plan Solicitado

Si el usuario especifica un `planCode` en la creación:

```typescript
if (planCode && planCode !== 'AMATISTA') {
  // Plan de pago detectado
  const planDefinition = await PlanDefinitionModel.findOne({ code: planCode });
  const variant = planDefinition.variants.find(v => v.days === planDays);
  
  if (variant && variant.price > 0) {
    // Generar factura para plan de pago
    invoice = await invoiceService.generateInvoice({
      profileId: profile._id.toString(),
      userId: profile.user.toString(),
      planCode: planCode,
      planDays: planDays,
      notes: `Factura generada automáticamente para nuevo perfil ${profile.name || profile._id}`
    });
  }
}
```

### 2.2 Actualización del Historial de Pagos

**NUEVO**: Cuando se genera una factura, se actualiza automáticamente el historial:

```typescript
// Actualizar el historial de pagos del perfil con la nueva factura
await ProfileModel.findByIdAndUpdate(
  profile._id,
  {
    $push: { paymentHistory: new Types.ObjectId(invoice._id as string) },
    isActive: true,        // Mantener activo con plan por defecto
    visible: shouldBeVisible  // Visible solo si no superó límites gratuitos
  }
);
```

## 3. Estados del Perfil Según el Tipo de Plan

### 3.1 Plan Gratuito (AMATISTA)
```typescript
// Plan gratuito - Perfil completamente funcional
profile.isActive = true;
profile.visible = true;
profile.planAssignment = {
  planId: defaultPlan._id,
  planCode: 'AMATISTA',
  variantDays: 30,
  startAt: new Date(),
  expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
};
```

### 3.2 Plan de Pago (Pendiente)
```typescript
// Plan de pago - Perfil activo con plan por defecto hasta confirmación
profile.isActive = true;           // Activo con AMATISTA
profile.visible = shouldBeVisible; // Visible según límites de usuario
profile.planAssignment = {         // Plan AMATISTA temporal
  planId: amatistaId,
  planCode: 'AMATISTA',
  // ... resto de campos
};
// Factura generada y agregada a paymentHistory
```

## 4. Generación de Factura

### 4.1 Servicio de Facturación
- **Función**: `generateInvoice()` en `invoice.service.ts`
- **Modelo**: `InvoiceModel`

### 4.2 Estructura de la Factura
```typescript
interface IInvoice {
  profileId: ObjectId;           // ID del perfil
  userId: ObjectId;              // ID del usuario
  status: 'pending' | 'paid' | 'cancelled' | 'expired';
  items: InvoiceItem[];          // Items de la factura
  totalAmount: number;           // Monto total
  createdAt: Date;              // Fecha de creación
  expiresAt: Date;              // Fecha de expiración
  paidAt?: Date;                // Fecha de pago
  paymentMethod?: string;        // Método de pago
  paymentData?: any;            // Datos adicionales del pago
  notes?: string;               // Notas adicionales
}
```

### 4.3 Items de Factura
```typescript
interface InvoiceItem {
  type: 'plan' | 'upgrade';     // Tipo de item
  code: string;                 // Código del plan/upgrade
  name: string;                 // Nombre descriptivo
  days?: number;                // Duración en días
  price: number;                // Precio unitario
  quantity: number;             // Cantidad (generalmente 1)
}
```

## 5. Confirmación de Pago

### 5.1 Endpoint de Confirmación
- **Endpoint**: `POST /api/invoices/webhook/payment-confirmed`
- **Controlador**: `PaymentWebhookController.confirmPayment()`

### 5.2 Estructura de la Solicitud
```typescript
{
  "invoiceId": "64f1a2b3c4d5e6f7g8h9i0j1",
  "paymentData": {  // OPCIONAL
    "paymentMethod": "Transferencia Bancaria",
    "paymentReference": "TXN123456789",
    "transactionId": "BANK_TXN_987654321",
    "amount": 50000,
    "currency": "COP",
    "bankName": "Banco Ejemplo",
    "accountNumber": "****1234",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

### 5.3 Proceso de Confirmación

#### Paso 1: Validaciones
```typescript
// Verificar que la factura existe
const invoice = await InvoiceModel.findById(invoiceId);
if (!invoice) {
  throw new Error('Factura no encontrada');
}

// Verificar que esté pendiente
if (invoice.status !== 'pending') {
  throw new Error(`La factura ya está en estado: ${invoice.status}`);
}
```

#### Paso 2: Actualizar Factura
```typescript
// Marcar como pagada
invoice.status = 'paid';
invoice.paidAt = new Date();

// Agregar datos de pago si se proporcionan
if (paymentData) {
  invoice.paymentData = paymentData;
}

await invoice.save();
```

#### Paso 3: Procesar Pago
```typescript
// Procesar el pago y actualizar el perfil
const result = await PaymentProcessorService.processInvoicePayment(invoiceId);
```

## 6. Procesamiento del Pago

### 6.1 Servicio de Procesamiento
- **Función**: `PaymentProcessorService.processInvoicePayment()`

### 6.2 Proceso de Activación

#### Paso 1: Obtener Datos
```typescript
// Obtener factura e información del perfil
const invoice = await InvoiceModel.findById(invoiceId);
const profile = await ProfileModel.findById(invoice.profileId);
```

#### Paso 2: Procesar Items de la Factura
```typescript
// Procesar cada item de la factura
for (const item of invoice.items) {
  if (item.type === 'plan') {
    await this.processPlanPayment(profile, item);
  } else if (item.type === 'upgrade') {
    await this.processUpgradePayment(profile, item);
  }
}
```

#### Paso 3: Asignación del Plan Pagado
```typescript
// Encontrar el plan y variante
const plan = await PlanDefinitionModel.findOne({ code: item.code });
const variant = plan.variants.find(v => v.days === item.days);

// Calcular fechas
const startAt = new Date();
const expiresAt = new Date(startAt.getTime() + (item.days * 24 * 60 * 60 * 1000));

// Asignar nuevo plan al perfil
profile.planAssignment = {
  planId: plan._id,
  planCode: plan.code,
  variantDays: item.days,
  startAt: startAt,
  expiresAt: expiresAt
};
```

#### Paso 4: Activación Final
```typescript
// Activar y hacer visible el perfil
profile.isActive = true;
profile.visible = true;  // Hacer visible al confirmar pago
await profile.save();
```

## 7. Estados Finales del Perfil

### 7.1 Después del Pago Confirmado
```typescript
{
  _id: "...",
  name: "Nombre del Perfil",
  isActive: true,           // Perfil activo
  visible: true,            // Visible en búsquedas
  planAssignment: {
    planId: "64f...",       // ID del plan pagado
    planCode: "PREMIUM",    // Código del plan pagado
    variantDays: 30,        // Duración del plan
    startAt: "2024-01-15T10:30:00Z",
    expiresAt: "2024-02-14T10:30:00Z"
  },
  paymentHistory: [         // Historial actualizado
    "64f1a2b3c4d5e6f7g8h9i0j1"  // ID de la factura pagada
  ]
}
```

### 7.2 Factura Pagada
```typescript
{
  _id: "64f1a2b3c4d5e6f7g8h9i0j1",
  profileId: "...",
  userId: "...",
  status: "paid",           // Estado actualizado
  paidAt: "2024-01-15T10:30:00Z",
  paymentData: {            // Datos del pago
    paymentMethod: "Transferencia Bancaria",
    transactionId: "BANK_TXN_987654321"
  },
  items: [
    {
      type: "plan",
      code: "PREMIUM",
      name: "Plan Premium",
      days: 30,
      price: 50000,
      quantity: 1
    }
  ],
  totalAmount: 50000
}
```

## 8. Flujos Alternativos

### 8.1 Cancelación de Pago
- **Endpoint**: `POST /api/invoices/webhook/payment-cancelled`
- **Resultado**: Perfil mantiene plan AMATISTA, factura marcada como 'cancelled'

### 8.2 Expiración de Factura
- **Proceso**: Job automático marca facturas vencidas como 'expired'
- **Resultado**: Perfil mantiene plan AMATISTA

### 8.3 Plan Gratuito Directo
- **Flujo**: Sin generación de factura
- **Resultado**: Perfil activo inmediatamente con plan AMATISTA

## 9. Consideraciones Importantes

### 9.1 Idempotencia
- Las confirmaciones de pago son idempotentes
- Múltiples llamadas al mismo `invoiceId` no causan efectos secundarios

### 9.2 Transaccionalidad
- Los cambios en perfil y factura se realizan de forma coordinada
- En caso de error, se mantiene consistencia de datos

### 9.3 Auditoría
- Todos los cambios quedan registrados en `paymentHistory`
- Los datos de pago se almacenan en `paymentData` para trazabilidad

### 9.4 Flexibilidad del paymentData
- Campo completamente opcional y flexible
- Permite adaptarse a diferentes proveedores de pago
- Estructura JSON libre para metadatos específicos

## 10. Endpoints de Consulta

### 10.1 Estado de Factura
- **Endpoint**: `GET /api/invoices/:id/status`
- **Uso**: Verificar estado actual de una factura

### 10.2 Datos de WhatsApp
- **Endpoint**: `GET /api/invoices/:id/whatsapp-data`
- **Uso**: Obtener mensaje formateado para envío por WhatsApp

### 10.3 Facturas Pendientes
- **Endpoint**: `GET /api/invoices/user/:userId/pending`
- **Uso**: Listar facturas pendientes de un usuario

Este flujo garantiza una experiencia consistente desde la creación del perfil hasta la confirmación del pago, manteniendo la integridad de los datos y proporcionando flexibilidad para diferentes métodos de pago.