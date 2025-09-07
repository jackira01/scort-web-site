import axiosInstance from '@/lib/axios';

export interface PlanPurchaseRequest {
  profileId: string;
  planCode: string;
  variantDays?: number;
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
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Error al validar operaciones de plan');
  }
};

/**
 * Obtiene información del plan actual de un perfil
 */
export const getProfilePlanInfo = async (profileId: string): Promise<ProfilePlanInfo | null> => {
  try {
    const response = await axiosInstance.get(`api/profile/${profileId}/plan`);
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      return null; // No tiene plan activo
    }
    throw new Error(error.response?.data?.message || 'Error al obtener información del plan');
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
  } catch (error: any) {
    throw new Error(error.response?.data?.message || error.message || 'Error al comprar el plan');
  }
};

/**
 * Renueva un plan existente
 */
export const renewPlan = async (request: PlanRenewalRequest) => {
  try {
    // Validar que el perfil tenga un plan activo
    console.log('🔍 Frontend: Validando plan antes de renovar...', { profileId: request.profileId, extensionDays: request.extensionDays });

    const planInfo = await getProfilePlanInfo(request.profileId);
    console.log('🔍 Frontend: Plan info obtenido:', planInfo);

    if (!planInfo) {
      console.error('❌ Frontend: Plan no encontrado:', { profileId: request.profileId });
      throw new Error('El perfil no tiene un plan activo para renovar');
    }

    if (!planInfo.isActive) {
      console.error('❌ Frontend: Plan no activo:', { planInfo });
      throw new Error('No se puede renovar un plan expirado. Compra un nuevo plan.');
    }

    console.log('✅ Frontend: Plan válido, procediendo con renovación...');

    const response = await axiosInstance.post('/api/plans/renew', request);

    console.log('✅ Frontend: Plan renovado exitosamente:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Frontend: Error completo en renewPlan:', error);
    throw new Error(error.response?.data?.message || error.message || 'Error al renovar el plan');
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
    const planHierarchy = ['AMATISTA', 'ESMERALDA', 'ORO', 'DIAMANTE'];
    const currentIndex = planHierarchy.indexOf(currentPlan.planCode);
    const newIndex = planHierarchy.indexOf(request.newPlanCode);

    if (newIndex <= currentIndex) {
      throw new Error('Solo se permiten upgrades a planes superiores. No se pueden hacer downgrades.');
    }

    const response = await axiosInstance.post(`/api/profile/${request.profileId}/upgrade-plan`, {
      newPlanCode: request.newPlanCode,
      variantDays: request.variantDays
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || error.message || 'Error al hacer upgrade del plan');
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
  } catch (error: any) {
    console.error('Error al obtener conteo de perfiles activos:', error);
    return 0;
  }
};

/**
 * Obtiene todos los planes disponibles
 */
export const getAvailablePlans = async () => {
  try {
    console.log('🔄 Iniciando petición a backend para obtener planes...');
    console.log('📍 URL:', `${axiosInstance.defaults.baseURL}/api/plans`);

    const response = await axiosInstance.get('/api/plans', {
      params: {
        isActive: true
      }
    });

    console.log('✅ Respuesta recibida del backend:', response.data);

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

    console.log('📊 Planes procesados:', response.data.data.length);
    return response.data.data;

  } catch (error: any) {
    console.error('❌ Error detallado en getAvailablePlans:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url,
      method: error.config?.method
    });

    // Proporcionar mensaje de error más específico
    const errorMessage = error.response?.data?.message || error.message || 'Error al obtener planes disponibles';
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