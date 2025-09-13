"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateProfileFeatures = void 0;
const attribute_group_model_1 = require("./attribute-group.model");
const validateProfileFeatures = async (features) => {
    for (const feature of features) {
        const group = await attribute_group_model_1.AttributeGroupModel.findById(feature.group_id);
        if (!group) {
            throw new Error(`El grupo de atributo con ID "${feature.group_id}" no existe.`);
        }
        for (const val of feature.value) {
            const isValidVariant = group.variants.some((variant) => variant.value === val.toLowerCase().trim() && variant.active);
            if (!isValidVariant) {
                throw new Error(`El valor "${val}" no es válido o está inactivo para el grupo "${group.name}".`);
            }
        }
    }
    return true;
};
exports.validateProfileFeatures = validateProfileFeatures;
