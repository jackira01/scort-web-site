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
exports.UpgradeDefinitionModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const UpgradeEffectSchema = new mongoose_1.Schema({
    levelDelta: {
        type: Number,
        min: -5,
        max: 5
    },
    setLevelTo: {
        type: Number,
        min: 1,
        max: 5
    },
    priorityBonus: {
        type: Number,
        default: 0
    },
    positionRule: {
        type: String,
        enum: ['FRONT', 'BACK', 'BY_SCORE'],
        default: 'BY_SCORE'
    }
}, { _id: false });
const UpgradeDefinitionSchema = new mongoose_1.Schema({
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
    durationHours: {
        type: Number,
        required: true,
        min: 1,
        default: 24
    },
    requires: {
        type: [String],
        default: [],
        validate: {
            validator: function (requires) {
                return !requires.includes(this.code);
            },
            message: 'Un upgrade no puede requerirse a sí mismo'
        }
    },
    stackingPolicy: {
        type: String,
        enum: ['extend', 'replace', 'reject'],
        required: true,
        default: 'extend'
    },
    effect: {
        type: UpgradeEffectSchema,
        required: true,
        validate: {
            validator: function (effect) {
                return effect.levelDelta !== undefined || effect.setLevelTo !== undefined || effect.priorityBonus !== undefined;
            },
            message: 'El efecto debe tener al menos levelDelta, setLevelTo o priorityBonus definido'
        }
    },
    active: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    collection: 'upgradedefinitions'
});
UpgradeDefinitionSchema.index({ code: 1 }, { unique: true });
UpgradeDefinitionSchema.index({ active: 1 });
UpgradeDefinitionSchema.index({ requires: 1 });
UpgradeDefinitionSchema.statics.findByCode = function (code) {
    return this.findOne({ code: code.toUpperCase() });
};
UpgradeDefinitionSchema.statics.findByRequirement = function (requirementCode, activeOnly = true) {
    const query = activeOnly
        ? { requires: requirementCode.toUpperCase(), active: true }
        : { requires: requirementCode.toUpperCase() };
    return this.find(query);
};
UpgradeDefinitionSchema.pre('save', async function (next) {
    if (this.isModified('code')) {
        const existing = await this.constructor.findByCode(this.code);
        if (existing && existing._id?.toString() !== this._id?.toString()) {
            const error = new Error(`El código '${this.code}' ya existe`);
            return next(error);
        }
    }
    if (this.isModified('requires') && this.requires.length > 0) {
        for (const requiredCode of this.requires) {
            const requiredUpgrade = await this.constructor.findByCode(requiredCode);
            if (!requiredUpgrade) {
                const error = new Error(`El upgrade requerido '${requiredCode}' no existe`);
                return next(error);
            }
        }
    }
    next();
});
UpgradeDefinitionSchema.methods.validateCircularDependency = async function () {
    const visited = new Set();
    const recursionStack = new Set();
    const hasCycle = async (upgradeCode) => {
        if (recursionStack.has(upgradeCode)) {
            return true;
        }
        if (visited.has(upgradeCode)) {
            return false;
        }
        visited.add(upgradeCode);
        recursionStack.add(upgradeCode);
        const upgrade = await this.constructor.findByCode(upgradeCode);
        if (upgrade && upgrade.requires) {
            for (const requiredCode of upgrade.requires) {
                if (await hasCycle(requiredCode)) {
                    return true;
                }
            }
        }
        recursionStack.delete(upgradeCode);
        return false;
    };
    return !(await hasCycle(this.code));
};
exports.UpgradeDefinitionModel = mongoose_1.default.model('UpgradeDefinition', UpgradeDefinitionSchema);
