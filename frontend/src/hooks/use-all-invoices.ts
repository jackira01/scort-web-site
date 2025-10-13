'use client';

import { useQuery } from '@tanstack/react-query';
import { invoiceService, Invoice, InvoiceFilters } from '@/services/invoice.service';

interface UseAllInvoicesOptions {
  page?: number;
  limit?: number;
  status?: string;
  userId?: string;
  profileId?: string;
  _id?: string;
  invoiceNumber?: string;
  startDate?: string;
  endDate?: string;
}

interface InvoiceStats {
  totalRevenue: number;
  monthlyRevenue: number;
  paidInvoices: number;
  pendingInvoices: number;
  totalInvoices: number;
}

interface UseAllInvoicesReturn {
  invoices: Invoice[];
  total: number;
  totalPages: number;
  currentPage: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  stats: InvoiceStats | null;
}

export const useAllInvoices = (options: UseAllInvoicesOptions = {}): UseAllInvoicesReturn => {
  const {
    page = 1,
    limit = 10,
    status,
    userId,
    profileId,
    _id,
    invoiceNumber,
    startDate,
    endDate
  } = options;

  // Query para obtener facturas paginadas
  const {
    data: invoicesData,
    isLoading: isLoadingInvoices,
    error: invoicesError,
    refetch: refetchInvoices
  } = useQuery({
    queryKey: ['allInvoices', page, limit, status, userId, profileId, _id, invoiceNumber, startDate, endDate],
    queryFn: async () => {
      const filters: InvoiceFilters = {};
      if (status) filters.status = status;
      if (userId) filters.userId = userId;
      if (profileId) filters.profileId = profileId;
      if (_id) filters._id = _id;
      if (invoiceNumber) filters.invoiceNumber = invoiceNumber;
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;

      return await invoiceService.getInvoices(filters, page, limit);
    },
    staleTime: 30000, // 30 segundos
    gcTime: 5 * 60 * 1000, // 5 minutos,
  });

  // Query separada para estadísticas (menos frecuente)
  const {
    data: statsData,
    isLoading: isLoadingStats
  } = useQuery({
    queryKey: ['invoiceStats'],
    queryFn: async () => {
      const allInvoicesResponse = await invoiceService.getInvoices({}, 1, 1000);
      const allInvoices = allInvoicesResponse.invoices;

      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      const paidInvoices = allInvoices.filter(inv => inv.status === 'paid');
      const pendingInvoices = allInvoices.filter(inv => inv.status === 'pending');

      const totalRevenue = paidInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);

      const monthlyRevenue = paidInvoices
        .filter(inv => {
          const invoiceDate = new Date(inv.createdAt);
          return invoiceDate.getMonth() === currentMonth && invoiceDate.getFullYear() === currentYear;
        })
        .reduce((sum, inv) => sum + inv.totalAmount, 0);

      return {
        totalRevenue,
        monthlyRevenue,
        paidInvoices: paidInvoices.length,
        pendingInvoices: pendingInvoices.length,
        totalInvoices: allInvoices.length
      };
    },
    staleTime: 60000, // 1 minuto
    gcTime: 10 * 60 * 1000, // 10 minutos
  });

  return {
    invoices: invoicesData?.invoices || [],
    total: invoicesData?.total || 0,
    totalPages: invoicesData?.totalPages || 0,
    currentPage: invoicesData?.page || page,
    isLoading: isLoadingInvoices || isLoadingStats,
    error: invoicesError ? (invoicesError instanceof Error ? invoicesError.message : 'Error al cargar las facturas') : null,
    refetch: refetchInvoices,
    stats: statsData || null
  };
};

export default useAllInvoices;