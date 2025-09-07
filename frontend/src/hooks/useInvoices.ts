'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

interface InvoiceItem {
  description: string;
  quantity: number;
  price: number;
}

interface Invoice {
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

interface UseInvoicesReturn {
  invoices: Invoice[];
  pendingInvoices: Invoice[];
  isLoading: boolean;
  error: string | null;
  totalPendingAmount: number;
  fetchInvoices: () => Promise<void>;
  payInvoice: (invoiceId: string) => Promise<boolean>;
  payAllInvoices: () => Promise<boolean>;
  refreshInvoices: () => void;
}

export const useInvoices = (userId?: string): UseInvoicesReturn => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInvoices = useCallback(async () => {
    if (!userId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/invoices?userId=${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Error al cargar las facturas');
      }
      
      const data = await response.json();
      setInvoices(data.invoices || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      toast.error('Error al cargar facturas', {
        description: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const payInvoice = useCallback(async (invoiceId: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Error al procesar el pago');
      }
      
      const data = await response.json();
      
      // Actualizar el estado local
      setInvoices(prev => 
        prev.map(invoice => 
          invoice._id === invoiceId 
            ? { ...invoice, status: 'paid' as const }
            : invoice
        )
      );
      
      toast.success('Pago procesado exitosamente', {
        description: `Factura #${data.invoice?.invoiceNumber || invoiceId} pagada`
      });
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      toast.error('Error al procesar el pago', {
        description: errorMessage
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const payAllInvoices = useCallback(async (): Promise<boolean> => {
    const pendingInvoiceIds = invoices
      .filter(invoice => invoice.status === 'pending')
      .map(invoice => invoice._id);
    
    if (pendingInvoiceIds.length === 0) {
      toast.info('No hay facturas pendientes para pagar');
      return true;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/invoices/pay-multiple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ invoiceIds: pendingInvoiceIds }),
      });
      
      if (!response.ok) {
        throw new Error('Error al procesar los pagos');
      }
      
      const data = await response.json();
      
      // Actualizar el estado local
      setInvoices(prev => 
        prev.map(invoice => 
          pendingInvoiceIds.includes(invoice._id)
            ? { ...invoice, status: 'paid' as const }
            : invoice
        )
      );
      
      toast.success('Pagos procesados exitosamente', {
        description: `${pendingInvoiceIds.length} facturas pagadas`
      });
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      toast.error('Error al procesar los pagos', {
        description: errorMessage
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [invoices]);

  const refreshInvoices = useCallback(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  // Cargar facturas al montar el componente
  useEffect(() => {
    if (userId) {
      fetchInvoices();
    }
  }, [fetchInvoices, userId]);

  // Calcular valores derivados
  const pendingInvoices = invoices.filter(invoice => invoice.status === 'pending');
  const totalPendingAmount = pendingInvoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0);

  return {
    invoices,
    pendingInvoices,
    isLoading,
    error,
    totalPendingAmount,
    fetchInvoices,
    payInvoice,
    payAllInvoices,
    refreshInvoices,
  };
};

export default useInvoices;