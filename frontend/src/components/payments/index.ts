// Componentes de pagos y facturas
export { PaymentAlert } from './PaymentAlert';
export { InvoiceListModal } from './InvoiceListModal';
export { PaymentManager } from './PaymentManager';

// Re-exportar el hook para facilitar el acceso
export { useInvoices } from '../../hooks/useInvoices';

// Tipos para uso externo
export interface InvoiceItem {
  description: string;
  quantity: number;
  price: number;
}

export interface Invoice {
  _id: string;
  invoiceNumber: string;
  status: 'pending' | 'paid' | 'expired';
  items: InvoiceItem[];
  totalAmount: number;
  createdAt: string;
  expiresAt: string;
  profileId: string;
  userId: string;
}

export interface PaymentAlertProps {
  invoiceCount: number;
  totalAmount: number;
  onPayClick: () => void;
  className?: string;
}

export interface InvoiceListModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoices: Invoice[];
  onPayInvoice: (invoiceId: string) => void;
  onPayAll: () => void;
  isLoading?: boolean;
}

export interface PaymentManagerProps {
  className?: string;
  showAlertOnly?: boolean;
}