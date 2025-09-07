import type { Response } from 'express';
import type { AuthRequest } from '../../types/auth.types';
import * as service from './profile.service';
import {
  subscribeProfile,
  purchaseUpgrade,
  getActiveProfilesCount,
  createProfileWithInvoice,
  softDeleteProfile,
  hardDeleteProfile,
  restoreProfile,
  getDeletedProfiles
} from './profile.service';
import { ConfigParameterService } from '../config-parameter/config-parameter.service';
import {
  validatePaidPlanAssignment,
  validateUpgradePurchase,
  getUserUsageStats,
  BusinessValidationError
} from '../validation/business-validation.service';

export const createProfile = async (req: AuthRequest, res: Response) => {
  try {
    console.log('🔴 [BACKEND] Raw req.body:', JSON.stringify(req.body, null, 2));
    console.log('🔴 [BACKEND] req.body type:', typeof req.body);
    console.log('🔴 [BACKEND] req.body keys:', Object.keys(req.body));

    const { profileData, purchasedPlan } = req.body;

    console.log("🔴 [BACKEND] Destructured profileData:", profileData);
    console.log("🔴 [BACKEND] Destructured purchasedPlan:", purchasedPlan);


    // Validar que se proporcionen los datos del perfil
    if (!profileData) {
      return res.status(400).json({
        success: false,
        message: 'Los datos del perfil (profileData) son requeridos'
      });
    }

    // DEBUG: Log de datos recibidos
    console.log('🔵 [PROFILE CONTROLLER] Datos recibidos para crear perfil:', {
      profileData: {
        userId: profileData.userId || profileData.user,
        name: profileData.name,
        hasProfileData: !!profileData
      },
      purchasedPlan: purchasedPlan ? {
        planCode: purchasedPlan.planCode,
        planDays: purchasedPlan.planDays || purchasedPlan.variantDays,
        hasPurchasedPlan: true
      } : { hasPurchasedPlan: false },
      bodyKeys: Object.keys(req.body)
    });

    // Extraer información del plan comprado si existe
    let planCode = null;
    let planDays = null;

    if (purchasedPlan) {
      planCode = purchasedPlan.planCode;
      planDays = purchasedPlan.planDays || purchasedPlan.variantDays;

      // Validar que el plan comprado tenga los datos necesarios
      if (!planCode || !planDays) {
        return res.status(400).json({
          success: false,
          message: 'El plan comprado debe incluir planCode y planDays/variantDays'
        });
      }

      // Obtener configuración del plan por defecto
      const defaultPlanConfig = await ConfigParameterService.findByKey('system.default_plan');
      const defaultPlanCode = defaultPlanConfig?.value?.enabled && defaultPlanConfig?.value?.planCode
        ? defaultPlanConfig.value.planCode
        : 'AMATISTA'; // Fallback

      // Si se especifica un plan pago, validar límites
      if (planCode !== 'GRATIS' && planCode !== defaultPlanCode) {
        console.log('🔵 [PROFILE CONTROLLER] Validando plan de pago:', { planCode, planDays });
        await validatePaidPlanAssignment(
          profileData.userId || profileData.user,
          planCode,
          undefined,
          purchasedPlan.orderId
        );
        console.log('✅ [PROFILE CONTROLLER] Validación de plan completada');
      }
    }

    // Usar la nueva función que maneja facturación automática
    console.log('🔵 [PROFILE CONTROLLER] Iniciando creación de perfil con facturación automática');
    const result = await createProfileWithInvoice({
      ...profileData,
      planCode: planCode,
      planDays: planDays
    });

    // Verificar que el perfil fue creado correctamente
    if (!result.profile) {
      throw new Error('Error interno: No se pudo crear el perfil');
    }

    // Respuesta diferenciada según si se generó factura
    if (result.invoice) {
      console.log('💰 [PROFILE CONTROLLER] Perfil creado con factura pendiente:', {
        profileId: result.profile._id,
        invoiceId: result.invoice._id,
        totalAmount: result.invoice.totalAmount,
        expiresAt: result.invoice.expiresAt
      });
      res.status(201).json({
        success: true,
        message: 'Perfil creado exitosamente. Se ha generado una factura pendiente.',
        profile: {
          ...result.profile.toObject(),
          paymentHistory: result.profile.paymentHistory || []
        },
        invoice: result.invoice,
        whatsAppMessage: result.whatsAppMessage,
        paymentRequired: true,
        expiresAt: result.invoice.expiresAt
      });
    } else {
      console.log('✅ [PROFILE CONTROLLER] Perfil creado sin factura (plan gratuito):', {
        profileId: result.profile._id
      });
      res.status(201).json({
        success: true,
        message: 'Perfil creado exitosamente.',
        profile: {
          ...result.profile.toObject(),
          paymentHistory: result.profile.paymentHistory || []
        },
        whatsAppMessage: result.whatsAppMessage,
        paymentRequired: false
      });
    }
  } catch (err: unknown) {
    // Manejar errores de validación de negocio
    if (err instanceof BusinessValidationError) {
      return res.status(409).json({ message: err.message });
    }

    const message = err instanceof Error ? err.message : 'An error occurred';
    res.status(400).json({ message });
  }
};

