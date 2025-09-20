import type { ConfigParameter } from '../types/config-parameter.types';
import { ConfigParameterService } from './config-parameter.service';

// Tipos específicos para la jerarquía de ubicaciones
export interface LocationValue {
    label: string;
    value: string;
}

// Tipos para los valores de configuración de ubicaciones
export interface CountryConfigValue {
    name: string;
    code: string;
    currency: string;
    language: string;
    timezone: string;
}

export interface DepartmentConfigValue {
    name: string;
    normalizedName: string;
    country: string;
    coordinates?: { lat: number; lng: number };
}

export interface CityConfigValue {
    name: string;
    normalizedName: string;
    department: string;
    departmentNormalized: string;
    coordinates?: { lat: number; lng: number };
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

            const countryValue = countryConfig.value as CountryConfigValue;

            return {
                label: countryValue.name,
                value: countryValue.code || countryConfig.key,
                departments,
                code: countryValue.code || 'CO',
                currency: countryValue.currency || 'COP',
                language: countryValue.language || 'es',
                timezone: countryValue.timezone || 'America/Bogota',
            };
        } catch {

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
                const deptValue = dept.value as DepartmentConfigValue;
                const cities = await LocationHierarchyService.getCitiesByDepartment(
                    deptValue.normalizedName,
                );

                departments.push({
                    label: deptValue.name,
                    value: deptValue.normalizedName,
                    cities,
                    coordinates: deptValue.coordinates,
                    cityCount: cities.length,
                });
            }

            return departments;
        } catch {

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

            return result.docs.map((city) => {
                const cityValue = city.value as CityConfigValue;
                return {
                    label: cityValue.name,
                    value: cityValue.normalizedName,
                    department: cityValue.department,
                    departmentNormalized: cityValue.departmentNormalized,
                    coordinates: cityValue.coordinates,
                };
            });
        } catch {

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
                    const deptValue = location.value as DepartmentConfigValue;
                    const departmentCities = await LocationHierarchyService.getCitiesByDepartment(
                        deptValue.normalizedName,
                        );
                    departments.push({
                        label: deptValue.name,
                        value: deptValue.normalizedName,
                        cities: departmentCities,
                        coordinates: deptValue.coordinates,
                        cityCount: departmentCities.length,
                    });
                } else if (location.tags?.includes('city')) {
                    const cityValue = location.value as CityConfigValue;
                    cities.push({
                        label: cityValue.name,
                        value: cityValue.normalizedName,
                        department: cityValue.department,
                        departmentNormalized: cityValue.departmentNormalized,
                        coordinates: cityValue.coordinates,
                    });
                }
            }

            return { departments, cities };
        } catch {

            return { departments: [], cities: [] };
        }
    }

    /**
     * Obtiene una ubicación específica por su clave
     */
    static async getLocationByKey(key: string): Promise<ConfigParameter | null> {
        try {
            return await ConfigParameterService.getByKey(key);
        } catch {

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
        } catch {

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
        } catch {

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
        } catch {

            return {
                totalDepartments: 0,
                totalCities: 0,
                departmentWithMostCities: null,
            };
        }
    }
}

export default LocationHierarchyService;
