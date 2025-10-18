import axiosInstance from '@/lib/axios';

export interface PlanPurchaseRequest {
  profileId: string;
  planCode: string;
  variantDays?: number;
  generateInvoice?: boolean; // Para administradores: controlar si generar factura
}

export interface PlanUpgradeRequest {
  profileId: string;
  newPlanCode: string;
  variantDays?: number;
}

export interface PlanRenewalRequest {
  profileId: string;
  extensionDays?: number;
}

export interface PlanValidationResponse {
  canPurchase: boolean;
  canUpgrade: boolean;
  canRenew: boolean;
  reason?: string;
  activeProfilesCount: number;
  maxActiveProfiles: number;
}

export interface ProfilePlanInfo {
  planCode: string;
  variantDays: number;
  startAt: string;
  expiresAt: string;
  isActive: boolean;
  daysRemaining: number;
}

/**
 * Valida si un perfil puede realizar operaciones de plan
 */
export const validatePlanOperations = async (profileId: string): Promise<PlanValidationResponse> => {
  try {
    const response = await axiosInstance.get(`/api/profile/${profileId}/plan/validate`);
    return response.data;
  } catch (error: unknown) {
    let errorMessage = 'Error al validar operaciones de plan';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'object' && error !== null && 'response' in error) {
      const responseError = error as { response?: { data?: { message?: string } } };
      errorMessage = responseError.response?.data?.message || errorMessage;
    }
    throw new Error(errorMessage);
  }
};

/**
 * Obtiene información del plan actual de un perfil
 */
export const getProfilePlanInfo = async (profileId: string): Promise<ProfilePlanInfo | null> => {
  try {
    const response = await axiosInstance.get(`api/profile/${profileId}/plan`);
    return response.data;
  } catch (error: unknown) {
    if (error instanceof Error && 'response' in error) {
      const axiosError = error as { response?: { status?: number; data?: { message?: string } } };
      if (axiosError.response?.status === 404) {
        return null; // No tiene plan activo
      }
      throw new Error(axiosError.response?.data?.message || 'Error al obtener información del plan');
    }
    throw new Error('Error al obtener información del plan');
  }
};

/**
 * Compra un nuevo plan para un perfil
 */
export const purchasePlan = async (request: PlanPurchaseRequest) => {
  try {
    // Validar restricciones antes de la compra
    const validation = await validatePlanOperations(request.profileId);

    if (!validation.canPurchase) {
      throw new Error(validation.reason || 'No se puede comprar este plan');
    }

    if (validation.activeProfilesCount >= validation.maxActiveProfiles && request.planCode !== 'AMATISTA') {
      throw new Error(`No puedes tener más de ${validation.maxActiveProfiles} perfiles con plan pago activos`);
    }

    const response = await axiosInstance.post('/api/plans/purchase', request);
    return response.data;
  } catch (error: unknown) {
    let errorMessage = 'Error al comprar plan';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'object' && error !== null && 'response' in error) {
      const responseError = error as { response?: { data?: { message?: string } } };
      errorMessage = responseError.response?.data?.message || errorMessage;
    }
    throw new Error(errorMessage);
  }
};

/**
 * Renueva un plan existente (permite renovar planes expirados)
 */
export const renewPlan = async (request: PlanRenewalRequest) => {
  try {
    console.log('🔍 DEBUG SERVICIO - renewPlan llamado con:', request);
    
    // Validar que el perfil tenga información de plan
    const planInfo = await getProfilePlanInfo(request.profileId);
    console.log('🔍 DEBUG SERVICIO - planInfo obtenida:', planInfo);

    if (!planInfo) {
      throw new Error('El perfil no tiene información de plan para renovar');
    }

    // Permitir renovación tanto de planes activos como expirados
    console.log('🔍 DEBUG SERVICIO - Enviando request al backend:', request);
    const response = await axiosInstance.post('/api/plans/renew', request);
    console.log('🔍 DEBUG SERVICIO - Respuesta del backend:', response.data);

    return response.data;
  } catch (error: unknown) {
    let errorMessage = 'Error al renovar plan';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'object' && error !== null && 'response' in error) {
      const responseError = error as { response?: { data?: { message?: string } } };
      errorMessage = responseError.response?.data?.message || errorMessage;
    }
    throw new Error(errorMessage);
  }
};

/**
 * Actualiza un plan a uno superior (upgrade)
 */
