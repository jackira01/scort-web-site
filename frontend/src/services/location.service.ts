const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

/**
 * Interface para LocationValue (compatible con backend)
 */
export interface LocationValue {
    value: string; // Valor normalizado: "bogota", "medellin"
    label: string; // Valor para mostrar: "Bogotá", "Medellín"
}

/**
 * Interface extendida para admin
 */
export interface LocationDetail extends LocationValue {
    type: 'country' | 'department' | 'city' | 'locality';
    hasChildren?: boolean;
    level?: number;
}

/**
 * Servicio para interactuar con la API de ubicaciones
 * Reemplaza el uso de colombiaData.ts con datos dinámicos desde la base de datos
 */
export class LocationService {
    /**
     * Helper para hacer peticiones fetch con manejo de errores
     */
    private async fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options?.headers,
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data.data;
    }

    /**
     * Obtener el país (Colombia)
     */
    async getCountry(): Promise<LocationValue> {
        try {
            return await this.fetchJSON<LocationValue>(`${API_URL}/api/locations/country`);
        } catch (error) {
            console.error('Error fetching country:', error);
            throw error;
        }
    }

    /**
     * Obtener todos los departamentos
     * GET /api/locations/departments
     */
    async getDepartments(): Promise<LocationValue[]> {
        try {
            return await this.fetchJSON<LocationValue[]>(`${API_URL}/api/locations/departments`);
        } catch (error) {
            console.error('Error fetching departments:', error);
            throw error;
        }
    }

    /**
     * Obtener hijos de cualquier ubicación
     * GET /api/locations/:parentValue/children
     * 
     * Ejemplos:
     * - getChildren('antioquia') → retorna ciudades de Antioquia
     * - getChildren('medellin') → retorna localidades de Medellín
     */
    async getChildren(parentValue: string): Promise<LocationValue[]> {
        try {
            return await this.fetchJSON<LocationValue[]>(`${API_URL}/api/locations/${parentValue}/children`);
        } catch (error) {
            console.error(`Error fetching children of ${parentValue}:`, error);
            throw error;
        }
    }

    /**
     * Obtener ciudades por departamento (alias de getChildren)
     * GET /api/locations/:departmentValue/children
     */
    async getCitiesByDepartment(departmentValue: string): Promise<LocationValue[]> {
        return this.getChildren(departmentValue);
    }

    /**
     * Obtener localidades por ciudad
     * GET /api/locations/:cityValue/children
     */
    async getLocalitiesByCity(cityValue: string): Promise<LocationValue[]> {
        return this.getChildren(cityValue);
    }

    /**
     * Validar si un departamento existe
     * GET /api/locations/validate/department/:value
     */
    async isValidDepartment(value: string): Promise<boolean> {
        try {
            const url = `${API_URL}/api/locations/validate/department/${value}`;
            const result = await this.fetchJSON<{ isValid: boolean }>(url);
            return result.isValid;
        } catch (error) {
            console.error(`Error validating department ${value}:`, error);
            return false;
        }
    }

    /**
     * Validar si una ciudad existe en un departamento
     * GET /api/locations/validate/city/:departmentValue/:cityValue
     */
    async isValidCity(departmentValue: string, cityValue: string): Promise<boolean> {
        try {
            const result = await this.fetchJSON<{ isValid: boolean }>(
                `${API_URL}/api/locations/validate/city/${departmentValue}/${cityValue}`
            );
            return result.isValid;
        } catch (error) {
            console.error(`Error validating city ${cityValue} in ${departmentValue}:`, error);
            return false;
        }
    }

    /**
     * Buscar ubicaciones por texto (autocomplete)
     * GET /api/locations/search?q=query&limit=10
     */
    async search(query: string, limit: number = 10): Promise<LocationDetail[]> {
        try {
            const url = `${API_URL}/api/locations/search?q=${encodeURIComponent(query)}&limit=${limit}`;
            return await this.fetchJSON<LocationDetail[]>(url);
        } catch (error) {
            console.error(`Error searching locations with query "${query}":`, error);
            throw error;
        }
    }

    /**
     * Obtener jerarquía completa (para admin)
     * GET /api/locations/hierarchy
     */
    async getFullHierarchy(): Promise<any> {
        try {
            return await this.fetchJSON<any>(`${API_URL}/api/locations/hierarchy`);
        } catch (error) {
            console.error('Error fetching hierarchy:', error);
            throw error;
        }
    }

    /**
     * Obtener todas las ubicaciones
     * GET /api/locations
     */
    async getAll(): Promise<any[]> {
        try {
            return await this.fetchJSON<any[]>(`${API_URL}/api/locations`);
        } catch (error) {
            console.error('Error fetching all locations:', error);
            throw error;
        }
    }

    /**
     * Obtener una ubicación por ID
     * GET /api/locations/:id
     */
    async getById(id: string): Promise<any> {
        try {
            return await this.fetchJSON<any>(`${API_URL}/api/locations/${id}`);
        } catch (error) {
            console.error(`Error fetching location ${id}:`, error);
            throw error;
        }
    }

    /**
     * Obtener ubicaciones por tipo
     * GET /api/locations/type/:type
     */
    async getByType(type: string): Promise<any[]> {
        try {
            return await this.fetchJSON<any[]>(`${API_URL}/api/locations/type/${type}`);
        } catch (error) {
            console.error(`Error fetching locations of type ${type}:`, error);
            throw error;
        }
    }

    /**
     * Crear una nueva ubicación
     * POST /api/locations
     */
    async create(data: any): Promise<any> {
        try {
            return await this.fetchJSON<any>(`${API_URL}/api/locations`, {
                method: 'POST',
                body: JSON.stringify(data),
            });
        } catch (error) {
            console.error('Error creating location:', error);
            throw error;
        }
    }

    /**
     * Actualizar una ubicación
     * PUT /api/locations/:id
     */
    async update(id: string, data: any): Promise<any> {
        try {
            return await this.fetchJSON<any>(`${API_URL}/api/locations/${id}`, {
                method: 'PUT',
                body: JSON.stringify(data),
            });
        } catch (error) {
            console.error(`Error updating location ${id}:`, error);
            throw error;
        }
    }

    /**
     * Eliminar una ubicación
     * DELETE /api/locations/:id
     */
    async delete(id: string): Promise<void> {
        try {
            await fetch(`${API_URL}/api/locations/${id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
        } catch (error) {
            console.error(`Error deleting location ${id}:`, error);
            throw error;
        }
    }

    /**
     * Importación masiva de ubicaciones
     * POST /api/locations/bulk-import
     */
    async bulkImport(data: any): Promise<any> {
        try {
            return await this.fetchJSON<any>(`${API_URL}/api/locations/bulk-import`, {
                method: 'POST',
                body: JSON.stringify(data),
            });
        } catch (error) {
            console.error('Error bulk importing locations:', error);
            throw error;
        }
    }
}

// Exportar instancia singleton
export const locationService = new LocationService();

// Exportar también como default para importaciones flexibles
export default locationService;
