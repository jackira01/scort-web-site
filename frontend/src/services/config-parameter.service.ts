import axios from '../lib/axios';
import { API_URL } from '../lib/config';
import type {
    ConfigParameter,
    CreateConfigParameterInput,
    UpdateConfigParameterInput,
    ConfigParameterQuery,
    ConfigParameterApiResponse,
    ConfigParametersApiResponse,
    ConfigValueApiResponse,
    ConfigValuesApiResponse,
    CategoriesApiResponse,
    TagsApiResponse,
    ApiResponse
} from '../types/config-parameter.types';

const API_BASE_URL = `${API_URL}/api/config-parameters`;

export class ConfigParameterService {
    /**
     * Crear nuevo parámetro de configuración
     */
    static async create(data: CreateConfigParameterInput): Promise<ConfigParameter> {
        const response = await axios.post<ConfigParameterApiResponse>(API_BASE_URL, data);
        return response.data.data;
    }

    /**
     * Obtener parámetros con filtros y paginación
     */
    static async getAll(query: ConfigParameterQuery = {}) {
        const params = new URLSearchParams();
        
        Object.entries(query).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                if (Array.isArray(value)) {
                    params.append(key, value.join(','));
                } else {
                    params.append(key, String(value));
                }
            }
        });

        const response = await axios.get<ConfigParametersApiResponse>(
            `${API_BASE_URL}?${params.toString()}`
        );
        return response.data.data;
    }

    /**
     * Obtener parámetro por ID
     */
    static async getById(id: string): Promise<ConfigParameter> {
        const response = await axios.get<ConfigParameterApiResponse>(`${API_BASE_URL}/${id}`);
        return response.data.data;
    }

    /**
     * Obtener parámetro por key
     */
    static async getByKey(key: string, activeOnly: boolean = true): Promise<ConfigParameter> {
        const params = activeOnly ? '?activeOnly=true' : '?activeOnly=false';
        const url = `${API_BASE_URL}/key/${key}${params}`;
        
        console.log('[DEBUG] ConfigParameterService.getByKey called with:', { key, activeOnly });
        console.log('[DEBUG] API URL:', url);
        console.log('[DEBUG] API_BASE_URL:', API_BASE_URL);
        
        try {
            const response = await axios.get<ConfigParameterApiResponse>(url);
            console.log('[DEBUG] API Response status:', response.status);
            console.log('[DEBUG] API Response headers:', response.headers);
            console.log('[DEBUG] API Response data:', response.data);
            
            if (!response.data) {
                console.error('[DEBUG] Response.data is undefined!');
                throw new Error('Response data is undefined');
            }
            
            if (!response.data.data) {
                console.error('[DEBUG] Response.data.data is undefined!');
                console.error('[DEBUG] Full response.data structure:', JSON.stringify(response.data, null, 2));
                throw new Error('Response data.data is undefined');
            }
            
            console.log('[DEBUG] Returning parameter:', response.data.data);
            return response.data.data;
        } catch (error) {
            console.error('[DEBUG] ConfigParameterService.getByKey error:', error);
            if (error.response) {
                console.error('[DEBUG] Error response status:', error.response.status);
                console.error('[DEBUG] Error response data:', error.response.data);
            }
            throw error;
        }
    }

    /**
     * Obtener parámetros por categoría
     */
    static async getByCategory(category: string, activeOnly: boolean = true): Promise<ConfigParameter[]> {
        const params = activeOnly ? '?activeOnly=true' : '?activeOnly=false';
        const response = await axios.get<ApiResponse<ConfigParameter[]>>(
            `${API_BASE_URL}/category/${category}${params}`
        );
        return response.data.data;
    }

    /**
     * Obtener parámetros por tipo
     */
    static async getByType(type: string, activeOnly: boolean = true): Promise<ConfigParameter[]> {
        const params = activeOnly ? '?activeOnly=true' : '?activeOnly=false';
        const response = await axios.get<ApiResponse<ConfigParameter[]>>(
            `${API_BASE_URL}/type/${type}${params}`
        );
        return response.data.data;
    }

    /**
     * Actualizar parámetro de configuración
     */
    static async update(id: string, data: UpdateConfigParameterInput): Promise<ConfigParameter> {
        const response = await axios.put<ConfigParameterApiResponse>(`${API_BASE_URL}/${id}`, data);
        return response.data.data;
    }

    /**
     * Eliminar parámetro de configuración (soft delete)
     */
    static async delete(id: string): Promise<void> {
        await axios.delete(`${API_BASE_URL}/${id}`);
    }

    /**
     * Activar/Desactivar parámetro
     */
    static async toggleActive(id: string): Promise<ConfigParameter> {
        const response = await axios.patch<ConfigParameterApiResponse>(`${API_BASE_URL}/${id}/toggle`);
        return response.data.data;
    }

    /**
     * Obtener todas las categorías disponibles
     */
    static async getCategories(): Promise<string[]> {
        const response = await axios.get<CategoriesApiResponse>(`${API_BASE_URL}/meta/categories`);
        return response.data.data;
    }

    /**
     * Obtener todos los tags disponibles
     */
    static async getTags(): Promise<string[]> {
        const response = await axios.get<TagsApiResponse>(`${API_BASE_URL}/meta/tags`);
        return response.data.data;
    }

    /**
     * Obtener valor de configuración por key (método público)
     */
    static async getValue<T = any>(key: string): Promise<T | null> {
        try {
            const response = await axios.get<ConfigValueApiResponse>(`${API_BASE_URL}/value/${key}`);
            return response.data.data.value;
        } catch (error) {
        
            return null;
        }
    }

    /**
     * Obtener múltiples valores por keys
     */
    static async getValues(keys: string[]): Promise<Record<string, any>> {
        try {
            const response = await axios.post<ConfigValuesApiResponse>(
                `${API_BASE_URL}/values`,
                { keys }
            );
            return response.data.data;
        } catch (error) {
        
            return {};
        }
    }

    /**
     * Validar estructura de configuración
     */
    static async validate(type: string, value: any, metadata?: any): Promise<{
        isValid: boolean;
        errors: string[];
    }> {
        try {
            const response = await axios.post<ApiResponse<{ isValid: boolean; errors: string[] }>>(
                `${API_BASE_URL}/validate`,
                { type, value, metadata }
            );
            return response.data.data;
        } catch (error) {
            return {
                isValid: false,
                errors: ['Validation service unavailable']
            };
        }
    }

    // Métodos de conveniencia para tipos específicos

    /**
     * Obtener configuración de ubicaciones
     */
    static async getLocationConfig() {
        return this.getValue('locations.colombia');
    }

    /**
     * Obtener configuración de textos
     */
    static async getTextConfig(category?: string) {
        if (category) {
            return this.getValue(`texts.${category}`);
        }
        return this.getByCategory('texts');
    }

    /**
     * Obtener configuración de membresías
     */
    static async getMembershipConfig() {
        return this.getValue('memberships.plans');
    }

    /**
     * Obtener configuración del sistema
     */
    static async getSystemConfig() {
        return this.getByCategory('system');
    }

    /**
     * Obtener configuración de la aplicación
     */
    static async getAppConfig() {
        return this.getByCategory('app');
    }

    // Métodos para cache y optimización

    /**
     * Obtener configuraciones críticas (con cache)
     */
    static async getCriticalConfigs(): Promise<Record<string, any>> {
        const criticalKeys = [
            'app.name',
            'app.version',
            'app.maintenance_mode',
            'locations.colombia',
            'memberships.plans'
        ];
        
        return this.getValues(criticalKeys);
    }

    /**
     * Precargar configuraciones comunes
     */
    static async preloadCommonConfigs(): Promise<void> {
        try {
            await Promise.all([
                this.getLocationConfig(),
                this.getMembershipConfig(),
                this.getSystemConfig()
            ]);
        } catch (error) {
        
        }
    }

    // Utilidades para desarrollo

    /**
     * Exportar todas las configuraciones (para backup/migración)
     */
    static async exportAll(): Promise<ConfigParameter[]> {
        const result = await this.getAll({ limit: 1000, isActive: undefined });
        return result.docs;
    }

    /**
     * Importar configuraciones (para restore/migración)
     */
    static async importConfigs(configs: CreateConfigParameterInput[]): Promise<ConfigParameter[]> {
        const results: ConfigParameter[] = [];
        
        for (const config of configs) {
            try {
                const created = await this.create(config);
                results.push(created);
            } catch (error) {
          
            }
        }
        
        return results;
    }

    /**
     * Verificar salud del servicio de configuración
     */
    static async healthCheck(): Promise<boolean> {
        try {
            await this.getCategories();
            return true;
        } catch (error) {
            return false;
        }
    }
}