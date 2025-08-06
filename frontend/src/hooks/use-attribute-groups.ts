'use client';

import { useQuery } from '@tanstack/react-query';
import { getAttributeGroups } from '@/services/attribute-group.service';

export const useAttributeGroups = () => {
  return useQuery({
    queryKey: ['attributeGroups'],
    queryFn: getAttributeGroups,
    staleTime: 1000 * 60 * 5, // 5 min
  });
};