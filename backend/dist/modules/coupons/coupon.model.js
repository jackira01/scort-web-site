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
exports.CouponModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const CouponSchema = new mongoose_1.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true,
        match: /^[A-Z0-9_-]+$/,
        maxlength: 50
    },
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    description: {
        type: String,
        trim: true,
        maxlength: 500
    },
    type: {
        type: String,
        enum: ['percentage', 'fixed_amount', 'plan_assignment'],
        required: true
    },
    value: {
        type: Number,
        required: true,
        min: 0,
        validate: {
            validator: function (value) {
                if (this.type === 'percentage') {
                    return value >= 0 && value <= 100;
                }
                if (this.type === 'fixed_amount') {
                    return value >= 0;
                }
                return true;
            },
            message: 'El valor debe ser válido según el tipo de cupón'
        }
    },
    planCode: {
        type: String,
        uppercase: true,
        trim: true,
        validate: {
            validator: function (value) {
                if (this.type === 'plan_assignment') {
                    return !!value;
                }
                return true;
            },
            message: 'El código de plan es requerido para cupones de asignación de plan'
        }
    },
    applicablePlans: {
        type: [String],
        default: [],
        validate: {
            validator: function (plans) {
                return plans.every(plan => /^[A-Z0-9_-]+$/.test(plan));
            },
            message: 'Los códigos de planes deben ser válidos'
        }
    },
    maxUses: {
        type: Number,
        required: true,
        min: -1,
        validate: {
            validator: function (value) {
                return value === -1 || value > 0;
            },
            message: 'Los usos máximos deben ser -1 (ilimitado) o mayor a 0'
        }
    },
    currentUses: {
        type: Number,
        default: 0,
        min: 0
    },
    validFrom: {
        type: Date,
        required: true
    },
    validUntil: {
        type: Date,
        required: true,
        validate: {
            validator: function (value) {
                return value > this.validFrom;
            },
            message: 'La fecha de vencimiento debe ser posterior a la fecha de inicio'
        }
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdBy: {
        type: String,
        required: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});
CouponSchema.virtual('isValid').get(function () {
    const doc = this;
    const now = new Date();
    return doc.isActive &&
        now >= doc.validFrom &&
        now <= doc.validUntil &&
        (doc.maxUses === -1 || doc.currentUses < doc.maxUses);
});
CouponSchema.virtual('isExhausted').get(function () {
    const doc = this;
    return doc.maxUses !== -1 && doc.currentUses >= doc.maxUses;
});
CouponSchema.virtual('remainingUses').get(function () {
    const doc = this;
    if (doc.maxUses === -1)
        return -1;
    return Math.max(0, doc.maxUses - doc.currentUses);
});
CouponSchema.index({ code: 1 });
CouponSchema.index({ type: 1, isActive: 1 });
CouponSchema.index({ validFrom: 1, validUntil: 1 });
CouponSchema.index({ isActive: 1, validFrom: 1, validUntil: 1 });
CouponSchema.index({ createdBy: 1 });
CouponSchema.index({ createdAt: -1 });
CouponSchema.statics.findByCode = function (code) {
    return this.findOne({ code: code.toUpperCase() });
};
CouponSchema.statics.findValidCoupons = function (activeOnly = true) {
    const now = new Date();
    const query = {
        validFrom: { $lte: now },
        validUntil: { $gte: now }
    };
    if (activeOnly) {
        query.isActive = true;
    }
    return this.find(query).sort({ createdAt: -1 });
};
CouponSchema.statics.findByType = function (type, activeOnly = true) {
    const query = { type };
    if (activeOnly) {
        query.isActive = true;
    }
    return this.find(query).sort({ createdAt: -1 });
};
CouponSchema.pre('save', function (next) {
    const doc = this;
    if (doc.code) {
        doc.code = doc.code.toUpperCase();
    }
    if (doc.planCode) {
        doc.planCode = doc.planCode.toUpperCase();
    }
    if (doc.applicablePlans && Array.isArray(doc.applicablePlans) && doc.applicablePlans.length > 0) {
        doc.applicablePlans = doc.applicablePlans.map((plan) => typeof plan === 'string' ? plan.toUpperCase() : plan);
    }
    next();
});
exports.CouponModel = mongoose_1.default.model('Coupon', CouponSchema);
exports.default = exports.CouponModel;