export const upgradePlan = async (request: PlanUpgradeRequest) => {
  try {
    // Validar restricciones de upgrade
    const validation = await validatePlanOperations(request.profileId);

    if (!validation.canUpgrade) {
      throw new Error(validation.reason || 'No se puede hacer upgrade de este plan');
    }

    const currentPlan = await getProfilePlanInfo(request.profileId);

    if (!currentPlan || !currentPlan.isActive) {
      throw new Error('El perfil debe tener un plan activo para hacer upgrade');
    }

    // Validar que sea un upgrade (no downgrade)
    // RESTRICCIÓN ELIMINADA: Ahora se permite cambiar a cualquier plan
    // Ya no validamos jerarquía de planes, permitiendo tanto upgrades como downgrades

    const response = await axiosInstance.post(`/api/profile/${request.profileId}/upgrade-plan`, {
      newPlanCode: request.newPlanCode,
      variantDays: request.variantDays
    });
    return response.data;
  } catch (error: unknown) {
    let errorMessage = 'Error al actualizar plan';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'object' && error !== null && 'response' in error) {
      const responseError = error as { response?: { data?: { message?: string } } };
      errorMessage = responseError.response?.data?.message || errorMessage;
    }
    throw new Error(errorMessage);
  }
};

/**
 * Obtiene el conteo de perfiles activos con planes pagos
 */
export const getActiveProfilesCount = async (userId?: string): Promise<number> => {
  try {
    const response = await axiosInstance.get('/api/profile/active-plans-count', {
      params: userId ? { userId } : undefined
    });
    return response.data.count || 0;
  } catch {
    // Error al obtener conteo de perfiles activos
    return 0;
  }
};

/**
 * Obtiene todos los planes disponibles
 */
export const getAvailablePlans = async () => {
  try {
    // Iniciando petición a backend para obtener planes

    const response = await axiosInstance.get('/api/plans', {
      params: {
        isActive: true
      }
    });

    // Respuesta recibida del backend

    // Validar estructura de respuesta
    if (!response.data || typeof response.data !== 'object') {
      throw new Error('Respuesta del backend inválida: no es un objeto');
    }

    if (!response.data.success) {
      throw new Error(`Error del backend: ${response.data.message || 'Error desconocido'}`);
    }

    if (!Array.isArray(response.data.data)) {
      throw new Error('Respuesta del backend inválida: data no es un array');
    }

    // Planes procesados
    return response.data.data;

  } catch (error: unknown) {
    let errorMessage = 'Error al obtener planes';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'object' && error !== null && 'response' in error) {
      const responseError = error as { response?: { data?: { message?: string } } };
      errorMessage = responseError.response?.data?.message || errorMessage;
    }
    throw new Error(errorMessage);
  }
};

/**
 * Obtiene la lista de upgrades disponibles
 */
export const getAvailableUpgrades = async () => {
  try {
    const response = await axiosInstance.get('/api/plans/upgrades');
    
    // Validar estructura de respuesta
    if (!response.data || typeof response.data !== 'object') {
      throw new Error('Respuesta del backend inválida: no es un objeto');
    }

    if (!response.data.success) {
      throw new Error(`Error del backend: ${response.data.message || 'Error desconocido'}`);
    }

    if (!Array.isArray(response.data.data)) {
      throw new Error('Respuesta del backend inválida: data no es un array');
    }

    return response.data.data;

  } catch (error: unknown) {
    let errorMessage = 'Error al obtener upgrades';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'object' && error !== null && 'response' in error) {
      const responseError = error as { response?: { data?: { message?: string } } };
      errorMessage = responseError.response?.data?.message || errorMessage;
    }
    throw new Error(errorMessage);
  }
};

/**
 * Valida si se puede transferir un plan (siempre retorna false según las restricciones)
 */
export const canTransferPlan = (): boolean => {
  return false; // Las transferencias de planes no están permitidas
};

/**
 * Valida las reglas de negocio para operaciones de planes
 */
export const validatePlanBusinessRules = {
  /**
   * Verifica si se puede editar un plan activo
   */
  canEditActivePlan: (): boolean => {
    return false; // No se pueden editar planes activos
  },

  /**
   * Verifica si se puede hacer downgrade
   */
  canDowngrade: (): boolean => {
    return false; // No se permiten downgrades
  },

  /**
   * Verifica si se puede transferir un plan
   */
  canTransfer: (): boolean => {
    return false; // No se permiten transferencias
  },

  /**
   * Verifica el límite de perfiles con planes pagos
   */
  validateProfileLimit: (activeCount: number, maxLimit: number = 10): boolean => {
    return activeCount < maxLimit;
  },

  /**
   * Verifica si un plan está activo
   */
  isPlanActive: (expiresAt: string | Date): boolean => {
    const expirationDate = new Date(expiresAt);
    return expirationDate > new Date();
  },

  /**
   * Calcula días restantes de un plan
   */
  getDaysRemaining: (expiresAt: string | Date): number => {
    const expirationDate = new Date(expiresAt);
    const now = new Date();
    const diffTime = expirationDate.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }
};

// Export service object for compatibility
export const plansService = {
  validatePlanOperations,
  purchasePlan,
  upgradePlan,
  renewPlan,
  getProfilePlanInfo,
  getAvailablePlans,
  getAvailableUpgrades,
  validatePlanBusinessRules
};