import { Response, NextFunction } from 'express';
import { ConfigParameterService } from './config-parameter.service';
import { AppError } from '../../utils/AppError';
import { AuthRequest } from '../../types/auth.types';
import type {
    CreateConfigParameterInput,
    UpdateConfigParameterInput,
    ConfigParameterQuery
} from './config-parameter.types';

export class ConfigParameterController {
    /**
     * Crear nuevo parámetro de configuración
     * POST /api/config-parameters
     */
    static async create(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const input: CreateConfigParameterInput = {
                ...req.body,
                modifiedBy: req.user?.id || req.body.modifiedBy
            };

            if (!input.modifiedBy) {
                throw new AppError('User ID is required', 400);
            }

            const configParam = await ConfigParameterService.create(input);
            
            res.status(201).json({
                success: true,
                message: 'Configuration parameter created successfully',
                data: configParam
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Obtener parámetros con filtros y paginación
     * GET /api/config-parameters
     */
    static async getAll(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const query: ConfigParameterQuery = {
                category: req.query.category as string,
                type: req.query.type as any,
                tags: req.query.tags ? (req.query.tags as string).split(',') : undefined,
                isActive: req.query.isActive ? req.query.isActive === 'true' : undefined,
                search: req.query.search as string,
                page: req.query.page ? parseInt(req.query.page as string) : undefined,
                limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
                sortBy: req.query.sortBy as string,
                sortOrder: req.query.sortOrder as 'asc' | 'desc'
            };

            const result = await ConfigParameterService.findAll(query);
            
            res.json({
                success: true,
                message: 'Configuration parameters retrieved successfully',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Obtener parámetro por ID
     * GET /api/config-parameters/:id
     */
    static async getById(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const configParam = await ConfigParameterService.findById(id);
            
            if (!configParam) {
                throw new AppError('Configuration parameter not found', 404);
            }
            
            res.json({
                success: true,
                message: 'Configuration parameter retrieved successfully',
                data: configParam
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Obtener parámetro por key
     * GET /api/config-parameters/key/:key
     */
    static async getByKey(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { key } = req.params;
            const activeOnly = req.query.activeOnly !== 'false';
            
            const configParam = await ConfigParameterService.findByKey(key, activeOnly);
            
            if (!configParam) {
                throw new AppError('Configuration parameter not found', 404);
            }
            
            res.json({
                success: true,
                message: 'Configuration parameter retrieved successfully',
                data: configParam
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Obtener parámetros por categoría
     * GET /api/config-parameters/category/:category
     */
    static async getByCategory(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { category } = req.params;
            const activeOnly = req.query.activeOnly !== 'false';
            
            const configParams = await ConfigParameterService.findByCategory(category, activeOnly);
            
            res.json({
                success: true,
                message: 'Configuration parameters retrieved successfully',
                data: configParams
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Obtener parámetros por tipo
     * GET /api/config-parameters/type/:type
     */
    static async getByType(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { type } = req.params;
            const activeOnly = req.query.activeOnly !== 'false';
            
            const configParams = await ConfigParameterService.findByType(type as any, activeOnly);
            
            res.json({
                success: true,
                message: 'Configuration parameters retrieved successfully',
                data: configParams
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Actualizar parámetro de configuración
     * PUT /api/config-parameters/:id
     */
    static async update(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const input: UpdateConfigParameterInput = {
                ...req.body,
                modifiedBy: req.user?.id || req.body.modifiedBy
            };

            if (!input.modifiedBy) {
                throw new AppError('User ID is required', 400);
            }

            const configParam = await ConfigParameterService.update(id, input);
            
            if (!configParam) {
                throw new AppError('Configuration parameter not found', 404);
            }
            
            res.json({
                success: true,
                message: 'Configuration parameter updated successfully',
                data: configParam
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Eliminar parámetro de configuración (soft delete)
     * DELETE /api/config-parameters/:id
     */
    static async delete(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const userId = req.user?.id || req.body.userId;

            if (!userId) {
                throw new AppError('User ID is required', 400);
            }

            const success = await ConfigParameterService.delete(id, userId);
            
            if (!success) {
                throw new AppError('Configuration parameter not found', 404);
            }
            
            res.json({
                success: true,
                message: 'Configuration parameter deleted successfully'
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Activar/Desactivar parámetro
     * PATCH /api/config-parameters/:id/toggle
     */
    static async toggleActive(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const userId = req.user?.id || req.body.userId;

            if (!userId) {
                throw new AppError('User ID is required', 400);
            }

            const configParam = await ConfigParameterService.toggleActive(id, userId);
            
            if (!configParam) {
                throw new AppError('Configuration parameter not found', 404);
            }
            
            res.json({
                success: true,
                message: `Configuration parameter ${configParam.isActive ? 'activated' : 'deactivated'} successfully`,
                data: configParam
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Obtener todas las categorías
     * GET /api/config-parameters/meta/categories
     */
    static async getCategories(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const categories = await ConfigParameterService.getCategories();
            
            res.json({
                success: true,
                message: 'Categories retrieved successfully',
                data: categories
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Obtener todos los tags
     * GET /api/config-parameters/meta/tags
     */
    static async getTags(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const tags = await ConfigParameterService.getTags();
            
            res.json({
                success: true,
                message: 'Tags retrieved successfully',
                data: tags
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Obtener valor por key (endpoint público para frontend)
     * GET /api/config-parameters/value/:key
     */
    static async getValue(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { key } = req.params;
            const value = await ConfigParameterService.getValue(key);
            
            if (value === null) {
                throw new AppError('Configuration parameter not found or inactive', 404);
            }
            
            res.json({
                success: true,
                message: 'Configuration value retrieved successfully',
                data: { key, value }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Obtener múltiples valores por keys
     * POST /api/config-parameters/values
     * Body: { keys: string[] }
     */
    static async getValues(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { keys } = req.body;
            
            if (!Array.isArray(keys)) {
                throw new AppError('Keys must be an array', 400);
            }
            
            const values = await ConfigParameterService.getValues(keys);
            
            res.json({
                success: true,
                message: 'Configuration values retrieved successfully',
                data: values
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Validar estructura de configuración
     * POST /api/config-parameters/validate
     */
    static async validate(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { type, value, metadata } = req.body;
            
            // Aquí puedes implementar validaciones específicas por tipo
            let isValid = true;
            const errors: string[] = [];
            
            // Validaciones básicas por tipo
            switch (type) {
                case 'location':
                    if (!value || typeof value !== 'object') {
                        isValid = false;
                        errors.push('Location value must be an object');
                    }
                    break;
                case 'text':
                    if (typeof value !== 'string' && typeof value !== 'object') {
                        isValid = false;
                        errors.push('Text value must be a string or object');
                    }
                    break;
                case 'membership':
                    if (!value || !value.plans || !Array.isArray(value.plans)) {
                        isValid = false;
                        errors.push('Membership value must contain a plans array');
                    }
                    break;
                case 'number':
                    if (typeof value !== 'number') {
                        isValid = false;
                        errors.push('Number value must be a number');
                    }
                    break;
                case 'boolean':
                    if (typeof value !== 'boolean') {
                        isValid = false;
                        errors.push('Boolean value must be a boolean');
                    }
                    break;
                case 'array':
                    if (!Array.isArray(value)) {
                        isValid = false;
                        errors.push('Array value must be an array');
                    }
                    break;
            }
            
            res.json({
                success: true,
                message: 'Validation completed',
                data: {
                    isValid,
                    errors
                }
            });
        } catch (error) {
            next(error);
        }
    }
}