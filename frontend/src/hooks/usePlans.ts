import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import axiosInstance from '@/lib/axios';
import {
  Plan,
  Upgrade,
  PlansResponse,
  UpgradesResponse,
  CreatePlanRequest,
  UpdatePlanRequest,
  CreateUpgradeRequest,
  UpdateUpgradeRequest,
  PlansFilters,
  UpgradesFilters,
  PaginationParams
} from '@/types/plans';

// Función para transformar datos del backend al formato del frontend
const transformBackendPlanToFrontend = (backendPlan: any): Plan => {
  return {
    _id: backendPlan._id,
    code: backendPlan.code,
    name: backendPlan.name,
    description: backendPlan.description,
    level: backendPlan.level,
    variants: backendPlan.variants?.map((variant: any, index: number) => ({
      price: variant.price,
      days: variant.days,
      durationRank: variant.durationRank || index + 1
    })) || [],
    features: backendPlan.features ? {
      showInHome: backendPlan.features.showInHome || false,
      showInFilters: backendPlan.features.showInFilters || false,
      showInSponsored: backendPlan.features.showInSponsored || false
    } : {
      showInHome: false,
      showInFilters: false,
      showInSponsored: false
    },
    contentLimits: backendPlan.contentLimits ? {
      photos: {
        min: backendPlan.contentLimits.photos?.min || 0,
        max: backendPlan.contentLimits.photos?.max || 0
      },
      videos: {
        min: backendPlan.contentLimits.videos?.min || 0,
        max: backendPlan.contentLimits.videos?.max || 0
      },
      audios: {
        min: backendPlan.contentLimits.audios?.min || 0,
        max: backendPlan.contentLimits.audios?.max || 0
      },
      storiesPerDayMax: backendPlan.contentLimits.storiesPerDayMax || 0
    } : {
      photos: { min: 0, max: 0 },
      videos: { min: 0, max: 0 },
      audios: { min: 0, max: 0 },
      storiesPerDayMax: 0
    },
    includedUpgrades: backendPlan.includedUpgrades || [],
    active: backendPlan.active || false,
    isActive: backendPlan.active || false,
    createdAt: backendPlan.createdAt,
    updatedAt: backendPlan.updatedAt,
    __v: backendPlan.__v || 0,
    id: backendPlan.id || backendPlan._id
  };
};

