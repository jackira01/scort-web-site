import { validateProfileFeatures } from '../attribute-group/validateProfileFeatures';
import { createProfileVerification } from '../profile-verification/profile-verification.service';
import UserModel from '../user/User.model';
import { ProfileModel } from './profile.model';
import type { CreateProfileDTO } from './profile.types';
import { PlanDefinitionModel } from '../plans/plan.model';
import { UpgradeDefinitionModel } from '../plans/upgrade.model';
import { ConfigParameterService } from '../config-parameter/config-parameter.service';

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

  // Validar límites de perfiles por usuario antes de crear
  const profileLimitsValidation = await validateUserProfileLimits(data.user.toString());
  if (!profileLimitsValidation.canCreate) {
    throw new Error(profileLimitsValidation.reason || 'No se puede crear el perfil debido a límites de usuario');
  }

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

  // Asignar plan por defecto si está configurado
  try {
    const defaultPlanConfig = await ConfigParameterService.getValue('system.default_plan');
    
    if (defaultPlanConfig?.enabled && defaultPlanConfig?.planCode) {
      // Buscar el plan por código
      const defaultPlan = await PlanDefinitionModel.findOne({ 
        code: defaultPlanConfig.planCode, 
        isActive: true 
      });
      
      if (defaultPlan && defaultPlan.variants && defaultPlan.variants.length > 0) {
        // Usar la primera variante del plan por defecto
        const defaultVariant = defaultPlan.variants[0];
        
        // Asignar el plan al perfil
        await subscribeProfile(
          profile._id as string,
          defaultPlan.code,
          defaultVariant.days
        );
        
        console.log(`Plan por defecto '${defaultPlan.code}' asignado al perfil ${profile._id}`);
      }
    }
  } catch (error) {
    console.error('Error al asignar plan por defecto:', error);
    // No fallar la creación del perfil si falla la asignación del plan por defecto
  }

  // Crear automáticamente una verificación de perfil
  try {
    console.log(`Creando verificación para perfil ${profile._id}`);
    const verification = await createProfileVerification({
      profile: (profile._id as any).toString(),
      verificationStatus: 'pending',
    });

    console.log(`Verificación creada:`, verification);

    // Actualizar el perfil con la referencia a la verificación
    if (verification && verification._id) {
      const updatedProfile = await ProfileModel.findByIdAndUpdate(
        profile._id,
        { verification: verification._id },
        { new: true },
      );
      console.log(`Perfil actualizado con verificación:`, updatedProfile?.verification);
    }
  } catch (error) {
    console.error('Error al crear verificación automática:', error);
    // No fallar la creación del perfil si falla la verificación
  }

  return profile;
};

