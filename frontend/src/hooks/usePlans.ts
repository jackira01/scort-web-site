import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Función para transformar datos del backend al formato del frontend
const transformBackendPlanToFrontend = (backendPlan: any): Plan => {
  return {
    _id: backendPlan._id,
    code: backendPlan.code,
    name: backendPlan.name,
    description: backendPlan.description || '',
    level: backendPlan.level,
    isActive: backendPlan.active,
    createdAt: backendPlan.createdAt,
    updatedAt: backendPlan.updatedAt,
    features: backendPlan.features ? {
      showInHome: backendPlan.features.showInHome || false,
      showInFilters: backendPlan.features.showInFilters || false,
      showInSponsored: backendPlan.features.showInSponsored || false
    } : {
      showInHome: false,
      showInFilters: false,
      showInSponsored: false
    },
    variants: backendPlan.variants?.map((variant: any, index: number) => ({
      price: variant.price,
      days: variant.days,
      features: backendPlan.features ? Object.keys(backendPlan.features).filter(key => backendPlan.features[key]) : [],
      contentLimits: {
        maxPhotos: backendPlan.contentLimits?.photos?.max || 0,
        maxVideos: backendPlan.contentLimits?.videos?.max || 0,
        maxAudios: backendPlan.contentLimits?.audios?.max || 0,
        storiesPerDayMax: backendPlan.contentLimits?.storiesPerDayMax || 0,
      },
      includedUpgrades: backendPlan.includedUpgrades || []
    })) || []
  };
};

// Funciones de API para Planes
const plansApi = {
  getAll: async (filters: PlansFilters & PaginationParams = {}): Promise<PlansResponse> => {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.isActive !== undefined) params.append('isActive', filters.isActive.toString());
    if (filters.level) params.append('level', filters.level.toString());
    if (filters.search) params.append('search', filters.search);

    const response = await fetch(`${API_BASE_URL}/api/plans?${params}`);
    if (!response.ok) throw new Error('Error al obtener planes');
    const result = await response.json();
    
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
    const response = await fetch(`${API_BASE_URL}/api/plans/${id}`);
    if (!response.ok) throw new Error('Error al obtener plan');
    const result = await response.json();
    const plan = result.data || result;
    const transformedPlan = transformBackendPlanToFrontend(plan);
    return transformedPlan;
  },

  getByCode: async (code: string): Promise<Plan> => {
    const response = await fetch(`${API_BASE_URL}/api/plans/code/${code}`);
    if (!response.ok) throw new Error('Error al obtener plan por código');
    const result = await response.json();
    const plan = result.data || result;
    return transformBackendPlanToFrontend(plan);
  },

  getByLevel: async (level: number): Promise<Plan[]> => {
    const response = await fetch(`${API_BASE_URL}/api/plans/level/${level}`);
    if (!response.ok) throw new Error('Error al obtener planes por nivel');
    const result = await response.json();
    const plans = result.data || result;
    return plans.map(transformBackendPlanToFrontend);
  },

  create: async (data: CreatePlanRequest): Promise<Plan> => {
    // Transformar datos del frontend al formato del backend
    const backendData = {
      code: data.code,
      name: data.name,
      level: data.level,
      active: data.isActive,
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
      contentLimits: data.variants?.[0] ? {
        photos: {
          min: 0,
          max: data.variants[0].contentLimits.maxPhotos
        },
        videos: {
          min: 0,
          max: data.variants[0].contentLimits.maxVideos
        },
        audios: {
          min: 0,
          max: data.variants[0].contentLimits.maxAudios
        },
        storiesPerDayMax: data.variants[0].contentLimits.storiesPerDayMax
      } : {
        photos: { min: 0, max: 0 },
        videos: { min: 0, max: 0 },
        audios: { min: 0, max: 0 },
        storiesPerDayMax: 0
      },
      includedUpgrades: data.variants?.[0]?.includedUpgrades || []
    };

    const response = await fetch(`${API_BASE_URL}/api/plans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(backendData)
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al crear plan');
    }
    const result = await response.json();
    const plan = result.data || result;
    return transformBackendPlanToFrontend(plan);
  },

  update: async (data: UpdatePlanRequest): Promise<Plan> => {

    
    // Transformar datos del frontend al formato del backend
    const backendData = {
      code: data.code,
      name: data.name,
      level: data.level,
      active: data.isActive,
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
      contentLimits: data.variants?.[0] ? {
        photos: {
          min: 0,
          max: data.variants[0].contentLimits.maxPhotos
        },
        videos: {
          min: 0,
          max: data.variants[0].contentLimits.maxVideos
        },
        audios: {
          min: 0,
          max: data.variants[0].contentLimits.maxAudios
        },
        storiesPerDayMax: data.variants[0].contentLimits.storiesPerDayMax
      } : {
        photos: { min: 0, max: 0 },
        videos: { min: 0, max: 0 },
        audios: { min: 0, max: 0 },
        storiesPerDayMax: 0
      },
      includedUpgrades: data.variants?.[0]?.includedUpgrades || []
    };



    const response = await fetch(`${API_BASE_URL}/api/plans/${data._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(backendData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al actualizar plan');
    }
    
    const result = await response.json();
    const plan = result.data || result;
    const transformedPlan = transformBackendPlanToFrontend(plan);
    return transformedPlan;
  },

  delete: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/api/plans/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Error al eliminar plan');
  }
};

// Funciones de API para Upgrades
const upgradesApi = {
  getAll: async (filters: UpgradesFilters & PaginationParams = {}): Promise<UpgradesResponse> => {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.active !== undefined) params.append('active', filters.active.toString());
    if (filters.search) params.append('search', filters.search);

    const response = await fetch(`${API_BASE_URL}/api/plans/upgrades?${params}`);
    if (!response.ok) throw new Error('Error al obtener upgrades');
    const result = await response.json();
    
    // Transformar la respuesta del backend al formato esperado por el frontend
    return {
      upgrades: result.data || [],
      total: result.pagination?.total || 0,
      page: result.pagination?.page || 1,
      limit: result.pagination?.limit || 10
    };
  },

  getById: async (id: string): Promise<Upgrade> => {
    const response = await fetch(`${API_BASE_URL}/api/plans/upgrades/${id}`);
    if (!response.ok) throw new Error('Error al obtener upgrade');
    const result = await response.json();
    return result.data || result;
  },

  getByCode: async (code: string): Promise<Upgrade> => {
    const response = await fetch(`${API_BASE_URL}/api/plans/upgrades/code/${code}`);
    if (!response.ok) throw new Error('Error al obtener upgrade por código');
    const result = await response.json();
    return result.data || result;
  },

  getDependencyTree: async (): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/api/plans/upgrades/dependency-tree`);
    if (!response.ok) throw new Error('Error al obtener árbol de dependencias');
    const result = await response.json();
    return result.data || result;
  },

  create: async (data: CreateUpgradeRequest): Promise<Upgrade> => {
    const response = await fetch(`${API_BASE_URL}/api/plans/upgrades`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Error al crear upgrade');
    const result = await response.json();
    return result.data || result;
  },

  update: async (data: UpdateUpgradeRequest): Promise<Upgrade> => {
    const response = await fetch(`${API_BASE_URL}/api/plans/upgrades/${data._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Error al actualizar upgrade');
    const result = await response.json();
    return result.data || result;
  },

  delete: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/api/plans/upgrades/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Error al eliminar upgrade');
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