import { body, param, query } from 'express-validator';

export const configParameterValidation = {
    create: [
        body('key')
            .isString()
            .trim()
            .isLength({ min: 1, max: 100 })
            .matches(/^[a-z0-9_.-]+$/)
            .withMessage('Key must contain only lowercase letters, numbers, underscores, dots, and hyphens'),
        body('name')
            .isString()
            .trim()
            .isLength({ min: 1, max: 200 })
            .withMessage('Name is required and must be between 1 and 200 characters'),
        body('type')
            .isIn(['location', 'text', 'membership', 'number', 'boolean', 'array', 'object', 'json'])
            .withMessage('Type must be one of: location, text, membership, number, boolean, array, object, json'),
        body('category')
            .isString()
            .trim()
            .isLength({ min: 1, max: 50 })
            .withMessage('Category is required and must be between 1 and 50 characters'),
        body('value')
            .exists()
            .withMessage('Value is required'),
        body('metadata')
            .optional()
            .isObject()
            .withMessage('Metadata must be an object'),
        body('metadata.description')
            .optional()
            .isString()
            .trim()
            .isLength({ max: 500 })
            .withMessage('Description must be a string with max 500 characters'),
        body('metadata.validation')
            .optional()
            .isObject()
            .withMessage('Validation must be an object'),
        body('metadata.ui_config')
            .optional()
            .isObject()
            .withMessage('UI config must be an object'),
        body('metadata.ui_config.component')
            .optional()
            .isString()
            .withMessage('Component must be a string'),
        body('metadata.ui_config.editable')
            .optional()
            .isBoolean()
            .withMessage('Editable must be a boolean'),
        body('metadata.ui_config.hierarchical')
            .optional()
            .isBoolean()
            .withMessage('Hierarchical must be a boolean'),
        body('metadata.ui_config.translatable')
            .optional()
            .isBoolean()
            .withMessage('Translatable must be a boolean'),
        body('metadata.ui_config.rich_text')
            .optional()
            .isBoolean()
            .withMessage('Rich text must be a boolean'),
        body('metadata.ui_config.price_editable')
            .optional()
            .isBoolean()
            .withMessage('Price editable must be a boolean'),
        body('metadata.ui_config.feature_management')
            .optional()
            .isBoolean()
            .withMessage('Feature management must be a boolean'),
        body('metadata.cache_ttl')
            .optional()
            .isInt({ min: 0, max: 86400 })
            .withMessage('Cache TTL must be an integer between 0 and 86400 seconds'),
        body('metadata.requires_restart')
            .optional()
            .isBoolean()
            .withMessage('Requires restart must be a boolean'),
        body('metadata.environment')
            .optional()
            .isIn(['development', 'production', 'all'])
            .withMessage('Environment must be one of: development, production, all'),
        body('tags')
            .optional()
            .isArray()
            .withMessage('Tags must be an array'),
        body('tags.*')
            .optional()
            .isString()
            .trim()
            .isLength({ min: 1, max: 30 })
            .withMessage('Each tag must be a string between 1 and 30 characters'),
        body('dependencies')
            .optional()
            .isArray()
            .withMessage('Dependencies must be an array'),
        body('dependencies.*')
            .optional()
            .isString()
            .trim()
            .matches(/^[a-z0-9_.-]+$/)
            .withMessage('Each dependency must be a valid configuration key'),
        body('modifiedBy')
            .optional()
            .isMongoId()
            .withMessage('ModifiedBy must be a valid MongoDB ObjectId')
    ],

    update: [
        param('id')
            .isMongoId()
            .withMessage('Invalid configuration parameter ID'),
        body('name')
            .optional()
            .isString()
            .trim()
            .isLength({ min: 1, max: 200 })
            .withMessage('Name must be between 1 and 200 characters'),
        body('value')
            .optional()
            .exists()
            .withMessage('Value cannot be null'),
        body('metadata')
            .optional()
            .isObject()
            .withMessage('Metadata must be an object'),
        body('metadata.description')
            .optional()
            .isString()
            .trim()
            .isLength({ max: 500 })
            .withMessage('Description must be a string with max 500 characters'),
        body('metadata.validation')
            .optional()
            .isObject()
            .withMessage('Validation must be an object'),
        body('metadata.ui_config')
            .optional()
            .isObject()
            .withMessage('UI config must be an object'),
        body('metadata.ui_config.component')
            .optional()
            .isString()
            .withMessage('Component must be a string'),
        body('metadata.ui_config.editable')
            .optional()
            .isBoolean()
            .withMessage('Editable must be a boolean'),
        body('metadata.ui_config.hierarchical')
            .optional()
            .isBoolean()
            .withMessage('Hierarchical must be a boolean'),
        body('metadata.ui_config.translatable')
            .optional()
            .isBoolean()
            .withMessage('Translatable must be a boolean'),
        body('metadata.ui_config.rich_text')
            .optional()
            .isBoolean()
            .withMessage('Rich text must be a boolean'),
        body('metadata.ui_config.price_editable')
            .optional()
            .isBoolean()
            .withMessage('Price editable must be a boolean'),
        body('metadata.ui_config.feature_management')
            .optional()
            .isBoolean()
            .withMessage('Feature management must be a boolean'),
        body('metadata.cache_ttl')
            .optional()
            .isInt({ min: 0, max: 86400 })
            .withMessage('Cache TTL must be an integer between 0 and 86400 seconds'),
        body('metadata.requires_restart')
            .optional()
            .isBoolean()
            .withMessage('Requires restart must be a boolean'),
        body('metadata.environment')
            .optional()
            .isIn(['development', 'production', 'all'])
            .withMessage('Environment must be one of: development, production, all'),
        body('isActive')
            .optional()
            .isBoolean()
            .withMessage('IsActive must be a boolean'),
        body('tags')
            .optional()
            .isArray()
            .withMessage('Tags must be an array'),
        body('tags.*')
            .optional()
            .isString()
            .trim()
            .isLength({ min: 1, max: 30 })
            .withMessage('Each tag must be a string between 1 and 30 characters'),
        body('dependencies')
            .optional()
            .isArray()
            .withMessage('Dependencies must be an array'),
        body('dependencies.*')
            .optional()
            .isString()
            .trim()
            .matches(/^[a-z0-9_.-]+$/)
            .withMessage('Each dependency must be a valid configuration key'),
        body('modifiedBy')
            .optional()
            .isMongoId()
            .withMessage('ModifiedBy must be a valid MongoDB ObjectId')
    ],

    getValues: [
        body('keys')
            .isArray({ min: 1, max: 50 })
            .withMessage('Keys must be an array with 1 to 50 elements'),
        body('keys.*')
            .isString()
            .trim()
            .matches(/^[a-z0-9_.-]+$/)
            .withMessage('Each key must be a valid configuration key')
    ],

    validate: [
        body('type')
            .isIn(['location', 'text', 'membership', 'number', 'boolean', 'array', 'object', 'json'])
            .withMessage('Type must be one of: location, text, membership, number, boolean, array, object, json'),
        body('value')
            .exists()
            .withMessage('Value is required for validation'),
        body('metadata')
            .optional()
            .isObject()
            .withMessage('Metadata must be an object')
    ],

    // Validaciones para parámetros de URL
    paramId: [
        param('id')
            .isMongoId()
            .withMessage('Invalid configuration parameter ID')
    ],

    paramKey: [
        param('key')
            .isString()
            .trim()
            .matches(/^[a-z0-9_.-]+$/)
            .withMessage('Invalid configuration key format')
    ],

    paramCategory: [
        param('category')
            .isString()
            .trim()
            .isLength({ min: 1, max: 50 })
            .withMessage('Invalid category format')
    ],

    paramType: [
        param('type')
            .isIn(['location', 'text', 'membership', 'number', 'boolean', 'array', 'object', 'json'])
            .withMessage('Invalid configuration type')
    ],

    // Validaciones para query parameters
    queryParams: [
        query('page')
            .optional()
            .isInt({ min: 1 })
            .withMessage('Page must be a positive integer'),
        query('limit')
            .optional()
            .isInt({ min: 1, max: 100 })
            .withMessage('Limit must be between 1 and 100'),
        query('sortBy')
            .optional()
            .isIn(['name', 'key', 'category', 'type', 'lastModified', 'createdAt'])
            .withMessage('SortBy must be one of: name, key, category, type, lastModified, createdAt'),
        query('sortOrder')
            .optional()
            .isIn(['asc', 'desc'])
            .withMessage('SortOrder must be asc or desc'),
        query('isActive')
            .optional()
            .isBoolean()
            .withMessage('IsActive must be a boolean'),
        query('activeOnly')
            .optional()
            .isBoolean()
            .withMessage('ActiveOnly must be a boolean'),
        query('search')
            .optional()
            .isString()
            .trim()
            .isLength({ min: 1, max: 100 })
            .withMessage('Search must be between 1 and 100 characters'),
        query('tags')
            .optional()
            .isString()
            .withMessage('Tags must be a comma-separated string')
    ]
};