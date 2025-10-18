import mongoose, { Schema, Document, Model } from 'mongoose';

export type StackingPolicy = 'extend' | 'replace' | 'reject';
export type PositionRule = 'FRONT' | 'BACK' | 'BY_SCORE';

export interface UpgradeEffect {
    levelDelta?: number; // -1 sube un nivel (mejora)
    setLevelTo?: number; // si quieres que un upgrade salte directo a un nivel
    priorityBonus?: number; // suma al score dentro del nivel
    positionRule?: PositionRule; // cómo se inserta temporalmente
}

export interface IUpgradeDefinition extends Document {
    code: string;
    name: string;
    durationHours: number; // por default 24
    price: number; // precio del upgrade en pesos colombianos
    requires: string[]; // códigos de upgrades requeridos; ej. IMPULSO requiere DESTACADO
    stackingPolicy: StackingPolicy; // recomiendo extend
    effect: UpgradeEffect;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface IUpgradeDefinitionModel extends Model<IUpgradeDefinition> {
    findByCode(code: string): Promise<IUpgradeDefinition | null>;
    findByRequirement(requirementCode: string, activeOnly?: boolean): Promise<IUpgradeDefinition[]>;
}

const UpgradeEffectSchema = new Schema<UpgradeEffect>({
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

const UpgradeDefinitionSchema = new Schema<IUpgradeDefinition>({
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
    price: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    requires: {
        type: [String],
        default: [],
        validate: {
            validator: function (requires: string[]) {
                // Validar que no se requiera a sí mismo
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
            validator: function (effect: UpgradeEffect) {
                // Al menos uno de levelDelta o setLevelTo debe estar definido
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

// Índices
UpgradeDefinitionSchema.index({ code: 1 }, { unique: true });
UpgradeDefinitionSchema.index({ active: 1 });
UpgradeDefinitionSchema.index({ requires: 1 });

// Métodos estáticos
UpgradeDefinitionSchema.statics.findByCode = function (code: string) {
    return this.findOne({ code: code.toUpperCase() });
};

UpgradeDefinitionSchema.statics.findByRequirement = function (requirementCode: string, activeOnly: boolean = true) {
    const query = activeOnly
        ? { requires: requirementCode.toUpperCase(), active: true }
        : { requires: requirementCode.toUpperCase() };
    return this.find(query);
};

// Validación personalizada para evitar códigos duplicados
UpgradeDefinitionSchema.pre('save', async function (next) {
    if (this.isModified('code')) {
        const existing = await (this.constructor as IUpgradeDefinitionModel).findByCode(this.code);
        if (existing && existing._id?.toString() !== this._id?.toString()) {
            const error = new Error(`El código '${this.code}' ya existe`);
            return next(error);
        }
    }

    // Validar que los upgrades requeridos existan
    if (this.isModified('requires') && this.requires.length > 0) {
        for (const requiredCode of this.requires) {
            const requiredUpgrade = await (this.constructor as IUpgradeDefinitionModel).findByCode(requiredCode);
            if (!requiredUpgrade) {
                const error = new Error(`El upgrade requerido '${requiredCode}' no existe`);
                return next(error);
            }
        }
    }

    next();
});

// Validación para evitar dependencias circulares
UpgradeDefinitionSchema.methods.validateCircularDependency = async function (): Promise<boolean> {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = async (upgradeCode: string): Promise<boolean> => {
        if (recursionStack.has(upgradeCode)) {
            return true; // Ciclo detectado
        }

        if (visited.has(upgradeCode)) {
            return false; // Ya visitado, no hay ciclo en esta rama
        }

        visited.add(upgradeCode);
        recursionStack.add(upgradeCode);

        const upgrade = await (this.constructor as IUpgradeDefinitionModel).findByCode(upgradeCode);
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

export const UpgradeDefinitionModel = mongoose.model<IUpgradeDefinition, IUpgradeDefinitionModel>(
    'UpgradeDefinition',
    UpgradeDefinitionSchema
);