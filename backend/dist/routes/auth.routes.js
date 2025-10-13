"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const router = (0, express_1.Router)();
router.post('/verify-email', auth_controller_1.verifyEmailController);
router.post('/resend-verification', auth_controller_1.resendVerificationController);
exports.default = router;
