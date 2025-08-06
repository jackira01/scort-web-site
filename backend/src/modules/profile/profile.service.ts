import { validateProfileFeatures } from '../attribute-group/validateProfileFeatures';
import { createProfileVerification } from '../profile-verification/profile-verification.service';
import UserModel from '../user/User.model';
import { ProfileModel } from './profile.model';
import type { CreateProfileDTO } from './profile.types';

export const checkProfileNameExists = async (name: string) => {
  const profile = await ProfileModel.findOne({ name });
  if (profile) {
    return {
      user: profile.user,
      exists: true,
      message: 'El nombre del perfil ya está en uso',
    };
  }
  return {
    user: null,
    exists: false,
    message: 'El nombre del perfil no está en uso',
  };
};

export const createProfile = async (data: CreateProfileDTO) => {
  await validateProfileFeatures(data.features);

  // profile name can exist
  /*   const { exists, message } = await checkProfileNameExists(data.name);
    if (exists) {
      throw new Error(message);
    } */

  const profile = await ProfileModel.create(data);

  // Agregar el perfil al array de profiles del usuario
  await UserModel.findByIdAndUpdate(
    data.user,
    { $push: { profiles: profile._id } },
    { new: true },
  );

  // Crear automáticamente una verificación de perfil
  try {
    const verification = await createProfileVerification({
      profile: (profile._id as any).toString(),
      verificationStatus: 'pending',
    });

    // Actualizar el perfil con la referencia a la verificación
    if (verification && verification._id) {
      await ProfileModel.findByIdAndUpdate(
        profile._id,
        { verification: verification._id },
        { new: true },
      );
    }
  } catch (error) {
    console.warn('Error al crear verificación automática:', error);
    // No fallar la creación del perfil si falla la verificación
  }

  return profile;
};

export const getProfiles = async () => {
  return ProfileModel.find().populate('user');
};

export const getProfileById = async (id: string) => {
  const profile = await ProfileModel.findById(id)
    .populate('user')
    .populate('features.group_id');

  if (!profile) {
    return null;
  }

  // Transformar los features al formato requerido
  const transformedProfile = profile.toObject();
  
  // Separar servicios del resto de features
  const services: string[] = [];
  const otherFeatures: any[] = [];
  
  profile.features.forEach((feature: any) => {
    // Verificar que el populate funcionó correctamente
    if (!feature.group_id || typeof feature.group_id === 'string') {
      console.warn('Feature group_id not populated properly:', feature);
      otherFeatures.push({
        group_id: feature.group_id,
        value: feature.value,
        groupName: 'Unknown',
      });
      return;
    }

    const transformedFeature = {
      group_id: feature.group_id._id,
      value: feature.value,
      groupName: feature.group_id.name,
    };

    // Si el groupName es 'Servicios', agregarlo al array de services
    if (feature.group_id.name === 'Servicios') {
      services.push(...feature.value);
    } else {
      otherFeatures.push(transformedFeature);
    }
  });
  
  transformedProfile.features = otherFeatures;
  transformedProfile.services = services;

  return transformedProfile;
};

export const updateProfile = async (
  id: string,
  data: Partial<CreateProfileDTO>,
) => {
  return ProfileModel.findByIdAndUpdate(id, data, { new: true });
};

export const deleteProfile = async (id: string) => {
  return ProfileModel.findByIdAndDelete(id);
};

// Función para crear verificaciones para perfiles existentes que no las tienen
export const createMissingVerifications = async () => {
  try {
    // Buscar perfiles que no tienen verificación
    const profilesWithoutVerification = await ProfileModel.find({
      verification: { $in: [null, undefined] },
    });

    console.log(
      `Encontrados ${profilesWithoutVerification.length} perfiles sin verificación`,
    );

    const results: any[] = [];
    for (const profile of profilesWithoutVerification) {
      try {
        const verification = await createProfileVerification({
          profile: String(profile._id),
          verificationStatus: 'pending',
        });

        if (!verification || !verification._id) {
          throw new Error('No se pudo crear la verificación');
        }

        // Actualizar el perfil con la referencia a la verificación
        await ProfileModel.findByIdAndUpdate(
          profile._id,
          { verification: verification._id },
          { new: true },
        );

        results.push({
          profileId: profile._id,
          profileName: profile.name,
          verificationId: verification._id,
          status: 'created',
        });

        console.log(`Verificación creada para perfil: ${profile.name}`);
      } catch (error: any) {
        console.error(
          `Error creando verificación para perfil ${profile.name}:`,
          error,
        );
        results.push({
          profileId: profile._id,
          profileName: profile.name,
          status: 'error',
          error: error?.message || 'Error desconocido',
        });
      }
    }

    return {
      total: profilesWithoutVerification.length,
      created: results.filter((r) => r.status === 'created').length,
      errors: results.filter((r) => r.status === 'error').length,
      results,
    };
  } catch (error: any) {
    throw new Error(
      `Error al crear verificaciones faltantes: ${error?.message || error}`,
    );
  }
};