// Funciones de API para Planes
const plansApi = {
  getAll: async (filters: PlansFilters & PaginationParams = {}): Promise<PlansResponse> => {
    const params: Record<string, any> = {};
    if (filters.page) params.page = filters.page;
    if (filters.limit) params.limit = filters.limit;
    if (filters.isActive !== undefined) params.isActive = filters.isActive;
    if (filters.level) params.level = filters.level;
    if (filters.search) params.search = filters.search;

    const response = await axiosInstance.get('/api/plans', { params });
    const result = response.data;

    // Transformar la respuesta del backend al formato esperado por el frontend
    const plans = (result.data || []).map(transformBackendPlanToFrontend);

    return {
      plans,
      total: result.pagination?.total || 0,
      page: result.pagination?.page || 1,
      limit: result.pagination?.limit || 10
    };
  },

  getById: async (id: string): Promise<Plan> => {
    const response = await axiosInstance.get(`/api/plans/${id}`);
    const result = response.data;
    const plan = result.data || result;
    const transformedPlan = transformBackendPlanToFrontend(plan);
    return transformedPlan;
  },

  getByCode: async (code: string): Promise<Plan> => {
    const response = await axiosInstance.get(`/api/plans/code/${code}`);
    const result = response.data;
    const plan = result.data || result;
    return transformBackendPlanToFrontend(plan);
  },

  getByLevel: async (level: number): Promise<Plan[]> => {
    const response = await axiosInstance.get(`/api/plans/level/${level}`);
    const result = response.data;
    const plans = result.data || result;
    return plans.map(transformBackendPlanToFrontend);
  },

  create: async (data: CreatePlanRequest): Promise<Plan> => {
    // Transformar datos del frontend al formato del backend
    const backendData = {
      code: data.code,
      name: data.name,
      description: data.description,
      level: data.level,
      active: data.active,
      // Tomar variants pero solo con days, price y durationRank
      variants: data.variants?.map((variant, index) => ({
        days: variant.days,
        price: variant.price,
        durationRank: index + 1
      })),
      // Usar features del plan
      features: data.features || {
        showInHome: false,
        showInFilters: false,
        showInSponsored: false
      },
      contentLimits: data.contentLimits || {
        photos: { min: 0, max: 0 },
        videos: { min: 0, max: 0 },
        audios: { min: 0, max: 0 },
        storiesPerDayMax: 0
      },
      includedUpgrades: data.includedUpgrades || []
    };

    const response = await axiosInstance.post('/api/plans', backendData);
    const result = response.data;
    const plan = result.data || result;
    return transformBackendPlanToFrontend(plan);
  },

  update: async (data: UpdatePlanRequest): Promise<Plan> => {


    // Transformar datos del frontend al formato del backend
    const backendData = {
      code: data.code,
      name: data.name,
      description: data.description,
      level: data.level,
      active: data.active,
      // Tomar variants pero solo con days, price y durationRank
      variants: data.variants?.map((variant, index) => ({
        days: variant.days,
        price: variant.price,
        durationRank: index + 1
      })),
      // Usar features del plan
      features: data.features || {
        showInHome: false,
        showInFilters: false,
        showInSponsored: false
      },
      contentLimits: data.contentLimits || {
        photos: { min: 0, max: 0 },
        videos: { min: 0, max: 0 },
        audios: { min: 0, max: 0 },
        storiesPerDayMax: 0
      },
      includedUpgrades: data.includedUpgrades || []
    };



    const response = await axiosInstance.put(`/api/plans/${data._id}`, backendData);
    const result = response.data;
    const plan = result.data || result;
    const transformedPlan = transformBackendPlanToFrontend(plan);
    return transformedPlan;
  },

  delete: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/api/plans/${id}`);
  }
};

// Funciones de API para Upgrades
const upgradesApi = {
  getAll: async (filters: UpgradesFilters & PaginationParams = {}): Promise<UpgradesResponse> => {
    const params: Record<string, any> = {};
    if (filters.page) params.page = filters.page;
    // Limitar el límite máximo a 100 según la validación del backend
    if (filters.limit) {
      params.limit = Math.min(filters.limit, 100);
    }
    if (filters.active !== undefined) params.active = filters.active;
    if (filters.search) params.search = filters.search;

    try {
      const response = await axiosInstance.get('/api/plans/upgrades', { params });
      const result = response.data;

      // Transformar la respuesta del backend al formato esperado por el frontend
      return {
        upgrades: result.data || [],
        total: result.pagination?.total || 0,
        page: result.pagination?.page || 1,
        limit: result.pagination?.limit || 10
      };
    } catch (error) {
      console.error('Error en upgradesApi.getAll:', error);
      throw error;
    }
  },

  getById: async (id: string): Promise<Upgrade> => {
    const response = await axiosInstance.get(`/api/plans/upgrades/${id}`);
    const result = response.data;
    return result.data || result;
  },

  getByCode: async (code: string): Promise<Upgrade> => {
    const response = await axiosInstance.get(`/api/plans/upgrades/code/${code}`);
    const result = response.data;
    return result.data || result;
  },

  getDependencyTree: async (): Promise<any> => {
    const response = await axiosInstance.get('/api/plans/upgrades/dependency-tree');
    const result = response.data;
    return result.data || result;
  },

  create: async (data: CreateUpgradeRequest): Promise<Upgrade> => {
    const response = await axiosInstance.post('/api/plans/upgrades', data);
    const result = response.data;
    return result.data || result;
  },

  update: async (data: UpdateUpgradeRequest): Promise<Upgrade> => {
    const response = await axiosInstance.put(`/api/plans/upgrades/${data._id}`, data);
    const result = response.data;
    return result.data || result;
  },

  delete: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/api/plans/upgrades/${id}`);
  }
};

