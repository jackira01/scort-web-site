import { Types } from 'mongoose';
import { validateProfileFeatures } from '../attribute-group/validateProfileFeatures';
import { createProfileVerification } from '../profile-verification/profile-verification.service';
import UserModel from '../user/User.model';
import { ProfileModel } from './profile.model';
import type { CreateProfileDTO, IProfile } from './profile.types';
import type { IInvoice } from '../payments/invoice.model';
import { PlanDefinitionModel } from '../plans/plan.model';
import { UpgradeDefinitionModel } from '../plans/upgrade.model';
import { ConfigParameterService } from '../config-parameter/config-parameter.service';
import invoiceService from '../payments/invoice.service';

// Interfaz para la configuración del plan por defecto
interface DefaultPlanConfig {
  enabled: boolean;
  planId: string | null;
  planCode: string | null;
}

// Interfaz para el objeto WhatsApp message
interface WhatsAppMessage {
  userId: string;
  profileId: string;
  company: string;
  companyNumber: string;
  message: string;
}

/**
 * Genera el objeto WhatsApp message con los datos de la empresa y factura
 */
// Cache para la configuración del plan por defecto
let defaultPlanConfigCache: { planId: string | null; planCode: string | null; enabled: boolean } | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

/**
 * Obtiene la configuración del plan por defecto desde la base de datos con cache
 */
const getDefaultPlanConfig = async (): Promise<{ planId: string | null; planCode: string | null; enabled: boolean }> => {
  const now = Date.now();

  // Verificar si tenemos cache válido
  if (defaultPlanConfigCache && (now - cacheTimestamp) < CACHE_DURATION) {

    return defaultPlanConfigCache;
  }

  try {

    const config = await ConfigParameterService.getValue('system.default_plan') as DefaultPlanConfig;

    if (!config) {

      // Buscar plan AMATISTA para obtener su _id
      const fallbackPlan = await PlanDefinitionModel.findOne({ code: 'AMATISTA', active: true });
      const fallbackConfig = {
        planId: fallbackPlan?._id?.toString() || null,
        planCode: 'AMATISTA',
        enabled: true
      };

      // Guardar en cache
      defaultPlanConfigCache = fallbackConfig;
      cacheTimestamp = now;

      return fallbackConfig;
    }

    const result = {
      planId: config.enabled ? config.planId : null,
      planCode: config.enabled ? config.planCode : null,
      enabled: config.enabled
    };

    // Guardar en cache
    defaultPlanConfigCache = result;
    cacheTimestamp = now;

    return result;
  } catch (error) {
    // Fallback en caso de error
    const fallbackPlan = await PlanDefinitionModel.findOne({ code: 'AMATISTA', active: true });
    const errorFallbackConfig = {
      planId: fallbackPlan?._id?.toString() || null,
      planCode: 'AMATISTA',
      enabled: true
    };

    // Guardar en cache (con tiempo reducido por ser fallback de error)
    defaultPlanConfigCache = errorFallbackConfig;
    cacheTimestamp = now;

    return errorFallbackConfig;
  }
};

const generateWhatsAppMessage = async (
  userId: string,
  profileId: string,
  invoiceId?: string
): Promise<WhatsAppMessage | null> => {
  try {
    // Obtener parámetros de configuración de la empresa
    const [companyName, companyWhatsApp] = await Promise.all([
      ConfigParameterService.getValue('company.name'),
      ConfigParameterService.getValue('company.whatsapp.number')
    ]);

    if (!companyName || !companyWhatsApp) {
      console.warn('⚠️ [WHATSAPP] Parámetros de empresa no configurados:', {
        companyName: !!companyName,
        companyWhatsApp: !!companyWhatsApp
      });
      return null;
    }

    // Generar mensaje elegante
    const message = invoiceId
      ? `¡Hola ${companyName}! 👋\n\nEspero que estén muy bien. Acabo de adquirir un paquete en su plataforma y me gustaría conocer las opciones disponibles para realizar el pago.\n\n📋 **Detalles de mi compra:**\n• ID de Factura: ${invoiceId}\n• ID de Perfil: ${profileId}\n\n¿Podrían orientarme sobre los métodos de pago disponibles y los pasos a seguir?\n\nMuchas gracias por su atención. 😊`
      : `¡Hola ${companyName}! 👋\n\nEspero que estén muy bien. He creado un nuevo perfil en su plataforma y me gustaría obtener más información sobre sus servicios.\n\n📋 **Detalles:**\n• ID de Perfil: ${profileId}\n\n¿Podrían brindarme más información sobre las opciones disponibles?\n\nMuchas gracias por su atención. 😊`;

    return {
      userId,
      profileId,
      company: companyName,
      companyNumber: companyWhatsApp,
      message
    };
  } catch (error) {
    console.error('❌ [WHATSAPP] Error al generar mensaje de WhatsApp:', error);
    return null;
  }
};

