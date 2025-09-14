import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import toast from 'react-hot-toast';
import { ConfigParameterService } from '../services/config-parameter.service';
import type {
    ConfigParameter,
    ConfigParameterMutations,
    ConfigParameterQuery,
    CreateConfigParameterInput,
    UpdateConfigParameterInput,
    UseConfigParameterResult,
    UseConfigParametersResult,
    UseConfigValueResult,
    UseConfigValuesResult,
} from '../types/config-parameter.types';

// Query keys
export const configParameterKeys = {
    all: ['config-parameters'] as const,
    lists: () => [...configParameterKeys.all, 'list'] as const,
    list: (filters: ConfigParameterQuery) =>
        [...configParameterKeys.lists(), filters] as const,
    details: () => [...configParameterKeys.all, 'detail'] as const,
    detail: (id: string) => [...configParameterKeys.details(), id] as const,
    byKey: (key: string) => [...configParameterKeys.all, 'key', key] as const,
    byCategory: (category: string) =>
        [...configParameterKeys.all, 'category', category] as const,
    byType: (type: string) => [...configParameterKeys.all, 'type', type] as const,
    values: () => [...configParameterKeys.all, 'values'] as const,
    value: (key: string) => [...configParameterKeys.values(), key] as const,
    multipleValues: (keys: string[]) =>
        [
            ...configParameterKeys.values(),
            'multiple',
            keys.sort().join(','),
        ] as const,
    categories: () => [...configParameterKeys.all, 'categories'] as const,
    tags: () => [...configParameterKeys.all, 'tags'] as const,
};

/**
 * Hook para obtener lista de parámetros de configuración con filtros
 */
export function useConfigParameters(
    initialFilters: ConfigParameterQuery = {},
    options?: {
        enabled?: boolean;
        refetchInterval?: number;
    },
): UseConfigParametersResult {
    const [filters, setFilters] = useState<ConfigParameterQuery>(initialFilters);
    const queryClient = useQueryClient();

    const {
        data,
        isLoading: loading,
        error,
        refetch,
    } = useQuery({
        queryKey: configParameterKeys.list(filters),
        queryFn: async () => {
            try {
                const result = await ConfigParameterService.getAll(filters);
                return (
                    result || {
                        docs: [],
                        totalCount: 0,
                        currentPage: 1,
                        totalPages: 1,
                        hasNextPage: false,
                        hasPrevPage: false,
                        limit: 20,
                    }
                );
            } catch (error) {

                return {
                    docs: [],
                    totalCount: 0,
                    currentPage: 1,
                    totalPages: 1,
                    hasNextPage: false,
                    hasPrevPage: false,
                    limit: 20,
                };
            }
        },
        enabled: options?.enabled ?? true,
        refetchInterval: options?.refetchInterval,
        staleTime: 5 * 60 * 1000, // 5 minutos
        retry: 1,
        retryDelay: 1000,
    });

    const handleSetFilters = useCallback((newFilters: ConfigParameterQuery) => {
        setFilters(newFilters);
    }, []);

    return {
        parameters: data?.docs || [],
        loading,
        error: error ? (error.message || String(error)) : null,
        totalCount: data?.totalCount || 0,
        currentPage: data?.currentPage || 1,
        totalPages: data?.totalPages || 1,
        hasNextPage: data?.hasNextPage || false,
        hasPrevPage: data?.hasPrevPage || false,
        refetch,
        setFilters: handleSetFilters,
    };
}

/**
 * Hook para obtener un parámetro de configuración por ID
 */
export function useConfigParameter(
    id: string,
    options?: { enabled?: boolean },
): UseConfigParameterResult {
    const {
        data: parameter,
        isLoading: loading,
        error,
        refetch,
    } = useQuery({
        queryKey: configParameterKeys.detail(id),
        queryFn: () => ConfigParameterService.getById(id),
        enabled: (options?.enabled ?? true) && !!id,
        staleTime: 5 * 60 * 1000,
    });

    return {
        parameter: parameter || null,
        loading,
        error: error ? (error.message || String(error)) : null,
        refetch,
    };
}

