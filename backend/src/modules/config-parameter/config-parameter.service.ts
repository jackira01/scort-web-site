import { Types } from 'mongoose';
import { AppError } from '../../utils/AppError';
import { logger } from '../../utils/logger';
import { ConfigParameterModel } from './config-parameter.model';
import type {
    ConfigParameterQuery,
    ConfigParameterResponse,
    ConfigParameterType,
    CreateConfigParameterInput,
    IConfigParameter,
    IConfigParameterLean,
    UpdateConfigParameterInput,
} from './config-parameter.types';

export class ConfigParameterService {
    /**
     * Crear un nuevo parámetro de configuración
     */
    static async create(
        input: CreateConfigParameterInput,
    ): Promise<IConfigParameter> {
        try {
            // Verificar que la key no exista
            const existing = await ConfigParameterModel.findOne({ key: input.key });
            if (existing) {
                throw new AppError(
                    `Configuration parameter with key '${input.key}' already exists`,
                    400,
                );
            }

            // Validar ObjectId del usuario
            if (!Types.ObjectId.isValid(input.modifiedBy)) {
                throw new AppError('Invalid modifiedBy user ID', 400);
            }

            const configParam = new ConfigParameterModel({
                ...input,
                modifiedBy: new Types.ObjectId(input.modifiedBy),
            });

            // Validar dependencias si existen
            if (input.dependencies && input.dependencies.length > 0) {
                const isValid = await configParam.validateDependencies();
                if (!isValid) {
                    throw new AppError(
                        'One or more dependencies are not available or inactive',
                        400,
                    );
                }
            }

            await configParam.save();
            logger.info(`Configuration parameter created: ${input.key}`, {
                userId: input.modifiedBy,
            });

            return configParam;
        } catch (error) {
            logger.error('Error creating configuration parameter:', error);
            throw error;
        }
    }

    /**
     * Obtener parámetros con paginación y filtros
     */
    static async findAll(
        query: ConfigParameterQuery = {},
    ): Promise<ConfigParameterResponse> {
        try {
            const {
                category,
                type,
                tags,
                isActive = true,
                search,
                page = 1,
                limit = 20,
                sortBy = 'name',
                sortOrder = 'asc',
            } = query;

            // Construir filtros
            const filters: any = {};

            if (category) filters.category = category;
            if (type) filters.type = type;
            if (typeof isActive === 'boolean') filters.isActive = isActive;
            if (tags && tags.length > 0) filters.tags = { $in: tags };

            if (search) {
                filters.$or = [
                    { name: { $regex: search, $options: 'i' } },
                    { key: { $regex: search, $options: 'i' } },
                    { category: { $regex: search, $options: 'i' } },
                ];
            }

            // Configurar ordenamiento
            const sort: any = {};
            sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

            // Ejecutar consulta con paginación
            const skip = (page - 1) * limit;
            const [docs, totalCount] = await Promise.all([
                ConfigParameterModel.find(filters)
                    .populate('modifiedBy', 'name email')
                    .sort(sort)
                    .skip(skip)
                    .limit(limit)
                    .lean(),
                ConfigParameterModel.countDocuments(filters),
            ]);

            const totalPages = Math.ceil(totalCount / limit);

            return {
                docs,
                totalCount,
                currentPage: page,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
                limit,
            };
        } catch (error) {
            logger.error('Error fetching configuration parameters:', error);
            throw error;
        }
    }

    /**
     * Obtener parámetro por key
     */
    static async findByKey(
        key: string,
        activeOnly: boolean = true,
    ): Promise<IConfigParameterLean | null> {
        try {
            const filters: any = { key };
            if (activeOnly) filters.isActive = true;

            return await ConfigParameterModel.findOne(filters)
                .populate('modifiedBy', 'name email')
                .lean();
        } catch (error) {
            logger.error(
                `Error fetching configuration parameter by key: ${key}`,
                error,
            );
            throw error;
        }
    }

    /**
     * Obtener parámetros por categoría
     */
    static async findByCategory(
        category: string,
        activeOnly: boolean = true,
    ): Promise<IConfigParameterLean[]> {
        try {
            return await ConfigParameterModel.findByCategoryLean(
                category,
                activeOnly,
            ).populate('modifiedBy', 'name email');
        } catch (error) {
            logger.error(
                `Error fetching configuration parameters by category: ${category}`,
                error,
            );
            throw error;
        }
    }

    /**
     * Obtener parámetros por tipo
     */
    static async findByType(
        type: ConfigParameterType,
        activeOnly: boolean = true,
    ): Promise<IConfigParameterLean[]> {
        try {
            return await ConfigParameterModel.findByTypeLean(
                type,
                activeOnly,
            ).populate('modifiedBy', 'name email');
        } catch (error) {
            logger.error(
                `Error fetching configuration parameters by type: ${type}`,
                error,
            );
            throw error;
        }
    }

