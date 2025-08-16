'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getAttributeGroups, 
  getAttributeGroupByKey, 
  createAttributeGroup, 
  updateVariant,
  deleteAttributeGroup,
  addVariant,
  removeVariant,
  updateGroup
} from '@/services/attribute-group.service';
import type { 
  CreateAttributeGroupInput, 
  UpdateVariantInput, 
  AddVariantInput, 
  RemoveVariantInput, 
  UpdateGroupInput 
} from '@/types/attribute-group.types';

export const useAttributeGroups = () => {
  return useQuery({
    queryKey: ['attributeGroups'],
    queryFn: getAttributeGroups,
    staleTime: 1000 * 60 * 5, // 5 min
  });
};

export const useAttributeGroupByKey = (key: string) => {
  return useQuery({
    queryKey: ['attributeGroup', key],
    queryFn: () => getAttributeGroupByKey(key),
    enabled: !!key,
    staleTime: 1000 * 60 * 5, // 5 min
  });
};

export const useCreateAttributeGroup = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createAttributeGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attributeGroups'] });
    },
  });
};

export const useUpdateVariant = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateVariant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attributeGroups'] });
    },
  });
};

export const useDeleteAttributeGroup = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteAttributeGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attributeGroups'] });
    },
  });
};

export const useAddVariant = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ groupId, data }: { groupId: string; data: AddVariantInput }) => 
      addVariant(groupId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attributeGroups'] });
    },
  });
};

export const useRemoveVariant = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ groupId, data }: { groupId: string; data: RemoveVariantInput }) => 
      removeVariant(groupId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attributeGroups'] });
    },
  });
};

export const useUpdateGroup = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ groupId, data }: { groupId: string; data: UpdateGroupInput }) => 
      updateGroup(groupId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attributeGroups'] });
    },
  });
};