/**
 * Hook para obtener un parámetro de configuración por key
 */
export function useConfigParameterByKey(
    key: string,
    activeOnly: boolean = true,
    options?: { enabled?: boolean },
): UseConfigParameterResult {
    // DEBUG useConfigParameterByKey called

    const queryKey = configParameterKeys.byKey(key);
    // DEBUG Query key generated

    const {
        data: parameter,
        isLoading: loading,
        error,
        refetch,
    } = useQuery({
        queryKey,
        queryFn: async () => {
            // DEBUG Query function executing
            try {
                const result = await ConfigParameterService.getByKey(key, activeOnly);
                // DEBUG ConfigParameterService.getByKey result
                return result;
            } catch (err) {
                // DEBUG ConfigParameterService.getByKey error
                throw err;
            }
        },
        enabled: (options?.enabled ?? true) && !!key,
        staleTime: 10 * 60 * 1000, // 10 minutos para valores por key
    });

    // DEBUG useQuery result

    const result = {
        parameter: parameter || null,
        loading,
        error: error ? (error.message || String(error)) : null,
        refetch,
    };

    // DEBUG Final hook result
    return result;
}

/**
 * Hook para obtener parámetros por categoría
 */
export function useConfigParametersByCategory(
    category: string,
    activeOnly: boolean = true,
    options?: { enabled?: boolean },
) {
    const {
        data: parameters,
        isLoading: loading,
        error,
        refetch,
    } = useQuery({
        queryKey: configParameterKeys.byCategory(category),
        queryFn: () => ConfigParameterService.getByCategory(category, activeOnly),
        enabled: (options?.enabled ?? true) && !!category,
        staleTime: 5 * 60 * 1000,
    });

    return {
        parameters: parameters || [],
        loading,
        error: error ? (error.message || String(error)) : null,
        refetch,
    };
}

/**
 * Hook para obtener parámetros por tipo
 */
export function useConfigParametersByType(
    type: string,
    activeOnly: boolean = true,
    options?: { enabled?: boolean },
) {
    const {
        data: parameters,
        isLoading: loading,
        error,
        refetch,
    } = useQuery({
        queryKey: configParameterKeys.byType(type),
        queryFn: () => ConfigParameterService.getByType(type, activeOnly),
        enabled: (options?.enabled ?? true) && !!type,
        staleTime: 5 * 60 * 1000,
    });

    return {
        parameters: parameters || [],
        loading,
        error: error ? (error.message || String(error)) : null,
        refetch,
    };
}

/**
 * Hook para obtener un valor de configuración por key
 */
export function useConfigValue<T = any>(
    key: string,
    options?: {
        enabled?: boolean;
        defaultValue?: T;
        refetchInterval?: number;
    },
): UseConfigValueResult<T> {
    const {
        data: value,
        isLoading: loading,
        error,
        refetch,
    } = useQuery({
        queryKey: configParameterKeys.value(key),
        queryFn: () => ConfigParameterService.getValue<T>(key),
        enabled: (options?.enabled ?? true) && !!key,
        staleTime: 15 * 60 * 1000, // 15 minutos para valores
        refetchInterval: options?.refetchInterval,
    });

    return {
        value: value ?? options?.defaultValue ?? null,
        loading,
        error: error ? (error.message || String(error)) : null,
        refetch,
    };
}

/**
 * Hook para obtener múltiples valores de configuración
 */
export function useConfigValues(
    keys: string[],
    options?: {
        enabled?: boolean;
        refetchInterval?: number;
    },
): UseConfigValuesResult {
    const {
        data: values,
        isLoading: loading,
        error,
        refetch,
    } = useQuery({
        queryKey: configParameterKeys.multipleValues(keys),
        queryFn: () => ConfigParameterService.getValues(keys),
        enabled: (options?.enabled ?? true) && keys.length > 0,
        staleTime: 15 * 60 * 1000,
        refetchInterval: options?.refetchInterval,
    });

    return {
        values: values || {},
        loading,
        error: error ? (error.message || String(error)) : null,
        refetch,
    };
}

