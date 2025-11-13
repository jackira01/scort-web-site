import { Schema, model, Types, Model } from 'mongoose';
import type { ILocation } from './location.types';

const LocationSchema = new Schema<ILocation>(
    {
        value: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
            index: true
        },
        label: {
            type: String,
            required: true,
            trim: true
        },
        type: {
            type: String,
            enum: ['country', 'department', 'city', 'locality'],
            required: true,
            index: true
        },
        parentId: {
            type: Schema.Types.ObjectId as any,
            ref: 'Location',
            index: true,
            required: false
        },
        path: {
            type: String,
            index: true,
            unique: true
        },
        level: {
            type: Number,
            min: 0,
            index: true
        },
        ancestorIds: [{
            type: Schema.Types.ObjectId as any,
            ref: 'Location'
        }],
        isActive: {
            type: Boolean,
            default: true,
            index: true
        },
        hasChildren: {
            type: Boolean,
            default: false
        },
        order: {
            type: Number,
            default: 0
        }
    },
    {
        timestamps: true,
        collection: 'locations'
    }
);

// Índices compuestos para búsquedas eficientes
LocationSchema.index({ type: 1, parentId: 1, isActive: 1 });
LocationSchema.index({ value: 1, parentId: 1 }, { unique: true });
LocationSchema.index({ path: 1 }, { unique: true });
LocationSchema.index({ level: 1, isActive: 1 });
LocationSchema.index({ ancestorIds: 1 });

// Middleware: Calcular campos de jerarquía antes de guardar
LocationSchema.pre('save', async function (next) {
    if (this.isNew || this.isModified('parentId')) {
        try {
            if (!this.parentId) {
                // Es el país (raíz)
                this.level = 0;
                this.path = this.value;
                this.ancestorIds = [];
            } else {
                // Obtener el padre
                const parent = await LocationModel.findById(this.parentId);
                if (!parent) {
                    throw new Error('Parent location not found');
                }

                this.level = parent.level + 1;
                this.path = `${parent.path}/${this.value}`;
                this.ancestorIds = [...parent.ancestorIds, parent._id];

                // Actualizar hasChildren del padre
                await LocationModel.updateOne(
                    { _id: this.parentId },
                    { hasChildren: true }
                );
            }
            next();
        } catch (error) {
            next(error as any);
        }
    } else {
        next();
    }
});

// Middleware: Al eliminar (soft delete), actualizar el padre
LocationSchema.post('findOneAndUpdate', async function (doc: any) {
    if (doc && doc.isActive === false && doc.parentId) {
        const activeChildrenCount = await LocationModel.countDocuments({
            parentId: doc.parentId,
            isActive: true
        });

        await LocationModel.updateOne(
            { _id: doc.parentId },
            {
                hasChildren: activeChildrenCount > 0
            }
        );
    }
});

export const LocationModel: Model<ILocation> = model<ILocation>('Location', LocationSchema);
