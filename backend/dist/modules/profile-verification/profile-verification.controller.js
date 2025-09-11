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
exports.recalculateProgress = exports.updateVerificationSteps = exports.deleteProfileVerification = exports.getAllProfileVerifications = exports.updateVerificationStatus = exports.updateProfileVerification = exports.createProfileVerification = exports.getProfileVerificationById = exports.getProfileVerificationByProfileId = void 0;
const profileVerificationService = __importStar(require("./profile-verification.service"));
const getProfileVerificationByProfileId = async (req, res) => {
    try {
        const { profileId } = req.params;
        if (!profileId) {
            return res.status(400).json({
                success: false,
                message: 'ID del perfil es requerido'
            });
        }
        const verification = await profileVerificationService.getProfileVerificationByProfileId(profileId);
        if (!verification) {
            return res.status(404).json({
                success: false,
                message: 'Verificación no encontrada para este perfil'
            });
        }
        res.status(200).json({
            success: true,
            data: verification
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: errorMessage
        });
    }
};
exports.getProfileVerificationByProfileId = getProfileVerificationByProfileId;
const getProfileVerificationById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'ID de verificación es requerido'
            });
        }
        const verification = await profileVerificationService.getProfileVerificationById(id);
        if (!verification) {
            return res.status(404).json({
                success: false,
                message: 'Verificación no encontrada'
            });
        }
        res.status(200).json({
            success: true,
            data: verification
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: errorMessage
        });
    }
};
exports.getProfileVerificationById = getProfileVerificationById;
const createProfileVerification = async (req, res) => {
    try {
        const verificationData = req.body;
        if (!verificationData.profile) {
            return res.status(400).json({
                success: false,
                message: 'ID del perfil es requerido'
            });
        }
        const verification = await profileVerificationService.createProfileVerification(verificationData);
        res.status(201).json({
            success: true,
            data: verification,
            message: 'Verificación creada exitosamente'
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: errorMessage
        });
    }
};
exports.createProfileVerification = createProfileVerification;
const updateProfileVerification = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'ID de verificación es requerido'
            });
        }
        const verification = await profileVerificationService.updateProfileVerification(id, updateData);
        if (!verification) {
            return res.status(404).json({
                success: false,
                message: 'Verificación no encontrada'
            });
        }
        res.status(200).json({
            success: true,
            data: verification,
            message: 'Verificación actualizada exitosamente'
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: errorMessage
        });
    }
};
exports.updateProfileVerification = updateProfileVerification;
const updateVerificationStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, reason } = req.body;
        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'ID de verificación es requerido'
            });
        }
        if (!status || !['pending', 'verified', 'rejected'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Estado de verificación inválido. Debe ser: pending, verified o rejected'
            });
        }
        const verification = await profileVerificationService.updateVerificationStatus(id, status, reason);
        if (!verification) {
            return res.status(404).json({
                success: false,
                message: 'Verificación no encontrada'
            });
        }
        res.status(200).json({
            success: true,
            data: verification,
            message: `Estado de verificación actualizado a: ${status}`
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: errorMessage
        });
    }
};
exports.updateVerificationStatus = updateVerificationStatus;
const getAllProfileVerifications = async (req, res) => {
    try {
        const { status, page, limit } = req.query;
        const filters = {
            status: status,
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 10
        };
        const result = await profileVerificationService.getAllProfileVerifications(filters);
        res.status(200).json({
            success: true,
            data: result.verifications,
            pagination: result.pagination
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: errorMessage
        });
    }
};
exports.getAllProfileVerifications = getAllProfileVerifications;
const deleteProfileVerification = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'ID de verificación es requerido'
            });
        }
        const verification = await profileVerificationService.deleteProfileVerification(id);
        if (!verification) {
            return res.status(404).json({
                success: false,
                message: 'Verificación no encontrada'
            });
        }
        res.status(200).json({
            success: true,
            message: 'Verificación eliminada exitosamente'
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: errorMessage
        });
    }
};
exports.deleteProfileVerification = deleteProfileVerification;
const updateVerificationSteps = async (req, res) => {
    try {
        const { id } = req.params;
        const stepsData = req.body;
        if (!id) {
            res.status(400).json({
                success: false,
                message: 'ID de verificación es requerido'
            });
            return;
        }
        if (!stepsData || Object.keys(stepsData).length === 0) {
            res.status(400).json({
                success: false,
                message: 'Datos de pasos de verificación son requeridos'
            });
            return;
        }
        const updatedVerification = await profileVerificationService.updateVerificationSteps(id, stepsData);
        if (!updatedVerification) {
            res.status(404).json({
                success: false,
                message: 'Verificación no encontrada'
            });
            return;
        }
        res.status(200).json({
            success: true,
            data: updatedVerification,
            message: 'Pasos de verificación actualizados y progreso recalculado exitosamente'
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};
exports.updateVerificationSteps = updateVerificationSteps;
const recalculateProgress = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'ID de verificación es requerido'
            });
        }
        const currentVerification = await profileVerificationService.getProfileVerificationById(id);
        if (!currentVerification) {
            return res.status(404).json({
                success: false,
                message: 'Verificación no encontrada'
            });
        }
        const verification = await profileVerificationService.updateVerificationSteps(id, currentVerification.steps);
        res.status(200).json({
            success: true,
            data: verification,
            message: 'Progreso de verificación recalculado exitosamente'
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: errorMessage
        });
    }
};
exports.recalculateProgress = recalculateProgress;
