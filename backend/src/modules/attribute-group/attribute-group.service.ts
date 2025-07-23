import { AttributeGroupModel } from './attribute-group.model';
import type { CreateAttributeGroupInput, UpdateVariantInput } from './attribute-group.types';

export const createAttributeGroup = async (data: CreateAttributeGroupInput) => {
    return await AttributeGroupModel.create(data);
};

export const getAttributeGroups = async () => {
    return await AttributeGroupModel.find();
};

export const getAttributeGroupByKey = async (key: string) => {
    return await AttributeGroupModel.findOne({ key });
};

export const updateVariant = async ({ groupId, variantIndex, newValue, active }: UpdateVariantInput) => {
    const group = await AttributeGroupModel.findById(groupId);
    if (!group) throw new Error('Group not found');

    const variant = group.variants[variantIndex];
    if (!variant) throw new Error('Variant not found');

    if (newValue !== undefined) variant.value = newValue;
    if (active !== undefined) variant.active = active;

    await group.save();
    return group;
};
