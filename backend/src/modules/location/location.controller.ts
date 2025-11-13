import { Request, Response } from 'express';
import { locationService } from './location.service';
import { logger } from '../../utils/logger';

export class LocationController {
    /**
     * GET /api/locations
     * Obtener todas las ubicaciones activas
     */
    async getAll(req: Request, res: Response) {
        try {
            const locations = await locationService.getAll();
            res.json({ success: true, data: locations });
        } catch (error: any) {
            logger.error('Error getting all locations:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * GET /api/locations/:id (cuando id es un ObjectId válido)
     * Obtener una ubicación por ID
     */
    async getById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const location = await locationService.getById(id);

            if (!location) {
                return res.status(404).json({
                    success: false,
                    error: 'Location not found'
                });
            }

            res.json({ success: true, data: location });
        } catch (error: any) {
            logger.error('Error getting location by id:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * GET /api/locations/type/:type
     * Obtener ubicaciones por tipo
     */
    async getByType(req: Request, res: Response) {
        try {
            const { type } = req.params;
            const locations = await locationService.getByType(type);
            res.json({ success: true, data: locations });
        } catch (error: any) {
            logger.error('Error getting locations by type:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * GET /api/locations/country
     * Obtener el país (Colombia)
     */
    async getCountry(req: Request, res: Response) {
        try {
            const country = await locationService.getCountry();

            if (!country) {
                return res.status(404).json({
                    success: false,
                    error: 'Country not found'
                });
            }

            res.json({
                success: true,
                data: {
                    value: country.value,
                    label: country.label
                }
            });
        } catch (error: any) {
            logger.error('Error getting country:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * GET /api/locations/departments
     * Obtener todos los departamentos
     */
    async getDepartments(req: Request, res: Response) {
        try {
            const departments = await locationService.getDepartments();
            res.json({ success: true, data: departments });
        } catch (error: any) {
            logger.error('Error getting departments:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * GET /api/locations/:parentValue/children
     * Obtener hijos de una ubicación
     */
    async getChildren(req: Request, res: Response) {
        try {
            const { parentValue } = req.params;
            const children = await locationService.getChildren(parentValue);
            res.json({ success: true, data: children });
        } catch (error: any) {
            logger.error('Error getting children:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * GET /api/locations/hierarchy
     * Obtener jerarquía completa (admin)
     */
    async getHierarchy(req: Request, res: Response) {
        try {
            const hierarchy = await locationService.getFullHierarchy();

            if (!hierarchy) {
                return res.status(404).json({
                    success: false,
                    error: 'No locations found'
                });
            }

            res.json({ success: true, data: hierarchy });
        } catch (error: any) {
            logger.error('Error getting hierarchy:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * GET /api/locations/search?q=query
     * Buscar ubicaciones por texto
     */
    async search(req: Request, res: Response) {
        try {
            const { q, limit } = req.query;

            if (!q || typeof q !== 'string') {
                return res.status(400).json({
                    success: false,
                    error: 'Query parameter "q" is required'
                });
            }

            const results = await locationService.search(
                q,
                limit ? parseInt(limit as string) : 10
            );

            res.json({ success: true, data: results });
        } catch (error: any) {
            logger.error('Error searching locations:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * GET /api/locations/validate/department/:value
     * Validar si un departamento existe
     */
    async validateDepartment(req: Request, res: Response) {
        try {
            const { value } = req.params;
            const isValid = await locationService.isValidDepartment(value);

            res.json({
                success: true,
                data: {
                    value,
                    isValid
                }
            });
        } catch (error: any) {
            logger.error('Error validating department:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * GET /api/locations/validate/city/:departmentValue/:cityValue
     * Validar si una ciudad existe en un departamento
     */
    async validateCity(req: Request, res: Response) {
        try {
            const { departmentValue, cityValue } = req.params;
            const isValid = await locationService.isValidCity(departmentValue, cityValue);

            res.json({
                success: true,
                data: {
                    department: departmentValue,
                    city: cityValue,
                    isValid
                }
            });
        } catch (error: any) {
            logger.error('Error validating city:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * POST /api/locations/bulk-import
     * ⭐ IMPORTACIÓN MASIVA - Para usar desde Postman
     * 
     * Body esperado: Ver location-import-example.json
     */
    async bulkImport(req: Request, res: Response) {
        try {
            logger.info('🚀 Iniciando importación masiva de ubicaciones...');

            const result = await locationService.bulkImport(req.body);

            res.status(201).json({
                success: true,
                message: result.message,
                stats: result.stats
            });
        } catch (error: any) {
            logger.error('❌ Error en importación masiva:', error);
            res.status(500).json({
                success: false,
                error: error.message,
                details: error.stack
            });
        }
    }

    /**
     * POST /api/locations (admin)
     * Crear una ubicación individual
     */
    async create(req: Request, res: Response) {
        try {
            const location = await locationService.createLocation(req.body);
            res.status(201).json({ success: true, data: location });
        } catch (error: any) {
            logger.error('Error creating location:', error);
            res.status(400).json({ success: false, error: error.message });
        }
    }

    /**
     * PUT /api/locations/:id (admin)
     * Actualizar una ubicación
     */
    async update(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const location = await locationService.updateLocation(id, req.body);

            if (!location) {
                return res.status(404).json({
                    success: false,
                    error: 'Location not found'
                });
            }

            res.json({ success: true, data: location });
        } catch (error: any) {
            logger.error('Error updating location:', error);
            res.status(400).json({ success: false, error: error.message });
        }
    }

    /**
     * DELETE /api/locations/:id (admin)
     * Eliminar una ubicación (soft delete)
     */
    async delete(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const deleted = await locationService.deleteLocation(id);

            if (!deleted) {
                return res.status(404).json({
                    success: false,
                    error: 'Location not found'
                });
            }

            res.json({
                success: true,
                message: 'Location deleted successfully'
            });
        } catch (error: any) {
            logger.error('Error deleting location:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }
}

export const locationController = new LocationController();
