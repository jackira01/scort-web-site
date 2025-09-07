import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { invoiceService, type Invoice } from '@/services/invoice.service';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();
  const [pendingInvoices, setPendingInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPendingInvoices = async () => {
    if (!session?.user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const invoices = await invoiceService.getPendingInvoicesByUser(session.user.id);
      setPendingInvoices(invoices);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar facturas pendientes';
      setError(errorMessage);
      console.error('Error fetching pending invoices:', err);
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
      toast({
        title: 'Pago registrado',
        description: 'La factura ha sido marcada como pagada exitosamente.',
      });
      await fetchPendingInvoices(); // Refrescar la lista
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al marcar como pagada';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      throw err;
    }
  };

  const cancelInvoice = async (invoiceId: string) => {
    try {
      await invoiceService.cancelInvoice(invoiceId);
      toast({
        title: 'Factura cancelada',
        description: 'La factura ha sido cancelada exitosamente.',
      });
      await fetchPendingInvoices(); // Refrescar la lista
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cancelar factura';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      throw err;
    }
  };

  const getWhatsAppData = async (invoiceId: string, phoneNumber?: string) => {
    try {
      const data = await invoiceService.getWhatsAppData(invoiceId, phoneNumber);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al generar datos de WhatsApp';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      throw err;
    }
  };

  useEffect(() => {
    fetchPendingInvoices();
  }, [session?.user?.id]);

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