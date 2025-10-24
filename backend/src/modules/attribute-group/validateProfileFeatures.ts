import type { Types } from 'mongoose';
import { AttributeGroupModel } from './attribute-group.model';
import type { AttributeValue } from '../profile/profile.types';

type FeatureInput = {
  group_id: Types.ObjectId | string;
  value: AttributeValue[]; // Ahora acepta string o { key: string; label: string }
};

/**
 * Valida una lista de features antes de guardar el perfil.
 * Verifica que el grupo exista y que cada valor esté entre sus variantes activas.
 */
export const validateProfileFeatures = async (features: FeatureInput[]) => {
  // Debug: features

  for (const feature of features) {
    const group = await AttributeGroupModel.findById(feature.group_id);

    if (!group) {
      throw new Error(
        `El grupo de atributo con ID "${feature.group_id}" no existe.`,
      );
    }

    for (const val of feature.value) {
      // Extraer el key si es un objeto, o usar el string directamente
      const valueToValidate: string = typeof val === 'object' && val !== null && 'key' in val
        ? val.key
        : val as string;

      const isValidVariant = group.variants.some(
        (variant) => variant.value === valueToValidate.toLowerCase().trim() && variant.active,
      );

      if (!isValidVariant) {
        throw new Error(
          `El valor "${valueToValidate}" no es válido o está inactivo para el grupo "${group.name}".`,
        );
      }
    }
  }

  return true;
};
