import { Types } from 'mongoose';
import { LocationModel } from './location.model';
import type {
    ILocation,
    LocationValue,
    LocationDetail,
    CreateLocationDTO,
    BulkLocationImport
} from './location.types';
import { logger } from '../../utils/logger';

export class LocationService {
    /**
     * Convierte Location de DB a formato frontend simplificado
     */
    private toLocationValue(location: ILocation): LocationValue {
        return {
            value: location.value,
            label: location.label
        };
    }

    /**
     * Convierte Location de DB a formato detallado (para admin)
     */
    private toLocationDetail(location: ILocation): LocationDetail {
        return {
            value: location.value,
            label: location.label,
            type: location.type,
            hasChildren: location.hasChildren,
            level: location.level
        };
    }

    /**
     * Obtener país (Colombia)
     */
    async getCountry(): Promise<ILocation | null> {
        return LocationModel.findOne({
            type: 'country',
            level: 0,
            isActive: true
        });
    }

    /**
     * Obtener todas las ubicaciones activas
     */
    async getAll(): Promise<ILocation[]> {
        return LocationModel.find({ isActive: true })
            .sort({ level: 1, order: 1, label: 1 })
            .lean() as any;
    }

    /**
     * Obtener una ubicación por ID
     */
    async getById(id: string): Promise<ILocation | null> {
        return LocationModel.findOne({
            _id: id,
            isActive: true
        }).lean() as any;
    }

    /**
     * Obtener ubicaciones por tipo
     */
    async getByType(type: string): Promise<ILocation[]> {
        return LocationModel.find({
            type,
            isActive: true
        })
            .sort({ order: 1, label: 1 })
            .lean() as any;
    }

    /**
     * Obtener todos los departamentos
     */
    async getDepartments(): Promise<LocationValue[]> {
        const departments = await LocationModel.find({
            type: 'department',
            isActive: true
        }).sort({ label: 1 });

        return departments.map(dept => this.toLocationValue(dept));
    }

    /**
     * Obtener hijos de una ubicación por value
     */
    async getChildren(parentValue: string): Promise<LocationValue[]> {
        const parent = await LocationModel.findOne({
            value: parentValue,
            isActive: true
        });

        if (!parent) return [];

        const children = await LocationModel.find({
            parentId: parent._id,
            isActive: true
        }).sort({ order: 1, label: 1 });

        return children.map(child => this.toLocationValue(child));
    }

    /**
     * Obtener ciudades por departamento (alias de getChildren)
     */
    async getCitiesByDepartment(departmentValue: string): Promise<LocationValue[]> {
        return this.getChildren(departmentValue);
    }

    /**
     * Obtener ubicación por value
     */
    async getByValue(value: string): Promise<ILocation | null> {
        return LocationModel.findOne({ value, isActive: true });
    }

    /**
     * Obtener ubicación por value y padre
     */
    async getByValueAndParent(value: string, parentValue?: string): Promise<ILocation | null> {
        if (!parentValue) {
            return LocationModel.findOne({ value, isActive: true });
        }

        const parent = await LocationModel.findOne({
            value: parentValue,
            isActive: true
        });

        if (!parent) return null;

        return LocationModel.findOne({
            value,
            parentId: parent._id,
            isActive: true
        });
    }

    /**
     * Validar si un departamento existe
     */
    async isValidDepartment(value: string): Promise<boolean> {
        const count = await LocationModel.countDocuments({
            type: 'department',
            value,
            isActive: true
        });
        return count > 0;
    }

    /**
     * Validar si una ciudad existe en un departamento
     */
    async isValidCity(departmentValue: string, cityValue: string): Promise<boolean> {
        const city = await this.getByValueAndParent(cityValue, departmentValue);
        return !!city;
    }

    /**
     * Crear una ubicación individual
     */
    async createLocation(data: CreateLocationDTO): Promise<ILocation> {
        let parentId: Types.ObjectId | undefined;

        if (data.parentValue) {
            const parent = await LocationModel.findOne({
                value: data.parentValue,
                isActive: true
            });
            if (!parent) {
                throw new Error(`Parent location '${data.parentValue}' not found`);
            }
            parentId = new Types.ObjectId(parent._id);
        }

        const location = new LocationModel({
            value: data.value,
            label: data.label,
            type: data.type,
            parentId,
            order: data.order || 0,
            isActive: true
        });

        await location.save();
        logger.info(`Location created: ${location.path}`);
        return location;
    }

