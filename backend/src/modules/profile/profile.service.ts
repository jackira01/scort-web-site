import { validateProfileFeatures } from '../attribute-group/validateProfileFeatures';
import { createProfileVerification } from '../profile-verification/profile-verification.service';
import UserModel from '../user/User.model';
import { ProfileModel } from './profile.model';
import type { CreateProfileDTO } from './profile.types';
import { PlanDefinitionModel } from '../plans/plan.model';
import { UpgradeDefinitionModel } from '../plans/upgrade.model';

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
  // Profile creation debug removed
  
  await validateProfileFeatures(data.features);

  // profile name can exist
  /*   const { exists, message } = await checkProfileNameExists(data.name);
    if (exists) {
      throw new Error(message);
    } */

  const profile = await ProfileModel.create(data);
  // Profile created successfully

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
    // Error al crear verificación automática
    // No fallar la creación del perfil si falla la verificación
  }

  return profile;
};

export const getProfiles = async (page: number = 1, limit: number = 10, fields?: string) => {
  const skip = (page - 1) * limit;
  
  // Construir la query base
  let query = ProfileModel.find()
    .populate('user')
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });
  
  // Aplicar selección de campos si se especifica
  if (fields) {
    // Convertir string separado por comas a formato de Mongoose
    const fieldsArray = fields.split(',').map(field => field.trim());
    const selectFields = fieldsArray.join(' ');
    query = query.select(selectFields) as any;
  }
  
  const [profiles, totalCount] = await Promise.all([
    query.exec(),
    ProfileModel.countDocuments()
  ]);
  
  const totalPages = Math.ceil(totalCount / limit);
  
  return {
    docs: profiles,
    totalCount,
    currentPage: page,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
    limit
  };
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
      // Feature group_id not populated properly
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
  // Si se está actualizando el campo media, hacer merge con los datos existentes
  if (data.media) {
    const existingProfile = await ProfileModel.findById(id);
    if (existingProfile && existingProfile.media) {
      // Hacer merge del campo media preservando los datos existentes
      data.media = {
        gallery: data.media.gallery || existingProfile.media.gallery || [],
        videos: data.media.videos || existingProfile.media.videos || [],
        audios: data.media.audios || existingProfile.media.audios || [],
        stories: data.media.stories || existingProfile.media.stories || [],
      };
    }
  }
  
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

    // Encontrados perfiles sin verificación

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

        // Verificación creada para perfil
      } catch (error: any) {
        // Error creando verificación para perfil
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

export const getProfilesWithStories = async (page: number = 1, limit: number = 10) => {
  const skip = (page - 1) * limit;
  
  // Filtrar perfiles que tengan al menos una historia en media.stories
  // Solo seleccionar los campos necesarios: _id, name, media
  const query = ProfileModel.find({
    'media.stories': { $exists: true, $ne: [] },
    isActive: true
  })
    .select('_id name media')
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  const countQuery = ProfileModel.countDocuments({
    'media.stories': { $exists: true, $ne: [] },
    isActive: true
  });

  const [profiles, total] = await Promise.all([query.exec(), countQuery]);

  return {
    profiles,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

// Nuevas funciones para suscripción y upgrades
export const subscribeProfile = async (profileId: string, planCode: string, variantDays: number) => {
  // Validar que el plan y variante existen
  const plan = await PlanDefinitionModel.findOne({ code: planCode });
  if (!plan) {
    throw new Error(`Plan con código ${planCode} no encontrado`);
  }

  const variant = plan.variants.find(v => v.days === variantDays);
  if (!variant) {
    throw new Error(`Variante de ${variantDays} días no encontrada para el plan ${planCode}`);
  }

  const profile = await ProfileModel.findById(profileId);
  if (!profile) {
    throw new Error('Perfil no encontrado');
  }

  // Reglas de negocio: máximo 3 AMATISTA visibles por usuario
  if (planCode === 'AMATISTA') {
    const amatistaCount = await ProfileModel.countDocuments({
      user: profile.user,
      visible: true,
      'planAssignment.planCode': 'AMATISTA'
    });
    if (amatistaCount >= 3) {
      throw new Error('Máximo 3 perfiles AMATISTA visibles por usuario');
    }
  }

  // Regla de negocio: máximo 10 perfiles con plan pago por usuario
  if (planCode !== 'AMATISTA') {
    const paidPlansCount = await ProfileModel.countDocuments({
      user: profile.user,
      'planAssignment.planCode': { $ne: 'AMATISTA' },
      'planAssignment.expiresAt': { $gt: new Date() }
    });
    if (paidPlansCount >= 10) {
      throw new Error('Máximo 10 perfiles con plan pago por usuario');
    }
  }

  // Calcular fechas
  const startAt = new Date();
  const expiresAt = new Date(startAt.getTime() + (variantDays * 24 * 60 * 60 * 1000));

  // Actualizar perfil
  const updatedProfile = await ProfileModel.findByIdAndUpdate(
    profileId,
    {
      planAssignment: {
        planCode,
        variantDays,
        startAt,
        expiresAt
      },
      visible: true
    },
    { new: true }
  );

  return updatedProfile;
};

export const purchaseUpgrade = async (profileId: string, upgradeCode: string) => {
  // Validar que el upgrade existe
  const upgrade = await UpgradeDefinitionModel.findOne({ code: upgradeCode });
  if (!upgrade) {
    throw new Error(`Upgrade con código ${upgradeCode} no encontrado`);
  }

  const profile = await ProfileModel.findById(profileId);
  if (!profile) {
    throw new Error('Perfil no encontrado');
  }

  // Verificar que el perfil tiene un plan activo
  if (!profile.planAssignment || profile.planAssignment.expiresAt < new Date()) {
    const error = new Error('No se pueden comprar upgrades sin un plan activo');
    (error as any).status = 409;
    throw error;
  }

  // Verificar dependencias (upgrades requeridos)
  if (upgrade.requires && upgrade.requires.length > 0) {
    const now = new Date();
    const activeUpgrades = profile.upgrades.filter(u => u.endAt > now);
    const activeUpgradeCodes = activeUpgrades.map(u => u.code);
    
    const missingRequirements = upgrade.requires.filter(req => !activeUpgradeCodes.includes(req));
    if (missingRequirements.length > 0) {
      throw new Error(`Upgrades requeridos no activos: ${missingRequirements.join(', ')}`);
    }
  }

  const now = new Date();
  const endAt = new Date(now.getTime() + (upgrade.durationHours * 60 * 60 * 1000));

  // Verificar si ya existe un upgrade activo del mismo tipo
  const existingUpgradeIndex = profile.upgrades.findIndex(
    u => u.code === upgradeCode && u.endAt > now
  );

  // Aplicar stacking policy
  switch (upgrade.stackingPolicy) {
    case 'reject':
      if (existingUpgradeIndex !== -1) {
        const error = new Error('Upgrade ya activo');
        (error as any).status = 409;
        throw error;
      }
      break;
      
    case 'replace':
      if (existingUpgradeIndex !== -1) {
        profile.upgrades.splice(existingUpgradeIndex, 1);
      }
      break;
      
    case 'extend':
      if (existingUpgradeIndex !== -1) {
        const existingUpgrade = profile.upgrades[existingUpgradeIndex];
        existingUpgrade.endAt = new Date(existingUpgrade.endAt.getTime() + (upgrade.durationHours * 60 * 60 * 1000));
        const updatedProfile = await ProfileModel.findByIdAndUpdate(
          profileId,
          { upgrades: profile.upgrades },
          { new: true }
        );
        return updatedProfile;
      }
      break;
  }

  // Agregar nuevo upgrade
  const newUpgrade = {
    code: upgradeCode,
    startAt: now,
    endAt,
    purchaseAt: now
  };

  const updatedProfile = await ProfileModel.findByIdAndUpdate(
    profileId,
    { $push: { upgrades: newUpgrade } },
    { new: true }
  );

  return updatedProfile;
};
