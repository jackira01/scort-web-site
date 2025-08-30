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

  // Filtrar perfiles visibles con plan activo
  const visibleProfiles = await ProfileModel.find({
    visible: true,
    isActive: true,
    'planAssignment.expiresAt': { $gt: now }
  }).exec();

  // Ordenar perfiles usando el motor de visibilidad
  const sortedProfiles = await sortProfiles(visibleProfiles, now);

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
  await ProfileModel.updateMany(
    { _id: { $in: profileIds } },
    { $set: { lastShownAt: now } }
  ).exec();
};

/**
 * Actualiza lastShownAt en lote para optimizar rendimiento
 * @param profileIds - IDs de los perfiles a actualizar
 */
export const batchUpdateLastShownAt = async (profileIds: string[]): Promise<void> => {
  if (profileIds.length === 0) return;

  const batchSize = 100; // Procesar en lotes de 100
  const now = new Date();

  for (let i = 0; i < profileIds.length; i += batchSize) {
    const batch = profileIds.slice(i, i + batchSize);
    await ProfileModel.updateMany(
      { _id: { $in: batch } },
      { $set: { lastShownAt: now } }
    ).exec();
  }
};

export const getHomeFeedStats = async (): Promise<Record<number, number>> => {
  const now = new Date();

  const visibleProfiles = await ProfileModel.find({
    visible: true,
    'planAssignment.expiresAt': { $gt: now }
  }).exec();

  const stats: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  for (const profile of visibleProfiles) {
    const level = await getEffectiveLevel(profile, now);
    stats[level]++;
  }

  return stats;
};