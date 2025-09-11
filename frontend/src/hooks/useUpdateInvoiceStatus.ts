import { useMutation, useQueryClient } from '@tanstack/react-query';
import { invoiceService } from '@/services/invoice.service';
import toast from 'react-hot-toast';

export const useUpdateInvoiceStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      invoiceId,
      status,
      reason
    }: {
      invoiceId: string;
      status: 'pending' | 'paid' | 'cancelled' | 'expired';
      reason?: string;
    }) => {
      return await invoiceService.updateInvoiceStatus(invoiceId, status, reason);
    },
    onSuccess: (data) => {
      // Invalidar queries relacionadas con facturas de manera optimizada
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['allInvoices'] }),
        queryClient.invalidateQueries({ queryKey: ['invoiceStats'] }),
        queryClient.invalidateQueries({ queryKey: ['userInvoices'] }),
        queryClient.invalidateQueries({ queryKey: ['pendingInvoices'] }),
        queryClient.invalidateQueries({ queryKey: ['invoices'] })
      ]);

      toast.success('Estado de factura actualizado correctamente');
    },
    onError: (error: any) => {
      console.error('Error updating invoice status:', error);
      toast.error(error.response?.data?.message || 'Error al actualizar el estado de la factura');
    }
  });
};