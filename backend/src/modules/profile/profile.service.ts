import { Types } from 'mongoose';
import EmailService from '../../services/email.service';
import { validateProfileFeatures } from '../attribute-group/validateProfileFeatures';
import { ConfigParameterService } from '../config-parameter/config-parameter.service';
import type { IInvoice } from '../payments/invoice.model';
import InvoiceModel from '../payments/invoice.model';
import invoiceService from '../payments/invoice.service';
import { PlanDefinitionModel } from '../plans/plan.model';
import { UpgradeDefinitionModel } from '../plans/upgrade.model';
import { ProfileVerification } from '../profile-verification/profile-verification.model';
import { createProfileVerification, updatePhoneChangeDetectionStatus } from '../profile-verification/profile-verification.service';
import { enrichProfileVerification } from '../profile-verification/verification.helper';
import UserModel from '../user/User.model';
import { sortProfiles } from '../visibility/visibility.service';
import { ProfileModel } from './profile.model';
import type { CreateProfileDTO, IProfile } from './profile.types';

// Interfaz para la configuración del plan por defecto
interface DefaultPlanConfig {
  enabled: boolean;
  planId: string | null;
  planCode: string | null;
}

/**
 * Genera los objetos de upgrade incluidos en un plan, sincronizados con la expiración del plan
 */
const generatePlanUpgrades = (plan: any, startAt: Date, expiresAt: Date) => {
  if (!plan.includedUpgrades || plan.includedUpgrades.length === 0) return [];

  return plan.includedUpgrades.map((code: string) => ({
    code,
    startAt,
    endAt: expiresAt, // La fecha de fin se sincroniza con la del plan
    purchaseAt: startAt,
    isVisible: true
  }));
};

/**
 * Fusiona los upgrades actuales con los nuevos del plan, reemplazando los existentes del mismo tipo
 */
const mergeUpgrades = (currentUpgrades: any[], newUpgrades: any[]) => {
  const newCodes = newUpgrades.map(u => u.code);
  // Mantener upgrades existentes que NO están en el nuevo set (para no duplicar)
  // Los upgrades del plan tienen prioridad y reemplazan a los existentes del mismo tipo
  const kept = (currentUpgrades || []).filter(u => !newCodes.includes(u.code));
  return [...kept, ...newUpgrades];
};

/**
 * Limpia upgrades expirados y elimina duplicados del mismo tipo
 * Mantiene solo el upgrade más reciente de cada tipo
 */
