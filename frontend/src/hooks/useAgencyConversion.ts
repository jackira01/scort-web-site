import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { API_URL } from '@/lib/config';
import toast from 'react-hot-toast';

export interface AgencyConversionRequest {
  businessName: string;
  businessDocument: string;
  reason?: string;
}

export interface ProfileCreationCheck {
  canCreate: boolean;
  requiresVerification: boolean;
  reason?: string;
}

// Función para solicitar conversión a agencia
const requestAgencyConversion = async (data: AgencyConversionRequest) => {
  const response = await fetch(`${API_URL}/api/agency-conversion/request`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // TODO: Agregar token de autenticación
      // 'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error al solicitar conversión');
  }

  return response.json();
};

// Función para verificar si puede crear perfiles adicionales
const checkProfileCreation = async (): Promise<ProfileCreationCheck> => {
  const response = await fetch(`${API_URL}/api/agency-conversion/check-profile-creation`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      // TODO: Agregar token de autenticación
      // 'Authorization': `Bearer ${token}`
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error al verificar creación de perfiles');
  }

  return response.json();
};

// Hook para solicitar conversión a agencia
export const useRequestAgencyConversion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: requestAgencyConversion,
    onSuccess: (data) => {
      toast.success('Solicitud de conversión enviada exitosamente');
      // Invalidar cache del usuario para reflejar los cambios
      queryClient.invalidateQueries({ queryKey: ['user'] });
      queryClient.invalidateQueries({ queryKey: ['session'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al enviar la solicitud');
    },
  });
};

// Hook para verificar si puede crear perfiles adicionales
export const useCheckProfileCreation = () => {
  return useQuery({
    queryKey: ['profile-creation-check'],
    queryFn: checkProfileCreation,
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 1,
  });
};

// Hook combinado para el componente AgencyConversionCard
export const useAgencyConversion = () => {
  const requestConversion = useRequestAgencyConversion();
  const profileCreationCheck = useCheckProfileCreation();
  const agencyConversions = useAgencyConversions('pending');
  const conversionStats = useConversionStats();
  const processConversion = useProcessConversion();

  return {
    requestConversion: {
      mutate: requestConversion.mutate,
      isLoading: requestConversion.isPending,
      error: requestConversion.error,
      isSuccess: requestConversion.isSuccess,
    },
    profileCreationCheck: {
      data: profileCreationCheck.data,
      isLoading: profileCreationCheck.isLoading,
      error: profileCreationCheck.error,
    },
    agencyConversions: {
      data: agencyConversions.data,
      isLoading: agencyConversions.isLoading,
      error: agencyConversions.error,
    },
    conversionStats: {
      data: conversionStats.data,
      isLoading: conversionStats.isLoading,
      error: conversionStats.error,
    },
    processConversion: {
      mutate: processConversion.mutate,
      isLoading: processConversion.isPending,
      error: processConversion.error,
      isSuccess: processConversion.isSuccess,
    },
  };
};

// Tipos para administradores
export interface AgencyConversionRequest {
  _id: string;
  user: {
    _id: string;
    email: string;
    name: string;
  };
  businessName: string;
  businessDocument: string;
  conversionRequestedAt: Date;
  conversionStatus: 'pending' | 'approved' | 'rejected';
  conversionApprovedAt?: Date;
  conversionApprovedBy?: string;
  rejectionReason?: string;
}

export interface ConversionStats {
  pending: number;
  approved: number;
  rejected: number;
  totalAgencies: number;
}

// Funciones para administradores
export const getAgencyConversions = async (filter: 'pending' | 'all' = 'all'): Promise<PendingConversion[]> => {
  const response = await fetch(`/api/agency-conversion/${filter === 'pending' ? 'pending' : 'history'}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Error al obtener conversiones de agencia');
  }

  return response.json();
};

export const getConversionStats = async (): Promise<ConversionStats> => {
  const response = await fetch(`${API_URL}/api/agency-conversion/stats`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      // TODO: Agregar token de autenticación de admin
      // 'Authorization': `Bearer ${adminToken}`
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error al obtener estadísticas de conversión');
  }

  return response.json();
};

export const processConversion = async (data: { userId: string; action: 'approve' | 'reject'; reason?: string }): Promise<void> => {
  const response = await fetch('/api/agency-conversion/process', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userId: data.userId,
      approved: data.action === 'approve',
      rejectionReason: data.reason
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Error al procesar conversión');
  }
};

// Hooks para administradores
export const useAgencyConversions = (filter: 'pending' | 'all' = 'all') => {
  return useQuery({
    queryKey: ['agency-conversions', filter],
    queryFn: () => getAgencyConversions(filter),
    refetchInterval: 30000, // Refrescar cada 30 segundos
  });
};

export const useConversionStats = () => {
  return useQuery({
    queryKey: ['agency-conversions', 'stats'],
    queryFn: getConversionStats,
    refetchInterval: 60000, // Refrescar cada minuto
  });
};

export const useProcessConversion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: processConversion,
    onSuccess: (data, variables) => {
      const action = variables.action === 'approve' ? 'aprobada' : 'rechazada';
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['agency-conversions'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al procesar conversión');
    },
  });
};