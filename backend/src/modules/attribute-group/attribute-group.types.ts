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
