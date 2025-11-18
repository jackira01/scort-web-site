import { ProfileModel } from '../profile/profile.model';
import { sortProfiles, getEffectiveLevel } from '../visibility/visibility.service';
import type { IProfile } from '../profile/profile.types';

export interface HomeFeedOptions {
  page?: number;
  pageSize?: number;
}

export interface HomeFeedResponse {
  profiles: IProfile[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  metadata: {
    levelSeparators: Array<{
      level: number;
      startIndex: number;
      count: number;
    }>;
  };
}

/**
 * Obtiene el feed principal con perfiles ordenados por nivel y prioridad
 * @param options - Opciones de paginación
 * @returns Feed ordenado con metadata
 */
export const getHomeFeed = async (options: HomeFeedOptions = {}): Promise<HomeFeedResponse> => {
  const { page = 1, pageSize = 20 } = options;
  const now = new Date();

  // Usar agregación para obtener todos los perfiles con información de usuario
  const verifiedUserProfiles = await ProfileModel.aggregate([
    {
      $match: {
        visible: true,
        isDeleted: { $ne: true },
        planAssignment: { $exists: true, $ne: null }, // Excluir perfiles sin plan (en proceso)
        'planAssignment.expiresAt': { $gt: now }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'user',
        foreignField: '_id',
        as: 'userInfo'
      }
    },
    {
      $lookup: {
        from: 'plandefinitions',
        localField: 'planAssignment.planId',
        foreignField: '_id',
        as: 'planAssignmentPlan'
      }
    },
    {
      $addFields: {
        user: { $arrayElemAt: ['$userInfo', 0] },
        'planAssignment.plan': { $arrayElemAt: ['$planAssignmentPlan', 0] }
      }
    },
    {
      $project: {
        userInfo: 0,
        planAssignmentPlan: 0
      }
    }
  ]);

  // Convertir los resultados de agregación a documentos de Mongoose
  const profileDocuments = verifiedUserProfiles.map(profile =>
    new ProfileModel(profile)
  );

  console.log(`\n🏠 [HOME FEED] Ordenando ${profileDocuments.length} perfiles para home (página ${page}, tamaño ${pageSize})`);

  // Ordenar perfiles usando el motor de visibilidad
  const sortedProfiles = await sortProfiles(profileDocuments, now);

  // Calcular metadata de separadores por nivel
  const levelSeparators: Array<{ level: number; startIndex: number; count: number }> = [];
  const profilesWithLevels = await Promise.all(
    sortedProfiles.map(async (profile) => ({
      profile,
      level: await getEffectiveLevel(profile, now)
    }))
  );

  // Agrupar por nivel para generar separadores
  let currentIndex = 0;
  for (let level = 1; level <= 5; level++) {
    const levelProfiles = profilesWithLevels.filter(p => p.level === level);
    if (levelProfiles.length > 0) {
      levelSeparators.push({
        level,
        startIndex: currentIndex,
        count: levelProfiles.length
      });
      currentIndex += levelProfiles.length;
    }
  }

  // Aplicar paginación
  const total = sortedProfiles.length;
  const totalPages = Math.ceil(total / pageSize);
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedProfiles = sortedProfiles.slice(startIndex, endIndex);

  console.log(`\n🏠 [HOME FEED] Mostrando perfiles ${startIndex + 1} a ${startIndex + paginatedProfiles.length} de ${total} totales`);

  // Actualizar lastShownAt para los perfiles servidos (fairness rotation)
  if (paginatedProfiles.length > 0) {
    await updateLastShownAt(paginatedProfiles.map(p => (p._id as any).toString()));
  }

  // Ajustar índices de separadores para la página actual
  const adjustedSeparators = levelSeparators
    .map(separator => ({
      ...separator,
      startIndex: Math.max(0, separator.startIndex - startIndex),
      endIndex: separator.startIndex + separator.count - startIndex
    }))
    .filter(separator =>
      separator.endIndex > 0 && separator.startIndex < pageSize
    )
    .map(separator => ({
      level: separator.level,
      startIndex: Math.max(0, separator.startIndex),
      count: Math.min(separator.endIndex, pageSize) - Math.max(0, separator.startIndex)
    }))
    .filter(separator => separator.count > 0);

  return {
    profiles: paginatedProfiles,
    pagination: {
      page,
      pageSize,
      total,
      totalPages
    },
    metadata: {
      levelSeparators: adjustedSeparators
    }
  };
};

/**
 * Obtiene estadísticas del feed para debugging
 * @returns Estadísticas por nivel
 */
/**
 * Actualiza lastShownAt para los perfiles servidos (sistema de rotación justa)
 * @param profileIds - IDs de los perfiles que fueron servidos
 */
export const updateLastShownAt = async (profileIds: string[]): Promise<void> => {
  if (profileIds.length === 0) return;

  const now = new Date();

  // Importar ConfigParameterService para obtener el intervalo de rotación
  const { ConfigParameterService } = await import('../config-parameter/config-parameter.service');

  // Obtener intervalo desde config-parameters (valor en minutos)
  const intervalMinutes = await ConfigParameterService.getValue('profile.rotation.interval.minutes') as number;

  // Si no se encuentra o es inválido, usar 15 minutos por defecto
  const minutes = (intervalMinutes && intervalMinutes > 0) ? intervalMinutes : 15;
  const rotationIntervalMs = minutes * 60 * 1000; // Convertir a milisegundos

  // Solo actualizar perfiles cuyo lastShownAt sea null o haya pasado el intervalo de rotación
  const minTimestamp = new Date(now.getTime() - rotationIntervalMs);

  await ProfileModel.updateMany(
    {
      _id: { $in: profileIds },
      $or: [
        { lastShownAt: null },
        { lastShownAt: { $lt: minTimestamp } }
      ]
    },
    { $set: { lastShownAt: now } }
  ).exec();
};

/**
 * Actualiza lastShownAt en lote para optimizar rendimiento
 * Solo actualiza perfiles cuyo lastShownAt sea null o haya pasado el intervalo de rotación
 * @param profileIds - IDs de los perfiles a actualizar
 */
export const batchUpdateLastShownAt = async (profileIds: string[]): Promise<void> => {
  if (profileIds.length === 0) return;

  const batchSize = 100; // Procesar en lotes de 100
  const now = new Date();

  // Importar ConfigParameterService para obtener el intervalo de rotación
  const { ConfigParameterService } = await import('../config-parameter/config-parameter.service');

  // Obtener intervalo desde config-parameters (valor en minutos)
  const intervalMinutes = await ConfigParameterService.getValue('profile.rotation.interval.minutes') as number;

  // Si no se encuentra o es inválido, usar 15 minutos por defecto
  const minutes = (intervalMinutes && intervalMinutes > 0) ? intervalMinutes : 15;
  const rotationIntervalMs = minutes * 60 * 1000; // Convertir a milisegundos

  // Solo actualizar perfiles cuyo lastShownAt sea null o haya pasado el intervalo de rotación
  const minTimestamp = new Date(now.getTime() - rotationIntervalMs);

  for (let i = 0; i < profileIds.length; i += batchSize) {
    const batch = profileIds.slice(i, i + batchSize);
    await ProfileModel.updateMany(
      {
        _id: { $in: batch },
        $or: [
          { lastShownAt: null },
          { lastShownAt: { $lt: minTimestamp } }
        ]
      },
      { $set: { lastShownAt: now } }
    ).exec();
  }
};

export const getHomeFeedStats = async (): Promise<Record<number, number>> => {
  const now = new Date();

  // Usar agregación para filtrar perfiles con usuarios verificados de manera más confiable
  const verifiedUserProfiles = await ProfileModel.aggregate([
    {
      $match: {
        visible: true,
        isDeleted: { $ne: true },
        planAssignment: { $exists: true, $ne: null }, // Excluir perfiles sin plan (en proceso)
        'planAssignment.expiresAt': { $gt: now }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'user',
        foreignField: '_id',
        as: 'userInfo'
      }
    },
    {
      $match: {
        'userInfo.isVerified': true
      }
    },
    {
      $addFields: {
        user: { $arrayElemAt: ['$userInfo', 0] }
      }
    },
    {
      $project: {
        userInfo: 0
      }
    }
  ]);

  // Convertir los resultados de agregación a documentos de Mongoose
  const profileDocuments = verifiedUserProfiles.map(profile =>
    new ProfileModel(profile)
  );

  const stats: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  for (const profile of profileDocuments) {
    const level = await getEffectiveLevel(profile, now);
    stats[level]++;
  }

  return stats;
};