/**
 * Hook para obtener categorías disponibles
 */
export function useConfigCategories(options?: { enabled?: boolean }) {
    const {
        data: categories,
        isLoading: loading,
        error,
        refetch,
    } = useQuery({
        queryKey: configParameterKeys.categories(),
        queryFn: async () => {
            try {
                const result = await ConfigParameterService.getCategories();
                return result || [];
            } catch (error) {

                return [];
            }
        },
        enabled: options?.enabled ?? true,
        staleTime: 30 * 60 * 1000, // 30 minutos
        retry: 1,
        retryDelay: 1000,
    });

    return {
        categories: categories || [],
        loading,
        error: error ? (error.message || String(error)) : null,
        refetch,
    };
}

/**
 * Hook para obtener tags disponibles
 */
export function useConfigTags(options?: { enabled?: boolean }) {
    const {
        data: tags,
        isLoading: loading,
        error,
        refetch,
    } = useQuery({
        queryKey: configParameterKeys.tags(),
        queryFn: async () => {
            try {
                const result = await ConfigParameterService.getTags();
                return result || [];
            } catch (error) {

                return [];
            }
        },
        enabled: options?.enabled ?? true,
        staleTime: 30 * 60 * 1000,
        retry: 1,
        retryDelay: 1000,
    });

    return {
        tags: tags || [],
        loading,
        error: error ? (error.message || String(error)) : null,
        refetch,
    };
}

/**
 * Hook para mutaciones de parámetros de configuración
 */
export function useConfigParameterMutations(): ConfigParameterMutations {
    const queryClient = useQueryClient();

    const createMutation = useMutation({
        mutationFn: (data: CreateConfigParameterInput) =>
            ConfigParameterService.create(data),
        onSuccess: (data) => {
            // Invalidar queries relacionadas
            queryClient.invalidateQueries({ queryKey: configParameterKeys.all });
            toast.success('Parámetro de configuración creado exitosamente');
        },
        onError: (error: any) => {
            toast.error(
                error?.response?.data?.message || 'Error al crear el parámetro',
            );
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({
            id,
            data,
        }: {
            id: string;
            data: UpdateConfigParameterInput;
        }) => ConfigParameterService.update(id, data),
        onSuccess: (data, variables) => {
            // Actualizar cache específico
            queryClient.setQueryData(configParameterKeys.detail(variables.id), data);
            // Invalidar queries relacionadas
            queryClient.invalidateQueries({ queryKey: configParameterKeys.lists() });
            queryClient.invalidateQueries({ queryKey: configParameterKeys.values() });
            toast.success('Parámetro de configuración actualizado exitosamente');
        },
        onError: (error: any) => {
            toast.error(
                error?.response?.data?.message || 'Error al actualizar el parámetro',
            );
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => ConfigParameterService.delete(id),
        onSuccess: (_, id) => {
            // Remover del cache
            queryClient.removeQueries({ queryKey: configParameterKeys.detail(id) });
            // Invalidar listas
            queryClient.invalidateQueries({ queryKey: configParameterKeys.lists() });
            queryClient.invalidateQueries({ queryKey: configParameterKeys.values() });
            toast.success('Parámetro de configuración eliminado exitosamente');
        },
        onError: (error: any) => {
            toast.error(
                error?.response?.data?.message || 'Error al eliminar el parámetro',
            );
        },
    });

    const toggleActiveMutation = useMutation({
        mutationFn: (id: string) => ConfigParameterService.toggleActive(id),
        onSuccess: (data, id) => {
            // Actualizar cache específico
            queryClient.setQueryData(configParameterKeys.detail(id), data);
            // Invalidar queries relacionadas
            queryClient.invalidateQueries({ queryKey: configParameterKeys.lists() });
            queryClient.invalidateQueries({ queryKey: configParameterKeys.values() });
            toast.success(
                `Parámetro ${data.isActive ? 'activado' : 'desactivado'} exitosamente`,
            );
        },
        onError: (error: any) => {
            toast.error(
                error?.response?.data?.message ||
                'Error al cambiar el estado del parámetro',
            );
        },
    });

    return {
        create: createMutation.mutateAsync,
        update: (id: string, data: UpdateConfigParameterInput) =>
            updateMutation.mutateAsync({ id, data }),
        delete: deleteMutation.mutateAsync,
        toggleActive: toggleActiveMutation.mutateAsync,
    };
}

// Hooks especializados para tipos específicos

/**
 * Hook para configuración de ubicaciones
 */
export function useLocationConfig() {
    return useConfigValue('locations.colombia', {
        refetchInterval: 60 * 60 * 1000, // 1 hora
    });
}

/**
 * Hook para configuración de membresías
 */
export function useMembershipConfig() {
    return useConfigValue('memberships.plans', {
        refetchInterval: 30 * 60 * 1000, // 30 minutos
    });
}

/**
 * Hook para configuración de textos
 */
export function useTextConfig(category?: string) {
    const key = category ? `texts.${category}` : 'texts';
    return useConfigValue(key, {
        refetchInterval: 60 * 60 * 1000, // 1 hora
    });
}

/**
 * Hook para configuraciones críticas del sistema
 */
export function useCriticalConfigs() {
    const keys = [
        'app.name',
        'app.version',
        'app.maintenance_mode',
        'locations.colombia',
        'memberships.plans',
    ];

    return useConfigValues(keys, {
        refetchInterval: 5 * 60 * 1000, // 5 minutos
    });
}

// Hooks individuales para mutaciones específicas
export function useDeleteConfigParameter() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => ConfigParameterService.delete(id),
        onSuccess: (_, id) => {
            queryClient.removeQueries({ queryKey: configParameterKeys.detail(id) });
            queryClient.invalidateQueries({ queryKey: configParameterKeys.lists() });
            queryClient.invalidateQueries({ queryKey: configParameterKeys.values() });
            toast.success('Parámetro de configuración eliminado exitosamente');
        },
        onError: (error: any) => {
            toast.error(
                error?.response?.data?.message || 'Error al eliminar el parámetro',
            );
        },
    });
}