    /**
     * IMPORTACIÓN MASIVA - Para usar desde Postman
     * Recibe toda la estructura jerárquica y la crea en un solo batch
     */
    async bulkImport(data: BulkLocationImport): Promise<{
        success: boolean;
        message: string;
        stats: {
            country: number;
            departments: number;
            cities: number;
            localities: number;
            total: number;
        };
    }> {
        const stats = {
            country: 0,
            departments: 0,
            cities: 0,
            localities: 0,
            total: 0
        };

        try {
            // 1. Limpiar colección existente
            await LocationModel.deleteMany({});
            logger.info('🗑️  Colección de ubicaciones limpiada');

            // 2. Crear país
            const country = await this.createLocation({
                value: data.country.value,
                label: data.country.label,
                type: 'country'
            });
            stats.country = 1;
            stats.total++;
            logger.info(`✅ País creado: ${country.label}`);

            // 3. Crear departamentos y sus hijos
            for (let deptIndex = 0; deptIndex < data.departments.length; deptIndex++) {
                const deptData = data.departments[deptIndex];

                const department = await this.createLocation({
                    value: deptData.value,
                    label: deptData.label,
                    type: 'department',
                    parentValue: country.value,
                    order: deptIndex
                });
                stats.departments++;
                stats.total++;
                logger.info(`  📍 Departamento: ${department.label}`);

                // 4. Crear ciudades del departamento
                if (deptData.cities) {
                    for (let cityIndex = 0; cityIndex < deptData.cities.length; cityIndex++) {
                        const cityData = deptData.cities[cityIndex];

                        const city = await this.createLocation({
                            value: cityData.value,
                            label: cityData.label,
                            type: 'city',
                            parentValue: department.value,
                            order: cityIndex
                        });
                        stats.cities++;
                        stats.total++;

                        // 5. Crear localidades de la ciudad (si existen)
                        if (cityData.localities) {
                            for (let localityIndex = 0; localityIndex < cityData.localities.length; localityIndex++) {
                                const localityData = cityData.localities[localityIndex];

                                await this.createLocation({
                                    value: localityData.value,
                                    label: localityData.label,
                                    type: 'locality',
                                    parentValue: city.value,
                                    order: localityIndex
                                });
                                stats.localities++;
                                stats.total++;
                            }
                        }
                    }
                }
            }

            logger.info('✅ Importación masiva completada:', stats);

            return {
                success: true,
                message: 'Importación completada exitosamente',
                stats
            };

        } catch (error) {
            logger.error('❌ Error en importación masiva:', error);
            throw error;
        }
    }

    /**
     * Actualizar ubicación
     */
    async updateLocation(id: string, data: Partial<CreateLocationDTO>): Promise<ILocation | null> {
        return LocationModel.findByIdAndUpdate(id, data, { new: true });
    }

    /**
     * Eliminar ubicación (soft delete)
     */
    async deleteLocation(id: string): Promise<boolean> {
        const result = await LocationModel.updateOne(
            { _id: id },
            { isActive: false }
        );
        return result.modifiedCount > 0;
    }

    /**
     * Obtener jerarquía completa (para admin)
     */
    async getFullHierarchy(): Promise<any> {
        const country = await this.getCountry();
        if (!country) return null;

        const buildTree = async (location: ILocation): Promise<any> => {
            const children = await LocationModel.find({
                parentId: location._id,
                isActive: true
            }).sort({ order: 1, label: 1 });

            return {
                ...this.toLocationDetail(location),
                children: await Promise.all(
                    children.map(child => buildTree(child))
                )
            };
        };

        return buildTree(country);
    }

    /**
     * Buscar ubicaciones por texto (autocomplete)
     */
    async search(query: string, limit = 10): Promise<LocationDetail[]> {
        const results = await LocationModel.find({
            $or: [
                { label: { $regex: query, $options: 'i' } },
                { value: { $regex: query, $options: 'i' } }
            ],
            isActive: true
        })
            .limit(limit)
            .sort({ level: 1, label: 1 });

        return results.map(loc => this.toLocationDetail(loc));
    }
}

export const locationService = new LocationService();
