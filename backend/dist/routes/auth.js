"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const jwt_service_1 = require("../services/jwt.service");
const auth_controller_1 = require("../controllers/auth.controller");
const router = (0, express_1.Router)();
const jwtService = new jwt_service_1.JWTService();
router.post('/verify-email', auth_controller_1.verifyEmailController);
router.post('/resend-verification', auth_controller_1.resendVerificationController);
router.post('/check-verification-status', auth_controller_1.checkVerificationStatusController);
router.post('/generate-token', async (req, res) => {
    try {
        const { userId, role } = req.body;
        if (!userId || !role) {
            return res.status(400).json({
                success: false,
                message: 'userId y role son requeridos'
            });
        }
        const token = jwtService.generateToken({ userId, role });
        res.json({
            success: true,
            token
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});
router.post('/verify-token', async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'Token es requerido'
            });
        }
        const payload = jwtService.verifyToken(token);
        res.json({
            success: true,
            payload
        });
    }
    catch (error) {
        res.status(401).json({
            success: false,
            message: 'Token inválido o expirado'
        });
    }
});
exports.default = router;
