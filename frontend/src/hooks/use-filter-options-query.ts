import { useQuery } from '@tanstack/react-query';
import { getFilterOptions } from '@/services/filters.service';
import { getAllDepartments, getCitiesByDepartment } from '@/utils/colombiaData';

interface FilterOptionItem {
  label: string;
  value: string;
}

interface FilterOptions {
  categories: FilterOptionItem[];
  locations: {
    countries: string[];
    departments: (string | FilterOptionItem)[];
    cities: (string | FilterOptionItem)[];
  };
  features: {
    [groupKey: string]: FilterOptionItem[];
  };
  priceRange: {
    min: number;
    max: number;
  };
}

interface UseFilterOptionsQueryReturn {
  data: FilterOptions | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export const useFilterOptionsQuery = (): UseFilterOptionsQueryReturn => {
  const {
    data: rawData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['filter-options'],
    queryFn: async () => {
      const response = await getFilterOptions();

      if (response.success && response.data) {
        // Validar que categories sea un array
        const validatedData = {
          ...response.data,
          categories: Array.isArray(response.data.categories) ? response.data.categories : []
        };
        console.log('🔍 DEBUG useFilterOptionsQuery - Departments data:', validatedData.locations?.departments);
        return validatedData;
      } else {
        console.error('🔍 DEBUG useFilterOptionsQuery - Invalid response format:', response);
        throw new Error('Invalid response format');
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos (antes cacheTime)
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    // Fallback data en caso de error
    placeholderData: {
      categories: [
        { label: 'ESCORT', value: 'escort' },
        { label: 'MASAJISTA', value: 'masajista' },
        { label: 'MODELO', value: 'modelo' },
        { label: 'ACOMPAÑANTE', value: 'acompañante' },
        { label: 'TRANS', value: 'trans' },
        { label: 'GIGOLO', value: 'gigolo' }
      ],
      locations: {
        countries: [],
        departments: [],
        cities: []
      },
      features: {},
      priceRange: {
        min: 0,
        max: 1000000
      }
    },
  });

  return {
    data: rawData,
    isLoading,
    error: error as Error | null,
    refetch,
  };
};

// Hook específico para departamentos con React Query
export const useDepartmentsQuery = () => {
  return useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      // Usar datos locales de Colombia ordenados alfabéticamente
      const departments = getAllDepartments();
      return departments
    },
    staleTime: 10 * 60 * 1000, // 10 minutos para departamentos (cambian poco)
    gcTime: 30 * 60 * 1000, // 30 minutos
    retry: 2,
  });
};

// Hook específico para ciudades por departamento con React Query
export const useCitiesByDepartmentQuery = (departmentId?: string) => {
  return useQuery({
    queryKey: ['cities', departmentId],
    queryFn: async () => {
      if (!departmentId) {
        return [];
      }

      // Usar datos locales de Colombia para obtener ciudades del departamento específico
      const cities = getCitiesByDepartment(departmentId);
      // Las ciudades ya vienen ordenadas alfabéticamente desde getCitiesByDepartment
      return cities;
    },
    enabled: !!departmentId, // Solo ejecutar si hay departamento seleccionado
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 15 * 60 * 1000, // 15 minutos
    retry: 2,
  });
};