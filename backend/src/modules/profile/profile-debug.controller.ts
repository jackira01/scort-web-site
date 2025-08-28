import type { Request, Response } from 'express';
import { ProfileModel } from './profile.model';
import { PlanDefinitionModel } from '../plans/plan.model';
import { UpgradeDefinitionModel } from '../plans/upgrade.model';

/**
 * Endpoint de debug para verificar la estructura de planAssignment
 * y upgrades en los perfiles
 */
export const debugProfileStructureController = async (req: Request, res: Response) => {
  try {
    const { profileId } = req.params;
    
    if (!profileId) {
      return res.status(400).json({ error: 'profileId es requerido' });
    }

    // Obtener el perfil con toda la información
    const profile = await ProfileModel.findById(profileId)
      .populate({
        path: 'verification',
        select: 'verificationStatus verificationProgress'
      })
      .lean();

    if (!profile) {
      return res.status(404).json({ error: 'Perfil no encontrado' });
    }

    const now = new Date();

    // Verificar upgrades activos
    const activeUpgrades = profile.upgrades?.filter(upgrade => 
      new Date(upgrade.startAt) <= now && new Date(upgrade.endAt) > now
    ) || [];

    // Verificar upgrades específicos
    const hasDestacadoUpgrade = activeUpgrades.some(upgrade => 
      upgrade.code === 'DESTACADO' || upgrade.code === 'HIGHLIGHT'
    );
    const hasImpulsoUpgrade = activeUpgrades.some(upgrade => 
      upgrade.code === 'IMPULSO' || upgrade.code === 'BOOST'
    );

    // Obtener información del plan si existe
    let planInfo = null;
    if (profile.planAssignment?.planCode) {
      planInfo = await PlanDefinitionModel.findOne({ 
        code: profile.planAssignment.planCode 
      }).lean();
    }

    // Obtener definiciones de upgrades
    const upgradeDefinitions = await UpgradeDefinitionModel.find({ 
      active: true 
    }).lean();

    const debugInfo = {
      profileId: profile._id,
      profileName: profile.name,
      planAssignment: profile.planAssignment,
      planInfo: planInfo ? {
        code: planInfo.code,
        name: planInfo.name,
        level: planInfo.level,
        features: planInfo.features
      } : null,
      upgrades: profile.upgrades || [],
      activeUpgrades,
      upgradeFlags: {
        hasDestacadoUpgrade,
        hasImpulsoUpgrade
      },
      availableUpgrades: upgradeDefinitions.map(upgrade => ({
        code: upgrade.code,
        name: upgrade.name,
        durationHours: upgrade.durationHours,
        active: upgrade.active
      })),
      validationChecks: {
        hasActivePlan: profile.planAssignment && 
          new Date(profile.planAssignment.expiresAt) > now,
        planExpired: profile.planAssignment ? 
          new Date(profile.planAssignment.expiresAt) <= now : null,
        canPurchaseDestacado: profile.planAssignment?.planCode !== 'DIAMANTE',
        canPurchaseImpulso: hasDestacadoUpgrade
      }
    };

    res.json({
      success: true,
      data: debugInfo,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Error en debug de estructura de perfil:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
};

/**
 * Endpoint para verificar todos los perfiles de un usuario
 */
export const debugUserProfilesController = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId es requerido' });
    }

    // Obtener todos los perfiles del usuario
    const profiles = await ProfileModel.find({ user: userId })
      .select('_id name planAssignment upgrades visible isActive')
      .lean();

    const now = new Date();

    const debugInfo = profiles.map(profile => {
      const activeUpgrades = profile.upgrades?.filter(upgrade => 
        new Date(upgrade.startAt) <= now && new Date(upgrade.endAt) > now
      ) || [];

      return {
        profileId: profile._id,
        profileName: profile.name,
        visible: profile.visible,
        isActive: profile.isActive,
        planAssignment: profile.planAssignment,
        hasActivePlan: profile.planAssignment && 
          new Date(profile.planAssignment.expiresAt) > now,
        upgradesCount: profile.upgrades?.length || 0,
        activeUpgradesCount: activeUpgrades.length,
        activeUpgrades: activeUpgrades.map(u => u.code)
      };
    });

    res.json({
      success: true,
      userId,
      profilesCount: profiles.length,
      profiles: debugInfo,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Error en debug de perfiles de usuario:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
};