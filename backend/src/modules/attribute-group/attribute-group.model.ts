import mongoose, { Schema } from 'mongoose';
import type { IAttributeGroup, Variant } from './attribute-group.types';

const VariantSchema = new Schema<Variant>({
    label: { type: String, required: true },  // Para mostrar al usuario
    value: { 
        type: String, 
        required: true,
        set: (val: string) => val.toLowerCase().trim()  // Auto-normalización
    },
    active: { type: Boolean, default: true },
});

const AttributeGroupSchema = new Schema<IAttributeGroup>(
    {
        name: { type: String, required: true },
        key: { type: String, required: true, unique: true },
        variants: { type: [VariantSchema], default: [] },
    },
    { timestamps: true },
);

export const AttributeGroupModel = mongoose.model<IAttributeGroup>(
    'AttributeGroup',
    AttributeGroupSchema,
);
