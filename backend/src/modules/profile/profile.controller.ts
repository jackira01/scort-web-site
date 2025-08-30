import type { Request, Response } from 'express';
import * as service from './profile.service';
import {
  subscribeProfile,
  purchaseUpgrade,
  getActiveProfilesCount,
} from './profile.service';
import { 
  validatePaidPlanAssignment,
  validateUpgradePurchase,
  getUserUsageStats,
  BusinessValidationError 
} from '../validation/business-validation.service';

export const createProfile = async (req: Request, res: Response) => {
  try {
    const { userId, planCode, orderId } = req.body;

    // Si se especifica un plan pago, validar límites
    if (planCode && planCode !== 'GRATIS') {
      await validatePaidPlanAssignment(
        userId,
        planCode,
        undefined,
        orderId
      );
    }

    const newProfile = await service.createProfile(req.body);
    res.status(201).json(newProfile);
  } catch (err: unknown) {
    // Manejar errores de validación de negocio
    if (err instanceof BusinessValidationError) {
      return res.status(409).json({ message: err.message });
    }
    
    const message = err instanceof Error ? err.message : 'An error occurred';
    res.status(400).json({ message });
  }
};

export const getProfiles = async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const fields = req.query.fields as string;
  
  const profiles = await service.getProfiles(page, limit, fields);
  res.json(profiles);
};

export const getProfilesForHome = async (req: Request, res: Response) => {
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

export const getProfileById = async (req: Request, res: Response) => {
  const profile = await service.getProfileById(req.params.id);
  if (!profile)
    return res.status(404).json({ message: 'Perfil no encontrado' });
  res.json(profile);
};

export const updateProfile = async (req: Request, res: Response) => {
  const updated = await service.updateProfile(req.params.id, req.body);
  res.json(updated);
};

export const deleteProfile = async (req: Request, res: Response) => {
  await service.deleteProfile(req.params.id);
  res.status(204).send();
};

// Nuevos endpoints para suscripción y upgrades
export const subscribeProfileController = async (req: Request, res: Response) => {
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

export const purchaseUpgradeController = async (req: Request, res: Response) => {
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

    const updatedProfile = await purchaseUpgrade(id, code);
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

export const getProfilesPost = async (req: Request, res: Response) => {
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

export const verifyProfileName = async (req: Request, res: Response) => {
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

export const createMissingVerifications = async (req: Request, res: Response) => {
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

export const getProfilesWithStories = async (req: Request, res: Response) => {
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
export const getUserUsageStatsController = async (req: Request, res: Response) => {
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
export const validateUserProfileLimitsController = async (req: Request, res: Response) => {
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
export const getUserProfilesSummaryController = async (req: Request, res: Response) => {
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
export const getProfilePlanInfoController = async (req: Request, res: Response) => {
  try {
    const { profileId } = req.params;
    
    const profile = await service.getProfileById(profileId);
    if (!profile) {
      return res.status(404).json({ error: 'Perfil no encontrado' });
    }

    // Verificar si tiene un plan activo
    const now = new Date();
    const hasActivePlan = profile.planAssignment && 
      new Date(profile.planAssignment.expiresAt) > now;
    
    if (!hasActivePlan) {
      return res.status(404).json({ error: 'El perfil no tiene un plan activo' });
    }

    // Devolver información del plan
    const planInfo = {
      planCode: profile.planAssignment?.planCode,
      expiresAt: profile.planAssignment?.expiresAt,
      isActive: true
    };

    res.json(planInfo);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An error occurred';
    res.status(400).json({ message });
  }
};

export const validateProfilePlanUpgradeController = async (req: Request, res: Response) => {
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
export const validateUpgradePurchaseController = async (req: Request, res: Response) => {
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

export const validatePlanOperationsController = async (req: Request, res: Response) => {
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