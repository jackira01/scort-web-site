import type { Document } from 'mongoose';

export interface CreateAttributeGroupInput {
    name: string;
    key: string;
    variants: { label: string; value: string }[];
}

export interface UpdateVariantInput {
    groupId: string;
    variantIndex: number;
    newValue?: string;
    active?: boolean;
}

export interface Variant {
    label: string;  // Para mostrar al usuario
    value: string;  // Para lógica de negocio (normalizado, lowercase)
    active?: boolean;
}

export interface IAttributeGroup extends Document {
    name: string;
    key: string;
    variants: Variant[];
}
