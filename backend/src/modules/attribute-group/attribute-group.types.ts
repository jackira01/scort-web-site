import type { Document } from 'mongoose';

export interface CreateAttributeGroupInput {
    name: string;
    key: string;
    variants: { value: string }[];
}

export interface UpdateVariantInput {
    groupId: string;
    variantIndex: number;
    newValue?: string;
    active?: boolean;
}

export interface Variant {
    value: string;
    active?: boolean;
}

export interface IAttributeGroup extends Document {
    name: string;
    key: string;
    variants: Variant[];
}
