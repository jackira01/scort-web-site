# Componentes de Pagos y Facturas

Este módulo contiene todos los componentes necesarios para gestionar pagos y facturas en la aplicación.

## Componentes Disponibles

### 1. PaymentAlert
Componente de alerta que muestra información sobre facturas pendientes.

```tsx
import { PaymentAlert } from '@/components/payments';

<PaymentAlert
  invoiceCount={3}
  totalAmount={150000}
  onPayClick={() => console.log('Abrir modal de pagos')}
  className="mb-4"
/>
```

### 2. InvoiceListModal
Modal que muestra la lista detallada de facturas con opciones de pago.

```tsx
import { InvoiceListModal } from '@/components/payments';

<InvoiceListModal
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  invoices={invoices}
  onPayInvoice={(id) => handlePayInvoice(id)}
  onPayAll={() => handlePayAll()}
  isLoading={isLoading}
/>
```

### 3. PaymentManager
Componente principal que integra tanto la alerta como el modal de pagos.

```tsx
import { PaymentManager } from '@/components/payments';

// Uso completo (alerta + modal)
<PaymentManager className="mb-6" />

// Solo alerta (sin modal)
<PaymentManager showAlertOnly={true} className="mb-6" />
```

### 4. useInvoices Hook
Hook personalizado para manejar la lógica de facturas y pagos.

```tsx
import { useInvoices } from '@/components/payments';

const {
  invoices,
  pendingInvoices,
  isLoading,
  totalPendingAmount,
  payInvoice,
  payAllInvoices,
  refreshInvoices
} = useInvoices(userId);
```

## Ejemplos de Integración

### En el Dashboard del Usuario
```tsx
// app/cuenta/dashboard/page.tsx
import { PaymentManager } from '@/components/payments';

export default function Dashboard() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Mi Dashboard</h1>
      
      {/* Alerta de pagos pendientes */}
      <PaymentManager className="mb-6" />
      
      {/* Resto del contenido del dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Otros componentes */}
      </div>
    </div>
  );
}
```

### En el Header de la Aplicación
```tsx
// components/header/Header.tsx
import { PaymentManager } from '@/components/payments';

export function Header() {
  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4">
        {/* Navegación */}
        <nav className="flex items-center justify-between py-4">
          {/* Logo y menú */}
        </nav>
        
        {/* Alerta de pagos (solo alerta, sin modal) */}
        <PaymentManager showAlertOnly={true} className="pb-4" />
      </div>
    </header>
  );
}
```

### Uso Personalizado con el Hook
```tsx
// components/custom/CustomPaymentComponent.tsx
import { useInvoices } from '@/components/payments';
import { useSession } from 'next-auth/react';

export function CustomPaymentComponent() {
  const { data: session } = useSession();
  const {
    pendingInvoices,
    totalPendingAmount,
    payInvoice,
    isLoading
  } = useInvoices(session?.user?.id);

  if (pendingInvoices.length === 0) {
    return <div>No hay facturas pendientes</div>;
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <h3 className="font-semibold text-yellow-800">
        Tienes {pendingInvoices.length} facturas pendientes
      </h3>
      <p className="text-yellow-700">
        Total: ${totalPendingAmount.toLocaleString()}
      </p>
      
      <div className="mt-3 space-y-2">
        {pendingInvoices.map((invoice) => (
          <div key={invoice._id} className="flex justify-between items-center">
            <span>Factura #{invoice.invoiceNumber}</span>
            <button
              onClick={() => payInvoice(invoice._id)}
              disabled={isLoading}
              className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              Pagar ${invoice.totalAmount.toLocaleString()}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Características

- ✅ **Responsive**: Todos los componentes se adaptan a diferentes tamaños de pantalla
- ✅ **Accesible**: Implementa las mejores prácticas de accesibilidad
- ✅ **TypeScript**: Completamente tipado para mejor experiencia de desarrollo
- ✅ **Integración con NextAuth**: Maneja automáticamente la sesión del usuario
- ✅ **Notificaciones**: Usa Sonner para mostrar notificaciones de éxito/error
- ✅ **Estados de carga**: Maneja estados de carga durante las operaciones
- ✅ **Actualización automática**: Refresca los datos después de operaciones exitosas
- ✅ **Alertas de vencimiento**: Muestra alertas especiales para facturas que vencen pronto

## Dependencias

- `next-auth`: Para manejo de sesiones
- `sonner`: Para notificaciones toast
- `luxon`: Para formateo de fechas
- `lucide-react`: Para iconos
- Componentes UI de shadcn/ui

## API Endpoints Requeridos

Los componentes esperan que existan los siguientes endpoints en el backend:

- `GET /api/invoices?userId={userId}` - Obtener facturas del usuario
- `POST /api/invoices/{invoiceId}/pay` - Pagar una factura específica
- `POST /api/invoices/pay-multiple` - Pagar múltiples facturas

Estos endpoints ya están implementados en el backend del proyecto.