export const getProfiles = async (page: number = 1, limit: number = 10, fields?: string) => {
  const skip = (page - 1) * limit;
  let query = ProfileModel.find({});

  if (fields) {
    // Normalizar "fields" para aceptar listas separadas por coma y garantizar dependencias de campos computados
    const cleaned = fields.split(',').map(f => f.trim()).filter(Boolean);

    // Si se solicita 'featured', asegurar que 'upgrades' esté disponible para calcularlo
    const needsFeatured = cleaned.includes('featured');
    const hasUpgrades = cleaned.includes('upgrades') || cleaned.some(f => f.startsWith('upgrades'));
    if (needsFeatured && !hasUpgrades) {
      cleaned.push('upgrades.code', 'upgrades.startAt', 'upgrades.endAt');
    }

    // Si se solicita 'isVerified' o 'verification', asegurar que 'verification' esté seleccionado para poder popular y calcular
    const needsIsVerified = cleaned.includes('isVerified') || cleaned.includes('verification');
    if (needsIsVerified && !cleaned.includes('verification')) {
      cleaned.push('verification');
    }

    const selectStr = cleaned.join(' ');
    query = query.select(selectStr) as any;
  }

  const rawProfiles = await query
    .populate({
      path: 'user',
      select: 'name email',
    })
    .populate({
      path: 'verification',
      select: 'verificationStatus verifiedAt',
    })
    .populate({
      path: 'features.group_id',
      select: 'name label',
    })
    .skip(skip)
    .limit(limit)
    .lean();

  const now = new Date();
  const profiles = rawProfiles.map(profile => {
    const verification = profile.verification;
    let isVerified = false;
    if (verification && typeof verification === 'object' && 'verificationStatus' in verification) {
      isVerified = (verification as { verificationStatus: string }).verificationStatus === 'verified';
    }
    const featured = profile.upgrades?.some(upgrade => 
      (upgrade.code === 'DESTACADO' || upgrade.code === 'HIGHLIGHT') &&
      new Date(upgrade.startAt) <= now && new Date(upgrade.endAt) > now
    ) || false;
    return {
      ...profile,
      isVerified,
      featured
    };
  });

  const total = await ProfileModel.countDocuments({});

  return {
    profiles,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

export const getProfilesForHome = async (page: number = 1, limit: number = 20) => {
  const skip = (page - 1) * limit;
  const now = new Date();

  // Obtener todos los perfiles activos y visibles
  // Solo seleccionar campos mínimos necesarios para la vista previa
  const profiles = await ProfileModel.find({
    isActive: true,
    visible: true,
    $or: [
      // Perfiles con planAssignment activo
      {
        'planAssignment.expiresAt': { $gt: now },
        'planAssignment.planCode': { $exists: true }
      },
      // Perfiles sin plan (plan gratuito por defecto)
      {
        planAssignment: null
      }
    ]
  })
  .select({
    name: 1,
    age: 1,
    'location.city.label': 1,
    'location.department.label': 1,
    'media.gallery': { $slice: 1 }, // Solo la primera imagen
    planAssignment: 1,
    upgrades: 1,
    lastLogin: 1,
    createdAt: 1,
    updatedAt: 1
  })
  .populate({
    path: 'verification',
    select: 'verificationStatus',
  })
  .lean();

  // Obtener definiciones de planes para mapear códigos a niveles y features
  const planDefinitions = await PlanDefinitionModel.find({ active: true }).lean();
  const planCodeToLevel = planDefinitions.reduce((acc, plan) => {
    acc[plan.code] = plan.level;
    return acc;
  }, {} as Record<string, number>);
  
  const planCodeToFeatures = planDefinitions.reduce((acc, plan) => {
    acc[plan.code] = plan.features;
    return acc;
  }, {} as Record<string, any>);

  // Obtener configuración del plan por defecto para perfiles sin plan asignado
  let defaultPlanFeatures = null;
  try {
    const defaultPlanConfig = await ConfigParameterService.getValue('system.default_plan');
    if (defaultPlanConfig?.enabled && defaultPlanConfig?.planCode) {
      defaultPlanFeatures = planCodeToFeatures[defaultPlanConfig.planCode];
    }
  } catch (error) {
    console.error('Error al obtener configuración del plan por defecto:', error);
  }

  // Debug: Log información de filtrado
  console.log(`Total profiles found: ${profiles.length}`);
  console.log(`Plan definitions found: ${planDefinitions.length}`);
  console.log('Available plan codes:', Object.keys(planCodeToFeatures));
  
  // Filtrar perfiles que deben mostrarse en home y enriquecer con información de jerarquía
  const filteredProfiles = profiles.filter(profile => {
    let planCode = null;
    
    // Determinar el código del plan desde planAssignment
    if (profile.planAssignment?.planCode) {
      planCode = profile.planAssignment.planCode;
    }
    
    // Debug: Log información del perfil
    console.log(`Profile ${profile.name} - Plan: ${planCode || 'none'} - Expires: ${profile.planAssignment?.expiresAt || 'N/A'}`);
    
    // Si no tiene plan asignado, verificar configuración del plan por defecto
    if (!planCode) {
      // Si hay un plan por defecto configurado, usar sus features
      if (defaultPlanFeatures) {
        const shouldShow = defaultPlanFeatures.showInHome === true;
        console.log(`Profile ${profile.name} - No plan assigned, using default plan features. Show in home: ${shouldShow}`);
        return shouldShow;
      }
      // Si no hay plan por defecto configurado, no mostrar en home por seguridad
      console.log(`Profile ${profile.name} - No plan assigned and no default plan configured. Hidden from home.`);
      return false;
    }
    
    // Verificar si el plan permite mostrar en home
    const planFeatures = planCodeToFeatures[planCode];
    if (!planFeatures) {
      console.warn(`Plan features not found for plan code: ${planCode}`);
      return false;
    }
    
    const shouldShow = planFeatures.showInHome === true;
    console.log(`Profile ${profile.name} - Plan ${planCode} - showInHome: ${planFeatures.showInHome} - Should show: ${shouldShow}`);
    return shouldShow;
  });
  
  console.log(`Filtered profiles for home: ${filteredProfiles.length}`);

  const enrichedProfiles = filteredProfiles.map(profile => {
    // Verificar upgrades activos
    const activeUpgrades = profile.upgrades?.filter(upgrade => 
      new Date(upgrade.startAt) <= now && new Date(upgrade.endAt) > now
    ) || [];

    // Determinar el nivel del plan (1=DIAMANTE=Premium, 5=AMATISTA=Free)
    let planLevel = 5; // Por defecto Free (AMATISTA)
    let planCode = 'GRATIS';
    
    // Obtener información del plan desde planAssignment
    if (profile.planAssignment?.planCode) {
      planLevel = planCodeToLevel[profile.planAssignment.planCode] || 5;
      planCode = profile.planAssignment.planCode;
    }

    // Verificar si tiene upgrades de boost o highlight
    let hasBoostUpgrade = activeUpgrades.some(upgrade => 
      upgrade.code === 'IMPULSO' || upgrade.code === 'BOOST'
    );
    let hasHighlightUpgrade = activeUpgrades.some(upgrade => 
      upgrade.code === 'DESTACADO' || upgrade.code === 'HIGHLIGHT'
    );
    
    // Si es plan DIAMANTE, incluye DESTACADO automáticamente
    if (planCode === 'DIAMANTE') {
      hasHighlightUpgrade = true;
    }

    return {
      ...profile,
      _hierarchyInfo: {
        planLevel,
        planCode,
        activeUpgrades,
        hasBoostUpgrade,
        hasHighlightUpgrade,
        lastActivity: profile.lastLogin || profile.updatedAt,
        createdAt: profile.createdAt
      }
    };
  });

  // Aplicar jerarquía de orden según especificaciones
  const sortedProfiles = enrichedProfiles.sort((a, b) => {
    const aInfo = a._hierarchyInfo;
    const bInfo = b._hierarchyInfo;

    // 1. Perfiles con Upgrade "Destacado" o "Boost" aparecen primero
    if (aInfo.hasHighlightUpgrade || aInfo.hasBoostUpgrade) {
      if (!(bInfo.hasHighlightUpgrade || bInfo.hasBoostUpgrade)) {
        return -1; // a va primero
      }
      
      // Ambos tienen upgrades, ordenar por prioridad del plan (nivel menor = mayor prioridad)
      if (aInfo.planLevel !== bInfo.planLevel) {
        return aInfo.planLevel - bInfo.planLevel;
      }
      
      // Si hay empate en plan, ordenar por fecha de inicio del upgrade más reciente
      const aLatestUpgrade = Math.max(...aInfo.activeUpgrades.map(u => new Date(u.startAt).getTime()));
      const bLatestUpgrade = Math.max(...bInfo.activeUpgrades.map(u => new Date(u.startAt).getTime()));
      return bLatestUpgrade - aLatestUpgrade;
    }
    
    if (bInfo.hasHighlightUpgrade || bInfo.hasBoostUpgrade) {
      return 1; // b va primero
    }

    // 2. Sin upgrades activos, ordenar por nivel de plan (1=DIAMANTE=Premium, 5=AMATISTA=Free)
    if (aInfo.planLevel !== bInfo.planLevel) {
      return aInfo.planLevel - bInfo.planLevel;
    }

    // 3. Mismo nivel de plan, aplicar criterios específicos
    if (aInfo.planLevel <= 2) {
      // Planes Premium (DIAMANTE/ORO): ordenar por última actividad
      const aActivity = new Date(aInfo.lastActivity).getTime();
      const bActivity = new Date(bInfo.lastActivity).getTime();
      return bActivity - aActivity; // Más activos primero
    } else {
      // Planes Free (AMATISTA): ordenar por fecha de creación descendente
      const aCreated = new Date(aInfo.createdAt).getTime();
      const bCreated = new Date(bInfo.createdAt).getTime();
      return bCreated - aCreated; // Más nuevos primero
    }
  });

  // Aplicar paginación
  const paginatedProfiles = sortedProfiles.slice(skip, skip + limit);

  // Limpiar información de jerarquía antes de devolver y mapear hasDestacadoUpgrade
  const cleanProfiles = paginatedProfiles.map(profile => {
    const { _hierarchyInfo, ...cleanProfile } = profile;
    return {
      ...cleanProfile,
      hasDestacadoUpgrade: _hierarchyInfo.hasHighlightUpgrade,
      hasImpulsoUpgrade: _hierarchyInfo.hasBoostUpgrade
    };
  });

  const total = filteredProfiles.length;

  return {
    profiles: cleanProfiles,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

export const getProfileById = async (id: string) => {
  const profile = await ProfileModel.findById(id)
    .populate('user', '_id name email')
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

  // Validar límites de perfiles usando la nueva lógica configurable
  const upgradeValidation = await validateProfilePlanUpgrade(profileId, planCode);
  if (!upgradeValidation.canUpgrade) {
    throw new Error(upgradeValidation.reason || 'No se puede asignar el plan al perfil');
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

/**
 * Valida si un usuario puede crear un nuevo perfil basado en los límites configurados
 * @param userId - ID del usuario
 * @param planCode - Código del plan que se asignará al perfil (opcional)
 * @returns Promise<{ canCreate: boolean, reason?: string, limits: object }>
 */
export const validateUserProfileLimits = async (userId: string, planCode?: string) => {
  try {
    // Obtener configuraciones de límites
    const [freeProfilesMax, paidProfilesMax, totalVisibleMax] = await Promise.all([
      ConfigParameterService.getValue('profiles.limits.free_profiles_max'),
      ConfigParameterService.getValue('profiles.limits.paid_profiles_max'),
      ConfigParameterService.getValue('profiles.limits.total_visible_max')
    ]);

    const limits = {
      freeProfilesMax: freeProfilesMax || 3,
      paidProfilesMax: paidProfilesMax || 10,
      totalVisibleMax: totalVisibleMax || 13
    };

    // Obtener perfiles activos del usuario
    const userProfiles = await ProfileModel.find({
      user: userId,
      isActive: true,
      visible: true
    }).lean();

    const now = new Date();
    
    // Clasificar perfiles por tipo
    let freeProfilesCount = 0;
    let paidProfilesCount = 0;

    for (const profile of userProfiles) {
      const hasActivePaidPlan = profile.planAssignment && 
        profile.planAssignment.expiresAt > now &&
        profile.planAssignment.planCode !== 'AMATISTA';
      
      if (hasActivePaidPlan) {
        paidProfilesCount++;
      } else {
        freeProfilesCount++;
      }
    }

    const totalProfiles = freeProfilesCount + paidProfilesCount;

    // Determinar si el nuevo perfil será gratuito o de pago
    const isNewProfilePaid = planCode && planCode !== 'AMATISTA';

    // Validar límites
    if (isNewProfilePaid) {
      // Validar límite de perfiles de pago
      if (paidProfilesCount >= limits.paidProfilesMax) {
        return {
          canCreate: false,
          reason: `Máximo de perfiles de pago alcanzado (${limits.paidProfilesMax})`,
          limits,
          currentCounts: { freeProfilesCount, paidProfilesCount, totalProfiles }
        };
      }
    } else {
      // Validar límite de perfiles gratuitos
      if (freeProfilesCount >= limits.freeProfilesMax) {
        return {
          canCreate: false,
          reason: `Máximo de perfiles gratuitos alcanzado (${limits.freeProfilesMax})`,
          limits,
          currentCounts: { freeProfilesCount, paidProfilesCount, totalProfiles }
        };
      }
    }

    // Validar límite total
    if (totalProfiles >= limits.totalVisibleMax) {
      return {
        canCreate: false,
        reason: `Máximo total de perfiles visibles alcanzado (${limits.totalVisibleMax})`,
        limits,
        currentCounts: { freeProfilesCount, paidProfilesCount, totalProfiles }
      };
    }

    return {
      canCreate: true,
      limits,
      currentCounts: { freeProfilesCount, paidProfilesCount, totalProfiles }
    };

  } catch (error) {
    console.error('Error al validar límites de perfiles:', error);
    throw new Error('Error interno al validar límites de perfiles');
  }
};

/**
 * Obtiene el resumen de perfiles de un usuario
 * @param userId - ID del usuario
 * @returns Promise<{ freeProfiles: number, paidProfiles: number, totalProfiles: number, limits: object }>
 */
export const getUserProfilesSummary = async (userId: string) => {
  try {
    // Obtener configuraciones de límites
    const [freeProfilesMax, paidProfilesMax, totalVisibleMax] = await Promise.all([
      ConfigParameterService.getValue('profiles.limits.free_profiles_max'),
      ConfigParameterService.getValue('profiles.limits.paid_profiles_max'),
      ConfigParameterService.getValue('profiles.limits.total_visible_max')
    ]);

    const limits = {
      freeProfilesMax: freeProfilesMax || 3,
      paidProfilesMax: paidProfilesMax || 10,
      totalVisibleMax: totalVisibleMax || 13
    };

    // Obtener perfiles activos del usuario
    const userProfiles = await ProfileModel.find({
      user: userId,
      isActive: true,
      visible: true
    }).lean();

    const now = new Date();
    
    // Clasificar perfiles por tipo
    let freeProfilesCount = 0;
    let paidProfilesCount = 0;
    const expiredPaidProfiles = [];

    for (const profile of userProfiles) {
      const hasActivePaidPlan = profile.planAssignment && 
        profile.planAssignment.expiresAt > now &&
        profile.planAssignment.planCode !== 'AMATISTA';
      
      if (hasActivePaidPlan) {
        paidProfilesCount++;
      } else {
        freeProfilesCount++;
        
        // Verificar si es un perfil con plan vencido
        if (profile.planAssignment && 
            profile.planAssignment.expiresAt <= now &&
            profile.planAssignment.planCode !== 'AMATISTA') {
          expiredPaidProfiles.push({
            profileId: profile._id,
            profileName: profile.name,
            expiredPlan: profile.planAssignment.planCode,
            expiredAt: profile.planAssignment.expiresAt
          });
        }
      }
    }

    const totalProfiles = freeProfilesCount + paidProfilesCount;

    return {
      freeProfiles: freeProfilesCount,
      paidProfiles: paidProfilesCount,
      totalProfiles,
      expiredPaidProfiles,
      limits,
      availableSlots: {
        freeSlots: Math.max(0, limits.freeProfilesMax - freeProfilesCount),
        paidSlots: Math.max(0, limits.paidProfilesMax - paidProfilesCount),
        totalSlots: Math.max(0, limits.totalVisibleMax - totalProfiles)
      }
    };

  } catch (error) {
    console.error('Error al obtener resumen de perfiles:', error);
    throw new Error('Error interno al obtener resumen de perfiles');
  }
};

/**
 * Valida si un perfil puede cambiar a un plan de pago
 * @param profileId - ID del perfil
 * @param newPlanCode - Código del nuevo plan
 * @returns Promise<{ canUpgrade: boolean, reason?: string }>
 */
export const validateProfilePlanUpgrade = async (profileId: string, newPlanCode: string) => {
  try {
    // Obtener el perfil
    const profile = await ProfileModel.findById(profileId).lean();
    if (!profile) {
      throw new Error('Perfil no encontrado');
    }

    // Si el nuevo plan es AMATISTA, siempre se puede "degradar"
    if (newPlanCode === 'AMATISTA') {
      return { canUpgrade: true };
    }

    const now = new Date();
    const currentlyHasPaidPlan = profile.planAssignment && 
      profile.planAssignment.expiresAt > now &&
      profile.planAssignment.planCode !== 'AMATISTA';

    // Si ya tiene un plan de pago activo, puede cambiar a otro plan de pago
    if (currentlyHasPaidPlan) {
      return { canUpgrade: true };
    }

    // Si no tiene plan de pago, verificar límites de perfiles de pago del usuario
    const validation = await validateUserProfileLimits(profile.user.toString(), newPlanCode);
    
    if (!validation.canCreate) {
      return {
        canUpgrade: false,
        reason: validation.reason
      };
    }

    return { canUpgrade: true };

  } catch (error) {
    console.error('Error al validar upgrade de plan:', error);
    throw new Error('Error interno al validar upgrade de plan');
  }
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
