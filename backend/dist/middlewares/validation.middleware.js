"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateParams = exports.validateQuery = exports.validateObjectId = exports.validateRequest = void 0;
const express_validator_1 = require("express-validator");
const express_validator_2 = require("express-validator");
const mongoose_1 = __importDefault(require("mongoose"));
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
const validateObjectId = (paramName) => {
    return (0, express_validator_2.param)(paramName)
        .custom((value) => {
        if (!mongoose_1.default.Types.ObjectId.isValid(value)) {
            throw new Error(`${paramName} debe ser un ObjectId válido`);
        }
        return true;
    });
};
exports.validateObjectId = validateObjectId;
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
