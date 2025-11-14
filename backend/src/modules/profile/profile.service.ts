import { Types } from 'mongoose';
import { validateProfileFeatures } from '../attribute-group/validateProfileFeatures';
import { createProfileVerification } from '../profile-verification/profile-verification.service';
import UserModel from '../user/User.model';
import { ProfileModel } from './profile.model';
import type { CreateProfileDTO, IProfile } from './profile.types';
import type { IInvoice } from '../payments/invoice.model';
import InvoiceModel from '../payments/invoice.model';
import { PlanDefinitionModel } from '../plans/plan.model';
import { UpgradeDefinitionModel } from '../plans/upgrade.model';
import { ConfigParameterService } from '../config-parameter/config-parameter.service';
import invoiceService from '../payments/invoice.service';
import EmailService from '../../services/email.service';
import { sortProfiles } from '../visibility/visibility.service';

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
  planCode?: string,
  variantDays?: number,
  couponInfo?: CouponInfo
): Promise<WhatsAppMessage | null> => {
  try {
    // Obtener parámetros de configuración de la empresa
    const [companyName, companyWhatsApp] = await Promise.all([
      ConfigParameterService.getValue('company.name'),
      ConfigParameterService.getValue('company.whatsapp.number')
    ]);

    if (!companyName || !companyWhatsApp) {
      return null;
    }

    // Obtener información del plan si no se proporciona
    let planInfo = '';
    if (planCode && variantDays) {
      planInfo = `\n• Plan: ${planCode} (${variantDays} días)`;
    } else {
      // Intentar obtener información del plan desde el perfil
      const profile = await ProfileModel.findById(profileId);
      if (profile?.planAssignment?.planCode && profile?.planAssignment?.variantDays) {
        planInfo = `\n• Plan: ${profile.planAssignment.planCode} (${profile.planAssignment.variantDays} días)`;
      }
    }

    // Agregar información de descuento si existe
    let discountInfo = '';
    if (couponInfo && couponInfo.originalAmount !== undefined && couponInfo.discountAmount !== undefined && couponInfo.finalAmount !== undefined) {
      discountInfo = `\n\n**Detalle de Descuento:**\n• Cupón: ${couponInfo.code} - ${couponInfo.name}\n• Precio Original: $${couponInfo.originalAmount.toFixed(2)}\n• Descuento Aplicado: -$${couponInfo.discountAmount.toFixed(2)}\n• Total a Pagar: $${couponInfo.finalAmount.toFixed(2)}`;
    }

    // Generar mensaje elegante
    const message = invoiceId
      ? `¡Hola ${companyName}! \n\nEspero que estén muy bien. Acabo de adquirir un paquete en su plataforma y me gustaría conocer las opciones disponibles para realizar el pago.\n\n **Detalles de mi compra:**${invoiceNumber ? `\n• Número de Factura: ${invoiceNumber}` : ''}\n• ID de Factura: ${invoiceId}\n• ID de Perfil: ${profileId}${planInfo}${discountInfo}\n\n¿Podrían orientarme sobre los métodos de pago disponibles y los pasos a seguir?\n\nMuchas gracias por su atención.`
      : `¡Hola ${companyName}! \n\nEspero que estén muy bien. He creado un nuevo perfil en su plataforma y me gustaría obtener más información sobre sus servicios.\n\n **Detalles:**\n• ID de Perfil: ${profileId}${planInfo}\n\n¿Podrían brindarme más información sobre las opciones disponibles?\n\nMuchas gracias por su atención. `;

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

  // Crear perfil con isActive=false y visible=false por defecto
  // El perfil estará inactivo e invisible hasta que se confirme el pago de su factura
  // Excluir planAssignment del data para evitar sobrescribir la asignación automática
  const { planAssignment, ...profileData } = data;
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
        console.log(`🎫 Generando factura con cupón: ${couponCode || 'sin cupón'}`);
        invoice = await invoiceService.generateInvoice({
          profileId: (profile._id as Types.ObjectId).toString(),
          userId: profile.user.toString(),
          planId: plan._id.toString(), // Usar el ID del plan
          planCode: plan.code, // También pasar el código para compatibilidad
          planDays: planDays,
          couponCode: couponCode, // Pasar el código del cupón
          notes: `Factura generada para nuevo perfil ${profile.name || profile._id}`
        });

        console.log(`💰 Factura generada - ID: ${invoice._id}, Total: ${invoice.totalAmount}, Cupón aplicado: ${invoice.coupon?.code || 'ninguno'}`);

        // ✅ VALIDACIÓN: Si después de aplicar cupón el monto final es 0, marcar factura como pagada
        // y asignar el plan directamente (cupón 100% descuento)
        if (invoice.totalAmount === 0) {
          console.log(`✅ Total = 0 detectado, marcando factura como pagada y asignando plan directamente`);
          // Marcar factura como pagada usando el servicio (esto incrementa el uso del cupón)
          await invoiceService.markAsPaid(invoice._id.toString());
          console.log(`✅ Factura marcada como pagada, uso de cupón incrementado`);

          // Calcular fechas de asignación
          const startAt = new Date();
          const expiresAt = new Date(startAt.getTime() + (planDays * 24 * 60 * 60 * 1000));

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
    // Error al obtener configuración del plan por defecto
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

  const sortedProfiles = await sortProfiles(filteredProfiles as any, now);

  // Aplicar paginación DESPUÉS del ordenamiento
  const paginatedProfiles = sortedProfiles.slice(skip, skip + limit);

  // Mapear perfiles para incluir información de verificación
  const cleanProfiles = paginatedProfiles.map(profile => {
    // Verificar upgrades activos para incluir en respuesta
    const activeUpgrades = profile.upgrades?.filter(upgrade =>
      new Date(upgrade.startAt) <= now && new Date(upgrade.endAt) > now
    ) || [];

    const hasDestacadoUpgrade = activeUpgrades.some(u =>
      u.code === 'DESTACADO' || u.code === 'HIGHLIGHT'
    );
    const hasImpulsoUpgrade = activeUpgrades.some(u =>
      u.code === 'IMPULSO' || u.code === 'BOOST'
    );

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
      ...profile,
      hasDestacadoUpgrade,
      hasImpulsoUpgrade,
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
  // Proteger el campo 'user' - no debe cambiar nunca (auditoría)
  // El perfil siempre debe mantener su propietario original
  const { user, ...safeData } = data;

  // Si se está actualizando el campo media, hacer merge con los datos existentes
  if (safeData.media) {
    const existingProfile = await ProfileModel.findById(id);
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

  return ProfileModel.findByIdAndUpdate(id, safeData, { new: true });
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

    // Obtener perfiles activos del usuario (excluyendo eliminados lógicamente)
    const userProfiles = await ProfileModel.find({
      user: userId,
      isActive: true,
      visible: true,
      isDeleted: { $ne: true }
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
    // Error al validar límites de perfiles
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

    // Mantener perfil inactivo hasta que se pague la factura
    profile.isActive = false;

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
  // Si el plan actual está expirado, usar la fecha actual como base
  // Si el plan actual está activo, mantener el tiempo restante y agregar los días del nuevo plan
  const currentExpiresAt = new Date(profile.planAssignment.expiresAt);
  let newExpiresAt: Date;

  if (currentExpiresAt <= now) {
    // Plan expirado: nueva fecha = ahora + días del nuevo plan
    newExpiresAt = new Date(now.getTime() + (selectedVariant.days * 24 * 60 * 60 * 1000));
  } else {
    // Plan activo: mantener tiempo restante + días del nuevo plan
    const remainingTime = currentExpiresAt.getTime() - now.getTime();
    newExpiresAt = new Date(now.getTime() + remainingTime + (selectedVariant.days * 24 * 60 * 60 * 1000));
  }

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
  fields?: string,
  userId?: string // 👈 Nuevo parámetro
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

  // 👇 Si se envía userId, filtramos por él
  const filter: any = {};
  if (userId) filter.user = userId;

  let query = ProfileModel.find(filter); // 👈 aquí aplicamos el filtro

  if (fields) {
    const cleaned = fields.split(',').map(f => f.trim()).filter(Boolean);

    const needsFeatured = cleaned.includes('featured');
    const hasUpgrades = cleaned.includes('upgrades') || cleaned.some(f => f.startsWith('upgrades'));
    if (needsFeatured && !hasUpgrades) {
      cleaned.push('upgrades.code', 'upgrades.startAt', 'upgrades.endAt');
    }

    const needsIsVerified = cleaned.includes('isVerified') || cleaned.includes('verification');
    if (needsIsVerified && !cleaned.includes('verification')) {
      cleaned.push('verification');
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
      select: 'verificationProgress verificationStatus'
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
    .sort({ updatedAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const now = new Date();
  const profiles = rawProfiles.map(profile => {
    let isVerified = false;
    if (profile.verification) {
      const verification = profile.verification as any;
      const verifiedCount = Object.values(verification).filter(status => status === 'verified').length;
      const totalFields = Object.keys(verification).length;
      if (verifiedCount === totalFields && totalFields > 0) {
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

    return {
      ...profile,
      isVerified,
      featured,
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

