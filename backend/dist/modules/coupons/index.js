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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CouponModel = exports.couponController = exports.couponService = exports.couponRoutes = void 0;
var coupon_routes_1 = require("./coupon.routes");
Object.defineProperty(exports, "couponRoutes", { enumerable: true, get: function () { return __importDefault(coupon_routes_1).default; } });
var coupon_service_1 = require("./coupon.service");
Object.defineProperty(exports, "couponService", { enumerable: true, get: function () { return coupon_service_1.couponService; } });
var coupon_controller_1 = require("./coupon.controller");
Object.defineProperty(exports, "couponController", { enumerable: true, get: function () { return coupon_controller_1.couponController; } });
var coupon_model_1 = require("./coupon.model");
Object.defineProperty(exports, "CouponModel", { enumerable: true, get: function () { return coupon_model_1.CouponModel; } });
__exportStar(require("./coupon.types"), exports);
