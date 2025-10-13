"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resendVerificationController = exports.verifyEmailController = void 0;
const email_verification_service_1 = require("../modules/user/email-verification.service");
const user_service_1 = require("../modules/user/user.service");
const User_model_1 = __importDefault(require("../modules/user/User.model"));
const emailVerificationService = new email_verification_service_1.EmailVerificationService();
const verifyEmailController = async (req, res) => {
    try {
        const { email, code } = req.body;
        if (!email || !code) {
            return res.status(400).json({
                success: false,
                message: 'Email y código son requeridos'
            });
        }
        const isValid = await emailVerificationService.verifyCode(email, code);
        if (isValid) {
            await User_model_1.default.findOneAndUpdate({ email }, { emailVerified: new Date() }, { new: true });
            return res.status(200).json({
                success: true,
                message: 'Email verificado exitosamente'
            });
        }
        else {
            return res.status(400).json({
                success: false,
                message: 'Código de verificación inválido'
            });
        }
    }
    catch (error) {
        console.error('Error in verifyEmailController:', error);
        return res.status(400).json({
            success: false,
            message: error.message || 'Error al verificar el código'
        });
    }
};
exports.verifyEmailController = verifyEmailController;
const resendVerificationController = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email es requerido'
            });
        }
        const user = await (0, user_service_1.findUserByEmail)(email);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }
        if (user.emailVerified) {
            return res.status(400).json({
                success: false,
                message: 'El email ya está verificado'
            });
        }
        const hasActiveCode = await emailVerificationService.hasActiveCode(email);
        if (hasActiveCode) {
            return res.status(429).json({
                success: false,
                message: 'Ya existe un código activo. Espera antes de solicitar otro.'
            });
        }
        await emailVerificationService.sendVerificationCode(email, user.name);
        return res.status(200).json({
            success: true,
            message: 'Código de verificación reenviado'
        });
    }
    catch (error) {
        console.error('Error in resendVerificationController:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error al reenviar el código'
        });
    }
};
exports.resendVerificationController = resendVerificationController;
