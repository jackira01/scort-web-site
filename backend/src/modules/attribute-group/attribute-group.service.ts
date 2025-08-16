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

export const deleteAttributeGroup = async (groupId: string) => {
    const group = await AttributeGroupModel.findById(groupId);
    if (!group) throw new Error('Group not found');
    
    return await AttributeGroupModel.findByIdAndDelete(groupId);
};

export const addVariant = async (groupId: string, variant: { label: string; value: string }) => {
    const group = await AttributeGroupModel.findById(groupId);
    if (!group) throw new Error('Group not found');
    
    group.variants.push({ ...variant, active: true });
    await group.save();
    return group;
};

export const removeVariant = async (groupId: string, variantIndex: number) => {
    const group = await AttributeGroupModel.findById(groupId);
    if (!group) throw new Error('Group not found');
    
    if (variantIndex < 0 || variantIndex >= group.variants.length) {
        throw new Error('Variant index out of bounds');
    }
    
    group.variants.splice(variantIndex, 1);
    await group.save();
    return group;
};

export const updateGroup = async (groupId: string, data: { name?: string; key?: string }) => {
    const group = await AttributeGroupModel.findById(groupId);
    if (!group) throw new Error('Group not found');
    
    if (data.name !== undefined) group.name = data.name;
    if (data.key !== undefined) group.key = data.key;
    
    await group.save();
    return group;
};
