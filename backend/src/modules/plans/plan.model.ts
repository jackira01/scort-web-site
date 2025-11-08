import mongoose, { Schema, Document, Model } from 'mongoose';

export interface PlanVariant {
    days: number;
    price: number;
    durationRank: number;
}

export interface PlanFeatures {
    showInHome: boolean;
    showInFilters: boolean;
    showInSponsored: boolean;
}

export interface ContentLimits {
    photos: {
        min: number;
        max: number;
    };
    videos: {
        min: number;
        max: number;
    };
    audios: {
        min: number;
        max: number;
    };
    storiesPerDayMax: number;
}

export interface IPlanDefinition extends Document {
    code: string;
    name: string;
    description?: string; // Descripción del plan (opcional)
    level: number; // 1..5; 1=DIAMANTE, 2=ORO, 3=ESMERALDA, 4=ZAFIRO, 5=AMATISTA
    variants: PlanVariant[];
    features: PlanFeatures;
    contentLimits: ContentLimits;
    includedUpgrades: string[]; // array de upgrade.code que vienen incluidos
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface IPlanDefinitionModel extends Model<IPlanDefinition> {
    findByLevel(level: number, activeOnly?: boolean): Promise<IPlanDefinition[]>;
    findByCode(code: string): Promise<IPlanDefinition | null>;
}

const PlanVariantSchema = new Schema<PlanVariant>({
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

const PlanFeaturesSchema = new Schema<PlanFeatures>({
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

const ContentLimitsSchema = new Schema<ContentLimits>({
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

const PlanDefinitionSchema = new Schema<IPlanDefinition>({
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
    description: {
        type: String,
        required: false,
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
            validator: function (variants: PlanVariant[]) {
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

// Virtual para compatibilidad con frontend (mapea 'active' a 'isActive')
PlanDefinitionSchema.virtual('isActive').get(function () {
    return this.active;
});

// Índices
PlanDefinitionSchema.index({ code: 1 }, { unique: true });
PlanDefinitionSchema.index({ level: 1, active: 1 });
PlanDefinitionSchema.index({ active: 1 });

// Métodos estáticos
PlanDefinitionSchema.statics.findByLevel = function (level: number, activeOnly: boolean = true) {
    const query = activeOnly ? { level, active: true } : { level };
    return this.find(query).sort({ level: 1 });
};

PlanDefinitionSchema.statics.findByCode = function (code: string) {
    return this.findOne({ code: code.toUpperCase() });
};

// Validación personalizada para evitar códigos duplicados
PlanDefinitionSchema.pre('save', async function (next) {
    if (this.isModified('code')) {
        const existing = await (this.constructor as IPlanDefinitionModel).findByCode(this.code);
        if (existing && existing._id?.toString() !== this._id?.toString()) {
            const error = new Error(`El código '${this.code}' ya existe`);
            return next(error);
        }
    }
    next();
});

export const PlanDefinitionModel = mongoose.model<IPlanDefinition, IPlanDefinitionModel>(
    'PlanDefinition',
    PlanDefinitionSchema
);