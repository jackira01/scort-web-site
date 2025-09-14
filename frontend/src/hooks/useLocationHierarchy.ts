import { type UseQueryResult, useQuery } from '@tanstack/react-query';
import {
    type CityData,
    type CountryData,
    type DepartmentData,
    LocationHierarchyService,
} from '../services/location-hierarchy.service';
import type { ConfigParameter } from '../types/config-parameter.types';

// Claves de query para React Query
const QUERY_KEYS = {
    country: ['location-hierarchy', 'country'] as const,
    departments: ['location-hierarchy', 'departments'] as const,
    departmentCities: (dept: string) =>
        ['location-hierarchy', 'cities', dept] as const,
    searchLocations: (term: string) =>
        ['location-hierarchy', 'search', term] as const,
    hierarchicalOptions: ['location-hierarchy', 'options'] as const,
    locationStats: ['location-hierarchy', 'stats'] as const,
    locationByKey: (key: string) =>
        ['location-hierarchy', 'location', key] as const,
};

/**
 * Hook para obtener información del país
 */
export const useCountry = (): UseQueryResult<CountryData | null> => {
    return useQuery({
        queryKey: QUERY_KEYS.country,
        queryFn: () => LocationHierarchyService.getCountry(),
        staleTime: 5 * 60 * 1000, // 5 minutos
        gcTime: 10 * 60 * 1000, // 10 minutos
    });
};

/**
 * Hook para obtener todos los departamentos
 */
export const useDepartments = (): UseQueryResult<DepartmentData[]> => {
    return useQuery({
        queryKey: QUERY_KEYS.departments,
        queryFn: () => LocationHierarchyService.getDepartments(),
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
    });
};

/**
 * Hook para obtener ciudades de un departamento específico
 */
export const useCitiesByDepartment = (
    departmentNormalized: string,
): UseQueryResult<CityData[]> => {
    return useQuery({
        queryKey: QUERY_KEYS.departmentCities(departmentNormalized),
        queryFn: () =>
            LocationHierarchyService.getCitiesByDepartment(departmentNormalized),
        enabled: !!departmentNormalized,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
    });
};

/**
 * Hook para buscar ubicaciones por texto
 */
export const useSearchLocations = (
    searchTerm: string,
    enabled: boolean = true,
) => {
    return useQuery({
        queryKey: QUERY_KEYS.searchLocations(searchTerm),
        queryFn: () => LocationHierarchyService.searchLocations(searchTerm),
        enabled: enabled && searchTerm.length >= 2,
        staleTime: 2 * 60 * 1000, // 2 minutos para búsquedas
        gcTime: 5 * 60 * 1000,
    });
};

/**
 * Hook para obtener opciones jerárquicas para selectores
 */
export const useHierarchicalOptions = () => {
    return useQuery({
        queryKey: QUERY_KEYS.hierarchicalOptions,
        queryFn: () => LocationHierarchyService.getHierarchicalOptions(),
        staleTime: 10 * 60 * 1000, // 10 minutos
        gcTime: 15 * 60 * 1000,
    });
};

/**
 * Hook para obtener estadísticas de ubicaciones
 */
export const useLocationStats = () => {
    return useQuery({
        queryKey: QUERY_KEYS.locationStats,
        queryFn: () => LocationHierarchyService.getLocationStats(),
        staleTime: 10 * 60 * 1000,
        gcTime: 15 * 60 * 1000,
    });
};

/**
 * Hook para obtener una ubicación específica por clave
 */
export const useLocationByKey = (
    key: string,
): UseQueryResult<ConfigParameter | null> => {
    return useQuery({
        queryKey: QUERY_KEYS.locationByKey(key),
        queryFn: () => LocationHierarchyService.getLocationByKey(key),
        enabled: !!key,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
    });
};

/**
 * Hook personalizado para manejar selección jerárquica de ubicaciones
 * Útil para formularios que requieren selección de departamento y ciudad
 */
export const useLocationSelection = () => {
    const { data: departments, isLoading: departmentsLoading } = useDepartments();

    const getDepartmentOptions = () => {
        return (
            departments?.map((dept) => ({
                label: dept.label,
                value: dept.value,
                cityCount: dept.cityCount,
            })) || []
        );
    };

    const getCityOptions = (departmentNormalized: string) => {
        const department = departments?.find(
            (d) => d.value === departmentNormalized,
        );
        return (
            department?.cities.map((city) => ({
                label: city.label,
                value: city.value,
            })) || []
        );
    };

    const validateSelection = (
        departmentNormalized: string,
        cityNormalized?: string,
    ) => {
        const department = departments?.find(
            (d) => d.value === departmentNormalized,
        );
        if (!department) return false;

        if (cityNormalized) {
            return department.cities.some((c) => c.value === cityNormalized);
        }

        return true;
    };

    return {
        departments,
        departmentsLoading,
        getDepartmentOptions,
        getCityOptions,
        validateSelection,
    };
};

/**
 * Hook para autocompletado de ubicaciones
 * Útil para campos de búsqueda con sugerencias
 */
export const useLocationAutocomplete = (
    searchTerm: string,
    minLength: number = 2,
) => {
    const { data, isLoading, error } = useSearchLocations(
        searchTerm,
        searchTerm.length >= minLength,
    );

    const suggestions = {
        departments:
            data?.departments.map((dept) => ({
                type: 'department' as const,
                label: dept.label,
                value: dept.value,
                subtitle: `${dept.cityCount} ciudades`,
                coordinates: dept.coordinates,
            })) || [],
        cities:
            data?.cities.map((city) => ({
                type: 'city' as const,
                label: city.label,
                value: city.value,
                subtitle: city.department,
                coordinates: city.coordinates,
            })) || [],
    };

    const allSuggestions = [...suggestions.departments, ...suggestions.cities];

    return {
        suggestions,
        allSuggestions,
        isLoading,
        error,
        hasResults: allSuggestions.length > 0,
    };
};

/**
 * Hook para validación de ubicaciones en tiempo real
 */
export const useLocationValidation = () => {
    const { data: departments } = useDepartments();

    const validateDepartment = (departmentNormalized: string): boolean => {
        return departments?.some((d) => d.value === departmentNormalized) || false;
    };

    const validateCity = (
        departmentNormalized: string,
        cityNormalized: string,
    ): boolean => {
        const department = departments?.find(
            (d) => d.value === departmentNormalized,
        );
        return department?.cities.some((c) => c.value === cityNormalized) || false;
    };

    const getDepartmentByCity = (
        cityNormalized: string,
    ): DepartmentData | null => {
        for (const dept of departments || []) {
            if (dept.cities.some((c) => c.value === cityNormalized)) {
                return dept;
            }
        }
        return null;
    };

    const getCityData = (
        departmentNormalized: string,
        cityNormalized: string,
    ): CityData | null => {
        const department = departments?.find(
            (d) => d.value === departmentNormalized,
        );
        return department?.cities.find((c) => c.value === cityNormalized) || null;
    };

    return {
        validateDepartment,
        validateCity,
        getDepartmentByCity,
        getCityData,
        isReady: !!departments,
    };
};

export default {
    useCountry,
    useDepartments,
    useCitiesByDepartment,
    useSearchLocations,
    useHierarchicalOptions,
    useLocationStats,
    useLocationByKey,
    useLocationSelection,
    useLocationAutocomplete,
    useLocationValidation,
};
