import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { invoiceService, type Invoice } from '@/services/invoice.service';
import toast from 'react-hot-toast';

export interface UsePendingInvoicesReturn {
  pendingInvoices: Invoice[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  markAsPaid: (invoiceId: string, paymentData: { paymentMethod: string; paymentReference?: string }) => Promise<void>;
  cancelInvoice: (invoiceId: string) => Promise<void>;
  getWhatsAppData: (invoiceId: string, phoneNumber?: string) => Promise<any>;
}

export function usePendingInvoices(): UsePendingInvoicesReturn {
  const { data: session } = useSession();
  const [pendingInvoices, setPendingInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPendingInvoices = async () => {
    if (!session?.user?._id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const invoices = await invoiceService.getPendingInvoicesByUser(session.user._id);
      setPendingInvoices(invoices);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar facturas pendientes';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const markAsPaid = async (
    invoiceId: string,
    paymentData: { paymentMethod: string; paymentReference?: string }
  ) => {
    try {
      await invoiceService.markAsPaid(invoiceId, paymentData);
      toast.success('Pago registrado');
      await fetchPendingInvoices(); // Refrescar la lista
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al marcar como pagada';
      toast.error('Error');
      throw err;
    }
  };

  const cancelInvoice = async (invoiceId: string) => {
    try {
      await invoiceService.cancelInvoice(invoiceId);
      toast.success('Factura cancelada');
      await fetchPendingInvoices(); // Refrescar la lista
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cancelar factura';
      toast.error('Error');
      throw err;
    }
  };

  const getWhatsAppData = async (invoiceId: string, phoneNumber?: string) => {
    try {
      const data = await invoiceService.getWhatsAppData(invoiceId, phoneNumber);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al generar datos de WhatsApp';
      toast.error('Error');
      throw err;
    }
  };

  useEffect(() => {
    fetchPendingInvoices();
  }, [session?.user?._id]);

  return {
    pendingInvoices,
    loading,
    error,
    refetch: fetchPendingInvoices,
    markAsPaid,
    cancelInvoice,
    getWhatsAppData,
  };
}