import { ProfileModel } from '../profile/profile.model';
import type { IProfile } from '../profile/profile.types';

/**
 * Servicio de limpieza automática para perfiles y upgrades expirados
 */

/**
 * Marca como no visibles los perfiles con planes expirados
 * @param now - Fecha actual para comparar expiraciones
 * @returns Número de perfiles actualizados
 */
export const hideExpiredProfiles = async (now: Date = new Date()): Promise<number> => {
  try {
    const result = await ProfileModel.updateMany(
      {
        visible: true,
        'planAssignment.expiresAt': { $lte: now }
      },
      {
        $set: { visible: false }
      }
    );

    console.log(`[Cleanup] Hidden ${result.modifiedCount} expired profiles at ${now.toISOString()}`);
    return result.modifiedCount;
  } catch (error) {
    console.error('[Cleanup] Error hiding expired profiles:', error);
    throw error;
  }
};

/**
 * Purga upgrades vencidos de los perfiles
 * @param now - Fecha actual para comparar expiraciones
 * @param keepHistory - Si true, mantiene los upgrades como historial
 * @returns Número de perfiles con upgrades limpiados
 */
export const cleanupExpiredUpgrades = async (
  now: Date = new Date(), 
  keepHistory: boolean = true
): Promise<number> => {
  try {
    if (keepHistory) {
      // Opción 1: Mover upgrades expirados a un campo de historial
      const profilesWithExpiredUpgrades = await ProfileModel.find({
        'upgrades.endAt': { $lte: now }
      });

      let updatedCount = 0;
      for (const profile of profilesWithExpiredUpgrades) {
        const activeUpgrades = profile.upgrades.filter(upgrade => upgrade.endAt > now);
        const expiredUpgrades = profile.upgrades.filter(upgrade => upgrade.endAt <= now);

        if (expiredUpgrades.length > 0) {
          // Mantener solo upgrades activos
          profile.upgrades = activeUpgrades;
          
          // Agregar campo de historial si no existe
          if (!(profile as any).upgradeHistory) {
            (profile as any).upgradeHistory = [];
          }
          
          // Mover upgrades expirados al historial
          (profile as any).upgradeHistory.push(...expiredUpgrades.map(upgrade => ({
            ...(upgrade as any).toObject(),
            expiredAt: now
          })));

          await profile.save();
          updatedCount++;
        }
      }

      console.log(`[Cleanup] Moved expired upgrades to history for ${updatedCount} profiles at ${now.toISOString()}`);
      return updatedCount;
    } else {
      // Opción 2: Eliminar completamente los upgrades expirados
      const result = await ProfileModel.updateMany(
        {
          'upgrades.endAt': { $lte: now }
        },
        {
          $pull: {
            upgrades: { endAt: { $lte: now } }
          }
        }
      );

      console.log(`[Cleanup] Removed expired upgrades from ${result.modifiedCount} profiles at ${now.toISOString()}`);
      return result.modifiedCount;
    }
  } catch (error) {
    console.error('[Cleanup] Error cleaning up expired upgrades:', error);
    throw error;
  }
};

/**
 * Ejecuta todas las tareas de limpieza automática
 * @param now - Fecha actual
 * @returns Resumen de la limpieza realizada
 */
export const runCleanupTasks = async (now: Date = new Date()): Promise<{
  hiddenProfiles: number;
  cleanedUpgrades: number;
  timestamp: Date;
}> => {
  console.log(`[Cleanup] Starting cleanup tasks at ${now.toISOString()}`);
  
  try {
    // Ejecutar tareas de limpieza en paralelo
    const [hiddenProfiles, cleanedUpgrades] = await Promise.all([
      hideExpiredProfiles(now),
      cleanupExpiredUpgrades(now, true) // Mantener historial por defecto
    ]);

    const summary = {
      hiddenProfiles,
      cleanedUpgrades,
      timestamp: now
    };

    console.log('[Cleanup] Tasks completed:', summary);
    return summary;
  } catch (error) {
    console.error('[Cleanup] Error running cleanup tasks:', error);
    throw error;
  }
};

/**
 * Obtiene estadísticas de perfiles por estado de visibilidad
 * @returns Estadísticas de perfiles
 */
export const getProfileVisibilityStats = async (): Promise<{
  visible: number;
  hidden: number;
  withActivePlan: number;
  withExpiredPlan: number;
  withActiveUpgrades: number;
}> => {
  const now = new Date();
  
  try {
    const [visible, hidden, withActivePlan, withExpiredPlan, withActiveUpgrades] = await Promise.all([
      ProfileModel.countDocuments({ visible: true }),
      ProfileModel.countDocuments({ visible: false }),
      ProfileModel.countDocuments({ 'planAssignment.expiresAt': { $gt: now } }),
      ProfileModel.countDocuments({ 'planAssignment.expiresAt': { $lte: now } }),
      ProfileModel.countDocuments({ 
        'upgrades': { 
          $elemMatch: { 
            startAt: { $lte: now },
            endAt: { $gt: now }
          }
        }
      })
    ]);

    return {
      visible,
      hidden,
      withActivePlan,
      withExpiredPlan,
      withActiveUpgrades
    };
  } catch (error) {
    console.error('[Cleanup] Error getting visibility stats:', error);
    throw error;
  }
};