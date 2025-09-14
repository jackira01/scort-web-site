import type { ConfigParameter } from '../types/config-parameter.types';
import { ConfigParameterService } from './config-parameter.service';

// Tipos específicos para la jerarquía de ubicaciones
export interface LocationValue {
    label: string;
    value: string;
}

export interface CityData extends LocationValue {
    department: string;
    departmentNormalized: string;
    coordinates?: { lat: number; lng: number };
}

export interface DepartmentData extends LocationValue {
    cities: CityData[];
    coordinates?: { lat: number; lng: number };
    cityCount: number;
}

export interface CountryData extends LocationValue {
    departments: DepartmentData[];
    code: string;
    currency: string;
    language: string;
    timezone: string;
}

/**
 * Servicio para manejar la jerarquía de ubicaciones (País > Departamento > Ciudad)
 * Compatible con la estructura existente de colombiaData.ts
 */
export class LocationHierarchyService {
    /**
     * Obtiene la información del país
     */
    static async getCountry(): Promise<CountryData | null> {
        try {
            const result = await ConfigParameterService.getAll({
                category: 'locations',
                tags: ['country'],
                limit: 1,
            });

            if (result.docs.length === 0) return null;

            const countryConfig = result.docs[0];
            const departments = await LocationHierarchyService.getDepartments();

            return {
                label: countryConfig.value.name,
                value: countryConfig.value.code || countryConfig.key,
                departments,
                code: countryConfig.value.code || 'CO',
                currency: countryConfig.value.currency || 'COP',
                language: countryConfig.value.language || 'es',
                timezone: countryConfig.value.timezone || 'America/Bogota',
            };
        } catch (error) {

            return null;
        }
    }

    /**
     * Obtiene todos los departamentos
     */
    static async getDepartments(): Promise<DepartmentData[]> {
        try {
            const result = await ConfigParameterService.getAll({
                category: 'locations',
                tags: ['department'],
                limit: 100,
                sortBy: 'name',
                sortOrder: 'asc',
            });

            const departments: DepartmentData[] = [];

            for (const dept of result.docs) {
                const cities = await LocationHierarchyService.getCitiesByDepartment(
                    dept.value.normalizedName,
                );

                departments.push({
                    label: dept.value.name,
                    value: dept.value.normalizedName,
                    cities,
                    coordinates: dept.value.coordinates,
                    cityCount: cities.length,
                });
            }

            return departments;
        } catch (error) {

            return [];
        }
    }

    /**
     * Obtiene las ciudades de un departamento específico
     */
    static async getCitiesByDepartment(
        departmentNormalized: string,
    ): Promise<CityData[]> {
        try {
            const result = await ConfigParameterService.getAll({
                category: 'locations',
                tags: ['city', departmentNormalized],
                limit: 200,
                sortBy: 'name',
                sortOrder: 'asc',
            });

            return result.docs.map((city) => ({
                label: city.value.name,
                value: city.value.normalizedName,
                department: city.value.department,
                departmentNormalized: city.value.departmentNormalized,
                coordinates: city.value.coordinates,
            }));
        } catch (error) {

            return [];
        }
    }

    /**
     * Busca ubicaciones por texto (departamentos y ciudades)
     */
    static async searchLocations(searchTerm: string): Promise<{
        departments: DepartmentData[];
        cities: CityData[];
    }> {
        try {
            const result = await ConfigParameterService.getAll({
                category: 'locations',
                search: searchTerm,
                tags: ['department', 'city'],
                limit: 50,
            });

            const departments: DepartmentData[] = [];
            const cities: CityData[] = [];

            for (const location of result.docs) {
                if (location.tags?.includes('department')) {
                    const departmentCities =
                        await LocationHierarchyService.getCitiesByDepartment(
                            location.value.normalizedName,
                        );
                    departments.push({
                        label: location.value.name,
                        value: location.value.normalizedName,
                        cities: departmentCities,
                        coordinates: location.value.coordinates,
                        cityCount: departmentCities.length,
                    });
                } else if (location.tags?.includes('city')) {
                    cities.push({
                        label: location.value.name,
                        value: location.value.normalizedName,
                        department: location.value.department,
                        departmentNormalized: location.value.departmentNormalized,
                        coordinates: location.value.coordinates,
                    });
                }
            }

            return { departments, cities };
        } catch (error) {

            return { departments: [], cities: [] };
        }
    }

    /**
     * Obtiene una ubicación específica por su clave
     */
    static async getLocationByKey(key: string): Promise<ConfigParameter | null> {
        try {
            return await ConfigParameterService.getByKey(key);
        } catch (error) {

            return null;
        }
    }

    /**
     * Obtiene ubicaciones para un selector jerárquico
     * Formato compatible con componentes de UI
     */
    static async getHierarchicalOptions(): Promise<
        {
            label: string;
            value: string;
            children: {
                label: string;
                value: string;
                children: {
                    label: string;
                    value: string;
                }[];
            }[];
        }[]
    > {
        try {
            const country = await LocationHierarchyService.getCountry();
            if (!country) return [];

            return [
                {
                    label: country.label,
                    value: country.value,
                    children: country.departments.map((dept) => ({
                        label: dept.label,
                        value: dept.value,
                        children: dept.cities.map((city) => ({
                            label: city.label,
                            value: city.value,
                        })),
                    })),
                },
            ];
        } catch (error) {

            return [];
        }
    }

    /**
     * Valida si una combinación departamento-ciudad es válida
     */
    static async validateLocation(
        departmentNormalized: string,
        cityNormalized?: string,
    ): Promise<boolean> {
        try {
            // Verificar que el departamento existe
            const departments = await LocationHierarchyService.getDepartments();
            const department = departments.find(
                (d) => d.value === departmentNormalized,
            );

            if (!department) return false;

            // Si se especifica ciudad, verificar que existe en el departamento
            if (cityNormalized) {
                return department.cities && department.cities.some((c) => c.value === cityNormalized);
            }

            return true;
        } catch (error) {

            return false;
        }
    }

    /**
     * Obtiene estadísticas de ubicaciones
     */
    static async getLocationStats(): Promise<{
        totalDepartments: number;
        totalCities: number;
        departmentWithMostCities: { name: string; count: number } | null;
    }> {
        try {
            const departments = await LocationHierarchyService.getDepartments();
            const totalCities = departments.reduce(
                (sum, dept) => sum + dept.cityCount,
                0,
            );

            const departmentWithMostCities = departments.reduce(
                (max, dept) =>
                    dept.cityCount > (max?.count || 0)
                        ? { name: dept.label, count: dept.cityCount }
                        : max,
                null as { name: string; count: number } | null,
            );

            return {
                totalDepartments: departments.length,
                totalCities,
                departmentWithMostCities,
            };
        } catch (error) {

            return {
                totalDepartments: 0,
                totalCities: 0,
                departmentWithMostCities: null,
            };
        }
    }
}

export default LocationHierarchyService;