    /**
     * Obtener parámetro por ID
     */
    static async findById(id: string): Promise<IConfigParameterLean | null> {
        try {
            if (!Types.ObjectId.isValid(id)) {
                throw new AppError('Invalid configuration parameter ID', 400);
            }

            return await ConfigParameterModel.findById(id)
                .populate('modifiedBy', 'name email')
                .lean();
        } catch (error) {
            logger.error(
                `Error fetching configuration parameter by ID: ${id}`,
                error,
            );
            throw error;
        }
    }

    /**
     * Actualizar parámetro de configuración
     */
    static async update(
        id: string,
        input: UpdateConfigParameterInput,
    ): Promise<IConfigParameterLean | null> {
        try {
            if (!Types.ObjectId.isValid(id)) {
                throw new AppError('Invalid configuration parameter ID', 400);
            }

            if (!Types.ObjectId.isValid(input.modifiedBy)) {
                throw new AppError('Invalid modifiedBy user ID', 400);
            }

            const configParam = await ConfigParameterModel.findById(id);
            if (!configParam) {
                throw new AppError('Configuration parameter not found', 404);
            }

            // Actualizar campos
            Object.assign(configParam, {
                ...input,
                modifiedBy: new Types.ObjectId(input.modifiedBy),
                lastModified: new Date(),
            });

            // Validar dependencias si se actualizaron
            if (input.dependencies) {
                const isValid = await configParam.validateDependencies();
                if (!isValid) {
                    throw new AppError(
                        'One or more dependencies are not available or inactive',
                        400,
                    );
                }
            }

            await configParam.save();
            logger.info(`Configuration parameter updated: ${configParam.key}`, {
                userId: input.modifiedBy,
            });

            return await ConfigParameterModel.findById(id)
                .populate('modifiedBy', 'name email')
                .lean();
        } catch (error) {
            logger.error(`Error updating configuration parameter: ${id}`, error);
            throw error;
        }
    }

    /**
     * Eliminar parámetro de configuración (soft delete)
     */
    static async delete(id: string, userId: string): Promise<boolean> {
        try {
            if (!Types.ObjectId.isValid(id)) {
                throw new AppError('Invalid configuration parameter ID', 400);
            }

            if (!Types.ObjectId.isValid(userId)) {
                throw new AppError('Invalid user ID', 400);
            }

            const result = await ConfigParameterModel.findByIdAndUpdate(
                id,
                {
                    isActive: false,
                    modifiedBy: new Types.ObjectId(userId),
                    lastModified: new Date(),
                },
                { new: true },
            );

            if (!result) {
                throw new AppError('Configuration parameter not found', 404);
            }

            logger.info(`Configuration parameter deleted: ${result.key}`, { userId });
            return true;
        } catch (error) {
            logger.error(`Error deleting configuration parameter: ${id}`, error);
            throw error;
        }
    }

    /**
     * Activar/Desactivar parámetro
     */
    static async toggleActive(
        id: string,
        userId: string,
    ): Promise<IConfigParameterLean | null> {
        try {
            if (!Types.ObjectId.isValid(id)) {
                throw new AppError('Invalid configuration parameter ID', 400);
            }

            const configParam = await ConfigParameterModel.findById(id);
            if (!configParam) {
                throw new AppError('Configuration parameter not found', 404);
            }

            configParam.isActive = !configParam.isActive;
            configParam.modifiedBy = new Types.ObjectId(userId);
            configParam.lastModified = new Date();

            await configParam.save();
            logger.info(
                `Configuration parameter ${configParam.isActive ? 'activated' : 'deactivated'}: ${configParam.key}`,
                { userId },
            );

            return await ConfigParameterModel.findById(id)
                .populate('modifiedBy', 'name email')
                .lean();
        } catch (error) {
            logger.error(`Error toggling configuration parameter: ${id}`, error);
            throw error;
        }
    }

    /**
     * Obtener todas las categorías disponibles
     */
    static async getCategories(): Promise<string[]> {
        try {
            return await ConfigParameterModel.distinct('category', {
                isActive: true,
            });
        } catch (error) {
            logger.error('Error fetching configuration categories:', error);
            throw error;
        }
    }

    /**
     * Obtener todos los tags disponibles
     */
    static async getTags(): Promise<string[]> {
        try {
            const tags = await ConfigParameterModel.distinct('tags', {
                isActive: true,
            });
            return tags.filter((tag) => tag); // Filtrar valores null/undefined
        } catch (error) {
            logger.error('Error fetching configuration tags:', error);
            throw error;
        }
    }

    /**
     * Obtener valor de configuración por key (método de conveniencia)
     */
    static async getValue(key: string): Promise<any> {
        try {
            const param = await ConfigParameterService.findByKey(key, true);
            return param?.value || null;
        } catch (error) {
            logger.error(`Error getting configuration value for key: ${key}`, error);
            return null;
        }
    }

    /**
     * Obtener múltiples valores por keys
     */
    static async getValues(keys: string[]): Promise<Record<string, any>> {
        try {
            const params = await ConfigParameterModel.find({
                key: { $in: keys },
                isActive: true,
            })
                .select('key value')
                .lean();

            const result: Record<string, any> = {};
            params.forEach((param) => {
                result[param.key] = param.value;
            });

            return result;
        } catch (error) {
            logger.error('Error getting multiple configuration values:', error);
            return {};
        }
    }
}
