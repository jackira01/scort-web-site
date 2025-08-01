import mongoose, { Schema } from 'mongoose';
import type { IAttributeGroup, Variant } from './attribute-group.types';

const VariantSchema = new Schema<Variant>({
    value: { type: String, required: true },
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