// Hooks para Planes
export const usePlans = (filters: PlansFilters & PaginationParams = {}) => {
  return useQuery({
    queryKey: ['plans', filters],
    queryFn: () => plansApi.getAll(filters),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

export const usePlan = (id: string) => {
  return useQuery({
    queryKey: ['plan', id],
    queryFn: () => plansApi.getById(id),
    enabled: !!id,
  });
};

export const usePlanByCode = (code: string) => {
  return useQuery({
    queryKey: ['plan', 'code', code],
    queryFn: () => plansApi.getByCode(code),
    enabled: !!code,
  });
};

export const usePlansByLevel = (level: number) => {
  return useQuery({
    queryKey: ['plans', 'level', level],
    queryFn: () => plansApi.getByLevel(level),
    enabled: !!level,
  });
};

export const useCreatePlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: plansApi.create,
    onSuccess: (data) => {
      // Invalidar y refrescar todas las queries de planes
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      queryClient.refetchQueries({ queryKey: ['plans'] });
      // Toast se maneja en el componente PlanForm
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al crear plan');
    },
  });
};

export const useUpdatePlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: plansApi.update,
    onSuccess: (data) => {
      // Invalidar y refrescar todas las queries de planes
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      queryClient.refetchQueries({ queryKey: ['plans'] });
      queryClient.invalidateQueries({ queryKey: ['plan', data._id] });
      // Toast se maneja en el componente PlanForm
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al actualizar plan');
    },
  });
};

export const useDeletePlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: plansApi.delete,
    onSuccess: () => {
      // Invalidar todas las queries que empiecen con 'plans'
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      // También refrescar queries específicas
      queryClient.refetchQueries({ queryKey: ['plans'] });
      toast.success('Plan eliminado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al eliminar plan');
    },
  });
};

// Hooks para Upgrades
export const useUpgrades = (filters: UpgradesFilters & PaginationParams = {}) => {
  return useQuery({
    queryKey: ['upgrades', filters],
    queryFn: () => upgradesApi.getAll(filters),
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: (failureCount, error: any) => {
      // No reintentar si es un error de validación (400)
      if (error?.message?.includes('validación')) {
        return false;
      }
      return failureCount < 3;
    },
  });
};

export const useUpgrade = (id: string) => {
  return useQuery({
    queryKey: ['upgrade', id],
    queryFn: () => upgradesApi.getById(id),
    enabled: !!id,
  });
};

export const useUpgradeByCode = (code: string) => {
  return useQuery({
    queryKey: ['upgrade', 'code', code],
    queryFn: () => upgradesApi.getByCode(code),
    enabled: !!code,
  });
};

export const useUpgradeDependencyTree = () => {
  return useQuery({
    queryKey: ['upgrades', 'dependency-tree'],
    queryFn: upgradesApi.getDependencyTree,
  });
};

export const useCreateUpgrade = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: upgradesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['upgrades'] });
      queryClient.invalidateQueries({ queryKey: ['upgrades', 'dependency-tree'] });
      toast.success('Upgrade creado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al crear upgrade');
    },
  });
};

export const useUpdateUpgrade = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: upgradesApi.update,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['upgrades'] });
      queryClient.invalidateQueries({ queryKey: ['upgrade', data._id] });
      queryClient.invalidateQueries({ queryKey: ['upgrades', 'dependency-tree'] });
      toast.success('Upgrade actualizado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al actualizar upgrade');
    },
  });
};

export const useDeleteUpgrade = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: upgradesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['upgrades'] });
      queryClient.invalidateQueries({ queryKey: ['upgrades', 'dependency-tree'] });
      toast.success('Upgrade eliminado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al eliminar upgrade');
    },
  });
};