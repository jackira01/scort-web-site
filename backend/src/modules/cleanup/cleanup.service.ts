import { ProfileModel } from '../profile/profile.model';
import type { IProfile } from '../profile/profile.types';
import { hideProfile } from '../profile/profile.service';
import { logger } from '../../utils/logger';

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
    // Buscar perfiles con planes expirados que aún están activos
    const expiredProfiles = await ProfileModel.find({
      visible: true,
      isActive: true,
      'planAssignment.expiresAt': { $lte: now }
    });

    let processedCount = 0;

    // Usar el método de ocultación para cada perfil expirado
    for (const profile of expiredProfiles) {
      try {
        await hideProfile((profile as any)._id.toString(), (profile as any).user.toString());
        processedCount++;
      } catch (error) {
        // Continuar con el siguiente perfil si hay error
        continue;
      }
    }

    return processedCount;
  } catch (error) {
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
    console.log(`[Cleanup] Starting upgrade cleanup at ${now.toISOString()}`);

    if (keepHistory) {
      // Opción 1: Mover upgrades expirados a un campo de historial
      const profilesWithExpiredUpgrades = await ProfileModel.find({
        'upgrades.endAt': { $lte: now }
      });

      console.log(`[Cleanup] Found ${profilesWithExpiredUpgrades.length} profiles with expired upgrades`);

      let updatedCount = 0;
      for (const profile of profilesWithExpiredUpgrades) {
        const activeUpgrades = profile.upgrades.filter(upgrade => upgrade.endAt > now);
        const expiredUpgrades = profile.upgrades.filter(upgrade => upgrade.endAt <= now);

        if (expiredUpgrades.length > 0) {
          console.log(`[Cleanup] Profile ${profile._id}: Removing ${expiredUpgrades.length} expired upgrades`);
          expiredUpgrades.forEach(u => {
            console.log(`  - Upgrade ${u.code} expired at ${u.endAt}`);
          });

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

      logger.info(`Moved expired upgrades to history for ${updatedCount} profiles`, { timestamp: now.toISOString() });
      console.log(`[Cleanup] Upgrade cleanup completed: ${updatedCount} profiles updated`);
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

      logger.info(`Removed expired upgrades from ${result.modifiedCount} profiles`, { timestamp: now.toISOString() });
      return result.modifiedCount;
    }
  } catch (error) {
    const err = error as Error;
    logger.error('Error cleaning up expired upgrades', { error: err.message, stack: err.stack });
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
  * Obtiene estadísticas de perfiles por estado de visibilidad y eliminación
  * @returns Estadísticas de perfiles
  */
export const getProfileVisibilityStats = async (): Promise<{
  visible: number;
  hidden: number;
  active: number;
  softDeleted: number;
  withActivePlan: number;
  withExpiredPlan: number;
  withActiveUpgrades: number;
}> => {
  const now = new Date();

  try {
    const [visible, hidden, active, softDeleted, withActivePlan, withExpiredPlan, withActiveUpgrades] = await Promise.all([
      ProfileModel.countDocuments({ visible: true, isDeleted: { $ne: true } }),
      ProfileModel.countDocuments({ visible: false, isDeleted: { $ne: true } }),
      ProfileModel.countDocuments({ isActive: true }),
      ProfileModel.countDocuments({ isDeleted: true }),
      ProfileModel.countDocuments({
        isActive: true,
        'planAssignment.expiresAt': { $gt: now }
      }),
      ProfileModel.countDocuments({
        isActive: true,
        'planAssignment.expiresAt': { $lte: now }
      }),
      ProfileModel.countDocuments({
        isActive: true,
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
      active,
      softDeleted,
      withActivePlan,
      withExpiredPlan,
      withActiveUpgrades
    };
  } catch (error) {
    throw error;
  }
};