export function useToggleConfigParameterActive() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => ConfigParameterService.toggleActive(id),
        onSuccess: (data, id) => {
            queryClient.setQueryData(configParameterKeys.detail(id), data);
            queryClient.invalidateQueries({ queryKey: configParameterKeys.lists() });
            queryClient.invalidateQueries({ queryKey: configParameterKeys.values() });
            toast.success(
                `Parámetro ${data.isActive ? 'activado' : 'desactivado'} exitosamente`,
            );
        },
        onError: (error: any) => {
            toast.error(
                error?.response?.data?.message ||
                'Error al cambiar el estado del parámetro',
            );
        },
    });
}

export function useCreateConfigParameter() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateConfigParameterInput) =>
            ConfigParameterService.create(data),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: configParameterKeys.all });
            toast.success('Parámetro de configuración creado exitosamente');
        },
        onError: (error: any) => {
            toast.error(
                error?.response?.data?.message || 'Error al crear el parámetro',
            );
        },
    });
}

export function useUpdateConfigParameter() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            id,
            data,
        }: {
            id: string;
            data: UpdateConfigParameterInput;
        }) => ConfigParameterService.update(id, data),
        onSuccess: (data, variables) => {
            queryClient.setQueryData(configParameterKeys.detail(variables.id), data);
            queryClient.invalidateQueries({ queryKey: configParameterKeys.lists() });
            queryClient.invalidateQueries({ queryKey: configParameterKeys.values() });
            toast.success('Parámetro de configuración actualizado exitosamente');
        },
        onError: (error: any) => {
            toast.error(
                error?.response?.data?.message || 'Error al actualizar el parámetro',
            );
        },
    });
}
