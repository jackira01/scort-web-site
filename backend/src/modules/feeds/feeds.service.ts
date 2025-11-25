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
      startIndex: number;sponsored - profiles
count: number;
    }>;
  };
}
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

/**
 * Obtiene el feed principal paginado y ordenado
 * @param options Opciones de paginación
 */
export const getHomeFeed = async (options: HomeFeedOptions): Promise<HomeFeedResponse> => {
  const page = options.page || 1;
  const pageSize = options.pageSize || 20;
  const now = new Date();

  // 1. Obtener candidatos (Misma lógica de filtrado que getHomeFeedStats)
  // Filtramos: Activos, Visibles, Plan válido, Usuario Verificado
  const aggregationPipeline = [
    {
      $match: {
        visible: true,
        isActive: true,
        isDeleted: { $ne: true },
        planAssignment: { $exists: true, $ne: null },
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
      $match: { 'userInfo.isVerified': true }
    },
    {
      $addFields: { user: { $arrayElemAt: ['$userInfo', 0] } }
    },
    {
      $project: { userInfo: 0 }
    }
  ];

  const rawProfiles = await ProfileModel.aggregate(aggregationPipeline);

  // Hidratamos los documentos para asegurar compatibilidad con sortProfiles
  const profiles = rawProfiles.map(p => new ProfileModel(p));

  // 2. Ordenar usando el servicio de visibilidad (VisibilityService)
  // Esto aplica la lógica de niveles, destacados, impulsos y randomización
  const sortedProfiles = await sortProfiles(profiles, now, 'HOME_FEED');

  // 3. Calcular metadatos de separadores de nivel (para el frontend)
  // Esto permite saber cuántos perfiles hay de cada nivel en el total ordenado
  const levelSeparators: Array<{ level: number; startIndex: number; count: number }> = [];

  // Nota: sortProfiles devuelve IProfile, pero en tiempo de ejecución tienen effectiveLevel
  // gracias al arreglo anterior. Casteamos a 'any' para leer esa propiedad sin error de TS.
  let currentLevel = -1;
  let currentCount = 0;
  let currentStartIndex = 0;

  sortedProfiles.forEach((profile, index) => {
    const p = profile as any;
    const level = p.effectiveLevel || 999;

    if (level !== currentLevel) {
      if (currentLevel !== -1) {
        levelSeparators.push({
          level: currentLevel,
          startIndex: currentStartIndex,
          count: currentCount
        });
      }
      currentLevel = level;
      currentStartIndex = index;
      currentCount = 0;
    }
    currentCount++;
  });

  // Agregar el último grupo
  if (currentCount > 0) {
    levelSeparators.push({
      level: currentLevel,
      startIndex: currentStartIndex,
      count: currentCount
    });
  }

  // 4. Paginación en memoria
  const total = sortedProfiles.length;
  const totalPages = Math.ceil(total / pageSize);
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedProfiles = sortedProfiles.slice(startIndex, endIndex);

  // 5. Actualizar lastShownAt (Efecto secundario asíncrono - Fire & Forget)
  // Esto asegura que la próxima vez que alguien cargue el feed, la rotación aleatoria cambie
  if (paginatedProfiles.length > 0) {
    const profileIds = paginatedProfiles.map(p => p._id.toString());
    batchUpdateLastShownAt(profileIds).catch(err =>
      console.error('Error actualizando lastShownAt en background:', err)
    );
  }

  return {
    profiles: paginatedProfiles,
    pagination: {
      page,
      pageSize,
      total,
      totalPages
    },
    metadata: {
      levelSeparators
    }
  };
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