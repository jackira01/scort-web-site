"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigParameterController = void 0;
const config_parameter_service_1 = require("./config-parameter.service");
const AppError_1 = require("../../utils/AppError");
class ConfigParameterController {
    static async create(req, res, next) {
        try {
            const input = {
                ...req.body,
                modifiedBy: req.user?.id || req.body.modifiedBy
            };
            if (!input.modifiedBy) {
                throw new AppError_1.AppError('User ID is required', 400);
            }
            const configParam = await config_parameter_service_1.ConfigParameterService.create(input);
            res.status(201).json({
                success: true,
                message: 'Configuration parameter created successfully',
                data: configParam
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async getAll(req, res, next) {
        try {
            const query = {
                category: req.query.category,
                type: req.query.type,
                tags: req.query.tags ? req.query.tags.split(',') : undefined,
                isActive: req.query.isActive ? req.query.isActive === 'true' : undefined,
                search: req.query.search,
                page: req.query.page ? parseInt(req.query.page) : undefined,
                limit: req.query.limit ? parseInt(req.query.limit) : undefined,
                sortBy: req.query.sortBy,
                sortOrder: req.query.sortOrder
            };
            const result = await config_parameter_service_1.ConfigParameterService.findAll(query);
            res.json({
                success: true,
                message: 'Configuration parameters retrieved successfully',
                data: result
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async getById(req, res, next) {
        try {
            const { id } = req.params;
            const configParam = await config_parameter_service_1.ConfigParameterService.findById(id);
            if (!configParam) {
                throw new AppError_1.AppError('Configuration parameter not found', 404);
            }
            res.json({
                success: true,
                message: 'Configuration parameter retrieved successfully',
                data: configParam
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async getByKey(req, res, next) {
        try {
            const { key } = req.params;
            const activeOnly = req.query.activeOnly !== 'false';
            const configParam = await config_parameter_service_1.ConfigParameterService.findByKey(key, activeOnly);
            if (!configParam) {
                throw new AppError_1.AppError('Configuration parameter not found', 404);
            }
            res.json({
                success: true,
                message: 'Configuration parameter retrieved successfully',
                data: configParam
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async getByCategory(req, res, next) {
        try {
            const { category } = req.params;
            const activeOnly = req.query.activeOnly !== 'false';
            const configParams = await config_parameter_service_1.ConfigParameterService.findByCategory(category, activeOnly);
            res.json({
                success: true,
                message: 'Configuration parameters retrieved successfully',
                data: configParams
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async getByType(req, res, next) {
        try {
            const { type } = req.params;
            const activeOnly = req.query.activeOnly !== 'false';
            const configParams = await config_parameter_service_1.ConfigParameterService.findByType(type, activeOnly);
            res.json({
                success: true,
                message: 'Configuration parameters retrieved successfully',
                data: configParams
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async update(req, res, next) {
        try {
            const { id } = req.params;
            const input = {
                ...req.body,
                modifiedBy: req.user?.id || req.body.modifiedBy
            };
            if (!input.modifiedBy) {
                throw new AppError_1.AppError('User ID is required', 400);
            }
            const configParam = await config_parameter_service_1.ConfigParameterService.update(id, input);
            if (!configParam) {
                throw new AppError_1.AppError('Configuration parameter not found', 404);
            }
            res.json({
                success: true,
                message: 'Configuration parameter updated successfully',
                data: configParam
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async delete(req, res, next) {
        try {
            const { id } = req.params;
            const userId = req.user?.id || req.body.userId;
            if (!userId) {
                throw new AppError_1.AppError('User ID is required', 400);
            }
            const success = await config_parameter_service_1.ConfigParameterService.delete(id, userId);
            if (!success) {
                throw new AppError_1.AppError('Configuration parameter not found', 404);
            }
            res.json({
                success: true,
                message: 'Configuration parameter deleted successfully'
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async toggleActive(req, res, next) {
        try {
            const { id } = req.params;
            const userId = req.user?.id || req.body.userId;
            if (!userId) {
                throw new AppError_1.AppError('User ID is required', 400);
            }
            const configParam = await config_parameter_service_1.ConfigParameterService.toggleActive(id, userId);
            if (!configParam) {
                throw new AppError_1.AppError('Configuration parameter not found', 404);
            }
            res.json({
                success: true,
                message: `Configuration parameter ${configParam.isActive ? 'activated' : 'deactivated'} successfully`,
                data: configParam
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async getCategories(req, res, next) {
        try {
            const categories = await config_parameter_service_1.ConfigParameterService.getCategories();
            res.json({
                success: true,
                message: 'Categories retrieved successfully',
                data: categories
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async getTags(req, res, next) {
        try {
            const tags = await config_parameter_service_1.ConfigParameterService.getTags();
            res.json({
                success: true,
                message: 'Tags retrieved successfully',
                data: tags
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async getValue(req, res, next) {
        try {
            const { key } = req.params;
            const value = await config_parameter_service_1.ConfigParameterService.getValue(key);
            if (value === null) {
                throw new AppError_1.AppError('Configuration parameter not found or inactive', 404);
            }
            res.json({
                success: true,
                message: 'Configuration value retrieved successfully',
                data: { key, value }
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async getValues(req, res, next) {
        try {
            const { keys } = req.body;
            if (!Array.isArray(keys)) {
                throw new AppError_1.AppError('Keys must be an array', 400);
            }
            const values = await config_parameter_service_1.ConfigParameterService.getValues(keys);
            res.json({
                success: true,
                message: 'Configuration values retrieved successfully',
                data: values
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async validate(req, res, next) {
        try {
            const { type, value, metadata } = req.body;
            let isValid = true;
            const errors = [];
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
        }
        catch (error) {
            next(error);
        }
    }
}
exports.ConfigParameterController = ConfigParameterController;
