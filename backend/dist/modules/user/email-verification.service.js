"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailVerificationService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const email_verification_model_1 = require("./email-verification.model");
const email_service_1 = __importDefault(require("../../services/email.service"));
class EmailVerificationService {
    constructor() {
        this.emailService = new email_service_1.default();
    }
    generateVerificationCode() {
        return crypto_1.default.randomInt(100000, 999999).toString();
    }
    async sendVerificationCode(email, userName) {
        try {
            await email_verification_model_1.EmailVerification.deleteOne({ email });
            const code = this.generateVerificationCode();
            await email_verification_model_1.EmailVerification.create({
                email,
                code,
                expiresAt: new Date(Date.now() + 15 * 60 * 1000),
                attempts: 0,
            });
            await this.emailService.sendEmailVerificationCode(email, code, userName);
        }
        catch (error) {
            console.error('Error sending verification code:', error);
            throw new Error('Error al enviar código de verificación');
        }
    }
    async verifyCode(email, code) {
        try {
            const verification = await email_verification_model_1.EmailVerification.findOne({ email });
            if (!verification) {
                throw new Error('No se encontró código de verificación para este email');
            }
            if (verification.expiresAt < new Date()) {
                await email_verification_model_1.EmailVerification.deleteOne({ email });
                throw new Error('El código de verificación ha expirado');
            }
            if (verification.attempts >= 5) {
                await email_verification_model_1.EmailVerification.deleteOne({ email });
                throw new Error('Demasiados intentos fallidos. Solicita un nuevo código');
            }
            verification.attempts += 1;
            await verification.save();
            if (verification.code !== code) {
                throw new Error('Código de verificación incorrecto');
            }
            await email_verification_model_1.EmailVerification.deleteOne({ email });
            return true;
        }
        catch (error) {
            console.error('Error verifying code:', error);
            throw error;
        }
    }
    async cleanupExpiredCodes() {
        try {
            await email_verification_model_1.EmailVerification.deleteMany({
                expiresAt: { $lt: new Date() }
            });
        }
        catch (error) {
            console.error('Error cleaning up expired codes:', error);
        }
    }
    async hasActiveCode(email) {
        try {
            const verification = await email_verification_model_1.EmailVerification.findOne({
                email,
                expiresAt: { $gt: new Date() }
            });
            return !!verification;
        }
        catch (error) {
            console.error('Error checking active code:', error);
            return false;
        }
    }
}
exports.EmailVerificationService = EmailVerificationService;
