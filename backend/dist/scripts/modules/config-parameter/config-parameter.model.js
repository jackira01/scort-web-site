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
exports.ConfigParameterModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const ConfigMetadataSchema = new mongoose_1.Schema({
    description: { type: String },
    validation: { type: mongoose_1.Schema.Types.Mixed },
    ui_config: {
        component: { type: String },
        editable: { type: Boolean, default: true },
        hierarchical: { type: Boolean, default: false },
        translatable: { type: Boolean, default: false },
        rich_text: { type: Boolean, default: false },
        price_editable: { type: Boolean, default: false },
        feature_management: { type: Boolean, default: false },
        custom_props: { type: mongoose_1.Schema.Types.Mixed },
    },
    cache_ttl: { type: Number, default: 3600 }, // TTL en segundos
    requires_restart: { type: Boolean, default: false },
    environment: {
        type: String,
        enum: ['development', 'production', 'all'],
        default: 'all',
    },
}, { _id: false });
const ConfigParameterSchema = new mongoose_1.Schema({
    key: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        match: /^[a-z0-9_.-]+$/,
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    type: {
        type: String,
        required: true,
        enum: [
            'location',
            'text',
            'membership',
            'number',
            'boolean',
            'array',
            'object',
            'json',
        ],
    },
    category: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
    },
    value: {
        type: mongoose_1.Schema.Types.Mixed,
        required: true,
    },
    metadata: {
        type: ConfigMetadataSchema,
        default: () => ({}),
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    version: {
        type: Number,
        default: 1,
    },
    lastModified: {
        type: Date,
        default: Date.now,
    },
    modifiedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    tags: [
        {
            type: String,
            trim: true,
            lowercase: true,
        },
    ],
    dependencies: [
        {
            type: String,
            trim: true,
        },
    ], // Keys de otros parámetros de los que depende
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
// Índices para optimizar consultas
// Nota: El índice para 'key' se crea automáticamente por unique: true
ConfigParameterSchema.index({ category: 1, isActive: 1 });
ConfigParameterSchema.index({ type: 1, isActive: 1 });
ConfigParameterSchema.index({ tags: 1 });
ConfigParameterSchema.index({ lastModified: -1 });
// Middleware para actualizar version y lastModified
ConfigParameterSchema.pre('save', function (next) {
    if (this.isModified('value') && !this.isNew) {
        this.version += 1;
        this.lastModified = new Date();
    }
    next();
});
// Virtual para obtener el historial de versiones (si se implementa)
ConfigParameterSchema.virtual('hasHistory').get(function () {
    return this.version > 1;
});
// Método estático para obtener por categoría
ConfigParameterSchema.statics.findByCategory = function (category, activeOnly = true) {
    const query = { category };
    if (activeOnly) {
        query.isActive = true;
    }
    return this.find(query).sort({ name: 1 });
};
// Método estático para obtener por tipo
ConfigParameterSchema.statics.findByType = function (type, activeOnly = true) {
    const query = { type };
    if (activeOnly) {
        query.isActive = true;
    }
    return this.find(query).sort({ category: 1, name: 1 });
};
// Método estático para búsqueda por tags
ConfigParameterSchema.statics.findByTags = function (tags, activeOnly = true) {
    const query = { tags: { $in: tags } };
    if (activeOnly) {
        query.isActive = true;
    }
    return this.find(query).sort({ category: 1, name: 1 });
};
// Métodos lean para mejor rendimiento
ConfigParameterSchema.statics.findByCategoryLean = function (category, activeOnly = true) {
    const query = { category };
    if (activeOnly) {
        query.isActive = true;
    }
    return this.find(query).lean().sort({ name: 1 });
};
ConfigParameterSchema.statics.findByTypeLean = function (type, activeOnly = true) {
    const query = { type };
    if (activeOnly) {
        query.isActive = true;
    }
    return this.find(query).lean().sort({ category: 1, name: 1 });
};
ConfigParameterSchema.statics.findByTagsLean = function (tags, activeOnly = true) {
    const query = { tags: { $in: tags } };
    if (activeOnly) {
        query.isActive = true;
    }
    return this.find(query).lean().sort({ category: 1, name: 1 });
};
// Método para validar dependencias
ConfigParameterSchema.methods.validateDependencies = async function () {
    if (!this.dependencies || this.dependencies.length === 0) {
        return true;
    }
    const dependentParams = await this.constructor.find({
        key: { $in: this.dependencies },
        isActive: true,
    });
    return dependentParams.length === this.dependencies.length;
};
exports.ConfigParameterModel = mongoose_1.default.model('ConfigParameter', ConfigParameterSchema);
