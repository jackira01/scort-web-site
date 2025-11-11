import { AttributeGroupModel } from './attribute-group.model';
import type { CreateAttributeGroupInput, UpdateVariantInput } from './attribute-group.types';

export const createAttributeGroup = async (data: CreateAttributeGroupInput) => {
    return await AttributeGroupModel.create(data);
};

export const getAttributeGroups = async () => {
    const groups = await AttributeGroupModel.find();

    // Ordenar variants alfabéticamente por label
    return groups.map(group => {
        const groupObj = group.toObject();
        if (groupObj.variants && Array.isArray(groupObj.variants)) {
            groupObj.variants.sort((a, b) => {
                const labelA = a.label?.toLowerCase() || '';
                const labelB = b.label?.toLowerCase() || '';
                return labelA.localeCompare(labelB, 'es', { sensitivity: 'base' });
            });
        }
        return groupObj;
    });
};

export const getAttributeGroupByKey = async (key: string) => {
    return await AttributeGroupModel.findOne({ key });
};

export const updateVariant = async ({ groupId, variantValue, newValue, newLabel, active }: UpdateVariantInput) => {
    const group = await AttributeGroupModel.findById(groupId);
    if (!group) throw new Error('Group not found');

    // Buscar la variante por su value actual
    const variant = group.variants.find(v => v.value === variantValue);
    if (!variant) throw new Error('Variant not found');

    if (newValue !== undefined) variant.value = newValue;
    if (newLabel !== undefined) variant.label = newLabel;
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

export const removeVariant = async (groupId: string, variantValue: string) => {
    const group = await AttributeGroupModel.findById(groupId);
    if (!group) throw new Error('Group not found');

    // Buscar el índice de la variante por su value (identificador único)
    const variantIndex = group.variants.findIndex(v => v.value === variantValue);

    if (variantIndex === -1) {
        throw new Error('Variant not found');
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
