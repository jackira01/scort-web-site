import axios from '../lib/axios';
import { API_URL } from '../lib/config';
import type {
    ConfigParameter,
    CreateConfigParameterInput,
    UpdateConfigParameterInput,
    ConfigParameterQuery,
    ConfigParameterResponse,
    ApiResponse
} from '../types/config-parameter.types';

const API_BASE_URL = `${API_URL}/api/config-parameters`;

export class ConfigParameterService {
    /**
     * Crear nuevo parámetro de configuración
     */
    static async create(data: CreateConfigParameterInput): Promise<ConfigParameter> {
        try {
            const response = await axios.post<ApiResponse<ConfigParameter>>(API_BASE_URL, data);
            return response.data.data;
        } catch {
            // ConfigParameterService.create error
            throw new Error('Error al crear parámetro de configuración');
        }
    }

    /**
     * Obtener parámetros con filtros y paginación
     */
    static async getAll(query: ConfigParameterQuery = {}) {
        const queryParts: string[] = [];
        
        Object.entries(query).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                if (Array.isArray(value)) {
                    queryParts.push(`${key}=${encodeURIComponent(value.join(','))}`);
                } else {
                    queryParts.push(`${key}=${encodeURIComponent(String(value))}`);
                }
            }
        });

        const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
        const response = await axios.get<ApiResponse<ConfigParameterResponse>>(
            `${API_BASE_URL}${queryString}`
        );
        return response.data.data;
    }

    /**
     * Obtener parámetro por ID
     */
    static async getById(id: string): Promise<ConfigParameter> {
        const response = await axios.get<ApiResponse<ConfigParameter>>(`${API_BASE_URL}/${id}`);
        return response.data.data;
    }

    /**
     * Obtener parámetro por key
     */
    static async getByKey(key: string, activeOnly: boolean = true): Promise<ConfigParameter> {
        const params = activeOnly ? '?activeOnly=true' : '?activeOnly=false';
        const url = `${API_BASE_URL}/key/${key}${params}`;
        
        // DEBUG ConfigParameterService.getByKey called
        
        try {
            const response = await axios.get<ApiResponse<ConfigParameter>>(url);
            // DEBUG API Response info
            
            if (!response.data) {
                // Response.data is undefined
                throw new Error('Response data is undefined');
            }
            
            if (!response.data.data) {
                // Response.data.data is undefined
                throw new Error('Response data.data is undefined');
            }
            
            // DEBUG Returning parameter
            return response.data.data;
        } catch {
            // ConfigParameterService.getByKey error
            throw new Error('Error al obtener parámetro de configuración');
        }
    }

    /**
     * Obtener parámetros por categoría
     */
    static async getByCategory(category: string, activeOnly: boolean = true): Promise<ConfigParameter[]> {
        try {
            const params = activeOnly ? '?activeOnly=true' : '?activeOnly=false';
            const response = await axios.get<ApiResponse<ConfigParameter[]>>(
                `${API_BASE_URL}/category/${category}${params}`
            );
            return response.data.data;
        } catch {
            // ConfigParameterService.getByCategory error
            throw new Error('Error al obtener parámetros por categoría');
        }
    }

    /**
     * Obtener parámetros por tipo
     */
    static async getByType(type: string, activeOnly: boolean = true): Promise<ConfigParameter[]> {
        try {
            const params = activeOnly ? '?activeOnly=true' : '?activeOnly=false';
            const response = await axios.get<ApiResponse<ConfigParameter[]>>(
                `${API_BASE_URL}/type/${type}${params}`
            );
            return response.data.data;
        } catch {
            // ConfigParameterService.getByType error
            throw new Error('Error al obtener parámetros por tipo');
        }
    }

    /**
     * Actualizar parámetro de configuración
     */
    static async update(id: string, data: UpdateConfigParameterInput): Promise<ConfigParameter> {
        try {
            const response = await axios.put<ApiResponse<ConfigParameter>>(`${API_BASE_URL}/${id}`, data);
            return response.data.data;
        } catch {
            // ConfigParameterService.update error
            throw new Error('Error al actualizar parámetro de configuración');
        }
    }

    /**
     * Eliminar parámetro de configuración (soft delete)
     */
    static async delete(id: string): Promise<void> {
        try {
            await axios.delete(`${API_BASE_URL}/${id}`);
        } catch {
            // ConfigParameterService.delete error
            throw new Error('Error al eliminar parámetro de configuración');
        }
    }

    /**
     * Activar/Desactivar parámetro
     */
    static async toggleActive(id: string): Promise<ConfigParameter> {
        const response = await axios.patch<ApiResponse<ConfigParameter>>(`${API_BASE_URL}/${id}/toggle`);
        return response.data.data;
    }

    /**
     * Obtener todas las categorías disponibles
     */
    static async getCategories(): Promise<string[]> {
        const response = await axios.get<ApiResponse<string[]>>(`${API_BASE_URL}/meta/categories`);
        return response.data.data;
    }

    /**
     * Obtener todos los tags disponibles
     */
    static async getTags(): Promise<string[]> {
        const response = await axios.get<ApiResponse<string[]>>(`${API_BASE_URL}/meta/tags`);
        return response.data.data;
    }

    /**
     * Obtener valor de configuración por key (método público)
     */
    static async getValue<T = unknown>(key: string): Promise<T | null> {
        try {
            const response = await axios.get<ApiResponse<{ key: string; value: unknown }>>(`${API_BASE_URL}/value/${key}`);
            return response.data.data.value as T;
        } catch {
            return null;
        }
    }

    /**
     * Obtener múltiples valores por keys
     */
    static async getValues(keys: string[]): Promise<Record<string, unknown>> {
        try {
            const response = await axios.post<ApiResponse<Record<string, unknown>>>(
                `${API_BASE_URL}/values`,
                { keys }
            );
            return response.data.data;
        } catch {
            return {};
        }
    }

    /**
     * Validar estructura de configuración
     */
    static async validate(type: string, value: unknown, metadata?: Record<string, unknown>): Promise<{
        isValid: boolean;
        errors: string[];
    }> {
        try {
            const response = await axios.post<ApiResponse<{ isValid: boolean; errors: string[] }>>(
                `${API_BASE_URL}/validate`,
                { type, value, metadata }
            );
            return response.data.data;
        } catch {
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
    static async getCriticalConfigs(): Promise<Record<string, unknown>> {
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
        } catch (_) {
        
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
            } catch (_) {
          
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
        } catch (_) {
            return false;
        }
    }
}