/**
 * Borrado lógico de perfil (para usuarios)
 */
export const softDeleteProfileController = async (req: AuthRequest, res: Response) => {
  try {
    const { id: profileId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    const result = await softDeleteProfile(profileId, userId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Borrado físico de perfil (para administradores)
 */
export const hardDeleteProfileController = async (req: AuthRequest, res: Response) => {
  try {
    const { id: profileId } = req.params;

    // Verificar que el usuario sea administrador
    if (!req.user?.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado. Solo administradores pueden eliminar perfiles permanentemente'
      });
    }

    const result = await hardDeleteProfile(profileId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Restaurar perfil (reactivar después de borrado lógico)
 */
export const restoreProfileController = async (req: AuthRequest, res: Response) => {
  try {
    const { id: profileId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    const result = await restoreProfile(profileId, userId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Obtener perfiles eliminados lógicamente (para administradores)
 */
export const getDeletedProfilesController = async (req: AuthRequest, res: Response) => {
  try {
    // Verificar que el usuario sea administrador
    if (!req.user?.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado. Solo administradores pueden ver perfiles eliminados'
      });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await getDeletedProfiles(page, limit);

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

export const getProfiles = async (req: AuthRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const fields = req.query.fields as string;

  const profiles = await service.getProfiles(page, limit, fields);
  res.json(profiles);
};

export const getProfilesForHome = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const profiles = await service.getProfilesForHome(page, limit);
    res.json(profiles);
  } catch (error: any) {
    console.error('Error getting profiles for home:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const getProfileById = async (req: AuthRequest, res: Response) => {
  const profile = await service.getProfileById(req.params.id);
  if (!profile)
    return res.status(404).json({ message: 'Perfil no encontrado' });
  res.json(profile);
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  const updated = await service.updateProfile(req.params.id, req.body);
  res.json(updated);
};

export const deleteProfile = async (req: AuthRequest, res: Response) => {
  await service.deleteProfile(req.params.id);
  res.status(204).send();
};

// Nuevos endpoints para suscripción y upgrades
export const subscribeProfileController = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { planCode, variantDays, orderId } = req.body;

    if (!planCode || !variantDays) {
      return res.status(400).json({ error: 'planCode y variantDays son requeridos' });
    }

    // Obtener el perfil para validaciones
    const profile = await service.getProfileById(id);
    if (!profile) {
      return res.status(404).json({ error: 'Perfil no encontrado' });
    }

    // Validaciones de negocio
    await validatePaidPlanAssignment(
      profile.user.toString(),
      planCode,
      id,
      orderId
    );

    const updatedProfile = await subscribeProfile(id, planCode, variantDays);
    res.status(200).json(updatedProfile);
  } catch (error: any) {
    console.error('Error subscribing profile:', error);

    // Manejar errores de validación de negocio
    if (error instanceof BusinessValidationError) {
      return res.status(409).json({ error: error.message });
    }

    if (error.message.includes('no encontrado') || error.message.includes('no encontrada')) {
      return res.status(404).json({ error: error.message });
    }

    if (error.message.includes('Máximo')) {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({ error: 'Internal server error' });
  }
};

export const purchaseUpgradeController = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { code, orderId } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'code es requerido' });
    }

    // Obtener el perfil para validaciones
    const profile = await service.getProfileById(id);
    if (!profile) {
      return res.status(404).json({ error: 'Perfil no encontrado' });
    }

    // Validaciones de negocio
    await validateUpgradePurchase(
      profile.user._id.toString(),
      id,
      code,
      orderId
    );

    const updatedProfile = await purchaseUpgrade(id, code, profile.user._id.toString());
    res.status(200).json(updatedProfile);
  } catch (error: any) {
    console.error('Error purchasing upgrade:', error);

    // Manejar errores de validación de negocio
    if (error instanceof BusinessValidationError) {
      return res.status(409).json({ error: error.message });
    }

    if (error.message.includes('no encontrado')) {
      return res.status(404).json({ error: error.message });
    }

    if ((error as any).status === 409 || error.message.includes('ya activo') || error.message.includes('sin un plan activo')) {
      return res.status(409).json({ error: error.message });
    }

    if (error.message.includes('requeridos no activos')) {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getProfilesPost = async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 10, fields } = req.body;

    // Convertir a números para asegurar tipos correctos
    const pageNum = Number(page);
    const limitNum = Number(limit);

    const profiles = await service.getProfiles(pageNum, limitNum, fields);
    res.json(profiles);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An error occurred';
    res.status(400).json({ message });
  }
};

export const verifyProfileName = async (req: AuthRequest, res: Response) => {
  try {
    // Debug: req.query
    const { profileName } = req.query;
    const profile = await service.checkProfileNameExists(profileName as string);
    res.status(200).send(profile);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An error occurred';
    res.status(400).json({ message });
  }
};

export const createMissingVerifications = async (req: AuthRequest, res: Response) => {
  try {
    const result = await service.createMissingVerifications();
    res.status(200).json({
      success: true,
      message: `Proceso completado. ${result.created} verificaciones creadas, ${result.errors} errores.`,
      data: result
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An error occurred';
    res.status(500).json({
      success: false,
      message: `Error al crear verificaciones faltantes: ${message}`
    });
  }
};

export const getProfilesWithStories = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const profiles = await service.getProfilesWithStories(page, limit);
    res.json(profiles);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An error occurred';
    res.status(500).json({ message });
  }
};

// Endpoint para obtener estadísticas de uso del usuario (debugging)
export const getUserUsageStatsController = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;

    const stats = await getUserUsageStats(userId);
    res.json(stats);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An error occurred';
    res.status(500).json({ message });
  }
};

// Endpoint para validar límites de perfiles de un usuario
export const validateUserProfileLimitsController = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const { planCode } = req.query;

    const validation = await service.validateUserProfileLimits(userId, planCode as string);
    res.json(validation);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An error occurred';
    res.status(500).json({ message });
  }
};

