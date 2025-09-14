import { Request, Response } from 'express';
import { plansService, CreatePlanInput, UpdatePlanInput, CreateUpgradeInput, UpdateUpgradeInput } from './plans.service';
import { validationResult } from 'express-validator';

export class PlansController {
    // ==================== PLANES ====================

    async createPlan(req: Request, res: Response): Promise<void> {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    message: 'Errores de validación',
                    errors: errors.array()
                });
                return;
            }

            const planData: CreatePlanInput = req.body;
            const plan = await plansService.createPlan(planData);

            res.status(201).json({
                success: true,
                message: 'Plan creado exitosamente',
                data: plan
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                message: error.message || 'Error al crear el plan',
                error: error.message
            });
        }
    }

    async getAllPlans(req: Request, res: Response): Promise<void> {
        try {
            const {
                page = 1,
                limit = 10,
                sortBy = 'level',
                sortOrder = 'asc',
                isActive,
                search
            } = req.query;

            // Si isActive está definido, usarlo; si no, mostrar todos los planes (no filtrar por defecto)
            const activeOnly = isActive !== undefined ? isActive === 'true' : false;

            const options = {
                page: parseInt(page as string),
                limit: parseInt(limit as string),
                sortBy: sortBy as string,
                sortOrder: sortOrder as 'asc' | 'desc',
                activeOnly,
                search: search as string
            };

            const result = await plansService.getAllPlans(options);

            res.status(200).json({
                success: true,
                message: 'Planes obtenidos exitosamente',
                data: result.plans,
                pagination: {
                    total: result.total,
                    page: result.page,
                    totalPages: result.totalPages,
                    limit: options.limit
                }
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: 'Error al obtener los planes',
                error: error.message
            });
        }
    }

    async getPlanById(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const plan = await plansService.getPlanById(id);

            if (!plan) {
                res.status(404).json({
                    success: false,
                    message: 'Plan no encontrado'
                });
                return;
            }

            res.status(200).json({
                success: true,
                message: 'Plan obtenido exitosamente',
                data: plan
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                message: error.message || 'Error al obtener el plan',
                error: error.message
            });
        }
    }

    async getPlanByCode(req: Request, res: Response): Promise<void> {
        try {
            const { code } = req.params;
            const plan = await plansService.getPlanByCode(code);

            if (!plan) {
                res.status(404).json({
                    success: false,
                    message: 'Plan no encontrado'
                });
                return;
            }

            res.status(200).json({
                success: true,
                message: 'Plan obtenido exitosamente',
                data: plan
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: 'Error al obtener el plan',
                error: error.message
            });
        }
    }

    async getPlansByLevel(req: Request, res: Response): Promise<void> {
        try {
            const { level } = req.params;
            const { activeOnly = 'true' } = req.query;

            const plans = await plansService.getPlansByLevel(
                parseInt(level),
                activeOnly === 'true'
            );

            res.status(200).json({
                success: true,
                message: 'Planes obtenidos exitosamente',
                data: plans
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: 'Error al obtener los planes',
                error: error.message
            });
        }
    }

    async updatePlan(req: Request, res: Response): Promise<void> {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    message: 'Errores de validación',
                    errors: errors.array()
                });
                return;
            }

            const { id } = req.params;
            const updateData: UpdatePlanInput = req.body;

            const plan = await plansService.updatePlan(id, updateData);

            if (!plan) {
                res.status(404).json({
                    success: false,
                    message: 'Plan no encontrado'
                });
                return;
            }

            res.status(200).json({
                success: true,
                message: 'Plan actualizado exitosamente',
                data: plan
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                message: error.message || 'Error al actualizar el plan',
                error: error.message
            });
        }
    }

    async deletePlan(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const deleted = await plansService.deletePlan(id);

            if (!deleted) {
                res.status(404).json({
                    success: false,
                    message: 'Plan no encontrado'
                });
                return;
            }

            res.status(200).json({
                success: true,
                message: 'Plan eliminado exitosamente'
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                message: error.message || 'Error al eliminar el plan',
                error: error.message
            });
        }
    }

    // ==================== UPGRADES ====================

    async createUpgrade(req: Request, res: Response): Promise<void> {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    message: 'Errores de validación',
                    errors: errors.array()
                });
                return;
            }

            const upgradeData: CreateUpgradeInput = req.body;
            const upgrade = await plansService.createUpgrade(upgradeData);

            res.status(201).json({
                success: true,
                message: 'Upgrade creado exitosamente',
                data: upgrade
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                message: error.message || 'Error al crear el upgrade',
                error: error.message
            });
        }
    }

    async getAllUpgrades(req: Request, res: Response): Promise<void> {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    message: 'Errores de validación',
                    errors: errors.array()
                });
                return;
            }

            const {
                page = 1,
                limit = 10,
                sortBy = 'code',
                sortOrder = 'asc',
                active
            } = req.query;

            // Si active está definido, usarlo; si no, mostrar todos los upgrades (no filtrar por defecto)
            const activeOnly = active !== undefined ? active === 'true' : false;

            const options = {
                page: parseInt(page as string),
                limit: parseInt(limit as string),
                sortBy: sortBy as string,
                sortOrder: sortOrder as 'asc' | 'desc',
                activeOnly
            };

            const result = await plansService.getAllUpgrades(options);

            res.status(200).json({
                success: true,
                message: 'Upgrades obtenidos exitosamente',
                data: result.upgrades,
                pagination: {
                    total: result.total,
                    page: result.page,
                    totalPages: result.totalPages,
                    limit: options.limit
                }
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: 'Error al obtener los upgrades',
                error: error.message
            });
        }
    }

    async getUpgradeById(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const upgrade = await plansService.getUpgradeById(id);

            if (!upgrade) {
                res.status(404).json({
                    success: false,
                    message: 'Upgrade no encontrado'
                });
                return;
            }

            res.status(200).json({
                success: true,
                message: 'Upgrade obtenido exitosamente',
                data: upgrade
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                message: error.message || 'Error al obtener el upgrade',
                error: error.message
            });
        }
    }

    async getUpgradeByCode(req: Request, res: Response): Promise<void> {
        try {
            const { code } = req.params;
            const upgrade = await plansService.getUpgradeByCode(code);

            if (!upgrade) {
                res.status(404).json({
                    success: false,
                    message: 'Upgrade no encontrado'
                });
                return;
            }

            res.status(200).json({
                success: true,
                message: 'Upgrade obtenido exitosamente',
                data: upgrade
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: 'Error al obtener el upgrade',
                error: error.message
            });
        }
    }

    async updateUpgrade(req: Request, res: Response): Promise<void> {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    message: 'Errores de validación',
                    errors: errors.array()
                });
                return;
            }

            const { id } = req.params;
            const updateData: UpdateUpgradeInput = req.body;

            const upgrade = await plansService.updateUpgrade(id, updateData);

            if (!upgrade) {
                res.status(404).json({
                    success: false,
                    message: 'Upgrade no encontrado'
                });
                return;
            }

            res.status(200).json({
                success: true,
                message: 'Upgrade actualizado exitosamente',
                data: upgrade
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                message: error.message || 'Error al actualizar el upgrade',
                error: error.message
            });
        }
    }

    async deleteUpgrade(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const deleted = await plansService.deleteUpgrade(id);

            if (!deleted) {
                res.status(404).json({
                    success: false,
                    message: 'Upgrade no encontrado'
                });
                return;
            }

            res.status(200).json({
                success: true,
                message: 'Upgrade eliminado exitosamente'
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                message: error.message || 'Error al eliminar el upgrade',
                error: error.message
            });
        }
    }

    // ==================== UTILIDADES ====================

    async validatePlanUpgrades(req: Request, res: Response): Promise<void> {
        try {
            const { code } = req.params;
            const result = await plansService.validatePlanUpgrades(code);

            res.status(200).json({
                success: true,
                message: 'Validación completada',
                data: result
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                message: error.message || 'Error al validar upgrades del plan',
                error: error.message
            });
        }
    }

    async getUpgradeDependencyTree(req: Request, res: Response): Promise<void> {
        try {
            const { code } = req.params;
            const result = await plansService.getUpgradeDependencyTree(code);

            if (!result) {
                res.status(404).json({
                    success: false,
                    message: 'Upgrade no encontrado'
                });
                return;
            }

            res.status(200).json({
                success: true,
                message: 'Árbol de dependencias obtenido exitosamente',
                data: result
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: 'Error al obtener el árbol de dependencias',
                error: error.message
            });
        }
    }

    // ==================== OPERACIONES DE PLANES ====================

    async purchasePlan(req: Request, res: Response): Promise<void> {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    message: 'Errores de validación',
                    errors: errors.array()
                });
                return;
            }

            const { profileId, planCode, variantDays } = req.body;
            const result = await plansService.purchasePlan(profileId, planCode, variantDays);

            res.status(200).json({
                success: true,
                message: 'Plan comprado exitosamente',
                data: {
                    ...result,
                    whatsAppMessage: result.whatsAppMessage
                }
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                message: error.message || 'Error al comprar el plan',
                error: error.message
            });
        }
    }

    async renewPlan(req: Request, res: Response): Promise<void> {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    message: 'Errores de validación',
                    errors: errors.array()
                });
                return;
            }

            const { profileId, planCode, variantDays } = req.body;
            const result = await plansService.renewPlan(profileId, planCode, variantDays);

            res.status(200).json({
                success: true,
                message: 'Plan renovado exitosamente',
                data: {
                    ...result,
                    whatsAppMessage: result.whatsAppMessage
                }
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                message: error.message || 'Error al renovar el plan',
                error: error.message
            });
        }
    }
}

export const plansController = new PlansController();