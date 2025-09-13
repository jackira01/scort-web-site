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
exports.PlanDefinitionModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const PlanVariantSchema = new mongoose_1.Schema({
    days: {
        type: Number,
        required: true,
        min: 1
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    durationRank: {
        type: Number,
        required: true,
        min: 0
    }
}, { _id: false });
const PlanFeaturesSchema = new mongoose_1.Schema({
    showInHome: {
        type: Boolean,
        required: true,
        default: false
    },
    showInFilters: {
        type: Boolean,
        required: true,
        default: false
    },
    showInSponsored: {
        type: Boolean,
        required: true,
        default: false
    }
}, { _id: false });
const ContentLimitsSchema = new mongoose_1.Schema({
    photos: {
        min: {
            type: Number,
            required: true,
            min: 0
        },
        max: {
            type: Number,
            required: true,
            min: 0
        }
    },
    videos: {
        min: {
            type: Number,
            required: true,
            min: 0
        },
        max: {
            type: Number,
            required: true,
            min: 0
        }
    },
    audios: {
        min: {
            type: Number,
            required: true,
            min: 0
        },
        max: {
            type: Number,
            required: true,
            min: 0
        }
    },
    storiesPerDayMax: {
        type: Number,
        required: true,
        min: 0
    }
}, { _id: false });
const PlanDefinitionSchema = new mongoose_1.Schema({
    code: {
        type: String,
        required: true,
        trim: true,
        uppercase: true,
        match: /^[A-Z_]+$/
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    level: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    variants: {
        type: [PlanVariantSchema],
        required: true,
        validate: {
            validator: function (variants) {
                return variants && variants.length > 0;
            },
            message: 'Al menos una variante es requerida'
        }
    },
    features: {
        type: PlanFeaturesSchema,
        required: true
    },
    contentLimits: {
        type: ContentLimitsSchema,
        required: true
    },
    includedUpgrades: {
        type: [String],
        default: []
    },
    active: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});
PlanDefinitionSchema.virtual('isActive').get(function () {
    return this.active;
});
PlanDefinitionSchema.index({ code: 1 }, { unique: true });
PlanDefinitionSchema.index({ level: 1, active: 1 });
PlanDefinitionSchema.index({ active: 1 });
PlanDefinitionSchema.statics.findByLevel = function (level, activeOnly = true) {
    const query = activeOnly ? { level, active: true } : { level };
    return this.find(query).sort({ level: 1 });
};
PlanDefinitionSchema.statics.findByCode = function (code) {
    return this.findOne({ code: code.toUpperCase() });
};
PlanDefinitionSchema.pre('save', async function (next) {
    if (this.isModified('code')) {
        const existing = await this.constructor.findByCode(this.code);
        if (existing && existing._id?.toString() !== this._id?.toString()) {
            const error = new Error(`El código '${this.code}' ya existe`);
            return next(error);
        }
    }
    next();
});
exports.PlanDefinitionModel = mongoose_1.default.model('PlanDefinition', PlanDefinitionSchema);
