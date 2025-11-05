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
exports.checkProfileSponsored = exports.getSponsoredProfilesCount = exports.getSponsoredProfiles = void 0;
const service = __importStar(require("./sponsored-profiles.service"));
const getSponsoredProfiles = async (req, res) => {
    try {
        const { page, limit, sortBy, sortOrder, fields, category, department, city, minPrice, maxPrice, identityVerified, hasVideo, documentVerified } = req.query;
        const query = {};
        if (page) {
            const pageNum = parseInt(page, 10);
            if (!isNaN(pageNum) && pageNum > 0) {
                query.page = pageNum;
            }
        }
        if (limit) {
            const limitNum = parseInt(limit, 10);
            if (!isNaN(limitNum) && limitNum > 0) {
                query.limit = Math.min(limitNum, 100);
            }
        }
        if (sortBy && typeof sortBy === 'string') {
            const validSortFields = ['createdAt', 'updatedAt', 'name', 'lastShownAt'];
            if (validSortFields.includes(sortBy)) {
                query.sortBy = sortBy;
            }
        }
        if (sortOrder && typeof sortOrder === 'string') {
            if (['asc', 'desc'].includes(sortOrder)) {
                query.sortOrder = sortOrder;
            }
        }
        if (fields && typeof fields === 'string') {
            query.fields = fields.split(',').map(field => field.trim()).filter(Boolean);
        }
        if (category && typeof category === 'string') {
            query.category = category;
        }
        if (department || city) {
            query.location = {};
            if (department && typeof department === 'string') {
                query.location.department = department;
            }
            if (city && typeof city === 'string') {
                query.location.city = city;
            }
        }
        const bodyFeatures = req.body?.features;
        if (bodyFeatures && typeof bodyFeatures === 'object') {
            query.features = bodyFeatures;
        }
        if (minPrice || maxPrice) {
            query.priceRange = {};
            if (minPrice) {
                const minPriceNum = parseFloat(minPrice);
                if (!isNaN(minPriceNum)) {
                    query.priceRange.min = minPriceNum;
                }
            }
            if (maxPrice) {
                const maxPriceNum = parseFloat(maxPrice);
                if (!isNaN(maxPriceNum)) {
                    query.priceRange.max = maxPriceNum;
                }
            }
        }
        if (identityVerified || hasVideo || documentVerified) {
            query.verification = {};
            if (identityVerified === 'true') {
                query.verification.identityVerified = true;
            }
            if (hasVideo === 'true') {
                query.verification.hasVideo = true;
            }
            if (documentVerified === 'true') {
                query.verification.documentVerified = true;
            }
        }
        const result = await service.getSponsoredProfiles(query);
        res.status(200).json({
            success: true,
            data: result.profiles,
            pagination: result.pagination,
            message: `Se encontraron ${result.pagination.totalProfiles} perfiles patrocinados`
        });
    }
    catch (error) {
        console.error('❌ [ERROR] Error en getSponsoredProfiles controller:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor al obtener perfiles patrocinados',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
exports.getSponsoredProfiles = getSponsoredProfiles;
const getSponsoredProfilesCount = async (req, res) => {
    try {
        const count = await service.getSponsoredProfilesCount();
        res.status(200).json({
            success: true,
            data: {
                totalCount: count
            },
            message: `Total de perfiles patrocinados: ${count}`
        });
    }
    catch (error) {
        console.error('Error en getSponsoredProfilesCount controller:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor al contar perfiles patrocinados',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
exports.getSponsoredProfilesCount = getSponsoredProfilesCount;
const checkProfileSponsored = async (req, res) => {
    try {
        const { profileId } = req.params;
        if (!profileId) {
            return res.status(400).json({
                success: false,
                message: 'ID de perfil requerido'
            });
        }
        const isSponsored = await service.isProfileSponsored(profileId);
        res.status(200).json({
            success: true,
            data: {
                profileId,
                isSponsored
            },
            message: isSponsored
                ? 'El perfil es elegible para aparecer en la sección patrocinada'
                : 'El perfil no cumple los criterios para aparecer en la sección patrocinada'
        });
    }
    catch (error) {
        console.error('Error en checkProfileSponsored controller:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor al verificar perfil patrocinado',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
exports.checkProfileSponsored = checkProfileSponsored;
