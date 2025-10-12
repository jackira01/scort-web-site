"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFilterOptions = exports.getFilteredProfilesPost = void 0;
const service = __importStar(require("./filters.service"));
const getFilteredProfilesPost = async (req, res) => {
    try {
        console.log('🔍 DEBUG Controller - Request body received:', JSON.stringify(req.body, null, 2));
        const { category, location, features, priceRange, availability, isActive, isVerified, profileVerified, documentVerified, hasDestacadoUpgrade, hasVideos, page, limit, sortBy, sortOrder, fields } = req.body;
        const filters = {};
        if (category)
            filters.category = category;
        if (isActive !== undefined)
            filters.isActive = isActive;
        if (isVerified !== undefined)
            filters.isVerified = isVerified;
        if (profileVerified !== undefined)
            filters.profileVerified = profileVerified;
        if (documentVerified !== undefined)
            filters.documentVerified = documentVerified;
        if (hasDestacadoUpgrade !== undefined)
            filters.hasDestacadoUpgrade = hasDestacadoUpgrade;
        if (hasVideos !== undefined)
            filters.hasVideos = hasVideos;
        if (location) {
            filters.location = {};
            if (location.country)
                filters.location.country = location.country;
            if (location.department)
                filters.location.department = location.department;
            if (location.city)
                filters.location.city = location.city;
        }
        if (features) {
            console.log('🔍 DEBUG Controller - Features received:', JSON.stringify(features, null, 2));
            filters.features = features;
        }
        if (priceRange) {
            filters.priceRange = {};
            if (priceRange.min !== undefined) {
                if (isNaN(priceRange.min)) {
                    return res.status(400).json({
                        success: false,
                        message: 'priceRange.min debe ser un número válido'
                    });
                }
                filters.priceRange.min = priceRange.min;
            }
            if (priceRange.max !== undefined) {
                if (isNaN(priceRange.max)) {
                    return res.status(400).json({
                        success: false,
                        message: 'priceRange.max debe ser un número válido'
                    });
                }
                filters.priceRange.max = priceRange.max;
            }
        }
        if (availability) {
            filters.availability = availability;
        }
        if (page !== undefined)
            filters.page = page;
        if (limit !== undefined)
            filters.limit = limit;
        if (sortBy)
            filters.sortBy = sortBy;
        if (sortOrder)
            filters.sortOrder = sortOrder;
        if (fields)
            filters.fields = fields;
        if (filters.page && (isNaN(filters.page) || filters.page < 1)) {
            return res.status(400).json({
                success: false,
                message: 'page debe ser un número entero mayor a 0'
            });
        }
        if (filters.limit && (isNaN(filters.limit) || filters.limit < 1 || filters.limit > 100)) {
            return res.status(400).json({
                success: false,
                message: 'limit debe ser un número entre 1 y 100'
            });
        }
        if (filters.sortBy) {
            const validSortFields = ['createdAt', 'updatedAt', 'name', 'price'];
            if (!validSortFields.includes(filters.sortBy)) {
                return res.status(400).json({
                    success: false,
                    message: `sortBy debe ser uno de: ${validSortFields.join(', ')}`
                });
            }
        }
        if (filters.sortOrder && filters.sortOrder !== 'asc' && filters.sortOrder !== 'desc') {
            return res.status(400).json({
                success: false,
                message: 'sortOrder debe ser "asc" o "desc"'
            });
        }
        console.log('🔍 DEBUG Controller - Final filters object:', JSON.stringify(filters, null, 2));
        const result = await service.getFilteredProfiles(filters);
        const response = {
            success: true,
            data: result,
            message: 'Perfiles obtenidos exitosamente'
        };
        res.status(200).json(response);
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        const errorStack = error instanceof Error ? error.stack : undefined;
        const errorName = error instanceof Error ? error.name : 'UnknownError';
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: process.env.NODE_ENV === 'development' ? {
                message: errorMessage,
                stack: errorStack,
                name: errorName
            } : undefined
        });
    }
};
exports.getFilteredProfilesPost = getFilteredProfilesPost;
const getFilterOptions = async (req, res) => {
    try {
        const options = await service.getFilterOptions();
        res.status(200).json({
            success: true,
            data: options,
            message: 'Opciones de filtros obtenidas exitosamente'
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
};
exports.getFilterOptions = getFilterOptions;
