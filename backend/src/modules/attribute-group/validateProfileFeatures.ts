import type { Types } from 'mongoose';
import { AttributeGroupModel } from './attribute-group.model';

type FeatureInput = {
  group: Types.ObjectId | string;
  value: string;
};

/**
 * Valida una lista de features antes de guardar el perfil.
 * Verifica que el grupo exista y que el value esté entre sus variantes activas.
 */
export const validateProfileFeatures = async (features: FeatureInput[]) => {
  for (const feature of features) {
    const group = await AttributeGroupModel.findById(feature.group);

    if (!group) {
      throw new Error(
        `El grupo de atributo con ID "${feature.group}" no existe.`,
      );
    }

    const isValidVariant = group.variants.some(
      (variant) => variant.value === feature.value && variant.active,
    );

    if (!isValidVariant) {
      throw new Error(
        `El valor "${feature.value}" no es válido o está inactivo para el grupo "${group.name}".`,
      );
    }
  }

  return true;
};