const cleanProfileUpgrades = (profile: IProfile): void => {
  const now = new Date();
  const upgradeMap = new Map<string, any>();

  // Filtrar upgrades expirados y mantener solo el más reciente de cada tipo
  for (const upgrade of profile.upgrades) {
    // Saltar upgrades expirados
    if (upgrade.endAt <= now) {
      continue;
    }

    const existing = upgradeMap.get(upgrade.code);

    // Si no existe o el actual es más reciente, guardarlo
    if (!existing || upgrade.purchaseAt > existing.purchaseAt) {
      upgradeMap.set(upgrade.code, upgrade);
    }
  }

  // Reemplazar el array de upgrades con los upgrades limpios
  profile.upgrades = Array.from(upgradeMap.values());
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

// Interfaz para información del cupón
interface CouponInfo {
  code: string;
  name: string;
  type: string;
  value: number;
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
}

const generateWhatsAppMessage = async (
  userId: string,
  profileId: string,
  invoiceId?: string,
  invoiceNumber?: string,
  upgradeCode?: string,
  variantDays?: number,
  couponInfo?: CouponInfo
): Promise<WhatsAppMessage | null> => {
  try {
    // Obtener todos los datos necesarios en paralelo
    const [companyName, companyWhatsApp, user, fullProfile] = await Promise.all([
      ConfigParameterService.getValue('company.name'),
      ConfigParameterService.getValue('company.whatsapp.number'),
      UserModel.findById(userId).select('name'),
      ProfileModel.findById(profileId).select('name planAssignment').populate('planAssignment.planId')
    ]);

    if (!companyName || !companyWhatsApp) {
      return null;
    }

    // Obtener plan actual del perfil
    let currentPlanInfo = 'Sin plan';
    if (fullProfile?.planAssignment?.planId) {
      const currentPlan = fullProfile.planAssignment.planId as any;
      currentPlanInfo = currentPlan.name || currentPlan.code || 'Plan desconocido';
    } else if (fullProfile?.planAssignment?.planCode) {
      currentPlanInfo = fullProfile.planAssignment.planCode;
    }

    // Obtener información del producto/servicio a adquirir
    let productInfo = '';
    if (upgradeCode) {
      const upgrade = await UpgradeDefinitionModel.findOne({ code: upgradeCode });
      if (upgrade) {
        productInfo = `${upgrade.name} - $${upgrade.price.toFixed(2)}`;
      } else {
        productInfo = upgradeCode;
      }
    } else if (variantDays) {
      // Si es un plan, obtener el nombre del plan que se está comprando desde invoiceId
      // En lugar de usar el plan actual del perfil
      if (invoiceId) {
        try {
          const invoice = await InvoiceModel.findById(invoiceId).select('items');
          const planItem = invoice?.items.find((item: any) => item.type === 'plan');
          if (planItem) {
            productInfo = `${planItem.name} (${variantDays} días)`;
          } else {
            productInfo = `Plan (${variantDays} días)`;
          }
        } catch (error) {
          productInfo = `Plan (${variantDays} días)`;
        }
      } else {
        productInfo = `Plan (${variantDays} días)`;
      }
    }

    // Agregar información de cupón si existe
    let couponLine = '';
    if (couponInfo) {
      couponLine = `\n• Cupón: ${couponInfo.code} - Descuento: $${(couponInfo.discountAmount || 0).toFixed(2)}`;
    }

    // Generar mensaje con nueva estructura
    const userName = user?.name || 'Cliente';
    const profileName = fullProfile?.name || profileId;

    const message = `¡Hola prepagoYA.com! \n\nEspero que estén muy bien. Acabo de adquirir un paquete en su plataforma y me gustaría conocer las opciones disponibles para realizar el pago. \n\n *Detalles de Compra:*\n• Usuario: ${userName}\n• Perfil: ${profileName}\n• Plan Actual: ${currentPlanInfo}${invoiceNumber ? `\n• Factura: ${invoiceNumber}` : ''}${productInfo ? `\n• Productos/Servicios: ${productInfo}` : ''}${couponLine}\n\nGracias por tu compra.`;

    return {
      userId,
      profileId,
      company: companyName,
      companyNumber: companyWhatsApp,
      message
    };
  } catch (error) {
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

export const createProfile = async (data: CreateProfileDTO, skipLimitsValidation = false): Promise<IProfile> => {
  // Profile creation debug removed

  await validateProfileFeatures(data.features);

  // Validar límites de perfiles por usuario antes de crear (si no se omite la validación)
  if (!skipLimitsValidation) {
    const profileLimitsValidation = await validateUserProfileLimits(data.user.toString());
    if (!profileLimitsValidation.canCreate) {
      throw new Error(profileLimitsValidation.reason || 'No se puede crear el perfil debido a límites de usuario');
    }
  }

  // profile name can exist
  /*   const { exists, message } = await checkProfileNameExists(data.name);
    if (exists) {
      throw new Error(message);
    } */

  // Crear perfil con isActive=false y visible=false por defecto
  // El perfil estará inactivo e invisible hasta que se confirme el pago de su factura
  // Excluir planAssignment del data para evitar sobrescribir la asignación automática
  const { planAssignment, ...profileData } = data;

  // Inicializar correctamente los campos de contacto
  // Si hay un número de contacto en la primera creación, no se considera un cambio
  if (profileData.contact?.number) {
    profileData.contact = {
      ...profileData.contact,
      hasChanged: false,           // No es cambio (es primera vez)
      lastChangeDate: new Date()   // Marcar cuándo se creó/estableció
    } as any;
  }

  let profile = await ProfileModel.create({
    ...profileData,
    isActive: false,  // Inactivo por defecto hasta pago de factura
    visible: false    // No visible hasta pago de factura
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
          profile._id.toString(),
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
    // Asegurarse de que tenemos el ID del perfil como string
    const profileIdStr = (profile._id as any).toString();

    const verification = await createProfileVerification({
      profile: profileIdStr,
      verificationStatus: 'check',
    });

    // Actualizar el perfil con la referencia a la verificación
    if (verification && verification._id) {
      // Usar updateOne para evitar hooks o validaciones innecesarias que puedan fallar
      await ProfileModel.updateOne(
        { _id: profile._id },
        { $set: { verification: verification._id } }
      );

      // Actualizar la instancia local del perfil para devolverla completa
      profile.verification = verification._id as any;
    }
  } catch (error) {
    console.error('Error al crear/vincular verificación automática:', error);
    // No fallar la creación del perfil si falla la verificación, pero loguear el error
  }

  return profile;
};

/**
 * Envía un correo de notificación al administrador cuando se crea un nuevo perfil
 */
async function sendProfileCreationNotification(profile: IProfile, invoice: IInvoice | null): Promise<void> {
  try {
    // Obtener información del usuario
    const user = await UserModel.findById(profile.user).select('name email accountType');
    if (!user) {
      return;
    }

    // Obtener el correo de la empresa desde la configuración
    const companyEmail = await ConfigParameterService.getValue('company.email');
    const companyName = await ConfigParameterService.getValue('company.name') || 'Administrador';

    if (!companyEmail) {
      return;
    }

    // Preparar información del perfil
    const profileInfo = `
      <strong>ID:</strong> ${profile._id}<br>
      <strong>Nombre del perfil:</strong> ${profile.name}<br>
      <strong>Descripción:</strong> ${profile.description || 'Sin descripción'}<br>
      <strong>Ubicación:</strong> ${profile.location?.city?.label || 'N/A'}, ${profile.location?.department?.label || 'N/A'}, ${profile.location?.country?.label || 'N/A'}<br>
      <strong>Estado:</strong> ${profile.isActive ? 'Activo' : 'Inactivo'}<br>
      <strong>Visible:</strong> ${profile.visible ? 'Sí' : 'No'}<br>
      <strong>Contacto:</strong> ${profile.contact?.number || 'N/A'}<br>
      <strong>Edad:</strong> ${profile.age || 'N/A'}
    `;

    // Preparar información del usuario
    const userInfo = `
      <strong>ID:</strong> ${user._id}<br>
      <strong>Nombre:</strong> ${user.name}<br>
      <strong>Email:</strong> ${user.email}<br>
      <strong>Tipo de cuenta:</strong> ${user.accountType === 'agency' ? 'Agencia' : 'Usuario común'}
    `;

    // Preparar información de la factura (si existe)
    let invoiceSection = '';
    if (invoice) {
      const invoiceItems = invoice.items?.map(item => {
        const days = item.days ? ` (${item.days} días)` : '';
        const price = item.price !== undefined ? item.price.toFixed(2) : '0.00';
        return `${item.name || 'Item'}${days} - $${price}`;
      }).join('<br>') || 'Sin items';

      const couponInfo = invoice.coupon
        ? `<br><strong>Cupón aplicado:</strong> ${invoice.coupon.code || 'N/A'} - Descuento: $${(invoice.coupon.discountAmount || 0).toFixed(2)}`
        : '';

      const totalAmount = invoice.totalAmount !== undefined ? invoice.totalAmount.toFixed(2) : '0.00';

      invoiceSection = `
        <div style="background-color: #fff3cd; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
          <h3 style="color: #856404; margin-top: 0;">💳 Información de Facturación</h3>
          <p><strong>Número de factura:</strong> #${invoice.invoiceNumber || 'N/A'}</p>
          <p><strong>Estado:</strong> <span style="color: ${invoice.status === 'paid' ? '#28a745' : '#ffc107'}; font-weight: bold; text-transform: uppercase;">${invoice.status || 'pending'}</span></p>
          <p><strong>Items:</strong><br>${invoiceItems}</p>
          <p><strong>Total:</strong> $${totalAmount}</p>
          ${couponInfo}
          <p><strong>Creada:</strong> ${invoice.createdAt ? invoice.createdAt.toLocaleString('es-ES') : 'N/A'}</p>
          <p><strong>Expira:</strong> ${invoice.expiresAt ? invoice.expiresAt.toLocaleString('es-ES') : 'N/A'}</p>
        </div>
      `;
    }

    // Construir el HTML del correo
    const htmlPart = `
      <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; background-color: #f8f9fa; padding: 20px;">
        <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="color: #007bff; border-bottom: 3px solid #007bff; padding-bottom: 10px; margin-top: 0;">
            🎉 Nuevo Perfil Creado
          </h2>
          
          <div style="background-color: #e7f3ff; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #007bff;">
            <h3 style="color: #004085; margin-top: 0;">👤 Información del Usuario</h3>
            <p>${userInfo}</p>
          </div>
          
          <div style="background-color: #d4edda; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #28a745;">
            <h3 style="color: #155724; margin-top: 0;">📋 Información del Perfil</h3>
            <p>${profileInfo}</p>
          </div>
          
          ${invoiceSection}
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #dee2e6;">
          
          <p style="color: #6c757d; font-size: 12px; text-align: center;">
            Este correo se generó automáticamente al crear un nuevo perfil en el sistema.<br>
            Fecha: ${new Date().toLocaleString('es-ES')}
          </p>
        </div>
      </div>
    `;

    // Preparar el texto plano
    const textPart = `
Nuevo Perfil Creado

INFORMACIÓN DEL USUARIO:
- ID: ${user._id}
- Nombre: ${user.name}
- Email: ${user.email}
- Tipo de cuenta: ${user.accountType === 'agency' ? 'Agencia' : 'Usuario común'}

INFORMACIÓN DEL PERFIL:
- ID: ${profile._id}
- Nombre: ${profile.name}
- Descripción: ${profile.description || 'Sin descripción'}
- Ubicación: ${profile.location?.city?.label || 'N/A'}, ${profile.location?.department?.label || 'N/A'}, ${profile.location?.country?.label || 'N/A'}
- Estado: ${profile.isActive ? 'Activo' : 'Inactivo'}
- Visible: ${profile.visible ? 'Sí' : 'No'}
- Contacto: ${profile.contact?.number || 'N/A'}
- Edad: ${profile.age || 'N/A'}

${invoice ? `
INFORMACIÓN DE FACTURACIÓN:
- Número de factura: #${invoice.invoiceNumber || 'N/A'}
- Estado: ${invoice.status || 'pending'}
- Total: $${invoice.totalAmount !== undefined ? invoice.totalAmount.toFixed(2) : '0.00'}
- Creada: ${invoice.createdAt ? invoice.createdAt.toLocaleString('es-ES') : 'N/A'}
- Expira: ${invoice.expiresAt ? invoice.expiresAt.toLocaleString('es-ES') : 'N/A'}
${invoice.coupon ? `- Cupón aplicado: ${invoice.coupon.code || 'N/A'}` : ''}
` : ''}

---
Este correo se generó automáticamente.
Fecha: ${new Date().toLocaleString('es-ES')}
    `;

    // Enviar el correo
    const emailService = new EmailService();
    const result = await emailService.sendSingleEmail({
      to: {
        email: companyEmail,
        name: companyName
      },
      content: {
        subject: `[Nuevo Perfil] ${profile.name} - Usuario: ${user.name}`,
        textPart: textPart.trim(),
        htmlPart: htmlPart
      }
    });

    if (!result.success) {
      throw new Error(result.error || 'Error al enviar correo de notificación');
    }
  } catch (error) {
    throw error;
  }
}

/**
 * Crea un perfil con generación automática de factura para planes de pago
 */
export const createProfileWithInvoice = async (data: CreateProfileDTO & { planId?: string; planCode?: string; planDays?: number; generateInvoice?: boolean; couponCode?: string }): Promise<{
  profile: IProfile;
  invoice: IInvoice | null;
  whatsAppMessage?: WhatsAppMessage | null;
}> => {
  const { planId, planCode, planDays, generateInvoice = false, couponCode, ...profileData } = data;

  // Obtener configuración del plan por defecto antes de crear el perfil
  const defaultPlanConfig = await getDefaultPlanConfig();
  const defaultPlanCode = defaultPlanConfig.enabled ? defaultPlanConfig.planCode : null;

  // Validar límites ANTES de crear el perfil, pasando el planCode para una validación correcta
  const limitsValidation = await validateUserProfileLimits(profileData.user.toString(), planCode);

  // Si el usuario está intentando crear un perfil gratuito y ha superado el límite, denegar la creación
  if (!limitsValidation.canCreate && (!planCode || planCode === defaultPlanCode)) {
    throw new Error(limitsValidation.reason || 'No se puede crear más perfiles gratuitos. Debe adquirir un plan de pago.');
  }

  // Crear el perfil (con plan por defecto configurado), omitiendo validación de límites ya que se hizo arriba
  const profile = await createProfile(profileData, true);

  let shouldBeVisible = true;

  // Si el usuario superó el límite de perfiles gratuitos y no compró un plan, ocultar el perfil
  if (!limitsValidation.canCreate && (!planCode || planCode === defaultPlanCode)) {
    // Usuario superó límite de perfiles gratuitos, perfil será invisible hasta pago
    shouldBeVisible = false;
  }

  let invoice = null;

  // Si se especifica un plan de pago, generar factura pero mantener el perfil con plan por defecto
  if ((planId || planCode) && planDays) {
    // Procesando plan de pago
    try {
      // Validar que el plan existe y obtener el precio
      // Buscando definición del plan por ID (prioritario) o por código

      let plan;
      if (planId) {
        plan = await PlanDefinitionModel.findById(planId);
      }

      // Fallback a búsqueda por código si no se encontró por ID
      if (!plan && planCode) {
        plan = await PlanDefinitionModel.findOne({ code: planCode });
      }

      if (!plan) {
        // Plan no encontrado
        throw new Error(`Plan con ${planId ? `ID ${planId}` : `código ${planCode}`} no encontrado`);
      }

      // Verificar si es el plan por defecto (no cobrar)
      const isPlanGratuito = planCode === defaultPlanCode || plan.code === defaultPlanCode;

      if (isPlanGratuito) {
        // No generar factura para plan gratuito
        return {
          profile,
          invoice: null,
          whatsAppMessage: null
        };
      }

      // Plan encontrado

      const variant = plan.variants.find(v => v.days === planDays);
      if (!variant) {
        // Variante no encontrada
        throw new Error(`Variante de ${planDays} días no encontrada para el plan ${plan.code}`);
      }
      // Variante encontrada

      // LÓGICA DE FACTURACIÓN:
      // - Usuarios regulares: generateInvoice = true (siempre factura para planes de pago)
      // - Admins: generateInvoice = valor del checkbox (pueden asignar sin factura)

      // ✅ CASO 1: Plan GRATUITO (price === 0)
      if (variant.price === 0) {
        const startAt = new Date();
        const expiresAt = new Date(startAt.getTime() + (planDays * 24 * 60 * 60 * 1000));

        // Generar upgrades incluidos en el plan
        const planUpgrades = generatePlanUpgrades(plan, startAt, expiresAt);

        // Fusionar con upgrades existentes
        const updatedUpgrades = mergeUpgrades(profile.upgrades || [], planUpgrades);

        // Asignar plan gratuito directamente con todas las fechas
        await ProfileModel.findByIdAndUpdate(
          profile._id,
          {
            planAssignment: {
              planId: plan._id,
              planCode: plan.code,
              variantDays: planDays,
              startAt,
              expiresAt
            },
            upgrades: updatedUpgrades,
            isActive: true,
            visible: shouldBeVisible
          }
        );

        // NO generar factura ni mensaje de WhatsApp para planes gratuitos
        // La notificación se enviará al final de la función
      }
      // ✅ CASO 2: Plan DE PAGO (price > 0) CON factura
      else if (variant.price > 0 && generateInvoice) {
        // Generar factura (puede incluir cupón que reduzca el precio a 0)
        invoice = await invoiceService.generateInvoice({
          profileId: (profile._id as Types.ObjectId).toString(),
          userId: profile.user.toString(),
          planId: plan._id.toString(), // Usar el ID del plan
          planCode: plan.code, // También pasar el código para compatibilidad
          planDays: planDays,
          couponCode: couponCode, // Pasar el código del cupón
          notes: `Factura generada para nuevo perfil ${profile.name || profile._id}`
        });

        // ✅ VALIDACIÓN: Si después de aplicar cupón el monto final es 0, marcar factura como pagada
        // y asignar el plan directamente (cupón 100% descuento)
        if (invoice.totalAmount === 0) {
          // Marcar factura como pagada usando el servicio (esto incrementa el uso del cupón)
          await invoiceService.markAsPaid(invoice._id.toString());

          // Calcular fechas de asignación
          const startAt = new Date();
          const expiresAt = new Date(startAt.getTime() + (planDays * 24 * 60 * 60 * 1000));

          // Generar upgrades incluidos en el plan
          const planUpgrades = generatePlanUpgrades(plan, startAt, expiresAt);

          // Fusionar con upgrades existentes (aunque es perfil nuevo, por consistencia)
          const updatedUpgrades = mergeUpgrades(profile.upgrades || [], planUpgrades);

          // Asignar plan directamente y activar perfil
          await ProfileModel.findByIdAndUpdate(
            profile._id,
            {
              planAssignment: {
                planId: plan._id,
                planCode: plan.code,
                variantDays: planDays,
                startAt,
                expiresAt
              },
              upgrades: updatedUpgrades,
              $push: { paymentHistory: new Types.ObjectId(invoice._id as string) },
              isActive: true,
              visible: shouldBeVisible
            }
          );

          // Limpiar invoice para evitar generar mensaje de WhatsApp (no hay que pagar)
          invoice = null;
        } else {
          // Monto final > 0, mantener factura pendiente y actualizar perfil
          await ProfileModel.findByIdAndUpdate(
            profile._id,
            {
              $push: { paymentHistory: new Types.ObjectId(invoice._id as string) },
              isActive: false,       // Mantener inactivo hasta que se pague la factura
              visible: false         // Ocultar hasta que se pague la factura
            }
          );
        }
      }
      // ✅ CASO 3: Plan DE PAGO (price > 0) SIN factura (admin)
      else if (variant.price > 0 && !generateInvoice) {
        // Calcular fechas para asignación directa
        const startAt = new Date();
        const expiresAt = new Date(startAt.getTime() + (planDays * 24 * 60 * 60 * 1000));

        // Generar upgrades incluidos en el plan
        const planUpgrades = generatePlanUpgrades(plan, startAt, expiresAt);

        // Fusionar con upgrades existentes
        const updatedUpgrades = mergeUpgrades(profile.upgrades || [], planUpgrades);

        // Asignar plan directamente sin generar factura
        await ProfileModel.findByIdAndUpdate(
          profile._id,
          {
            planAssignment: {
              planId: plan._id,
              planCode: plan.code,
              variantDays: planDays,
              startAt,
              expiresAt
            },
            upgrades: updatedUpgrades,
            isActive: true,
            visible: shouldBeVisible
          }
        );
      }
    } catch (error) {
      // Si falla la facturación, el perfil se mantiene con plan por defecto
    }
  } else {
    // Asegurar que el perfil tenga la visibilidad correcta según límites
    await ProfileModel.findByIdAndUpdate(
      profile._id,
      {
        isActive: true,
        visible: shouldBeVisible
      }
    );
  }

  const whatsAppMessage = await generateWhatsAppMessage(
    profile.user.toString(),
    (profile._id as Types.ObjectId).toString(),
    invoice?._id?.toString(),
    invoice?.invoiceNumber?.toString(),
    planCode,
    planDays,
    invoice?.coupon &&
      invoice.coupon.code &&
      invoice.coupon.originalAmount !== undefined &&
      invoice.coupon.discountAmount !== undefined &&
      invoice.coupon.finalAmount !== undefined
      ? {
        code: invoice.coupon.code,
        name: invoice.coupon.name || '',
        type: invoice.coupon.type || '',
        value: invoice.coupon.value || 0,
        originalAmount: invoice.coupon.originalAmount,
        discountAmount: invoice.coupon.discountAmount,
        finalAmount: invoice.coupon.finalAmount
      }
      : undefined
  );

  // Enviar correo de notificación al administrador
  try {
    await sendProfileCreationNotification(profile, invoice);
  } catch (emailError) {
    // No lanzar error - el correo es secundario, no debe interrumpir la creación del perfil
  }

  return { profile, invoice, whatsAppMessage };
};

// Helper para extraer categoría de features
export const extractCategoryFromFeatures = (features: any[]): string | null => {
  if (!features || !Array.isArray(features)) return null;

  const categoryFeature = features.find((f: any) => {
    // CASO 1: group_id es un objeto poblado
    if (f.group_id && typeof f.group_id === 'object') {
      const key = f.group_id.key?.toLowerCase();
      const name = f.group_id.name?.toLowerCase();
      return key === 'category' || name === 'categoría' || name === 'categoria';
    }
    
    // CASO 2: group_id es un string (ID) pero el valor nos da una pista
    else if (f.value && Array.isArray(f.value) && f.value.length > 0) {
      const val = f.value[0];
      if (typeof val === 'object' && val !== null && val.key) {
         const key = val.key.toLowerCase();
         return ['escort', 'escorts', 'masajista', 'masajistas', 'trans', 'bdsm', 'pareja', 'parejas'].includes(key);
      }
    }
    return false;
  });

  if (categoryFeature && categoryFeature.value && categoryFeature.value.length > 0) {
    const val = categoryFeature.value[0];
    if (typeof val === 'object' && val !== null) {
      return val.label || val.value || val.key;
    }
    return val;
  }
  return null;
};

export const getProfiles = async (page: number = 1, limit: number = 10, fields?: string): Promise<{ profiles: IProfile[]; pagination: { page: number; limit: number; total: number; pages: number } }> => {
  const skip = (page - 1) * limit;

  // Filtrar solo perfiles visibles y no eliminados lógicamente
  let query = ProfileModel.find({
    visible: true,
    isDeleted: { $ne: true }
  });

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

    // Ensure createdAt and contact are selected for dynamic verification calculation
    if (needsIsVerified || cleaned.includes('verification')) {
      if (!cleaned.includes('createdAt')) cleaned.push('createdAt');
      if (!cleaned.includes('contact')) cleaned.push('contact');
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
      select: 'verificationProgress verificationStatus steps'
    })
    .populate({
      path: 'features.group_id',
      select: 'name label',
    })
    .skip(skip)
    .limit(limit)
    .lean();

  const now = new Date();
  const minAgeMonths = await ConfigParameterService.getValue('profile.verification.minimum_age_months') || 12;

  const profiles = rawProfiles.map(rawProfile => {
    // Enriquecer perfil con cálculo dinámico de verificación
    const profile = enrichProfileVerification(rawProfile, Number(minAgeMonths));

    // Calcular estado de verificación basado en campos individuales
    let isVerified = false;
    if (profile.verification) {
      const verification = profile.verification as any;
      // Adaptamos la lógica para usar los steps enriquecidos
      const verifiedCount = Object.values(verification.steps || {}).filter((step: any) => step?.isVerified === true).length;

      // Si tiene los 5 pasos verificados
      if (verifiedCount >= 5) {
        isVerified = true;
      }
    }

    const featured = profile.upgrades?.some((upgrade: any) =>
      (upgrade.code === 'DESTACADO' || upgrade.code === 'HIGHLIGHT') &&
      new Date(upgrade.startAt) <= now && new Date(upgrade.endAt) > now
    ) || false;

    // Extraer categoría
    const category = extractCategoryFromFeatures(profile.features);

    return {
      ...profile,
      isVerified,
      featured,
      category
    };
  }) as unknown as IProfile[];

  const total = await ProfileModel.countDocuments({});

  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;
  const nextPage = hasNextPage ? page + 1 : null;
  const prevPage = hasPrevPage ? page - 1 : null;
  const pagingCounter = (page - 1) * limit + 1;

  return {
    profiles,
    pagination: {
      page,
      limit,
      total,
      pages: totalPages
    }
  };
};

export const getProfilesForHome = async (page: number = 1, limit: number = 20): Promise<{ profiles: any[]; pagination: { page: number; limit: number; total: number; pages: number } }> => {
  const skip = (page - 1) * limit;
  const now = new Date();

  // DEBUG getProfilesForHome - Iniciando consulta

  // Obtener todos los perfiles activos y visibles CON USUARIOS VERIFICADOS
  // Solo seleccionar campos mínimos necesarios para la vista previa
  const profiles = await ProfileModel.find({
    isActive: true,
    visible: true,
    isDeleted: { $ne: true }, // Excluir perfiles eliminados lógicamente
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
      description: 1,
      user: 1, // IMPORTANTE: Incluir referencia al usuario
      contact: 1, // IMPORTANTE: Necesario para verificación dinámica
      'location.city.label': 1,
      'location.department.label': 1,
      'media.gallery': { $slice: 1 }, // Solo la primera imagen
      planAssignment: 1,
      upgrades: 1,
      lastLogin: 1,
      createdAt: 1,
      updatedAt: 1,
      features: 1 // Incluir features para mostrar categoría
    })
    .populate({
      path: 'user',
      model: 'User',
      select: 'name email isVerified',
      match: { isVerified: true } // FILTRO CRÍTICO: Solo usuarios verificados
    })
    .populate({
      path: 'features.group_id',
      select: 'name label key', // Incluir key para búsqueda segura
    })
    .populate({
      path: 'verification',
      model: 'ProfileVerification',
      select: 'verificationProgress verificationStatus steps'
    })
    .populate({
      path: 'planAssignment.planId',
      model: 'PlanDefinition',
      select: 'name code level features includedUpgrades'
    })
    .lean();

  // Perfiles encontrados antes del filtro

  // Filtrar perfiles que NO tienen usuario verificado (populate devuelve null)
  const profilesWithVerifiedUsers = profiles.filter(profile => {
    const hasVerifiedUser = profile.user !== null;
    if (!hasVerifiedUser) {
      // Perfil filtrado (usuario no verificado)
    }
    return hasVerifiedUser;
  });

  // Perfiles con usuarios verificados

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
    console.error('Error getting default plan config:', error);
  }

  // Debug: Log información de filtrado
  // Plan definitions found y available plan codes

  // Filtrar perfiles que deben mostrarse en home y enriquecer con información de jerarquía
  const filteredProfiles = profilesWithVerifiedUsers.filter(profile => {
    let planCode = null;

    // Determinar el código del plan desde planAssignment
    if (profile.planAssignment?.planCode) {
      planCode = profile.planAssignment.planCode;
    }

    // Debug: Log información del perfil
    // Profile plan info

    // Si no tiene plan asignado, verificar configuración del plan por defecto
    if (!planCode) {
      // Si hay un plan por defecto configurado, usar sus features
      if (defaultPlanFeatures) {
        const shouldShow = defaultPlanFeatures.showInHome === true;
        // No plan assigned, using default plan features
        return shouldShow;
      }
      // Si no hay plan por defecto configurado, no mostrar en home por seguridad
      // No plan assigned and no default plan configured
      return false;
    }

    // Verificar si el plan permite mostrar en home
    const planFeatures = planCodeToFeatures[planCode];
    if (!planFeatures) {
      // Plan features not found for plan code
      return false;
    }

    const shouldShow = planFeatures.showInHome === true;
    // Plan showInHome validation
    return shouldShow;
  });

  const sortedProfiles = await sortProfiles(filteredProfiles as any, now, 'HOME');

  // Aplicar paginación DESPUÉS del ordenamiento
  const paginatedProfiles = sortedProfiles.slice(skip, skip + limit);

  // Mapear perfiles para incluir información de verificación
  // Mapear perfiles para incluir información de verificación
  const minAgeMonths = await ConfigParameterService.getValue('profile.verification.minimum_age_months') || 12;

  const cleanProfiles = paginatedProfiles.map(rawProfile => {
    // Enriquecer perfil con cálculo dinámico de verificación (Score y Steps)
    const profile = enrichProfileVerification(rawProfile, Number(minAgeMonths));

    // Verificar upgrades activos para incluir en respuesta
    const activeUpgrades = profile.upgrades?.filter((upgrade: any) =>
      new Date(upgrade.startAt) <= now && new Date(upgrade.endAt) > now
    ) || [];

    const hasDestacadoUpgrade = activeUpgrades.some((u: any) =>
      u.code === 'DESTACADO' || u.code === 'HIGHLIGHT'
    );
    const hasImpulsoUpgrade = activeUpgrades.some((u: any) =>
      u.code === 'IMPULSO' || u.code === 'BOOST'
    );

    // Calcular estado de verificación basado en campos individuales
    // NOTA: enrichProfileVerification ya calculó el verificationProgress
    let isVerified = false;
    let verificationLevel = 'pending';

    if (profile.verification) {
      const verification = profile.verification as any;
      // Mantenemos la lógica de isVerified basada en steps explícitos si es necesario,
      // o podemos confiar en el progress. Por ahora mantenemos la lógica existente para isVerified
      // pero usamos el progress calculado dinámicamente.

      // La lógica original contaba 'verified' values.
      // Ahora verification.steps tiene objetos con { isVerified: boolean }
      // Adaptamos la lógica si es necesario, pero enrichProfileVerification devuelve una estructura compatible

      const verifiedCount = Object.values(verification.steps || {}).filter((step: any) => step?.isVerified === true).length;
      // Total steps considerados en el helper son 5

      if (verifiedCount >= 5) { // Si tiene los 5 pasos
        isVerified = true;
        verificationLevel = 'verified';
      } else if (verifiedCount > 0) {
        verificationLevel = 'partial';
      }
    }

    // Extraer categoría
    const category = extractCategoryFromFeatures(profile.features);

    return {
      ...profile,
      hasDestacadoUpgrade,
      hasImpulsoUpgrade,
      category, // Nueva propiedad
      verification: {
        ...(typeof profile.verification === 'object' && profile.verification !== null ? profile.verification : {}),
        isVerified,
        verificationLevel
      }
    };
  });

  const total = filteredProfiles.length;

  // DEBUG - Resultado final

  // Debug: Mostrar algunos perfiles de ejemplo
  cleanProfiles.slice(0, 3).forEach((profile, index) => {
    const user = profile.user as any;
    // DEBUG - Perfil info
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
    .populate('user', '_id name email accountType')
    .populate('features.group_id')
    .populate({
      path: 'verification',
      model: 'ProfileVerification',
      select: 'verificationProgress verificationStatus steps'
    });

  if (!profile) {
    return null;
  }

  // Transformar los features al formato requerido
  const transformedProfile = profile.toObject();

  // IMPORTANTE: Asegurar que contact y createdAt estén disponibles para enrichProfileVerification
  // Estas propiedades son necesarias para calcular accountAge y contactConsistency
  if (!transformedProfile.contact) {
    transformedProfile.contact = {
      number: null,
      lastChangeDate: new Date(),
      hasChanged: false,
    };
  }
  if (!transformedProfile.createdAt) {
    transformedProfile.createdAt = new Date();
  }

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

  // Enriquecer con verificación dinámica (Score y Steps calculados al vuelo)
  const minAgeMonths = await ConfigParameterService.getValue('profile.verification.minimum_age_months') || 12;
  const enrichedProfile = enrichProfileVerification(transformedProfile, Number(minAgeMonths));

  return enrichedProfile;
};

export const updateProfile = async (
  id: string,
  data: Partial<CreateProfileDTO>,
) => {
  // Proteger el campo 'user' - no debe cambiar nunca (auditoría)
  // El perfil siempre debe mantener su propietario original
  const { user, ...safeData } = data;

  // Recuperar perfil existente para detectar cambios
  const existingProfile = await ProfileModel.findById(id);

  if (!existingProfile) {
    throw new Error('Perfil no encontrado');
  }

  // DETECCIÓN DE CAMBIO DE TELÉFONO
  if (safeData.contact?.number !== undefined) {
    const oldNumber = existingProfile.contact?.number;
    const newNumber = safeData.contact.number;

    if (oldNumber !== newNumber) {
      // Caso 1: Primer número (no penalizar)
      if (!oldNumber || oldNumber === null) {
        safeData.contact = {
          ...safeData.contact,
          hasChanged: false,
          lastChangeDate: new Date()
        } as any;
      }
      // Caso 2: Cambio de número (penalizar)
      else {
        safeData.contact = {
          ...safeData.contact,
          hasChanged: true,
          lastChangeDate: new Date()
        } as any;
      }
    } else {
      // Caso 3: Número igual - preservar valores existentes
      safeData.contact = {
        ...safeData.contact,
        hasChanged: existingProfile.contact?.hasChanged ?? false,
        lastChangeDate: existingProfile.contact?.lastChangeDate ?? new Date()
      } as any;
    }
  }

  // Si se está actualizando el campo media, hacer merge con los datos existentes
  if (safeData.media) {
    if (existingProfile && existingProfile.media) {
      // Hacer merge del campo media preservando los datos existentes
      // Solo usar datos existentes si el campo no está definido en safeData.media
      safeData.media = {
        gallery: safeData.media.gallery !== undefined ? safeData.media.gallery : (existingProfile.media.gallery || []),
        videos: safeData.media.videos !== undefined ? safeData.media.videos : (existingProfile.media.videos || []),
        audios: safeData.media.audios !== undefined ? safeData.media.audios : (existingProfile.media.audios || []),
        stories: safeData.media.stories !== undefined ? safeData.media.stories : (existingProfile.media.stories || []),
      };
    }
  }

  const updatedProfile = await ProfileModel.findByIdAndUpdate(id, safeData, { new: true });

  // DISPARAR RECÁLCULO DE VERIFICACIÓN si cambió el teléfono
  if (safeData.contact?.number !== undefined && updatedProfile) {
    try {
      await updatePhoneChangeDetectionStatus(updatedProfile);
    } catch (error) {
      console.error('Error al actualizar estado de verificación de teléfono:', error);
      // No fallar la actualización del perfil si falla la verificación
    }
  }

  return updatedProfile;
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

export const addStory = async (profileId: string, storyData: { link: string; type: 'image' | 'video'; duration?: number; startTime?: number }) => {
  const profile = await ProfileModel.findById(profileId).populate('planAssignment.planId');
  if (!profile) throw new Error('Profile not found');

  // Check plan limits
  const plan = profile.planAssignment?.planId as any;
  // If no plan, assume default limits (maybe 0 or small number)
  const storiesLimit = plan?.contentLimits?.storiesPerDayMax || 0;

  // Count stories from last 24h
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentStories = profile.media?.stories?.filter(s => {
    const createdAt = new Date(s.createdAt);
    return createdAt > oneDayAgo;
  }) || [];

  if (recentStories.length >= storiesLimit) {
    // Calculate next upload date for error message
    const sortedStories = recentStories.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    const oldestRecentStory = sortedStories[0];
    const nextUploadDate = new Date(new Date(oldestRecentStory.createdAt).getTime() + 24 * 60 * 60 * 1000);

    throw new Error(`Has alcanzado el límite diario de historias (${storiesLimit}). Podrás subir más el ${nextUploadDate.toLocaleString()}`);
  }

  // Add story
  const updatedProfile = await ProfileModel.findByIdAndUpdate(profileId, {
    $push: {
      'media.stories': {
        ...storyData,
        createdAt: new Date()
      }
    }
  }, { new: true });

  return updatedProfile;
};

export const getProfilesWithStories = async (page: number = 1, limit: number = 10): Promise<{ profiles: IProfile[]; total: number; page: number; limit: number; totalPages: number }> => {
  const skip = (page - 1) * limit;
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const pipeline = [
    {
      $match: {
        isActive: true,
        'media.stories': {
          $elemMatch: { createdAt: { $gt: oneDayAgo } }
        }
      }
    },
    {
      $project: {
        name: 1,
        media: {
          stories: {
            $filter: {
              input: '$media.stories',
              as: 'story',
              cond: { $gt: ['$$story.createdAt', oneDayAgo] }
            }
          },
          gallery: 1
        },
        user: 1,
        createdAt: 1
      }
    },
    { $sort: { 'media.stories.createdAt': -1 } as Record<string, 1 | -1> },
    {
      $facet: {
        metadata: [{ $count: "total" }],
        data: [{ $skip: skip }, { $limit: limit }]
      }
    }
  ];

  const result = await ProfileModel.aggregate(pipeline);

  const profiles = result[0].data;
  const total = result[0].metadata[0]?.total || 0;

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

      // Factura generada automáticamente

      // NUEVO FLUJO: Desactivar perfil hasta que se pague la factura
      // NO asignar el plan todavía, mantener el plan actual
      const updatedProfile = await ProfileModel.findByIdAndUpdate(
        profileId,
        { isActive: false },
        { new: true }
      );

      // Perfil desactivado hasta confirmación de pago

      return { profile: updatedProfile, invoice };
    } catch (error) {
      // Error al generar factura automática
      // No fallar la suscripción si falla la generación de factura
    }
  }

  // NUEVO FLUJO: Solo asignar plan si es gratuito o no se genera factura
  if (!generateInvoice || planCode === defaultPlanCode) {
    // Calcular fechas
    const startAt = new Date();
    const expiresAt = new Date(startAt.getTime() + (variantDays * 24 * 60 * 60 * 1000));

    // Generar upgrades incluidos en el plan
    const planUpgrades = generatePlanUpgrades(plan, startAt, expiresAt);

    // Fusionar con upgrades existentes
    const updatedUpgrades = mergeUpgrades(profile.upgrades || [], planUpgrades);

    // Actualizar perfil con el plan gratuito
    const updateData: any = {
      planAssignment: {
        planId: plan._id,
        planCode,
        variantDays,
        startAt,
        expiresAt
      },
      upgrades: updatedUpgrades,
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

    /* if (accountType === 'agency') {
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
    } */

    const limits = {
      freeProfilesMax: freeProfilesMax || (accountType === 'agency' ? 5 : 3),
      paidProfilesMax: paidProfilesMax || (accountType === 'agency' ? 50 : 10),
      totalVisibleMax: totalVisibleMax || (accountType === 'agency' ? 55 : 13),
      accountType,
      requiresIndependentVerification: requiresIndependentVerification || false
    };

    // Obtener perfiles del usuario (excluyendo solo los eliminados lógicamente)
    // Incluimos perfiles activos e inactivos, visibles e invisibles para validar el límite correctamente
    const userProfiles = await ProfileModel.find({
      user: userId,
      isDeleted: { $ne: true }
    }).populate('planAssignment.planId', 'code name variants').lean();

    const now = new Date();

    // Clasificar perfiles por tipo basándose en el PRECIO del plan (más confiable)
    let freeProfilesCount = 0;
    let paidProfilesCount = 0;

    for (const profile of userProfiles) {
      // Verificar si el plan está activo
      const hasPlanActive = profile.planAssignment && profile.planAssignment.expiresAt > now;

      if (!hasPlanActive) {
        // Si no tiene plan activo o expiró, cuenta como gratuito
        freeProfilesCount++;
        continue;
      }

      // Obtener el plan poblado para verificar el precio
      const plan = profile.planAssignment.planId as any;

      if (!plan || !plan.variants) {
        freeProfilesCount++;
        continue;
      }

      // Buscar la variante correspondiente a los días del perfil
      const variant = plan.variants.find((v: any) => v.days === profile.planAssignment.variantDays);
      const variantPrice = variant?.price ?? null;

      // LÓGICA CORRECTA: Si el precio es 0, es gratuito. Si es > 0, es de pago
      const isPaidPlan = variantPrice !== null && variantPrice > 0;

      if (isPaidPlan) {
        paidProfilesCount++;
      } else {
        freeProfilesCount++;
      }
    }

    const totalProfiles = freeProfilesCount + paidProfilesCount;

    // Determinar si el nuevo perfil será gratuito o de pago basándose en el precio del plan
    let isNewProfilePaid = false;

    if (planCode) {
      // Buscar el plan en la BD para verificar su precio
      const newPlan = await PlanDefinitionModel.findOne({ code: planCode, active: true }).select('code name variants').lean();

      if (newPlan && newPlan.variants && newPlan.variants.length > 0) {
        // Verificar si alguna variante tiene precio > 0
        const hasPaidVariant = newPlan.variants.some((v: any) => v.price > 0);
        isNewProfilePaid = hasPaidVariant;
      }
    }

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
    // Error al validar límites de perfiles
    throw new Error('Error interno al validar límites de perfiles');
  }
};

/**
 * VALIDACIÓN A: Verifica si el usuario puede crear un nuevo perfil (límite total de perfiles)
 * Esta validación se ejecuta ANTES de entrar al wizard de creación
 * @param userId - ID del usuario
 * @returns Promise con el resultado de la validación
 */
export const validateMaxProfiles = async (userId: string): Promise<{ ok: boolean; message?: string; currentCount?: number; maxAllowed?: number }> => {
  try {
    // Obtener información del usuario para determinar el tipo de cuenta
    const user = await UserModel.findById(userId).lean();
    if (!user) {
      return {
        ok: false,
        message: 'Usuario no encontrado'
      };
    }

    const accountType = user.accountType || 'common';

    // Obtener el límite total de perfiles según el tipo de cuenta
    let totalVisibleMax: number;

    /* if (accountType === 'agency') {
      // Verificar que la conversión esté aprobada
      if (user.agencyInfo?.conversionStatus !== 'approved') {
        return {
          ok: false,
          message: 'La conversión a agencia debe estar aprobada para crear perfiles'
        };
      }

      totalVisibleMax = await ConfigParameterService.getValue('profiles.limits.agency.total_visible_max') || 55;
    } else {
      totalVisibleMax = await ConfigParameterService.getValue('profiles.limits.total_visible_max') || 13;
    } */

    totalVisibleMax = await ConfigParameterService.getValue('profiles.limits.total_visible_max') || 13;

    // Contar perfiles actuales del usuario (excluyendo eliminados)
    const currentProfileCount = await ProfileModel.countDocuments({
      user: userId,
      isDeleted: { $ne: true }
    });

    // Verificar si ya alcanzó el límite
    if (currentProfileCount >= totalVisibleMax) {
      return {
        ok: false,
        message: 'Has alcanzado el número máximo de perfiles permitidos.',
        currentCount: currentProfileCount,
        maxAllowed: totalVisibleMax
      };
    }

    return {
      ok: true,
      currentCount: currentProfileCount,
      maxAllowed: totalVisibleMax
    };

  } catch (error) {
    console.error('Error en validateMaxProfiles:', error);
    return {
      ok: false,
      message: 'Error al validar límite de perfiles'
    };
  }
};

/**
 * VALIDACIÓN B: Verifica si el usuario puede seleccionar un plan gratuito (límite de perfiles gratuitos)
 * Esta validación se ejecuta en el PASO 4 del wizard cuando el usuario selecciona un plan
 * @param userId - ID del usuario
 * @param planCode - Código del plan seleccionado
 * @returns Promise con el resultado de la validación
 */
export const validatePlanSelection = async (userId: string, planCode: string): Promise<{ ok: boolean; message?: string; isPaid?: boolean; currentFreeCount?: number; maxFree?: number }> => {
  try {
    // Buscar el plan en la base de datos
    const plan = await PlanDefinitionModel.findOne({ code: planCode, active: true }).select('code name variants').lean();

    if (!plan) {
      return {
        ok: false,
        message: 'Plan no encontrado'
      };
    }

    // Verificar si el plan es gratuito (todas las variantes tienen precio = 0)
    const isPaidPlan = plan.variants?.some((v: any) => v.price > 0) || false;

    // Si el plan es de pago, no necesitamos validar límites de gratuitos
    if (isPaidPlan) {
      return {
        ok: true,
        isPaid: true
      };
    }

    // El plan es gratuito, verificar límite de perfiles gratuitos
    // Obtener información del usuario para determinar el tipo de cuenta
    const user = await UserModel.findById(userId).lean();
    if (!user) {
      return {
        ok: false,
        message: 'Usuario no encontrado'
      };
    }

    const accountType = user.accountType || 'common';

    // Obtener el límite de perfiles gratuitos según el tipo de cuenta
    let freeProfilesMax: number;

    if (accountType === 'agency') {
      freeProfilesMax = await ConfigParameterService.getValue('profiles.limits.agency.free_profiles_max') || 5;
    } else {
      freeProfilesMax = await ConfigParameterService.getValue('profiles.limits.free_profiles_max') || 3;
    }

    // Contar perfiles gratuitos actuales
    const userProfiles = await ProfileModel.find({
      user: userId,
      isDeleted: { $ne: true }
    }).populate('planAssignment.planId', 'code name variants').lean();

    const now = new Date();
    let freeProfilesCount = 0;

    for (const profile of userProfiles) {
      // Verificar si el plan está activo
      const hasPlanActive = profile.planAssignment && profile.planAssignment.expiresAt > now;

      if (!hasPlanActive) {
        // Sin plan activo = gratuito
        freeProfilesCount++;
        continue;
      }

      // Obtener el plan poblado para verificar el precio
      const profilePlan = profile.planAssignment.planId as any;

      if (!profilePlan || !profilePlan.variants) {
        freeProfilesCount++;
        continue;
      }

      // Buscar la variante correspondiente
      const variant = profilePlan.variants.find((v: any) => v.days === profile.planAssignment.variantDays);
      const variantPrice = variant?.price ?? 0;

      // Si el precio es 0, es gratuito
      if (variantPrice === 0) {
        freeProfilesCount++;
      }
    }

    // Verificar si ya alcanzó el límite
    if (freeProfilesCount >= freeProfilesMax) {
      return {
        ok: false,
        message: 'Has alcanzado el máximo de perfiles gratuitos.',
        isPaid: false,
        currentFreeCount: freeProfilesCount,
        maxFree: freeProfilesMax
      };
    }

    return {
      ok: true,
      isPaid: false,
      currentFreeCount: freeProfilesCount,
      maxFree: freeProfilesMax
    };

  } catch (error) {
    console.error('Error en validatePlanSelection:', error);
    return {
      ok: false,
      message: 'Error al validar selección de plan'
    };
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

    // Obtener perfiles del usuario (excluyendo solo los eliminados)
    // Incluimos perfiles activos e inactivos para dar un resumen completo
    const userProfiles = await ProfileModel.find({
      user: userId,
      isDeleted: { $ne: true }
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
    // Error al obtener resumen de perfiles
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
    // Error al validar upgrade de plan
    throw new Error('Error interno al validar upgrade de plan');
  }
};

export const purchaseUpgrade = async (
  profileId: string,
  upgradeCode: string,
  userId: string
): Promise<{
  profile: IProfile;
  invoice: IInvoice;
  upgradeCode?: string;
  status?: string;
  message?: string;
  whatsAppMessage?: WhatsAppMessage | null;
}> => {
  // Validar que el upgrade existe
  const upgrade = await UpgradeDefinitionModel.findOne({ code: upgradeCode });
  if (!upgrade) {
    throw new Error(`Upgrade con código ${upgradeCode} no encontrado`);
  }

  const profile = await ProfileModel.findById(profileId);
  if (!profile) {
    throw new Error('Perfil no encontrado');
  }

  // Obtener configuración del plan por defecto
  const defaultPlanConfig = await getDefaultPlanConfig();
  const defaultPlanCode = defaultPlanConfig.enabled ? defaultPlanConfig.planCode : 'AMATISTA';

  const now = new Date();

  // Verificar que el perfil tiene un plan asignado
  if (!profile.planAssignment) {
    const error = new Error('No se pueden comprar upgrades sin un plan asignado');
    (error as any).status = 409;
    throw error;
  }

  // Verificar que el plan no esté expirado
  if (profile.planAssignment.expiresAt < now) {
    const error = new Error('No se pueden comprar upgrades con un plan expirado. Por favor renueva tu plan primero');
    (error as any).status = 409;
    throw error;
  }

  // Verificar que no sea el plan por defecto (gratuito)
  const isDefaultPlan = profile.planAssignment.planCode === defaultPlanCode ||
    (profile.planAssignment.planId && profile.planAssignment.planId.toString() === defaultPlanConfig.planId);

  if (isDefaultPlan) {
    const error = new Error('No se pueden comprar upgrades con el plan gratuito. Por favor adquiere un plan de pago primero');
    (error as any).status = 409;
    throw error;
  }

  // Verificar dependencias (upgrades requeridos)
  if (upgrade.requires && upgrade.requires.length > 0) {
    const activeUpgrades = profile.upgrades.filter(u => u.endAt > now);
    const activeUpgradeCodes = activeUpgrades.map(u => u.code);

    const missingRequirements = upgrade.requires.filter(req => !activeUpgradeCodes.includes(req));
    if (missingRequirements.length > 0) {
      throw new Error(`Upgrades requeridos no activos: ${missingRequirements.join(', ')}`);
    }
  }

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

  // Generar factura para el upgrade con precio de la base de datos
  let invoice = null;

  try {
    invoice = await invoiceService.generateInvoice({
      profileId: profileId,
      userId: profile.user.toString(),
      upgradeCodes: [upgradeCode]
    });

    // Agregar factura al historial de pagos del perfil
    profile.paymentHistory.push(new Types.ObjectId(invoice._id as string));

    // No modificar isActive ni visible - el perfil mantiene su estado actual
    // El upgrade no debe afectar la visibilidad o activación del perfil

    await profile.save();

    const whatsAppMessage = await generateWhatsAppMessage(
      profile.user.toString(),
      (profile._id as Types.ObjectId).toString(),
      invoice._id?.toString(),
      invoice.invoiceNumber?.toString(),
      upgradeCode,
      undefined,
      invoice.coupon &&
        invoice.coupon.code &&
        invoice.coupon.originalAmount !== undefined &&
        invoice.coupon.discountAmount !== undefined &&
        invoice.coupon.finalAmount !== undefined
        ? {
          code: invoice.coupon.code,
          name: invoice.coupon.name || '',
          type: invoice.coupon.type || '',
          value: invoice.coupon.value || 0,
          originalAmount: invoice.coupon.originalAmount,
          discountAmount: invoice.coupon.discountAmount,
          finalAmount: invoice.coupon.finalAmount
        }
        : undefined
    );

    // Retornar información de la compra pendiente con datos de WhatsApp
    return {
      profile,
      invoice,
      upgradeCode,
      status: 'pending_payment',
      message: 'Upgrade pendiente de pago',
      whatsAppMessage
    };

  } catch (error) {
    // Error creando factura para upgrade
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

  // Validar que tiene un plan asignado (puede estar expirado para admins)
  const now = new Date();
  if (!profile.planAssignment) {
    throw new Error('El perfil debe tener un plan asignado para hacer upgrade');
  }

  // Validar que el nuevo plan existe
  const newPlan = await PlanDefinitionModel.findOne({ code: normalizedPlanCode, active: true });
  if (!newPlan) {
    throw new Error(`Plan con código ${normalizedPlanCode} no encontrado`);
  }

  // Obtener configuración del plan por defecto para construir jerarquía dinámica
  const defaultPlanConfig = await getDefaultPlanConfig();
  const defaultPlanCode = defaultPlanConfig.enabled ? defaultPlanConfig.planCode : 'AMATISTA'; // Fallback

  // RESTRICCIÓN ELIMINADA: Ahora se permite cambiar a cualquier plan
  // Ya no validamos jerarquía de planes, permitiendo tanto upgrades como downgrades

  // Determinar la variante a usar
  let selectedVariant;
  if (variantDays) {
    // Buscar la variante específica solicitada
    selectedVariant = newPlan.variants.find(v => v.days === variantDays);
    if (!selectedVariant) {
      throw new Error(`Variante de ${variantDays} días no encontrada para el plan ${normalizedPlanCode}`);
    }
  } else {
    // Usar la primera variante disponible (variante principal/por defecto)
    if (!newPlan.variants || newPlan.variants.length === 0) {
      throw new Error(`El plan ${normalizedPlanCode} no tiene variantes disponibles`);
    }
    selectedVariant = newPlan.variants[0];
  }

  // Validar límites de perfiles
  const upgradeValidation = await validateProfilePlanUpgrade(profileId, normalizedPlanCode);
  if (!upgradeValidation.canUpgrade) {
    throw new Error(upgradeValidation.reason || 'No se puede hacer upgrade a este plan');
  }

  // Calcular nueva fecha de expiración
  // CAMBIO: Ahora el upgrade REEMPLAZA el plan actual, reseteando las fechas
  // Ya no se suma el tiempo restante, se establece la duración exacta del nuevo plan desde ahora
  const newExpiresAt = new Date(now.getTime() + (selectedVariant.days * 24 * 60 * 60 * 1000));

  // Procesar upgrades incluidos en el nuevo plan
  // Primero limpiar upgrades expirados y duplicados
  cleanProfileUpgrades(profile);

  // Generar upgrades incluidos en el nuevo plan (sincronizados con la expiración del plan)
  const planUpgrades = generatePlanUpgrades(newPlan, now, newExpiresAt);

  // Fusionar con upgrades existentes (priorizando los nuevos del plan)
  profile.upgrades = mergeUpgrades(profile.upgrades || [], planUpgrades);

  // Actualizar el plan del perfil y los upgrades
  const updatedProfile = await ProfileModel.findByIdAndUpdate(
    profileId,
    {
      isActive: true, // Reactivar perfil al renovar plan
      planAssignment: {
        planId: newPlan._id,
        planCode: normalizedPlanCode,
        variantDays: selectedVariant.days,
        startAt: now, // ACTUALIZAR fecha de inicio a ahora (reset)
        expiresAt: newExpiresAt
      },
      upgrades: profile.upgrades // Usar el array limpio y actualizado
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
 * Desactivación visual de perfil (para usuarios normales)
 * Oculta el perfil públicamente pero mantiene isActive=true para que solo sea visible por administradores
 */
export const hideProfile = async (profileId: string, userId: string): Promise<{ success: boolean; message: string }> => {
  try {
    const profile = await ProfileModel.findOne({ _id: profileId, user: userId });

    if (!profile) {
      return { success: false, message: 'Perfil no encontrado o no tienes permisos para eliminarlo' };
    }

    if (!profile.visible) {
      return { success: false, message: 'El perfil ya está oculto' };
    }

    // Desactivación visual: solo ocultar públicamente, mantener isActive=true
    profile.visible = false;
    await profile.save();

    return { success: true, message: 'Perfil ocultado exitosamente' };
  } catch (error) {
    return { success: false, message: 'Error al ocultar el perfil' };
  }
};

/**
 * Borrado lógico de perfil (para administradores)
 * Marca el perfil como inactivo - eliminación lógica real
 */
export const softDeleteProfile = async (profileId: string, userId?: string): Promise<{ success: boolean; message: string }> => {
  try {
    // Si se proporciona userId, verificar que sea propietario del perfil
    const query = userId ? { _id: profileId, user: userId } : { _id: profileId };
    const profile = await ProfileModel.findOne(query);

    if (!profile) {
      return { success: false, message: userId ? 'Perfil no encontrado o no tienes permisos para eliminarlo' : 'Perfil no encontrado' };
    }

    if (profile.isDeleted) {
      return { success: false, message: 'El perfil ya está eliminado lógicamente' };
    }

    // Borrado lógico: marcar como eliminado
    profile.isDeleted = true;
    profile.visible = false; // También ocultar cuando se elimina lógicamente
    await profile.save();

    return { success: true, message: 'Perfil eliminado lógicamente' };
  } catch (error) {
    return { success: false, message: 'Error al eliminar el perfil lógicamente' };
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

    // NOTA: Las facturas NO se eliminan intencionalmente
    // Son registros financieros que deben mantenerse incluso si el perfil se elimina
    // para auditoría, contabilidad y cumplimiento legal

    // Eliminar el perfil completamente (esto incluye automáticamente las historias en media.stories)
    await ProfileModel.findByIdAndDelete(profileId);

    return { success: true, message: 'Perfil y todos sus datos eliminados permanentemente' };
  } catch (error) {
    return { success: false, message: 'Error al eliminar el perfil permanentemente' };
  }
};

/**
 * Mostrar perfil oculto (para usuarios normales)
 * Hace visible un perfil que fue ocultado visualmente
 */
export const showProfile = async (profileId: string, userId: string): Promise<{ success: boolean; message: string }> => {
  try {
    const profile = await ProfileModel.findOne({ _id: profileId, user: userId });

    if (!profile) {
      return { success: false, message: 'Perfil no encontrado o no tienes permisos para mostrarlo' };
    }

    if (profile.isDeleted) {
      return { success: false, message: 'El perfil está eliminado lógicamente y solo puede ser restaurado por un administrador' };
    }

    if (profile.visible) {
      return { success: false, message: 'El perfil ya está visible' };
    }

    // Mostrar perfil: hacer visible públicamente
    profile.visible = true;
    await profile.save();

    return { success: true, message: 'Perfil mostrado exitosamente' };
  } catch (error) {
    return { success: false, message: 'Error al mostrar el perfil' };
  }
};

/**
 * Restaurar perfil (reactivar después de borrado lógico - solo administradores)
 */
export const restoreProfile = async (profileId: string, userId?: string): Promise<{ success: boolean; message: string }> => {
  try {
    const profile = await ProfileModel.findById(profileId);

    if (!profile) {
      return { success: false, message: 'Perfil no encontrado' };
    }

    if (!profile.isDeleted) {
      return { success: false, message: 'El perfil no está eliminado' };
    }

    // Restaurar perfil del borrado lógico
    profile.isDeleted = false;
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

    const profiles = await ProfileModel.find({ isDeleted: true })
      .populate('user', 'name email')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await ProfileModel.countDocuments({ isDeleted: true });

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

/**
 * Obtener todos los perfiles para el adminboard (incluye activos e inactivos)
 */
export const getAllProfilesForAdmin = async (
  page: number = 1,
  limit: number = 10,
  fields?: string | string[],
  userId?: string,
  profileName?: string,
  profileId?: string,
  isActive?: boolean,
  isDeleted?: boolean,
  isVerified?: boolean | 'pending'
): Promise<{
  docs: IProfile[];
  totalDocs: number;
  limit: number;
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  nextPage: number | null;
  prevPage: number | null;
  pagingCounter: number;
}> => {
  const skip = (page - 1) * limit;

  // Filtro básico
  const filter: any = {};
  if (userId) filter.user = userId;
  if (profileId) filter._id = profileId;
  if (profileName) filter.name = { $regex: profileName, $options: 'i' };
  if (typeof isActive === 'boolean') filter.isActive = isActive;
  if (typeof isDeleted === 'boolean') filter.isDeleted = isDeleted;

  // Filtro por verificación (requiere consulta a ProfileVerification)
  if (isVerified !== undefined) {
    const verificationFilter: any = {};
    
    if (isVerified === 'pending') {
      verificationFilter.verificationStatus = 'pending';
    } else if (isVerified === true) {
      verificationFilter.verificationStatus = 'check';
    } else {
      verificationFilter.verificationStatus = { $ne: 'check' };
    }

    const verifications = await ProfileVerification.find(verificationFilter).select('_id');
    const verificationIds = verifications.map(v => v._id);

    if (isVerified === 'pending') {
      filter.verification = { $in: verificationIds };
    } else if (isVerified === true) {
      filter.verification = { $in: verificationIds };
    } else {
      // Si no está verificado, puede ser que tenga una verificación no 'check' O que no tenga campo verification
      // NOTA: Si buscamos 'pending', solo queremos los que tienen verificationStatus='pending', no los que no tienen verificación.
      filter.$or = [
        { verification: { $in: verificationIds } },
        { verification: { $exists: false } },
        { verification: null }
      ];
    }
  }

  let query = ProfileModel.find(filter);

  // Procesar campos si se envían (pueden venir como string separado por comas o array)
  if (fields) {
    const cleaned = Array.isArray(fields)
      ? fields
      : fields.split(',').map(f => f.trim()).filter(Boolean);

    const needsFeatured = cleaned.includes('featured');
    const hasUpgrades = cleaned.includes('upgrades') || cleaned.some(f => f.startsWith('upgrades'));
    if (needsFeatured && !hasUpgrades) {
      cleaned.push('upgrades.code', 'upgrades.startAt', 'upgrades.endAt');
    }

    const needsIsVerified = cleaned.includes('isVerified') || cleaned.includes('verification');
    if (needsIsVerified && !cleaned.includes('verification')) {
      cleaned.push('verification');
    }

    // Siempre incluir isDeleted para que el adminboard pueda mostrar el badge
    if (!cleaned.includes('isDeleted')) {
      cleaned.push('isDeleted');
    }

    // Si se incluye planAssignment completo, no agregar subcampos (evita path collision)
    // Si solo se incluyen subcampos específicos, agregarlos todos para asegurar consistencia
    const hasPlanAssignmentComplete = cleaned.includes('planAssignment');
    const hasPlanAssignmentSubfields = cleaned.some(f => f.startsWith('planAssignment.'));

    if (hasPlanAssignmentSubfields && !hasPlanAssignmentComplete) {
      // Solo agregar subcampos faltantes si NO se incluyó el objeto completo
      if (!cleaned.includes('planAssignment.planId')) cleaned.push('planAssignment.planId');
      if (!cleaned.includes('planAssignment.variantDays')) cleaned.push('planAssignment.variantDays');
      if (!cleaned.includes('planAssignment.startAt')) cleaned.push('planAssignment.startAt');
      if (!cleaned.includes('planAssignment.expiresAt')) cleaned.push('planAssignment.expiresAt');
      if (!cleaned.includes('planAssignment.purchasedAt')) cleaned.push('planAssignment.purchasedAt');
      if (!cleaned.includes('planAssignment.planCode')) cleaned.push('planAssignment.planCode');
    }
    // Si se incluye planAssignment completo, no hacemos nada (se incluyen todos los campos automáticamente)

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
      select: 'verificationProgress verificationStatus steps'
    })
    .populate({
      path: 'features.group_id',
      select: 'name label',
    })
    .populate({
      path: 'planAssignment.planId',
      model: 'PlanDefinition',
      select: 'code name description level variants features contentLimits includedUpgrades'
    })
    .sort({ createdAt: -1, _id: -1 }) // Orden estable por fecha de creación (no updatedAt que cambia con cada edición)
    .skip(skip)
    .limit(limit)
    .lean();

  const now = new Date();
  const profiles = rawProfiles.map(profile => {
    let isVerified = false;
    let verificationStatus = 'unverified';

    if (profile.verification) {
      const verification = profile.verification as any;

      if (verification.verificationStatus) {
        verificationStatus = verification.verificationStatus;
      }

      // Usar el estado maestro de la verificación
      if (verificationStatus === 'check') {
        isVerified = true;
      }
    }

    const featured =
      profile.upgrades?.some(
        (upgrade: any) =>
          (upgrade.code === 'DESTACADO' || upgrade.code === 'HIGHLIGHT') &&
          new Date(upgrade.startAt) <= now &&
          new Date(upgrade.endAt) > now
      ) || false;

    // Extraer categoría
    const category = extractCategoryFromFeatures(profile.features);

    return {
      ...profile,
      isVerified,
      verificationStatus,
      featured,
      category,
    };
  }) as unknown as IProfile[];

  // 👇 Contar solo los que cumplan el filtro
  const total = await ProfileModel.countDocuments(filter);

  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;
  const nextPage = hasNextPage ? page + 1 : null;
  const prevPage = hasPrevPage ? page - 1 : null;
  const pagingCounter = (page - 1) * limit + 1;

  return {
    docs: profiles,
    totalDocs: total,
    limit,
    page,
    totalPages,
    hasNextPage,
    hasPrevPage,
    nextPage,
    prevPage,
    pagingCounter,
  };
};

export const checkStoryLimits = async (profileId: string) => {
  const profile = await ProfileModel.findById(profileId).populate('planAssignment.planId');
  if (!profile) throw new Error('Profile not found');

  const plan = profile.planAssignment?.planId as any;
  const storiesLimit = plan?.contentLimits?.storiesPerDayMax || 0;

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentStories = profile.media?.stories?.filter(s => {
    const createdAt = new Date(s.createdAt);
    return createdAt > oneDayAgo;
  }) || [];

  const remaining = Math.max(0, storiesLimit - recentStories.length);

  // Calculate when the next slot opens
  let nextUploadDate = null;
  if (remaining === 0 && recentStories.length > 0) {
    // Sort by createdAt ascending to find the oldest story that is still "recent"
    // The next slot opens 24h after that story was created
    const sortedStories = recentStories.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    const oldestRecentStory = sortedStories[0];
    nextUploadDate = new Date(new Date(oldestRecentStory.createdAt).getTime() + 24 * 60 * 60 * 1000);
  }

  return {
    limit: storiesLimit,
    used: recentStories.length,
    remaining,
    nextUploadDate
  };
};

export const deleteAllStories = async (profileId: string) => {
  const profile = await ProfileModel.findByIdAndUpdate(profileId, {
    $set: { 'media.stories': [] }
  }, { new: true });
  return profile;
};

