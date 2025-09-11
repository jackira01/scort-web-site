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
exports.ProfileModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const profileSchema = new mongoose_1.Schema({
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    description: String,
    isActive: { type: Boolean, default: false },
    location: {
        country: {
            value: { type: String, required: true },
            label: { type: String, required: true },
        },
        department: {
            value: { type: String, required: true },
            label: { type: String, required: true },
        },
        city: {
            value: { type: String, required: true },
            label: { type: String, required: true },
        },
    },
    features: [
        {
            group_id: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'AttributeGroup', required: true },
            value: [{ type: String, required: true }],
        },
    ],
    age: { type: String, required: true, },
    contact: {
        number: { type: String, required: true, },
        whatsapp: { type: String, required: false },
        telegram: { type: String, required: false },
        changedAt: Date,
    },
    height: { type: String, required: true },
    media: {
        gallery: [String],
        videos: [String],
        audios: [String],
        stories: [{
                link: String,
                type: {
                    type: String,
                    enum: ['image', 'video'],
                    required: true,
                },
            }],
    },
    verification: { type: mongoose_1.Schema.Types.ObjectId, ref: 'ProfileVerification' },
    availability: [
        {
            dayOfWeek: {
                type: String,
                enum: ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sábado', 'domingo'],
                required: true,
            },
            slots: [
                {
                    start: { type: String, required: true },
                    end: { type: String, required: true },
                    timezone: { type: String, required: true },
                },
            ],
        },
    ],
    rates: [
        {
            hour: { type: String, required: true },
            price: { type: Number, required: true },
            delivery: { type: Boolean, required: true, default: false },
        },
    ],
    paymentHistory: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'Invoice' }],
    lastLogin: Date,
    planAssignment: {
        type: {
            planId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'PlanDefinition' },
            planCode: { type: String },
            variantDays: { type: Number },
            startAt: { type: Date },
            expiresAt: { type: Date },
        },
        default: null,
        _id: false
    },
    upgrades: [{
            code: { type: String, required: true },
            startAt: { type: Date, required: true },
            endAt: { type: Date, required: true },
            purchaseAt: { type: Date, required: true },
        }],
    lastShownAt: { type: Date },
    visible: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
}, { timestamps: true });
profileSchema.index({ visible: 1 });
profileSchema.index({ isDeleted: 1 });
profileSchema.index({ 'planAssignment.expiresAt': 1 });
profileSchema.index({ lastShownAt: 1 });
profileSchema.index({ visible: 1, 'planAssignment.expiresAt': 1, lastShownAt: 1 });
profileSchema.index({ isDeleted: 1, visible: 1 });
profileSchema.index({ user: 1 });
profileSchema.index({ 'location.country.value': 1 });
profileSchema.index({ 'location.department.value': 1 });
profileSchema.index({ 'location.city.value': 1 });
profileSchema.index({ 'features.group_id': 1, 'features.value': 1 });
profileSchema.index({ 'rates.price': 1 });
profileSchema.index({ 'media.videos': 1 });
profileSchema.index({ 'upgrades.code': 1, 'upgrades.startAt': 1, 'upgrades.endAt': 1 });
profileSchema.index({ 'planAssignment.planCode': 1 });
profileSchema.index({
    visible: 1,
    isDeleted: 1,
    'planAssignment.expiresAt': 1,
    'location.country.value': 1
});
profileSchema.index({ createdAt: -1 });
exports.ProfileModel = mongoose_1.default.model('Profile', profileSchema);
