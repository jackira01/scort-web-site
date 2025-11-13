import { useQuery } from '@tanstack/react-query';
import { useCentralizedSession } from '@/hooks/use-centralized-session';
import { invoiceService, Invoice } from '@/services/invoice.service';

export interface UseUserInvoicesOptions {
  page?: number;
  limit?: number;
  status?: string;
  invoiceId?: string;
  profileId?: string;
  enabled?: boolean;
}

export interface UseUserInvoicesReturn {
  invoices: Invoice[];
  total: number;
  page: number;
  totalPages: number;
  currentPage: number;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export const useUserInvoices = ({
  page = 1,
  limit = 10,
  status,
  invoiceId,
  profileId,
  enabled = true
}: UseUserInvoicesOptions = {}): UseUserInvoicesReturn => {
  const { userId } = useCentralizedSession();

  const {
    data,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['userInvoices', userId, page, limit, status, invoiceId, profileId],
    queryFn: async () => {
      if (!userId) throw new Error('Usuario no autenticado');
      return await invoiceService.getUserInvoices(userId, page, limit, status, invoiceId, profileId);
    },
    enabled: enabled && !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  });

  return {
    invoices: data?.invoices || [],
    total: data?.total || 0,
    page: data?.page || 1,
    totalPages: data?.totalPages || 0,
    currentPage: data?.currentPage || 1,
    isLoading,
    error: error as Error | null,
    refetch
  };
};