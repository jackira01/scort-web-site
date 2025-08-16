import axios from 'axios';
import type { 
  IAttributeGroup, 
  CreateAttributeGroupInput, 
  UpdateVariantInput,
  AddVariantInput,
  RemoveVariantInput,
  UpdateGroupInput
} from '@/types/attribute-group.types';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const getAttributeGroups = async (): Promise<IAttributeGroup[]> => {
    try {
        const response = await axios.get(`${API_URL}/api/attribute-groups`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const getAttributeGroupByKey = async (key: string): Promise<IAttributeGroup> => {
    try {
        const response = await axios.get(`${API_URL}/api/attribute-groups/${key}`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const createAttributeGroup = async (data: CreateAttributeGroupInput): Promise<IAttributeGroup> => {
    try {
        const response = await axios.post(`${API_URL}/api/attribute-groups`, data);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const updateVariant = async (data: UpdateVariantInput): Promise<IAttributeGroup> => {
    try {
        const response = await axios.patch(`${API_URL}/api/attribute-groups/variant`, data);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const deleteAttributeGroup = async (groupId: string): Promise<void> => {
    try {
        await axios.delete(`${API_URL}/api/attribute-groups/${groupId}`);
    } catch (error) {
        throw error;
    }
};

export const addVariant = async (groupId: string, data: AddVariantInput): Promise<IAttributeGroup> => {
    try {
        const response = await axios.post(`${API_URL}/api/attribute-groups/${groupId}/variants`, data);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const removeVariant = async (groupId: string, data: RemoveVariantInput): Promise<IAttributeGroup> => {
    try {
        const response = await axios.delete(`${API_URL}/api/attribute-groups/${groupId}/variants`, { data });
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const updateGroup = async (groupId: string, data: UpdateGroupInput): Promise<IAttributeGroup> => {
    try {
        const response = await axios.patch(`${API_URL}/api/attribute-groups/${groupId}`, data);
        return response.data;
    } catch (error) {
        throw error;
    }
};