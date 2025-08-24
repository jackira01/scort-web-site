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
          setData(response.data);
        } else {
          throw new Error('Invalid response format');
        }
      } catch (err) {
  
        setError(err instanceof Error ? err.message : 'Error fetching filter options');
      } finally {
        setLoading(false);
      }
    };

    fetchFilterOptions();
  }, []);

  return { data, loading, error };
};