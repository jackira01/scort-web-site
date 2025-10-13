'use client';

import { useQuery } from '@tanstack/react-query';
import { getAttributeGroups } from '@/services/attribute-group.service';
import type { IAttributeGroup } from '@/types/attribute-group.types';

/**
 * Hook para obtener los grupos de atributos que se usan en los filtros
 * Filtra solo los grupos con keys: 'gender', 'category' (removido 'sex')
 */
export const useFilterAttributeGroups = () => {
  return useQuery({
    queryKey: ['filterAttributeGroups'],
    queryFn: async () => {
      const allGroups = await getAttributeGroups();
      // Filtrar solo los grupos que necesitamos para los filtros
      const filterKeys = ['gender', 'category']; // Removido 'sex'
      return allGroups.filter((group: IAttributeGroup) => 
        filterKeys.includes(group.key)
      );
    },
    staleTime: 1000 * 60 * 10, // 10 minutos
    gcTime: 1000 * 60 * 30, // 30 minutos
  });
};

/**
 * Hook para obtener un grupo específico por su key
 */
export const useAttributeGroupByKey = (key: string) => {
  return useQuery({
    queryKey: ['attributeGroup', key],
    queryFn: async () => {
      const allGroups = await getAttributeGroups();
      return allGroups.find((group: IAttributeGroup) => group.key === key);
    },
    staleTime: 1000 * 60 * 10, // 10 minutos
    gcTime: 1000 * 60 * 30, // 30 minutos
    enabled: !!key,
  });
};