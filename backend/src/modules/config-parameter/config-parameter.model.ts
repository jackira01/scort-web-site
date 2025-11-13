import mongoose, { Schema, Types } from 'mongoose';
import type {
    ConfigMetadata,
    ConfigParameterType,
    IConfigParameter,
    IConfigParameterModel,
} from './config-parameter.types';

const ConfigMetadataSchema = new Schema<ConfigMetadata>(
    {
        description: { type: String },
        validation: { type: Schema.Types.Mixed },
        ui_config: {
            component: { type: String },
            editable: { type: Boolean, default: true },
            hierarchical: { type: Boolean, default: false },
            translatable: { type: Boolean, default: false },
            rich_text: { type: Boolean, default: false },
            price_editable: { type: Boolean, default: false },
            feature_management: { type: Boolean, default: false },
            custom_props: { type: Schema.Types.Mixed },
        },
        cache_ttl: { type: Number, default: 3600 }, // TTL en segundos
        requires_restart: { type: Boolean, default: false },
        environment: {
            type: String,
            enum: ['development', 'production', 'all'],
            default: 'all',
        },
    },
    { _id: false },
);

const ConfigParameterSchema = new Schema<IConfigParameter>(
    {
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
                'system',
                'app',
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
            type: Schema.Types.Mixed,
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
            type: Schema.Types.ObjectId,
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
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    },
);

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
ConfigParameterSchema.statics.findByCategory = function (
    category: string,
    activeOnly: boolean = true,
) {
    const query: any = { category };
    if (activeOnly) {
        query.isActive = true;
    }
    return this.find(query).sort({ name: 1 });
};

// Método estático para obtener por tipo
ConfigParameterSchema.statics.findByType = function (
    type: ConfigParameterType,
    activeOnly: boolean = true,
) {
    const query: any = { type };
    if (activeOnly) {
        query.isActive = true;
    }
    return this.find(query).sort({ category: 1, name: 1 });
};

// Método estático para búsqueda por tags
ConfigParameterSchema.statics.findByTags = function (
    tags: string[],
    activeOnly: boolean = true,
) {
    const query: any = { tags: { $in: tags } };
    if (activeOnly) {
        query.isActive = true;
    }
    return this.find(query).sort({ category: 1, name: 1 });
};

// Métodos lean para mejor rendimiento
ConfigParameterSchema.statics.findByCategoryLean = function (
    category: string,
    activeOnly: boolean = true,
) {
    const query: any = { category };
    if (activeOnly) {
        query.isActive = true;
    }
    return this.find(query).lean().sort({ name: 1 });
};

ConfigParameterSchema.statics.findByTypeLean = function (
    type: ConfigParameterType,
    activeOnly: boolean = true,
) {
    const query: any = { type };
    if (activeOnly) {
        query.isActive = true;
    }
    return this.find(query).lean().sort({ category: 1, name: 1 });
};

ConfigParameterSchema.statics.findByTagsLean = function (
    tags: string[],
    activeOnly: boolean = true,
) {
    const query: any = { tags: { $in: tags } };
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

    const dependentParams = await (
        this.constructor as IConfigParameterModel
    ).find({
        key: { $in: this.dependencies },
        isActive: true,
    });

    return dependentParams.length === this.dependencies.length;
};

export const ConfigParameterModel = mongoose.model<
    IConfigParameter,
    IConfigParameterModel
>('ConfigParameter', ConfigParameterSchema);
