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
const mongoose_1 = __importStar(require("mongoose"));
const invoiceItemSchema = new mongoose_1.Schema({
    type: {
        type: String,
        enum: ['plan', 'upgrade'],
        required: true
    },
    code: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    days: {
        type: Number
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
        default: 1
    }
}, { _id: false });
const invoiceSchema = new mongoose_1.Schema({
    profileId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Profile',
        required: true
    },
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'paid', 'cancelled', 'expired'],
        default: 'pending',
        required: true
    },
    items: {
        type: [invoiceItemSchema],
        required: true,
        validate: {
            validator: function (items) {
                return items && items.length > 0;
            },
            message: 'Invoice must have at least one item'
        }
    },
    totalAmount: {
        type: Number,
        required: true,
        min: 0
    },
    coupon: {
        code: { type: String },
        name: { type: String },
        type: {
            type: String,
            enum: ['percentage', 'fixed_amount', 'plan_assignment']
        },
        value: { type: Number },
        originalAmount: { type: Number },
        discountAmount: { type: Number },
        finalAmount: { type: Number },
        _id: false
    },
    expiresAt: {
        type: Date,
        required: true
    },
    paidAt: {
        type: Date
    },
    cancelledAt: {
        type: Date
    },
    paymentMethod: {
        type: String,
        maxlength: 100
    },
    paymentData: {
        type: mongoose_1.Schema.Types.Mixed
    },
    cancellationReason: {
        type: String,
        maxlength: 500
    },
    notes: {
        type: String,
        maxlength: 500
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});
invoiceSchema.virtual('isExpired').get(function () {
    return this.status === 'pending' && new Date() > this.expiresAt;
});
invoiceSchema.index({ profileId: 1, status: 1 });
invoiceSchema.index({ userId: 1, status: 1 });
invoiceSchema.index({ expiresAt: 1, status: 1 });
invoiceSchema.index({ createdAt: -1 });
invoiceSchema.pre('save', function (next) {
    if (this.isModified('items')) {
        this.totalAmount = this.items.reduce((total, item) => {
            return total + (item.price * item.quantity);
        }, 0);
    }
    next();
});
exports.default = mongoose_1.default.model('Invoice', invoiceSchema);
