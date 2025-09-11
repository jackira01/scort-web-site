"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigParameterService = void 0;
const mongoose_1 = require("mongoose");
const AppError_1 = require("../../utils/AppError");
const logger_1 = require("../../utils/logger");
const config_parameter_model_1 = require("./config-parameter.model");
class ConfigParameterService {
    static async create(input) {
        try {
            const existing = await config_parameter_model_1.ConfigParameterModel.findOne({ key: input.key });
            if (existing) {
                throw new AppError_1.AppError(`Configuration parameter with key '${input.key}' already exists`, 400);
            }
            if (!mongoose_1.Types.ObjectId.isValid(input.modifiedBy)) {
                throw new AppError_1.AppError('Invalid modifiedBy user ID', 400);
            }
            const configParam = new config_parameter_model_1.ConfigParameterModel({
                ...input,
                modifiedBy: new mongoose_1.Types.ObjectId(input.modifiedBy),
            });
            if (input.dependencies && input.dependencies.length > 0) {
                const isValid = await configParam.validateDependencies();
                if (!isValid) {
                    throw new AppError_1.AppError('One or more dependencies are not available or inactive', 400);
                }
            }
            await configParam.save();
            logger_1.logger.info(`Configuration parameter created: ${input.key}`, {
                userId: input.modifiedBy,
            });
            return configParam;
        }
        catch (error) {
            logger_1.logger.error('Error creating configuration parameter:', error);
            throw error;
        }
    }
    static async findAll(query = {}) {
        try {
            const { category, type, tags, isActive = true, search, page = 1, limit = 20, sortBy = 'name', sortOrder = 'asc', } = query;
            const filters = {};
            if (category)
                filters.category = category;
            if (type)
                filters.type = type;
            if (typeof isActive === 'boolean')
                filters.isActive = isActive;
            if (tags && tags.length > 0)
                filters.tags = { $in: tags };
            if (search) {
                filters.$or = [
                    { name: { $regex: search, $options: 'i' } },
                    { key: { $regex: search, $options: 'i' } },
                    { category: { $regex: search, $options: 'i' } },
                ];
            }
            const sort = {};
            sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
            const skip = (page - 1) * limit;
            const [docs, totalCount] = await Promise.all([
                config_parameter_model_1.ConfigParameterModel.find(filters)
                    .populate('modifiedBy', 'name email')
                    .sort(sort)
                    .skip(skip)
                    .limit(limit)
                    .lean(),
                config_parameter_model_1.ConfigParameterModel.countDocuments(filters),
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
        }
        catch (error) {
            logger_1.logger.error('Error fetching configuration parameters:', error);
            throw error;
        }
    }
    static async findByKey(key, activeOnly = true) {
        try {
            const filters = { key };
            if (activeOnly)
                filters.isActive = true;
            return await config_parameter_model_1.ConfigParameterModel.findOne(filters)
                .populate('modifiedBy', 'name email')
                .lean();
        }
        catch (error) {
            logger_1.logger.error(`Error fetching configuration parameter by key: ${key}`, error);
            throw error;
        }
    }
    static async findByCategory(category, activeOnly = true) {
        try {
            return await config_parameter_model_1.ConfigParameterModel.findByCategoryLean(category, activeOnly).populate('modifiedBy', 'name email');
        }
        catch (error) {
            logger_1.logger.error(`Error fetching configuration parameters by category: ${category}`, error);
            throw error;
        }
    }
    static async findByType(type, activeOnly = true) {
        try {
            return await config_parameter_model_1.ConfigParameterModel.findByTypeLean(type, activeOnly).populate('modifiedBy', 'name email');
        }
        catch (error) {
            logger_1.logger.error(`Error fetching configuration parameters by type: ${type}`, error);
            throw error;
        }
    }
    static async findById(id) {
        try {
            if (!mongoose_1.Types.ObjectId.isValid(id)) {
                throw new AppError_1.AppError('Invalid configuration parameter ID', 400);
            }
            return await config_parameter_model_1.ConfigParameterModel.findById(id)
                .populate('modifiedBy', 'name email')
                .lean();
        }
        catch (error) {
            logger_1.logger.error(`Error fetching configuration parameter by ID: ${id}`, error);
            throw error;
        }
    }
    static async update(id, input) {
        try {
            if (!mongoose_1.Types.ObjectId.isValid(id)) {
                throw new AppError_1.AppError('Invalid configuration parameter ID', 400);
            }
            if (!mongoose_1.Types.ObjectId.isValid(input.modifiedBy)) {
                throw new AppError_1.AppError('Invalid modifiedBy user ID', 400);
            }
            const configParam = await config_parameter_model_1.ConfigParameterModel.findById(id);
            if (!configParam) {
                throw new AppError_1.AppError('Configuration parameter not found', 404);
            }
            Object.assign(configParam, {
                ...input,
                modifiedBy: new mongoose_1.Types.ObjectId(input.modifiedBy),
                lastModified: new Date(),
            });
            if (input.dependencies) {
                const isValid = await configParam.validateDependencies();
                if (!isValid) {
                    throw new AppError_1.AppError('One or more dependencies are not available or inactive', 400);
                }
            }
            await configParam.save();
            logger_1.logger.info(`Configuration parameter updated: ${configParam.key}`, {
                userId: input.modifiedBy,
            });
            return await config_parameter_model_1.ConfigParameterModel.findById(id)
                .populate('modifiedBy', 'name email')
                .lean();
        }
        catch (error) {
            logger_1.logger.error(`Error updating configuration parameter: ${id}`, error);
            throw error;
        }
    }
    static async delete(id, userId) {
        try {
            if (!mongoose_1.Types.ObjectId.isValid(id)) {
                throw new AppError_1.AppError('Invalid configuration parameter ID', 400);
            }
            if (!mongoose_1.Types.ObjectId.isValid(userId)) {
                throw new AppError_1.AppError('Invalid user ID', 400);
            }
            const result = await config_parameter_model_1.ConfigParameterModel.findByIdAndUpdate(id, {
                isActive: false,
                modifiedBy: new mongoose_1.Types.ObjectId(userId),
                lastModified: new Date(),
            }, { new: true });
            if (!result) {
                throw new AppError_1.AppError('Configuration parameter not found', 404);
            }
            logger_1.logger.info(`Configuration parameter deleted: ${result.key}`, { userId });
            return true;
        }
        catch (error) {
            logger_1.logger.error(`Error deleting configuration parameter: ${id}`, error);
            throw error;
        }
    }
    static async toggleActive(id, userId) {
        try {
            if (!mongoose_1.Types.ObjectId.isValid(id)) {
                throw new AppError_1.AppError('Invalid configuration parameter ID', 400);
            }
            const configParam = await config_parameter_model_1.ConfigParameterModel.findById(id);
            if (!configParam) {
                throw new AppError_1.AppError('Configuration parameter not found', 404);
            }
            configParam.isActive = !configParam.isActive;
            configParam.modifiedBy = new mongoose_1.Types.ObjectId(userId);
            configParam.lastModified = new Date();
            await configParam.save();
            logger_1.logger.info(`Configuration parameter ${configParam.isActive ? 'activated' : 'deactivated'}: ${configParam.key}`, { userId });
            return await config_parameter_model_1.ConfigParameterModel.findById(id)
                .populate('modifiedBy', 'name email')
                .lean();
        }
        catch (error) {
            logger_1.logger.error(`Error toggling configuration parameter: ${id}`, error);
            throw error;
        }
    }
    static async getCategories() {
        try {
            return await config_parameter_model_1.ConfigParameterModel.distinct('category', {
                isActive: true,
            });
        }
        catch (error) {
            logger_1.logger.error('Error fetching configuration categories:', error);
            throw error;
        }
    }
    static async getTags() {
        try {
            const tags = await config_parameter_model_1.ConfigParameterModel.distinct('tags', {
                isActive: true,
            });
            return tags.filter((tag) => tag);
        }
        catch (error) {
            logger_1.logger.error('Error fetching configuration tags:', error);
            throw error;
        }
    }
    static async getValue(key) {
        try {
            const param = await ConfigParameterService.findByKey(key, true);
            return param?.value || null;
        }
        catch (error) {
            logger_1.logger.error(`Error getting configuration value for key: ${key}`, error);
            return null;
        }
    }
    static async getValues(keys) {
        try {
            const params = await config_parameter_model_1.ConfigParameterModel.find({
                key: { $in: keys },
                isActive: true,
            })
                .select('key value')
                .lean();
            const result = {};
            params.forEach((param) => {
                result[param.key] = param.value;
            });
            return result;
        }
        catch (error) {
            logger_1.logger.error('Error getting multiple configuration values:', error);
            return {};
        }
    }
}
exports.ConfigParameterService = ConfigParameterService;