// Endpoint para obtener resumen de perfiles de un usuario
export const getUserProfilesSummaryController = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;

    const summary = await service.getUserProfilesSummary(userId);
    res.json(summary);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An error occurred';
    res.status(500).json({ message });
  }
};

// Endpoint para validar upgrade de plan de un perfil
export const getProfilePlanInfoController = async (req: AuthRequest, res: Response) => {
  try {
    const { profileId } = req.params;

    const profile = await service.getProfileById(profileId);
    if (!profile) {
      return res.status(404).json({ error: 'Perfil no encontrado' });
    }

    // Verificar si tiene un plan activo
    const now = new Date();
    const expiresAt = profile.planAssignment ? new Date(profile.planAssignment.expiresAt) : null;
    const hasActivePlan = profile.planAssignment && expiresAt && expiresAt > now;

    // Debug logging para investigar el problema
    console.log('🔍 Debug getProfilePlanInfo:', {
      profileId,
      profileName: profile.name,
      hasPlanAssignment: !!profile.planAssignment,
      planCode: profile.planAssignment?.planCode,
      expiresAt: expiresAt?.toISOString(),
      now: now.toISOString(),
      hasActivePlan,
      diffMs: expiresAt ? expiresAt.getTime() - now.getTime() : null,
      diffDays: expiresAt ? Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null
    });

    if (!hasActivePlan) {
      return res.status(404).json({ error: 'El perfil no tiene un plan activo' });
    }

    // Calcular días restantes y estado activo
    const daysRemaining = Math.max(0, Math.ceil((expiresAt!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    // Devolver información del plan
    const planInfo = {
      planCode: profile.planAssignment!.planCode,
      variantDays: profile.planAssignment!.variantDays,
      startAt: profile.planAssignment!.startAt,
      expiresAt: profile.planAssignment!.expiresAt,
      isActive: true,
      daysRemaining
    };

    console.log('✅ Plan info devuelto:', planInfo);
    res.json(planInfo);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An error occurred';
    console.error('❌ Error en getProfilePlanInfo:', message);
    res.status(400).json({ message });
  }
};

export const validateProfilePlanUpgradeController = async (req: AuthRequest, res: Response) => {
  try {
    const { profileId } = req.params;
    const { planCode } = req.query;

    if (!planCode) {
      return res.status(400).json({ error: 'planCode es requerido' });
    }

    const validation = await service.validateProfilePlanUpgrade(profileId, planCode as string);
    res.json(validation);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An error occurred';
    res.status(400).json({ message });
  }
};

// Endpoint para validar compra de upgrade
export const validateUpgradePurchaseController = async (req: AuthRequest, res: Response) => {
  try {
    const { profileId, upgradeCode } = req.params;

    if (!upgradeCode) {
      return res.status(400).json({ error: 'upgradeCode es requerido' });
    }

    const profile = await service.getProfileById(profileId);
    if (!profile) {
      return res.status(404).json({ error: 'Perfil no encontrado' });
    }

    // Verificar que el perfil tiene un plan activo
    const now = new Date();
    const hasActivePlan = profile.planAssignment &&
      new Date(profile.planAssignment.expiresAt) > now;

    if (!hasActivePlan) {
      return res.json({
        canPurchase: false,
        reason: 'Necesitas un plan activo para comprar upgrades'
      });
    }

    // Verificar reglas específicas por tipo de upgrade
    if (upgradeCode === 'IMPULSO') {
      // IMPULSO requiere DESTACADO activo
      const activeUpgrades = profile.upgrades?.filter(u => new Date(u.endAt) > now) || [];
      const hasDestacado = activeUpgrades.some(u => u.code === 'DESTACADO');

      if (!hasDestacado) {
        return res.json({
          canPurchase: false,
          reason: 'Necesitas tener "Destacado" activo para comprar "Impulso"'
        });
      }
    }

    // Verificar si es plan DIAMANTE y el upgrade es DESTACADO
    if (upgradeCode === 'DESTACADO' && profile.planAssignment?.planCode === 'DIAMANTE') {
      return res.json({
        canPurchase: false,
        reason: 'El plan Diamante ya incluye "Destacado" permanente'
      });
    }

    // Verificar si ya tiene el upgrade activo
    const activeUpgrades = profile.upgrades?.filter(u => new Date(u.endAt) > now) || [];
    const hasUpgradeActive = activeUpgrades.some(u => u.code === upgradeCode);

    if (hasUpgradeActive) {
      return res.json({
        canPurchase: false,
        reason: `El upgrade ${upgradeCode} ya está activo`
      });
    }

    res.json({ canPurchase: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An error occurred';
    res.status(500).json({ message });
  }
};

export const validatePlanOperationsController = async (req: AuthRequest, res: Response) => {
  try {
    const { profileId } = req.params;

    if (!profileId) {
      res.status(400).json({ message: 'profileId es requerido' });
      return;
    }

    // Obtener el perfil
    const profile = await service.getProfileById(profileId);
    if (!profile) {
      res.status(404).json({ message: 'Perfil no encontrado' });
      return;
    }

    // Obtener el conteo de perfiles activos del usuario
    const activeProfilesCount = await getActiveProfilesCount(profile.user.toString());

    // Validaciones básicas
    const maxActiveProfiles = 10; // Límite estándar
    const canPurchase = activeProfilesCount < maxActiveProfiles;
    const canUpgrade = true; // Los upgrades generalmente están permitidos
    const canRenew = profile.planAssignment && new Date(profile.planAssignment.expiresAt) > new Date();

    let reason = '';
    if (!canPurchase) {
      reason = `Has alcanzado el límite máximo de ${maxActiveProfiles} perfiles con plan activo`;
    }

    res.json({
      canPurchase,
      canUpgrade,
      canRenew,
      activeProfilesCount,
      maxActiveProfiles,
      reason
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An error occurred';
    res.status(500).json({ message });
  }
};

// Endpoint para hacer upgrade de plan de un perfil
export const upgradePlanController = async (req: AuthRequest, res: Response) => {
  try {
    const { id: profileId } = req.params; // Usar 'id' en lugar de 'profileId' para coincidir con la ruta
    const { newPlanCode, variantDays } = req.body;

    console.log('🔍 Backend Controller: Upgrade request received:', {
      profileId,
      newPlanCode,
      variantDays,
      body: req.body,
      params: req.params
    });

    if (!profileId) {
      return res.status(400).json({
        success: false,
        error: 'profileId es requerido'
      });
    }

    if (!newPlanCode) {
      return res.status(400).json({
        success: false,
        error: 'newPlanCode es requerido'
      });
    }

    const updatedProfile = await service.upgradePlan(profileId, newPlanCode, variantDays);

    console.log('✅ Backend Controller: Upgrade successful:', {
      profileId,
      newPlanCode,
      updatedPlan: updatedProfile?.planAssignment
    });

    res.json({
      success: true,
      message: 'Plan actualizado exitosamente',
      profile: updatedProfile
    });
  } catch (error: any) {
    console.error('❌ Backend Controller: Error al hacer upgrade de plan:', {
      error: error.message,
      stack: error.stack,
      profileId: req.params.id,
      newPlanCode: req.body.newPlanCode
    });
    res.status(400).json({
      success: false,
      error: error.message || 'Error al hacer upgrade del plan'
    });
  }
};