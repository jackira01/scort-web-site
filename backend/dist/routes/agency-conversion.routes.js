"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const agency_conversion_controller_1 = __importDefault(require("../controllers/agency-conversion.controller"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authMiddleware);
router.post('/request', agency_conversion_controller_1.default.requestConversion);
router.post('/process/:userId', agency_conversion_controller_1.default.processConversion);
router.get('/pending', agency_conversion_controller_1.default.getPendingConversions);
router.get('/history', agency_conversion_controller_1.default.getConversionHistory);
router.get('/check-profile-creation', agency_conversion_controller_1.default.checkProfileCreation);
router.get('/stats', agency_conversion_controller_1.default.getConversionStats);
exports.default = router;
