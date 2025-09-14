"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateParams = exports.validateQuery = exports.validateRequest = void 0;
const express_validator_1 = require("express-validator");
const validateRequest = (validations) => {
    return async (req, res, next) => {
        await Promise.all(validations.map(validation => validation.run(req)));
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            const formattedErrors = errors.array().map(error => ({
                field: error.type === 'field' ? error.path : error.type,
                message: error.msg
            }));
            return res.status(400).json({
                message: 'Errores de validación',
                errors: formattedErrors
            });
        }
        next();
    };
};
exports.validateRequest = validateRequest;
const validateQuery = (validations) => {
    return async (req, res, next) => {
        await Promise.all(validations.map(validation => validation.run(req)));
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            const formattedErrors = errors.array().map(error => ({
                field: error.type === 'field' ? error.path : error.type,
                message: error.msg
            }));
            return res.status(400).json({
                message: 'Errores de validación en query parameters',
                errors: formattedErrors
            });
        }
        next();
    };
};
exports.validateQuery = validateQuery;
const validateParams = (validations) => {
    return async (req, res, next) => {
        await Promise.all(validations.map(validation => validation.run(req)));
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            const formattedErrors = errors.array().map(error => ({
                field: error.type === 'field' ? error.path : error.type,
                message: error.msg
            }));
            return res.status(400).json({
                message: 'Errores de validación en parámetros',
                errors: formattedErrors
            });
        }
        next();
    };
};
exports.validateParams = validateParams;
