"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.configParameterValidation = void 0;
const express_validator_1 = require("express-validator");
exports.configParameterValidation = {
    create: [
        (0, express_validator_1.body)('key')
            .isString()
            .trim()
            .isLength({ min: 1, max: 100 })
            .matches(/^[a-z0-9_.-]+$/)
            .withMessage('Key must contain only lowercase letters, numbers, underscores, dots, and hyphens'),
        (0, express_validator_1.body)('name')
            .isString()
            .trim()
            .isLength({ min: 1, max: 200 })
            .withMessage('Name is required and must be between 1 and 200 characters'),
        (0, express_validator_1.body)('type')
            .isIn(['location', 'text', 'membership', 'number', 'boolean', 'array', 'object', 'json'])
            .withMessage('Type must be one of: location, text, membership, number, boolean, array, object, json'),
        (0, express_validator_1.body)('category')
            .isString()
            .trim()
            .isLength({ min: 1, max: 50 })
            .withMessage('Category is required and must be between 1 and 50 characters'),
        (0, express_validator_1.body)('value')
            .exists()
            .withMessage('Value is required'),
        (0, express_validator_1.body)('metadata')
            .optional()
            .isObject()
            .withMessage('Metadata must be an object'),
        (0, express_validator_1.body)('metadata.description')
            .optional()
            .isString()
            .trim()
            .isLength({ max: 500 })
            .withMessage('Description must be a string with max 500 characters'),
        (0, express_validator_1.body)('metadata.validation')
            .optional()
            .isObject()
            .withMessage('Validation must be an object'),
        (0, express_validator_1.body)('metadata.ui_config')
            .optional()
            .isObject()
            .withMessage('UI config must be an object'),
        (0, express_validator_1.body)('metadata.ui_config.component')
            .optional()
            .isString()
            .withMessage('Component must be a string'),
        (0, express_validator_1.body)('metadata.ui_config.editable')
            .optional()
            .isBoolean()
            .withMessage('Editable must be a boolean'),
        (0, express_validator_1.body)('metadata.ui_config.hierarchical')
            .optional()
            .isBoolean()
            .withMessage('Hierarchical must be a boolean'),
        (0, express_validator_1.body)('metadata.ui_config.translatable')
            .optional()
            .isBoolean()
            .withMessage('Translatable must be a boolean'),
        (0, express_validator_1.body)('metadata.ui_config.rich_text')
            .optional()
            .isBoolean()
            .withMessage('Rich text must be a boolean'),
        (0, express_validator_1.body)('metadata.ui_config.price_editable')
            .optional()
            .isBoolean()
            .withMessage('Price editable must be a boolean'),
        (0, express_validator_1.body)('metadata.ui_config.feature_management')
            .optional()
            .isBoolean()
            .withMessage('Feature management must be a boolean'),
        (0, express_validator_1.body)('metadata.cache_ttl')
            .optional()
            .isInt({ min: 0, max: 86400 })
            .withMessage('Cache TTL must be an integer between 0 and 86400 seconds'),
        (0, express_validator_1.body)('metadata.requires_restart')
            .optional()
            .isBoolean()
            .withMessage('Requires restart must be a boolean'),
        (0, express_validator_1.body)('metadata.environment')
            .optional()
            .isIn(['development', 'production', 'all'])
            .withMessage('Environment must be one of: development, production, all'),
        (0, express_validator_1.body)('tags')
            .optional()
            .isArray()
            .withMessage('Tags must be an array'),
        (0, express_validator_1.body)('tags.*')
            .optional()
            .isString()
            .trim()
            .isLength({ min: 1, max: 30 })
            .withMessage('Each tag must be a string between 1 and 30 characters'),
        (0, express_validator_1.body)('dependencies')
            .optional()
            .isArray()
            .withMessage('Dependencies must be an array'),
        (0, express_validator_1.body)('dependencies.*')
            .optional()
            .isString()
            .trim()
            .matches(/^[a-z0-9_.-]+$/)
            .withMessage('Each dependency must be a valid configuration key'),
        (0, express_validator_1.body)('modifiedBy')
            .optional()
            .isMongoId()
            .withMessage('ModifiedBy must be a valid MongoDB ObjectId')
    ],
    update: [
        (0, express_validator_1.param)('id')
            .isMongoId()
            .withMessage('Invalid configuration parameter ID'),
        (0, express_validator_1.body)('name')
            .optional()
            .isString()
            .trim()
            .isLength({ min: 1, max: 200 })
            .withMessage('Name must be between 1 and 200 characters'),
        (0, express_validator_1.body)('value')
            .optional()
            .exists()
            .withMessage('Value cannot be null'),
        (0, express_validator_1.body)('metadata')
            .optional()
            .isObject()
            .withMessage('Metadata must be an object'),
        (0, express_validator_1.body)('metadata.description')
            .optional()
            .isString()
            .trim()
            .isLength({ max: 500 })
            .withMessage('Description must be a string with max 500 characters'),
        (0, express_validator_1.body)('metadata.validation')
            .optional()
            .isObject()
            .withMessage('Validation must be an object'),
        (0, express_validator_1.body)('metadata.ui_config')
            .optional()
            .isObject()
            .withMessage('UI config must be an object'),
        (0, express_validator_1.body)('metadata.ui_config.component')
            .optional()
            .isString()
            .withMessage('Component must be a string'),
        (0, express_validator_1.body)('metadata.ui_config.editable')
            .optional()
            .isBoolean()
            .withMessage('Editable must be a boolean'),
        (0, express_validator_1.body)('metadata.ui_config.hierarchical')
            .optional()
            .isBoolean()
            .withMessage('Hierarchical must be a boolean'),
        (0, express_validator_1.body)('metadata.ui_config.translatable')
            .optional()
            .isBoolean()
            .withMessage('Translatable must be a boolean'),
        (0, express_validator_1.body)('metadata.ui_config.rich_text')
            .optional()
            .isBoolean()
            .withMessage('Rich text must be a boolean'),
        (0, express_validator_1.body)('metadata.ui_config.price_editable')
            .optional()
            .isBoolean()
            .withMessage('Price editable must be a boolean'),
        (0, express_validator_1.body)('metadata.ui_config.feature_management')
            .optional()
            .isBoolean()
            .withMessage('Feature management must be a boolean'),
        (0, express_validator_1.body)('metadata.cache_ttl')
            .optional()
            .isInt({ min: 0, max: 86400 })
            .withMessage('Cache TTL must be an integer between 0 and 86400 seconds'),
        (0, express_validator_1.body)('metadata.requires_restart')
            .optional()
            .isBoolean()
            .withMessage('Requires restart must be a boolean'),
        (0, express_validator_1.body)('metadata.environment')
            .optional()
            .isIn(['development', 'production', 'all'])
            .withMessage('Environment must be one of: development, production, all'),
        (0, express_validator_1.body)('isActive')
            .optional()
            .isBoolean()
            .withMessage('IsActive must be a boolean'),
        (0, express_validator_1.body)('tags')
            .optional()
            .isArray()
            .withMessage('Tags must be an array'),
        (0, express_validator_1.body)('tags.*')
            .optional()
            .isString()
            .trim()
            .isLength({ min: 1, max: 30 })
            .withMessage('Each tag must be a string between 1 and 30 characters'),
        (0, express_validator_1.body)('dependencies')
            .optional()
            .isArray()
            .withMessage('Dependencies must be an array'),
        (0, express_validator_1.body)('dependencies.*')
            .optional()
            .isString()
            .trim()
            .matches(/^[a-z0-9_.-]+$/)
            .withMessage('Each dependency must be a valid configuration key'),
        (0, express_validator_1.body)('modifiedBy')
            .optional()
            .isMongoId()
            .withMessage('ModifiedBy must be a valid MongoDB ObjectId')
    ],
    getValues: [
        (0, express_validator_1.body)('keys')
            .isArray({ min: 1, max: 50 })
            .withMessage('Keys must be an array with 1 to 50 elements'),
        (0, express_validator_1.body)('keys.*')
            .isString()
            .trim()
            .matches(/^[a-z0-9_.-]+$/)
            .withMessage('Each key must be a valid configuration key')
    ],
    validate: [
        (0, express_validator_1.body)('type')
            .isIn(['location', 'text', 'membership', 'number', 'boolean', 'array', 'object', 'json'])
            .withMessage('Type must be one of: location, text, membership, number, boolean, array, object, json'),
        (0, express_validator_1.body)('value')
            .exists()
            .withMessage('Value is required for validation'),
        (0, express_validator_1.body)('metadata')
            .optional()
            .isObject()
            .withMessage('Metadata must be an object')
    ],
    paramId: [
        (0, express_validator_1.param)('id')
            .isMongoId()
            .withMessage('Invalid configuration parameter ID')
    ],
    paramKey: [
        (0, express_validator_1.param)('key')
            .isString()
            .trim()
            .matches(/^[a-z0-9_.-]+$/)
            .withMessage('Invalid configuration key format')
    ],
    paramCategory: [
        (0, express_validator_1.param)('category')
            .isString()
            .trim()
            .isLength({ min: 1, max: 50 })
            .withMessage('Invalid category format')
    ],
    paramType: [
        (0, express_validator_1.param)('type')
            .isIn(['location', 'text', 'membership', 'number', 'boolean', 'array', 'object', 'json'])
            .withMessage('Invalid configuration type')
    ],
    queryParams: [
        (0, express_validator_1.query)('page')
            .optional()
            .isInt({ min: 1 })
            .withMessage('Page must be a positive integer'),
        (0, express_validator_1.query)('limit')
            .optional()
            .isInt({ min: 1, max: 100 })
            .withMessage('Limit must be between 1 and 100'),
        (0, express_validator_1.query)('sortBy')
            .optional()
            .isIn(['name', 'key', 'category', 'type', 'lastModified', 'createdAt'])
            .withMessage('SortBy must be one of: name, key, category, type, lastModified, createdAt'),
        (0, express_validator_1.query)('sortOrder')
            .optional()
            .isIn(['asc', 'desc'])
            .withMessage('SortOrder must be asc or desc'),
        (0, express_validator_1.query)('isActive')
            .optional()
            .isBoolean()
            .withMessage('IsActive must be a boolean'),
        (0, express_validator_1.query)('activeOnly')
            .optional()
            .isBoolean()
            .withMessage('ActiveOnly must be a boolean'),
        (0, express_validator_1.query)('search')
            .optional()
            .isString()
            .trim()
            .isLength({ min: 1, max: 100 })
            .withMessage('Search must be between 1 and 100 characters'),
        (0, express_validator_1.query)('tags')
            .optional()
            .isString()
            .withMessage('Tags must be a comma-separated string')
    ]
};
