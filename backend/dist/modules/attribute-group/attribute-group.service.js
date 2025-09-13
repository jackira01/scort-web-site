"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateGroup = exports.removeVariant = exports.addVariant = exports.deleteAttributeGroup = exports.updateVariant = exports.getAttributeGroupByKey = exports.getAttributeGroups = exports.createAttributeGroup = void 0;
const attribute_group_model_1 = require("./attribute-group.model");
const createAttributeGroup = async (data) => {
    return await attribute_group_model_1.AttributeGroupModel.create(data);
};
exports.createAttributeGroup = createAttributeGroup;
const getAttributeGroups = async () => {
    return await attribute_group_model_1.AttributeGroupModel.find();
};
exports.getAttributeGroups = getAttributeGroups;
const getAttributeGroupByKey = async (key) => {
    return await attribute_group_model_1.AttributeGroupModel.findOne({ key });
};
exports.getAttributeGroupByKey = getAttributeGroupByKey;
const updateVariant = async ({ groupId, variantIndex, newValue, active }) => {
    const group = await attribute_group_model_1.AttributeGroupModel.findById(groupId);
    if (!group)
        throw new Error('Group not found');
    const variant = group.variants[variantIndex];
    if (!variant)
        throw new Error('Variant not found');
    if (newValue !== undefined)
        variant.value = newValue;
    if (active !== undefined)
        variant.active = active;
    await group.save();
    return group;
};
exports.updateVariant = updateVariant;
const deleteAttributeGroup = async (groupId) => {
    const group = await attribute_group_model_1.AttributeGroupModel.findById(groupId);
    if (!group)
        throw new Error('Group not found');
    return await attribute_group_model_1.AttributeGroupModel.findByIdAndDelete(groupId);
};
exports.deleteAttributeGroup = deleteAttributeGroup;
const addVariant = async (groupId, variant) => {
    const group = await attribute_group_model_1.AttributeGroupModel.findById(groupId);
    if (!group)
        throw new Error('Group not found');
    group.variants.push({ ...variant, active: true });
    await group.save();
    return group;
};
exports.addVariant = addVariant;
const removeVariant = async (groupId, variantIndex) => {
    const group = await attribute_group_model_1.AttributeGroupModel.findById(groupId);
    if (!group)
        throw new Error('Group not found');
    if (variantIndex < 0 || variantIndex >= group.variants.length) {
        throw new Error('Variant index out of bounds');
    }
    group.variants.splice(variantIndex, 1);
    await group.save();
    return group;
};
exports.removeVariant = removeVariant;
const updateGroup = async (groupId, data) => {
    const group = await attribute_group_model_1.AttributeGroupModel.findById(groupId);
    if (!group)
        throw new Error('Group not found');
    if (data.name !== undefined)
        group.name = data.name;
    if (data.key !== undefined)
        group.key = data.key;
    await group.save();
    return group;
};
exports.updateGroup = updateGroup;
