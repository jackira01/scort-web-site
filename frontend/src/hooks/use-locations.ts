import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { locationService } from '@/services/location.service';
import type { LocationType } from '@/types/location.types';

interface CreateLocationData {
    value: string;
    label: string;
    type: LocationType;
    parentId?: string;
}

interface UpdateLocationData {
    value?: string;
    label?: string;
    type?: LocationType;
    parentId?: string;
    isActive?: boolean;
}

/**
 * Hook para obtener todas las ubicaciones
 */
export function useLocations() {
    return useQuery({
        queryKey: ['locations'],
        queryFn: () => locationService.getAll(),
        staleTime: 5 * 60 * 1000, // 5 minutos
    });
}

/**
 * Hook para obtener una ubicación por ID
 */
export function useLocation(id: string) {
    return useQuery({
        queryKey: ['locations', id],
        queryFn: () => locationService.getById(id),
        enabled: !!id,
    });
}

/**
 * Hook para obtener ubicaciones por tipo
 */
export function useLocationsByType(type: LocationType) {
    return useQuery({
        queryKey: ['locations', 'by-type', type],
        queryFn: () => locationService.getByType(type),
        staleTime: 5 * 60 * 1000,
    });
}

/**
 * Hook para obtener ubicaciones hijas
 */
export function useChildrenLocations(parentId: string) {
    return useQuery({
        queryKey: ['locations', 'children', parentId],
        queryFn: () => locationService.getChildren(parentId),
        enabled: !!parentId,
        staleTime: 5 * 60 * 1000,
    });
}

/**
 * Hook para obtener departamentos
 */
export function useDepartments() {
    return useQuery({
        queryKey: ['locations', 'departments'],
        queryFn: () => locationService.getDepartments(),
        staleTime: 10 * 60 * 1000, // 10 minutos
    });
}

/**
 * Hook para obtener ciudades por departamento
 */
export function useCitiesByDepartment(departmentValue: string) {
    return useQuery({
        queryKey: ['locations', 'cities', departmentValue],
        queryFn: () => locationService.getCitiesByDepartment(departmentValue),
        enabled: !!departmentValue,
        staleTime: 10 * 60 * 1000,
    });
}

/**
 * Hook para crear una ubicación
 */
export function useCreateLocation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateLocationData) => locationService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['locations'] });
        },
    });
}

/**
 * Hook para actualizar una ubicación
 */
export function useUpdateLocation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateLocationData }) =>
            locationService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['locations'] });
        },
    });
}

/**
 * Hook para eliminar una ubicación
 */
export function useDeleteLocation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => locationService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['locations'] });
        },
    });
}

/**
 * Hook para importación masiva de ubicaciones
 */
export function useBulkImportLocations() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: any) => locationService.bulkImport(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['locations'] });
        },
    });
}
