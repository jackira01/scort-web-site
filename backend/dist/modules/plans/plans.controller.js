"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plansController = exports.PlansController = void 0;
const plans_service_1 = require("./plans.service");
const express_validator_1 = require("express-validator");
class PlansController {
    async createPlan(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    message: 'Errores de validación',
                    errors: errors.array()
                });
                return;
            }
            const planData = req.body;
            const plan = await plans_service_1.plansService.createPlan(planData);
            res.status(201).json({
                success: true,
                message: 'Plan creado exitosamente',
                data: plan
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                message: error.message || 'Error al crear el plan',
                error: error.message
            });
        }
    }
    async getAllPlans(req, res) {
        try {
            const { page = 1, limit = 10, sortBy = 'level', sortOrder = 'asc', isActive, search } = req.query;
            const activeOnly = isActive !== undefined ? isActive === 'true' : false;
            const options = {
                page: parseInt(page),
                limit: parseInt(limit),
                sortBy: sortBy,
                sortOrder: sortOrder,
                activeOnly,
                search: search
            };
            const result = await plans_service_1.plansService.getAllPlans(options);
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
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error al obtener los planes',
                error: error.message
            });
        }
    }
    async getPlanById(req, res) {
        try {
            const { id } = req.params;
            const plan = await plans_service_1.plansService.getPlanById(id);
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
        }
        catch (error) {
            res.status(400).json({
                success: false,
                message: error.message || 'Error al obtener el plan',
                error: error.message
            });
        }
    }
    async getPlanByCode(req, res) {
        try {
            const { code } = req.params;
            const plan = await plans_service_1.plansService.getPlanByCode(code);
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
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error al obtener el plan',
                error: error.message
            });
        }
    }
    async getPlansByLevel(req, res) {
        try {
            const { level } = req.params;
            const { activeOnly = 'true' } = req.query;
            const plans = await plans_service_1.plansService.getPlansByLevel(parseInt(level), activeOnly === 'true');
            res.status(200).json({
                success: true,
                message: 'Planes obtenidos exitosamente',
                data: plans
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error al obtener los planes',
                error: error.message
            });
        }
    }
    async updatePlan(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    message: 'Errores de validación',
                    errors: errors.array()
                });
                return;
            }
            const { id } = req.params;
            const updateData = req.body;
            const plan = await plans_service_1.plansService.updatePlan(id, updateData);
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
        }
        catch (error) {
            res.status(400).json({
                success: false,
                message: error.message || 'Error al actualizar el plan',
                error: error.message
            });
        }
    }
    async deletePlan(req, res) {
        try {
            const { id } = req.params;
            const deleted = await plans_service_1.plansService.deletePlan(id);
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
        }
        catch (error) {
            res.status(400).json({
                success: false,
                message: error.message || 'Error al eliminar el plan',
                error: error.message
            });
        }
    }
    async createUpgrade(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    message: 'Errores de validación',
                    errors: errors.array()
                });
                return;
            }
            const upgradeData = req.body;
            const upgrade = await plans_service_1.plansService.createUpgrade(upgradeData);
            res.status(201).json({
                success: true,
                message: 'Upgrade creado exitosamente',
                data: upgrade
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                message: error.message || 'Error al crear el upgrade',
                error: error.message
            });
        }
    }
    async getAllUpgrades(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    message: 'Errores de validación',
                    errors: errors.array()
                });
                return;
            }
            const { page = 1, limit = 10, sortBy = 'code', sortOrder = 'asc', active } = req.query;
            const activeOnly = active !== undefined ? active === 'true' : false;
            const options = {
                page: parseInt(page),
                limit: parseInt(limit),
                sortBy: sortBy,
                sortOrder: sortOrder,
                activeOnly
            };
            const result = await plans_service_1.plansService.getAllUpgrades(options);
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
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error al obtener los upgrades',
                error: error.message
            });
        }
    }
    async getUpgradeById(req, res) {
        try {
            const { id } = req.params;
            const upgrade = await plans_service_1.plansService.getUpgradeById(id);
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
        }
        catch (error) {
            res.status(400).json({
                success: false,
                message: error.message || 'Error al obtener el upgrade',
                error: error.message
            });
        }
    }
    async getUpgradeByCode(req, res) {
        try {
            const { code } = req.params;
            const upgrade = await plans_service_1.plansService.getUpgradeByCode(code);
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
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error al obtener el upgrade',
                error: error.message
            });
        }
    }
    async updateUpgrade(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    message: 'Errores de validación',
                    errors: errors.array()
                });
                return;
            }
            const { id } = req.params;
            const updateData = req.body;
            const upgrade = await plans_service_1.plansService.updateUpgrade(id, updateData);
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
        }
        catch (error) {
            res.status(400).json({
                success: false,
                message: error.message || 'Error al actualizar el upgrade',
                error: error.message
            });
        }
    }
    async deleteUpgrade(req, res) {
        try {
            const { id } = req.params;
            const deleted = await plans_service_1.plansService.deleteUpgrade(id);
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
        }
        catch (error) {
            res.status(400).json({
                success: false,
                message: error.message || 'Error al eliminar el upgrade',
                error: error.message
            });
        }
    }
    async getUpgradeDependencyTree(req, res) {
        try {
            const { code } = req.params;
            const result = await plans_service_1.plansService.getUpgradeDependencyTree(code);
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
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error al obtener el árbol de dependencias',
                error: error.message
            });
        }
    }
    async purchasePlan(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    message: 'Errores de validación',
                    errors: errors.array()
                });
                return;
            }
            const { profileId, planCode, variantDays, generateInvoice } = req.body;
            const isAdmin = req.user?.role === 'admin';
            const result = await plans_service_1.plansService.purchasePlan(profileId, planCode, variantDays, isAdmin, generateInvoice);
            res.status(200).json({
                success: true,
                message: 'Plan comprado exitosamente',
                data: {
                    ...result,
                    whatsAppMessage: result.whatsAppMessage
                }
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                message: error.message || 'Error al comprar el plan',
                error: error.message
            });
        }
    }
    async renewPlan(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    message: 'Errores de validación',
                    errors: errors.array()
                });
                return;
            }
            const { profileId, extensionDays } = req.body;
            const ProfileModel = require('../profile/profile.model').ProfileModel;
            const profile = await ProfileModel.findById(profileId);
            if (!profile || !profile.planAssignment) {
                res.status(400).json({
                    success: false,
                    message: 'Plan no encontrado o inactivo',
                    error: 'Plan no encontrado o inactivo'
                });
                return;
            }
            const planCode = profile.planAssignment.planCode;
            const isAdmin = req.user?.role === 'admin';
            const result = await plans_service_1.plansService.renewPlan(profileId, planCode, extensionDays, isAdmin);
            res.status(200).json({
                success: true,
                message: 'Plan renovado exitosamente',
                data: {
                    ...result,
                    whatsAppMessage: result.whatsAppMessage
                }
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                message: error.message || 'Error al renovar el plan',
                error: error.message
            });
        }
    }
}
exports.PlansController = PlansController;
exports.plansController = new PlansController();