export const checkProfileNameExists = async (name: string): Promise<{ user: any; exists: boolean; message: string }> => {
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

export const createProfile = async (data: CreateProfileDTO): Promise<IProfile> => {
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

  // Crear perfil con isActive=true y visible=false por defecto
  // El perfil estará activo pero no visible hasta pasar verificaciones
  // Excluir planAssignment del data para evitar sobrescribir la asignación automática
  const { planAssignment, ...profileData } = data;
  let profile = await ProfileModel.create({
    ...profileData,
    isActive: true,  // Activo por defecto con plan gratuito
    visible: false   // No visible hasta verificaciones
  });
  // Profile created successfully

  // Agregar el perfil al array de profiles del usuario
  await UserModel.findByIdAndUpdate(
    data.user,
    { $push: { profiles: profile._id } },
    { new: true },
  );

  // Asignar plan por defecto según configuración de la base de datos
  try {
    const defaultPlanConfig = await getDefaultPlanConfig();



    if (defaultPlanConfig.enabled && (defaultPlanConfig.planId || defaultPlanConfig.planCode)) {


      // Buscar el plan configurado como por defecto (preferir _id sobre code)
      let defaultPlan;
      if (defaultPlanConfig.planId) {
        defaultPlan = await PlanDefinitionModel.findById(defaultPlanConfig.planId);

      } else {
        defaultPlan = await PlanDefinitionModel.findOne({
          code: defaultPlanConfig.planCode,
          active: true
        });

      }

      if (defaultPlan && defaultPlan.variants && defaultPlan.variants.length > 0) {
        // Usar la primera variante del plan por defecto
        const defaultVariant = defaultPlan.variants[0];

        // Asignar el plan por defecto al perfil
        const subscriptionResult = await subscribeProfile(
          profile._id as string,
          defaultPlan.code, // Usar el código del plan encontrado
          defaultVariant.days,
          false // No generar factura para plan por defecto
        );




        // Actualizar la referencia del perfil para la creación de verificación
        if (subscriptionResult.profile) {
          const updatedProfile = await ProfileModel.findById(profile._id);
          if (updatedProfile) {
            profile = updatedProfile;
          }
        }
      } else {

      }
    } else {

    }
  } catch (error) {
    // Error al asignar plan por defecto
    // No fallar la creación del perfil si falla la asignación del plan por defecto
  }

  // Crear automáticamente una verificación de perfil
  try {

    const verification = await createProfileVerification({
      profile: (profile._id as any).toString(),
      verificationStatus: 'pending',
    });



    // Actualizar el perfil con la referencia a la verificación
    if (verification && verification._id) {
      const updatedProfile = await ProfileModel.findByIdAndUpdate(
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

/**
 * Crea un perfil con generación automática de factura para planes de pago
 */
export const createProfileWithInvoice = async (data: CreateProfileDTO & { planCode?: string; planDays?: number }): Promise<{
  profile: IProfile;
  invoice: IInvoice | null;
  whatsAppMessage?: WhatsAppMessage | null;
}> => {
  const { planCode, planDays, ...profileData } = data;



  // Crear el perfil primero (con plan por defecto configurado)

  const profile = await createProfile(profileData);


  // Validar límites de perfiles gratuitos para determinar visibilidad
  const limitsValidation = await validateUserProfileLimits(profileData.user.toString(), planCode);
  let shouldBeVisible = true;

  // Obtener configuración del plan por defecto para validaciones
  const defaultPlanConfig = await getDefaultPlanConfig();
  const defaultPlanCode = defaultPlanConfig.enabled ? defaultPlanConfig.planCode : null;

  // Si el usuario superó el límite de perfiles gratuitos y no compró un plan, ocultar el perfil
  if (!limitsValidation.canCreate && (!planCode || planCode === defaultPlanCode)) {
    console.log('⚠️ [PROFILE SERVICE] Usuario superó límite de perfiles gratuitos, perfil será invisible hasta pago');
    shouldBeVisible = false;
  }

  let invoice = null;

  // Si se especifica un plan de pago, generar factura pero mantener el perfil con plan por defecto
  if (planCode && planDays && planCode !== defaultPlanCode) {
    console.log('🟡 [PROFILE SERVICE] Procesando plan de pago:', { planCode, planDays });
    try {
      // Validar que el plan existe y obtener el precio
      console.log('🟡 [PROFILE SERVICE] Buscando definición del plan:', planCode);
      const plan = await PlanDefinitionModel.findOne({ code: planCode });
      if (!plan) {
        console.error('❌ [PROFILE SERVICE] Plan no encontrado:', planCode);
        throw new Error(`Plan con código ${planCode} no encontrado`);
      }
      console.log('✅ [PROFILE SERVICE] Plan encontrado:', { name: plan.name, variants: plan.variants.length });

      const variant = plan.variants.find(v => v.days === planDays);
      if (!variant) {
        console.error('❌ [PROFILE SERVICE] Variante no encontrada:', { planCode, planDays });
        throw new Error(`Variante de ${planDays} días no encontrada para el plan ${planCode}`);
      }
      console.log('✅ [PROFILE SERVICE] Variante encontrada:', { days: variant.days, price: variant.price });

      // Solo generar factura si el plan tiene costo
      if (variant.price > 0) {
        console.log('💰 [PROFILE SERVICE] Plan de pago detectado, generando factura...');
        invoice = await invoiceService.generateInvoice({
          profileId: (profile._id as Types.ObjectId).toString(),
          userId: profile.user.toString(),
          planCode: planCode,
          planDays: planDays,
          notes: `Factura generada automáticamente para nuevo perfil ${profile.name || profile._id}`
        });

        console.log('✅ [PROFILE SERVICE] Factura generada exitosamente:', {
          invoiceId: invoice._id,
          totalAmount: invoice.totalAmount,
          expiresAt: invoice.expiresAt,
          profileId: profile._id
        });

        // Actualizar el historial de pagos del perfil con la nueva factura
        console.log('💳 [PROFILE SERVICE] Actualizando historial de pagos del perfil...');
        await ProfileModel.findByIdAndUpdate(
          profile._id,
          {
            $push: { paymentHistory: new Types.ObjectId(invoice._id as string) },
            isActive: true,        // Mantener activo con plan por defecto
            visible: shouldBeVisible  // Visible solo si no superó límites gratuitos
          }
        );
        console.log('✅ [PROFILE SERVICE] Historial de pagos actualizado con factura:', invoice._id);

        // NUEVO FLUJO: Mantener perfil activo con plan por defecto hasta confirmación de pago
        // Solo ocultar si el usuario superó límites de perfiles gratuitos
        console.log('🟡 [PROFILE SERVICE] Configurando visibilidad del perfil según límites...');
        console.log('✅ [PROFILE SERVICE] Perfil configurado:', {
          isActive: true,
          visible: shouldBeVisible,
          reason: shouldBeVisible ? 'Dentro de límites' : 'Superó límites gratuitos'
        });
      } else {
        // Plan gratuito, mantener el plan por defecto ya asignado
        console.log('🆓 [PROFILE SERVICE] Plan gratuito detectado, manteniendo plan por defecto actual');

        // Generar mensaje de WhatsApp para plan gratuito
        const whatsAppMessage = await generateWhatsAppMessage(
          profile.user.toString(),
          (profile._id as Types.ObjectId).toString()
        );

        return { profile, invoice: null, whatsAppMessage };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.error('❌ [PROFILE SERVICE] Error al procesar plan para nuevo perfil:', {
        error: errorMessage,
        planCode,
        planDays,
        profileId: profile._id
      });
      // Si falla la facturación, el perfil se mantiene con plan por defecto
    }
  } else {
    // No se especificó plan de pago (purchasedPlan vacío), mantener plan por defecto
    console.log('🆓 [PROFILE SERVICE] No se especificó plan de pago, manteniendo plan por defecto');

    // Asegurar que el perfil tenga la visibilidad correcta según límites
    await ProfileModel.findByIdAndUpdate(
      profile._id,
      {
        isActive: true,
        visible: shouldBeVisible
      }
    );

    console.log('✅ [PROFILE SERVICE] Perfil configurado con plan gratuito:', {
      isActive: true,
      visible: shouldBeVisible,
      reason: shouldBeVisible ? 'Dentro de límites gratuitos' : 'Superó límites gratuitos'
    });
  }

  // Generar mensaje de WhatsApp
  console.log('📱 [PROFILE SERVICE] Generando mensaje de WhatsApp...');
  const whatsAppMessage = await generateWhatsAppMessage(
    profile.user.toString(),
    (profile._id as Types.ObjectId).toString(),
    invoice?._id?.toString()
  );

  if (whatsAppMessage) {
    console.log('✅ [PROFILE SERVICE] Mensaje de WhatsApp generado exitosamente:', {
      company: whatsAppMessage.company,
      companyNumber: whatsAppMessage.companyNumber,
      hasInvoice: !!invoice
    });
  } else {
    console.log('⚠️ [PROFILE SERVICE] No se pudo generar el mensaje de WhatsApp');
  }

  console.log('🏁 [PROFILE SERVICE] Finalizando createProfileWithInvoice:', {
    profileId: profile._id,
    hasInvoice: !!invoice,
    invoiceId: invoice?._id,
    hasWhatsAppMessage: !!whatsAppMessage
  });
  return { profile, invoice, whatsAppMessage };
};

export const getProfiles = async (page: number = 1, limit: number = 10, fields?: string): Promise<{ profiles: IProfile[]; pagination: { page: number; limit: number; total: number; pages: number } }> => {
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
      model: 'ProfileVerification',
      select: 'verificationProgress verificationStatus'
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
    // Calcular estado de verificación basado en campos individuales
    let isVerified = false;
    if (profile.verification) {
      const verification = profile.verification as any;
      const verifiedCount = Object.values(verification).filter(status => status === 'verified').length;
      const totalFields = Object.keys(verification).length;

      if (verifiedCount === totalFields && totalFields > 0) {
        isVerified = true;
      }
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

export const getProfilesForHome = async (page: number = 1, limit: number = 20): Promise<{ profiles: any[]; pagination: { page: number; limit: number; total: number; pages: number } }> => {
  const skip = (page - 1) * limit;
  const now = new Date();

  console.log('🏠 DEBUG getProfilesForHome - Iniciando consulta');
  console.log(`   Página: ${page}, Límite: ${limit}, Skip: ${skip}`);
  console.log(`   Fecha actual: ${now.toISOString()}`);

  // Obtener todos los perfiles activos y visibles CON USUARIOS VERIFICADOS
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
      user: 1, // IMPORTANTE: Incluir referencia al usuario
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
      path: 'user',
      model: 'User',
      select: 'name email isVerified',
      match: { isVerified: true } // FILTRO CRÍTICO: Solo usuarios verificados
    })
    .populate({
      path: 'verification',
      model: 'ProfileVerification',
      select: 'verificationProgress verificationStatus'
    })
    .lean();

  console.log(`📊 DEBUG - Perfiles encontrados antes del filtro: ${profiles.length}`);

  // Filtrar perfiles que NO tienen usuario verificado (populate devuelve null)
  const profilesWithVerifiedUsers = profiles.filter(profile => {
    const hasVerifiedUser = profile.user !== null;
    if (!hasVerifiedUser) {
      console.log(`❌ DEBUG - Perfil filtrado (usuario no verificado): ${profile.name}`);
    }
    return hasVerifiedUser;
  });

  console.log(`✅ DEBUG - Perfiles con usuarios verificados: ${profilesWithVerifiedUsers.length}`);

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
  console.log(`📋 DEBUG - Plan definitions found: ${planDefinitions.length}`);
  console.log('📋 DEBUG - Available plan codes:', Object.keys(planCodeToFeatures));

  // Filtrar perfiles que deben mostrarse en home y enriquecer con información de jerarquía
  const filteredProfiles = profilesWithVerifiedUsers.filter(profile => {
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

    // Determinar el nivel del plan (1=DIAMANTE=Premium, 5=Plan por defecto=Free)
    let planLevel = 5; // Por defecto Free (plan por defecto)
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

    // 2. Sin upgrades activos, ordenar por nivel de plan (1=DIAMANTE=Premium, 5=Plan por defecto=Free)
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
      // Planes Free (plan por defecto): ordenar por fecha de creación descendente
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

    // Calcular estado de verificación basado en campos individuales
    let isVerified = false;
    let verificationLevel = 'pending';

    if (profile.verification) {
      const verification = profile.verification as any;
      const verifiedCount = Object.values(verification).filter(status => status === 'verified').length;
      const totalFields = Object.keys(verification).length;

      if (verifiedCount === totalFields && totalFields > 0) {
        isVerified = true;
        verificationLevel = 'verified';
      } else if (verifiedCount > 0) {
        verificationLevel = 'partial';
      }
    }

    return {
      ...cleanProfile,
      hasDestacadoUpgrade: _hierarchyInfo.hasHighlightUpgrade,
      hasImpulsoUpgrade: _hierarchyInfo.hasBoostUpgrade,
      verification: {
        ...(typeof profile.verification === 'object' && profile.verification !== null ? profile.verification : {}),
        isVerified,
        verificationLevel
      }
    };
  });

  const total = filteredProfiles.length;

  console.log(`🎯 DEBUG - Resultado final:`);
  console.log(`   Perfiles después del filtro de planes: ${filteredProfiles.length}`);
  console.log(`   Perfiles paginados devueltos: ${cleanProfiles.length}`);
  console.log(`   Total disponible: ${total}`);
  console.log(`   Páginas totales: ${Math.ceil(total / limit)}`);

  // Debug: Mostrar algunos perfiles de ejemplo
  cleanProfiles.slice(0, 3).forEach((profile, index) => {
    const user = profile.user as any;
    console.log(`   Perfil ${index + 1}: ${profile.name} - Usuario: ${user?.name || 'N/A'} - Verificado: ${user?.isVerified}`);
  });

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

export const getProfileById = async (id: string): Promise<IProfile | null> => {
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
      // Solo usar datos existentes si el campo no está definido en data.media
      data.media = {
        gallery: data.media.gallery !== undefined ? data.media.gallery : (existingProfile.media.gallery || []),
        videos: data.media.videos !== undefined ? data.media.videos : (existingProfile.media.videos || []),
        audios: data.media.audios !== undefined ? data.media.audios : (existingProfile.media.audios || []),
        stories: data.media.stories !== undefined ? data.media.stories : (existingProfile.media.stories || []),
      };
    }
  }

  return ProfileModel.findByIdAndUpdate(id, data, { new: true });
};

export const deleteProfile = async (id: string): Promise<IProfile | null> => {
  return ProfileModel.findByIdAndDelete(id);
};

// Función para crear verificaciones para perfiles existentes que no las tienen
export const createMissingVerifications = async (): Promise<{ total: number; created: number; errors: number; results: any[] }> => {
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

export const getProfilesWithStories = async (page: number = 1, limit: number = 10): Promise<{ profiles: IProfile[]; total: number; page: number; limit: number; totalPages: number }> => {
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
export const subscribeProfile = async (profileId: string, planCode: string, variantDays: number, generateInvoice: boolean = false): Promise<{ profile: IProfile | null; invoice: IInvoice | null }> => {
  // Obtener configuración del plan por defecto para validaciones
  const defaultPlanConfig = await getDefaultPlanConfig();
  const defaultPlanCode = defaultPlanConfig.enabled ? defaultPlanConfig.planCode : 'AMATISTA'; // Fallback
  // Validar que el plan y variante existen
  const plan = await PlanDefinitionModel.findOne({ code: planCode, active: true });
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

  // NUEVO FLUJO: Generar factura si es un plan de pago y se solicita
  let invoice = null;
  if (generateInvoice && planCode !== defaultPlanCode && variant.price > 0) {
    try {
      invoice = await invoiceService.generateInvoice({
        profileId: profileId,
        userId: profile.user.toString(),
        planCode: planCode,
        planDays: variantDays,
        notes: `Factura generada automáticamente para suscripción de perfil ${profile.name || profileId}`
      });

      console.log(`Factura generada automáticamente: ${invoice._id} para perfil ${profileId}`);

      // NUEVO FLUJO: Desactivar perfil hasta que se pague la factura
      // NO asignar el plan todavía, mantener el plan actual
      const updatedProfile = await ProfileModel.findByIdAndUpdate(
        profileId,
        { isActive: false },
        { new: true }
      );

      console.log('🟡 [PROFILE SERVICE] Perfil desactivado hasta confirmación de pago - plan actual mantenido');

      return { profile: updatedProfile, invoice };
    } catch (error) {
      console.error('Error al generar factura automática:', error);
      // No fallar la suscripción si falla la generación de factura
    }
  }

  // NUEVO FLUJO: Solo asignar plan si es gratuito o no se genera factura
  if (!generateInvoice || planCode === defaultPlanCode) {
    // Calcular fechas
    const startAt = new Date();
    const expiresAt = new Date(startAt.getTime() + (variantDays * 24 * 60 * 60 * 1000));

    // Actualizar perfil con el plan gratuito
    const updateData: any = {
      planAssignment: {
        planId: plan._id,
        planCode,
        variantDays,
        startAt,
        expiresAt
      },
      visible: true,
      isActive: true
    };

    const updatedProfile = await ProfileModel.findByIdAndUpdate(
      profileId,
      updateData,
      { new: true }
    );

    return { profile: updatedProfile, invoice };
  }

  // Si llegamos aquí, algo salió mal con la facturación
  const currentProfile = await ProfileModel.findById(profileId);

  return { profile: currentProfile, invoice };
};

/**
 * Valida si un usuario puede crear un nuevo perfil basado en los límites configurados
 * @param userId - ID del usuario
 * @param planCode - Código del plan que se asignará al perfil (opcional)
 * @returns Promise<{ canCreate: boolean, reason?: string, limits: object }>
 */
export const validateUserProfileLimits = async (userId: string, planCode?: string): Promise<{ canCreate: boolean; reason?: string; limits?: any; currentCounts?: any; accountType?: string; requiresIndependentVerification?: boolean }> => {
  try {
    // Obtener configuración del plan por defecto
    const defaultPlanConfig = await getDefaultPlanConfig();
    const defaultPlanCode = defaultPlanConfig.enabled ? defaultPlanConfig.planCode : 'AMATISTA'; // Fallback

    // Obtener información del usuario para determinar el tipo de cuenta
    const user = await UserModel.findById(userId).lean();
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    const accountType = user.accountType || 'common';

    // Obtener configuraciones de límites según el tipo de cuenta
    let freeProfilesMax, paidProfilesMax, totalVisibleMax, requiresIndependentVerification;

    if (accountType === 'agency') {
      // Para agencias, verificar que la conversión esté aprobada
      if (user.agencyInfo?.conversionStatus !== 'approved') {
        return {
          canCreate: false,
          reason: 'La conversión a agencia debe estar aprobada para crear perfiles adicionales',
          limits: { accountType },
          currentCounts: { freeProfilesCount: 0, paidProfilesCount: 0, totalProfiles: 0 }
        };
      }

      // Usar límites específicos para agencias
      [freeProfilesMax, paidProfilesMax, totalVisibleMax, requiresIndependentVerification] = await Promise.all([
        ConfigParameterService.getValue('profiles.limits.agency.free_profiles_max'),
        ConfigParameterService.getValue('profiles.limits.agency.paid_profiles_max'),
        ConfigParameterService.getValue('profiles.limits.agency.total_visible_max'),
        ConfigParameterService.getValue('profiles.limits.agency.independent_verification_required')
      ]);
    } else {
      // Usar límites para usuarios comunes
      [freeProfilesMax, paidProfilesMax, totalVisibleMax] = await Promise.all([
        ConfigParameterService.getValue('profiles.limits.free_profiles_max'),
        ConfigParameterService.getValue('profiles.limits.paid_profiles_max'),
        ConfigParameterService.getValue('profiles.limits.total_visible_max')
      ]);
      requiresIndependentVerification = false;
    }

    const limits = {
      freeProfilesMax: freeProfilesMax || (accountType === 'agency' ? 5 : 3),
      paidProfilesMax: paidProfilesMax || (accountType === 'agency' ? 50 : 10),
      totalVisibleMax: totalVisibleMax || (accountType === 'agency' ? 55 : 13),
      accountType,
      requiresIndependentVerification: requiresIndependentVerification || false
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
        (
          (profile.planAssignment.planId && profile.planAssignment.planId.toString() !== defaultPlanConfig.planId) ||
          (profile.planAssignment.planCode && profile.planAssignment.planCode !== defaultPlanCode)
        );

      if (hasActivePaidPlan) {
        paidProfilesCount++;
      } else {
        freeProfilesCount++;
      }
    }

    const totalProfiles = freeProfilesCount + paidProfilesCount;

    // Determinar si el nuevo perfil será gratuito o de pago
    const isNewProfilePaid = planCode && planCode !== defaultPlanCode;

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

    // Validación adicional para agencias: verificar conversión aprobada
    if (accountType === 'agency') {
      const agencyInfo = user.agencyInfo;
      if (!agencyInfo || agencyInfo.conversionStatus !== 'approved') {
        return {
          canCreate: false,
          reason: 'La conversión a cuenta de agencia debe estar aprobada para crear perfiles adicionales',
          limits,
          currentCounts: { freeProfilesCount, paidProfilesCount, totalProfiles }
        };
      }
    }

    return {
      canCreate: true,
      limits,
      currentCounts: { freeProfilesCount, paidProfilesCount, totalProfiles },
      accountType,
      requiresIndependentVerification: accountType === 'agency' && totalProfiles > 0
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
export const getUserProfilesSummary = async (userId: string): Promise<{ freeProfiles: number; paidProfiles: number; totalProfiles: number; limits: any; availableSlots: any; expiredPaidProfiles?: any[] }> => {
  try {
    // Obtener configuración del plan por defecto
    const defaultPlanConfig = await getDefaultPlanConfig();
    const defaultPlanCode = defaultPlanConfig.enabled ? defaultPlanConfig.planCode : 'AMATISTA'; // Fallback

    // Obtener información del usuario para determinar el tipo de cuenta
    const user = await UserModel.findById(userId).lean();
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    const accountType = user.accountType || 'common';

    // Obtener configuraciones de límites según el tipo de cuenta
    let freeProfilesMax, paidProfilesMax, totalVisibleMax;

    if (accountType === 'agency') {
      // Usar límites específicos para agencias
      [freeProfilesMax, paidProfilesMax, totalVisibleMax] = await Promise.all([
        ConfigParameterService.getValue('profiles.limits.agency.free_profiles_max'),
        ConfigParameterService.getValue('profiles.limits.agency.paid_profiles_max'),
        ConfigParameterService.getValue('profiles.limits.agency.total_visible_max')
      ]);
    } else {
      // Usar límites para usuarios comunes
      [freeProfilesMax, paidProfilesMax, totalVisibleMax] = await Promise.all([
        ConfigParameterService.getValue('profiles.limits.free_profiles_max'),
        ConfigParameterService.getValue('profiles.limits.paid_profiles_max'),
        ConfigParameterService.getValue('profiles.limits.total_visible_max')
      ]);
    }

    const limits = {
      freeProfilesMax: freeProfilesMax || (accountType === 'agency' ? 5 : 3),
      paidProfilesMax: paidProfilesMax || (accountType === 'agency' ? 50 : 10),
      totalVisibleMax: totalVisibleMax || (accountType === 'agency' ? 55 : 13),
      accountType
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
        (
          (profile.planAssignment.planId && profile.planAssignment.planId.toString() !== defaultPlanConfig.planId) ||
          (profile.planAssignment.planCode && profile.planAssignment.planCode !== defaultPlanCode)
        );

      if (hasActivePaidPlan) {
        paidProfilesCount++;
      } else {
        freeProfilesCount++;

        // Verificar si es un perfil con plan vencido
        const isExpiredPaidPlan = profile.planAssignment &&
          profile.planAssignment.expiresAt <= now &&
          (
            (profile.planAssignment.planId && profile.planAssignment.planId.toString() !== defaultPlanConfig.planId) ||
            (profile.planAssignment.planCode && profile.planAssignment.planCode !== defaultPlanCode)
          );

        if (isExpiredPaidPlan && profile.planAssignment) {
          expiredPaidProfiles.push({
            profileId: profile._id,
            profileName: profile.name,
            expiredPlan: profile.planAssignment.planCode || 'Plan desconocido',
            expiredAt: profile.planAssignment.expiresAt || null
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
export const validateProfilePlanUpgrade = async (profileId: string, newPlanCode: string): Promise<{ canUpgrade: boolean; reason?: string }> => {
  try {
    // Obtener configuración del plan por defecto
    const defaultPlanConfig = await getDefaultPlanConfig();
    const defaultPlanCode = defaultPlanConfig.enabled ? defaultPlanConfig.planCode : 'AMATISTA'; // Fallback

    // Obtener el perfil
    const profile = await ProfileModel.findById(profileId).lean();
    if (!profile) {
      throw new Error('Perfil no encontrado');
    }

    // Si el nuevo plan es el plan por defecto, siempre se puede "degradar"
    if (newPlanCode === defaultPlanCode) {
      return { canUpgrade: true };
    }

    const now = new Date();
    const currentlyHasPaidPlan = profile.planAssignment &&
      profile.planAssignment.expiresAt > now &&
      (
        (profile.planAssignment.planId && profile.planAssignment.planId.toString() !== defaultPlanConfig.planId) ||
        (profile.planAssignment.planCode && profile.planAssignment.planCode !== defaultPlanCode)
      );

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

export const purchaseUpgrade = async (profileId: string, upgradeCode: string, userId: string): Promise<{ profile: IProfile; invoice: IInvoice; upgradeCode?: string; status?: string; message?: string }> => {
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

  // Aplicar stacking policy para validaciones
  switch (upgrade.stackingPolicy) {
    case 'reject':
      if (existingUpgradeIndex !== -1) {
        const error = new Error('Upgrade ya activo');
        (error as any).status = 409;
        throw error;
      }
      break;
  }

  // Generar factura para el upgrade (por ahora precio 0, pero se puede configurar)
  let invoice = null;
  const upgradePrice = 0; // TODO: Configurar precios de upgrades

  try {
    invoice = await invoiceService.generateInvoice({
      profileId: profileId,
      userId: profile.user.toString(),
      upgradeCodes: [upgradeCode]
    });

    // Agregar factura al historial de pagos del perfil
    profile.paymentHistory.push(new Types.ObjectId(invoice._id as string));

    // Mantener perfil inactivo hasta que se pague la factura
    profile.isActive = false;

    await profile.save();

    console.log(`💰 Factura generada para upgrade ${upgradeCode} en perfil ${profileId}`);

    // Retornar información de la compra pendiente
    return {
      profile,
      invoice,
      upgradeCode,
      status: 'pending_payment',
      message: 'Upgrade pendiente de pago'
    };

  } catch (error) {
    console.error('❌ Error creando factura para upgrade:', error);
    throw new Error('Error al generar factura para el upgrade');
  }
};

/**
 * Actualiza el plan de un perfil a uno superior (upgrade)
 * @param profileId - ID del perfil
 * @param newPlanCode - Código del nuevo plan
 * @param variantDays - Días de la variante del nuevo plan (opcional, usa la más barata si no se especifica)
 * @returns Promise<Profile> - Perfil actualizado
 */
export const upgradePlan = async (profileId: string, newPlanCode: string, variantDays?: number): Promise<IProfile> => {
  // Validar parámetros de entrada
  if (!profileId) {
    throw new Error('profileId es requerido');
  }
  if (!newPlanCode || typeof newPlanCode !== 'string') {
    throw new Error('newPlanCode es requerido y debe ser un string');
  }

  // Normalizar el código del plan
  const normalizedPlanCode = newPlanCode.trim().toUpperCase();

  // Validar que el perfil existe
  const profile = await ProfileModel.findById(profileId);
  if (!profile) {
    throw new Error('Perfil no encontrado');
  }

  // Validar que tiene un plan activo
  const now = new Date();
  if (!profile.planAssignment || new Date(profile.planAssignment.expiresAt) <= now) {
    throw new Error('El perfil debe tener un plan activo para hacer upgrade');
  }

  // Validar que el nuevo plan existe
  const newPlan = await PlanDefinitionModel.findOne({ code: normalizedPlanCode, active: true });
  if (!newPlan) {
    throw new Error(`Plan con código ${normalizedPlanCode} no encontrado`);
  }

  // Obtener configuración del plan por defecto para construir jerarquía dinámica
  const defaultPlanConfig = await getDefaultPlanConfig();
  const defaultPlanCode = defaultPlanConfig.enabled ? defaultPlanConfig.planCode : 'AMATISTA'; // Fallback

  // Validar que es un upgrade (no downgrade)
  // Construir jerarquía dinámica con el plan por defecto en la posición más baja
  const planHierarchy = [defaultPlanCode, 'ESMERALDA', 'ORO', 'DIAMANTE'].filter((plan, index, arr) => arr.indexOf(plan) === index); // Eliminar duplicados
  const currentPlanCode = profile.planAssignment.planCode || defaultPlanCode;
  const currentIndex = planHierarchy.indexOf(currentPlanCode);
  const newIndex = planHierarchy.indexOf(normalizedPlanCode);

  if (newIndex <= currentIndex) {
    throw new Error('Solo se permiten upgrades a planes superiores. No se pueden hacer downgrades.');
  }

  // Determinar la variante a usar
  let selectedVariant;
  if (variantDays) {
    selectedVariant = newPlan.variants.find(v => v.days === variantDays);
    if (!selectedVariant) {
      throw new Error(`Variante de ${variantDays} días no encontrada para el plan ${normalizedPlanCode}`);
    }
  } else {
    // Usar la variante más barata (menor precio)
    selectedVariant = newPlan.variants.reduce((cheapest, current) =>
      current.price < cheapest.price ? current : cheapest
    );
  }

  // Validar límites de perfiles
  const upgradeValidation = await validateProfilePlanUpgrade(profileId, normalizedPlanCode);
  if (!upgradeValidation.canUpgrade) {
    throw new Error(upgradeValidation.reason || 'No se puede hacer upgrade a este plan');
  }

  // Calcular nueva fecha de expiración
  // Mantener el tiempo restante del plan actual y agregar los días del nuevo plan
  const currentExpiresAt = new Date(profile.planAssignment.expiresAt);
  const remainingTime = Math.max(0, currentExpiresAt.getTime() - now.getTime());
  const newExpiresAt = new Date(now.getTime() + remainingTime + (selectedVariant.days * 24 * 60 * 60 * 1000));

  // Actualizar el plan del perfil
  const updatedProfile = await ProfileModel.findByIdAndUpdate(
    profileId,
    {
      planAssignment: {
        planId: newPlan._id,
        planCode: normalizedPlanCode,
        variantDays: selectedVariant.days,
        startAt: profile.planAssignment.startAt, // Mantener fecha de inicio original
        expiresAt: newExpiresAt
      }
    },
    { new: true }
  );

  if (!updatedProfile) {
    throw new Error('Error al actualizar el perfil');
  }

  return updatedProfile;
};

/**
 * Obtiene el número de perfiles activos (con plan vigente) de un usuario
 */
export const getActiveProfilesCount = async (userId: string): Promise<number> => {
  const now = new Date();

  const activeProfilesCount = await ProfileModel.countDocuments({
    user_id: userId,
    'planAssignment.expiresAt': { $gt: now }
  });

  return activeProfilesCount;
};

/**
 * Borrado lógico de perfil (para usuarios)
 * Marca el perfil como inactivo pero mantiene todos los datos
 */
export const softDeleteProfile = async (profileId: string, userId: string): Promise<{ success: boolean; message: string }> => {
  try {
    const profile = await ProfileModel.findOne({ _id: profileId, user: userId });

    if (!profile) {
      return { success: false, message: 'Perfil no encontrado o no tienes permisos para eliminarlo' };
    }

    if (!profile.isActive) {
      return { success: false, message: 'El perfil ya está desactivado' };
    }

    // Borrado lógico: marcar como inactivo y no visible
    profile.isActive = false;
    profile.visible = false;
    await profile.save();

    return { success: true, message: 'Perfil desactivado exitosamente' };
  } catch (error) {
    return { success: false, message: 'Error al desactivar el perfil' };
  }
};

/**
 * Borrado físico de perfil (para administradores)
 * Elimina completamente el perfil y todos sus datos relacionados
 */
export const hardDeleteProfile = async (profileId: string): Promise<{ success: boolean; message: string }> => {
  try {
    const profile = await ProfileModel.findById(profileId);

    if (!profile) {
      return { success: false, message: 'Perfil no encontrado' };
    }

    // Eliminar verificaciones relacionadas
    const ProfileVerificationModel = (await import('../profile-verification/profile-verification.model')).ProfileVerification;
    await ProfileVerificationModel.deleteMany({ profile: profileId });

    // Eliminar facturas relacionadas
    const InvoiceModel = (await import('../payments/invoice.model')).default;
    await InvoiceModel.deleteMany({ profileId: profileId });

    // Eliminar el perfil completamente
    await ProfileModel.findByIdAndDelete(profileId);

    return { success: true, message: 'Perfil y todos sus datos eliminados permanentemente' };
  } catch (error) {
    return { success: false, message: 'Error al eliminar el perfil permanentemente' };
  }
};

/**
 * Restaurar perfil (reactivar después de borrado lógico)
 */
export const restoreProfile = async (profileId: string, userId: string): Promise<{ success: boolean; message: string }> => {
  try {
    const profile = await ProfileModel.findOne({ _id: profileId, user: userId });

    if (!profile) {
      return { success: false, message: 'Perfil no encontrado o no tienes permisos para restaurarlo' };
    }

    if (profile.isActive) {
      return { success: false, message: 'El perfil ya está activo' };
    }

    // Restaurar perfil
    profile.isActive = true;
    profile.visible = true;
    await profile.save();

    return { success: true, message: 'Perfil restaurado exitosamente' };
  } catch (error) {
    return { success: false, message: 'Error al restaurar el perfil' };
  }
};

/**
 * Obtener perfiles eliminados lógicamente (para administradores)
 */
export const getDeletedProfiles = async (page: number = 1, limit: number = 10): Promise<{ profiles: IProfile[]; pagination: { page: number; limit: number; total: number; pages: number } }> => {
  try {
    const skip = (page - 1) * limit;

    const profiles = await ProfileModel.find({ isActive: false })
      .populate('user', 'name email')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await ProfileModel.countDocuments({ isActive: false });

    return {
      profiles,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    throw new Error('Error al obtener perfiles eliminados');
  }
};
