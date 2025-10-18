import { useEffect, useState } from 'react';
import { getFilterOptions } from '@/services/filters.service';

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

interface UseFilterOptionsReturn {
  data: FilterOptions | null;
  loading: boolean;
  error: string | null;
}

export const useFilterOptions = (): UseFilterOptionsReturn => {
  const [data, setData] = useState<FilterOptions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getFilterOptions();

        if (response.success && response.data) {
          // Validar que categories sea un array
          const validatedData = {
            ...response.data,
            categories: Array.isArray(response.data.categories) ? response.data.categories : []
          };
          console.log('🔍 DEBUG useFilterOptions - Departments data:', validatedData.locations?.departments);

          setData(validatedData);
        } else {
          console.error('🔍 DEBUG useFilterOptions - Invalid response format:', response);
          throw new Error('Invalid response format');
        }
      } catch (err) {
        console.error('🔍 DEBUG useFilterOptions - Error fetching filter options:', err);
        // Fallback con datos por defecto cuando el backend no está disponible
        const fallbackData: FilterOptions = {
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
        };


        setData(fallbackData);
        setError(err instanceof Error ? err.message : 'Error fetching filter options');
      } finally {
        setLoading(false);
      }
    };

    fetchFilterOptions();
  }, []);

  return { data, loading, error };
};