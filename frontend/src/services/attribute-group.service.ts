import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const getAttributeGroups = async () => {
    console.log('🔍 [AttributeGroupService] Haciendo petición a:', `${API_URL}/api/attribute-groups`);
    
    try {
        const response = await axios.get(`${API_URL}/api/attribute-groups`);
        console.log('🔍 [AttributeGroupService] Respuesta recibida:', {
            status: response.status,
            dataLength: response.data?.length || 0,
            data: response.data
        });
        return response.data;
    } catch (error) {
        console.error('🚨 [AttributeGroupService] Error en petición:', error);
        throw error;
    }
};