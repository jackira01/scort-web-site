import { PlanDefinitionModel } from '../plans/plan.model';
import { UpgradeDefinitionModel } from '../plans/upgrade.model';
import type { IProfile } from '../profile/profile.types';
import { ConfigParameterService } from '../config-parameter/config-parameter.service';

export interface IProfileWithMetadata extends IProfile {
  effectiveLevel?: number;
  priorityScore?: number;
}

/**
 * Generador de números pseudo-aleatorios con seed
 * Usado para rotación consistente durante un intervalo de tiempo
 */
function seededRandom(seed: number) {
  let state = seed;
  return () => {
    state = (state * 9301 + 49297) % 233280;
    return state / 233280;
  };
}

/**
 * Calcula el intervalo de rotación actual basado en la configuración dinámica
 */
async function getRotationSeed(): Promise<number> {
  const now = Date.now();
  // Obtener intervalo desde config-parameters (valor en minutos)
  const intervalMinutes = await ConfigParameterService.getValue('profile.rotation.interval.minutes') as number;
  // Si no se encuentra o es inválido, usar 15 minutos por defecto
  const minutes = (intervalMinutes && intervalMinutes > 0) ? intervalMinutes : 15;
  const rotationInterval = minutes * 60 * 1000;
  const seed = Math.floor(now / rotationInterval);
  console.log(`🔄 [ROTATION] Seed actual: ${seed} (intervalo: ${minutes} minutos)`);
  return seed;
}

/**
 * Función auxiliar para mezclar arrays usando Fisher-Yates shuffle con seed
 */
async function shuffleArray<T>(array: T[], seed?: number): Promise<T[]> {
  if (array.length <= 1) return array; // Optimización simple

  const shuffled = [...array];
  const usedSeed = seed ?? await getRotationSeed();
  const random = seededRandom(usedSeed);

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

interface EffectiveLevelAndVariant {
  effectiveLevel: number;
  effectiveVariantDays: number;
  hasDestacado: boolean;
  hasImpulso: boolean;
  originalLevel: number;
  originalVariantDays: number;
}

/**
 * Calcula el nivel y variante efectivos considerando upgrades DESTACADO e IMPULSO
 */
export const calculateEffectiveLevelAndVariant = async (
  profile: IProfile,
  now: Date = new Date()
): Promise<EffectiveLevelAndVariant> => {
  let planDefinition;

  if (profile.planAssignment?.planId && typeof profile.planAssignment.planId === 'object') {
    planDefinition = profile.planAssignment.planId;
  } else {
    planDefinition = await PlanDefinitionModel.findOne({
      code: profile.planAssignment?.planCode,
    }).lean();
  }

  if (!planDefinition) {
    return {
      effectiveLevel: 999, effectiveVariantDays: 0, hasDestacado: false, hasImpulso: false, originalLevel: 999, originalVariantDays: 0,
    };
  }

  const originalLevel = planDefinition.level;
  const originalVariantDays = profile.planAssignment?.variantDays || 0;
  let effectiveLevel = originalLevel;
  let effectiveVariantDays = originalVariantDays;
  let hasDestacado = false;
  let hasImpulso = false;

  const activeUpgrades = profile.upgrades?.filter(
    (upgrade) => upgrade.startAt && upgrade.endAt && new Date(upgrade.startAt) <= now && new Date(upgrade.endAt) > now
  ) || [];

  const destacadoUpgrade = activeUpgrades.find((u) => u.code === 'DESTACADO');

  if (destacadoUpgrade) {
    hasDestacado = true;
    if (effectiveLevel > 1) {
      effectiveLevel = effectiveLevel - 1;
    }
  }

  const impulsoUpgrade = activeUpgrades.find((u) => u.code === 'IMPULSO');

  if (impulsoUpgrade && hasDestacado) {
    hasImpulso = true;
  }

  return { effectiveLevel, effectiveVariantDays, hasDestacado, hasImpulso, originalLevel, originalVariantDays };
};

export const getEffectiveLevel = async (profile: IProfile, now: Date = new Date()): Promise<number> => {
  const result = await calculateEffectiveLevelAndVariant(profile, now);
  return result.effectiveLevel;
};

/**
 * Calcula el score de visibilidad completo
 */
export const calculateVisibilityScore = async (profile: IProfile, now: Date = new Date()): Promise<number> => {
  let score = 0;

  const { effectiveLevel, effectiveVariantDays, hasDestacado, hasImpulso, originalLevel } = await calculateEffectiveLevelAndVariant(profile, now);

  if (effectiveLevel === 999) {
    return -1000000000;
  }

  // BASE SCORES (Jerarquía principal):
  // Nivel 1: 5,000,000
  // Nivel 2: 4,000,000 ...
  const baseLevelScore = (6 - effectiveLevel) * 1000000;
  const isNative = (originalLevel === effectiveLevel);

  // SUBCATEGORÍAS (Saltos de 250,000):
  if (isNative && hasImpulso) {
    score = baseLevelScore + 750000;
  } else if (isNative) {
    score = baseLevelScore + 500000;
  } else if (hasDestacado && hasImpulso) {
    score = baseLevelScore + 250000;
  } else if (hasDestacado) {
    score = baseLevelScore;
  } else {
    score = baseLevelScore + 500000; // Fallback
  }

  // DURACIÓN DEL PLAN (Max 249,000)
  const planDurationScore = Math.min(effectiveVariantDays, 249) * 1000;
  score += planDurationScore;

  // OTROS UPGRADES
  if (profile.upgrades && profile.upgrades.length > 0) {
    const otherActiveUpgrades = profile.upgrades.filter(
      (upgrade) => upgrade.code !== 'DESTACADO' && upgrade.code !== 'IMPULSO' &&
        upgrade.startAt && upgrade.endAt && new Date(upgrade.startAt) <= now && new Date(upgrade.endAt) > now
    );

    for (const upgrade of otherActiveUpgrades) {
      const upgradeDefinition = await UpgradeDefinitionModel.findOne({ code: upgrade.code }).lean();
      if (upgradeDefinition?.effect?.priorityBonus) {
        score += (upgradeDefinition.effect.priorityBonus * 10000);
      }
    }
  }

  // ELIMINADO: Recency Penalty (penalización por tiempo desde última vista)
  // Esto causaba decimales que fragmentaban los grupos de shuffle.

  // Asegurar Enteros:
  return Math.max(0, Math.floor(score));
};

export const getPriorityScore = async (profile: IProfile, now: Date = new Date()): Promise<number> => {
  return await calculateVisibilityScore(profile, now);
};

/**
 * Ordena una lista de perfiles dentro del mismo nivel
 * LÓGICA ACTUALIZADA:
 * 1. SEPARACIÓN: Se dividen en Impulsos y Normales para garantizar prioridad VIP.
 * 2. ORDENAMIENTO: AMBOS grupos se ordenan por SCORE y luego aplican SHUFFLE.
 * Ya no se usa la fecha de compra para ordenar Impulsos.
 */
export const sortProfilesWithinLevel = async (profiles: IProfile[], now: Date = new Date()): Promise<IProfile[]> => {

  // Interfaces auxiliares locales
  interface ImpulseItem { profile: IProfile; score: number; }
  interface NormalItem { profile: IProfile; score: number; }

  const itemsWithImpulso: ImpulseItem[] = [];
  const itemsWithoutImpulso: NormalItem[] = [];

  // 1. CLASIFICACIÓN
  for (const profile of profiles) {
    const p = profile as IProfileWithMetadata;
    const score = p.priorityScore || 0;

    // Validar Impulso Activo + Destacado (Regla de Negocio)
    const impulsoUpgrade = profile.upgrades?.find(
      u => u.code === 'IMPULSO' && u.startAt && new Date(u.startAt) <= now && new Date(u.endAt) > now
    );

    // Nota: La fecha de compra ya no es relevante para el orden, solo la existencia del upgrade
    if (impulsoUpgrade && impulsoUpgrade.purchaseAt) {
      itemsWithImpulso.push({
        profile,
        score
      });
    } else {
      itemsWithoutImpulso.push({ profile, score });
    }
  }

  // 2. PROCESAMIENTO DE IMPULSOS (AHORA CON SHUFFLE)
  const impulseByScore: { [score: number]: ImpulseItem[] } = {};
  itemsWithImpulso.forEach(item => {
    if (!impulseByScore[item.score]) impulseByScore[item.score] = [];
    impulseByScore[item.score].push(item);
  });

  // Ordenar los scores de Impulso de MAYOR a MENOR
  const sortedImpulseScores = Object.keys(impulseByScore).map(Number).sort((a, b) => b - a);

  const finalImpulseList: IProfile[] = [];

  for (const score of sortedImpulseScores) {
    const group = impulseByScore[score].map(x => x.profile);

    // CAMBIO: Shuffle para Impulsos también.
    // Si tienen el mismo score, rotan aleatoriamente.
    // Si tienen scores diferentes, el orden de sortedImpulseScores manda.
    const shuffledGroup = await shuffleArray(group);

    finalImpulseList.push(...shuffledGroup);
  }

  if (finalImpulseList.length > 0) {
    // console.log(`   🚀 VIP (Impulso): ${finalImpulseList.length} perfiles procesados con Score + Shuffle.`);
  }

  // 3. PROCESAMIENTO DE NORMALES (ROTATIVOS)
  const normalByScore: { [score: number]: NormalItem[] } = {};
  itemsWithoutImpulso.forEach(item => {
    if (!normalByScore[item.score]) normalByScore[item.score] = [];
    normalByScore[item.score].push(item);
  });

  const sortedNormalScores = Object.keys(normalByScore).map(Number).sort((a, b) => b - a);

  const finalNormalList: IProfile[] = [];

  for (const score of sortedNormalScores) {
    const group = normalByScore[score].map(x => x.profile);

    // Shuffle para Normales
    const shuffledGroup = await shuffleArray(group);

    finalNormalList.push(...shuffledGroup);
  }

  // 4. FUSIÓN
  // Los Impulsos siguen yendo primero porque tienen el bono de score (+500k) y además los ponemos al inicio de la lista.
  return [
    ...finalImpulseList,
    ...finalNormalList
  ];
};

/**
 * Ordena una lista de perfiles considerando nivel efectivo y prioridad
 */
export const sortProfiles = async (
  profiles: IProfile[],
  now: Date = new Date(),
  context: string = 'GENERAL'
): Promise<IProfile[]> => {
  console.log(`\n🔄 [${context}] ========== INICIANDO ORDENAMIENTO DE ${profiles.length} PERFILES ==========`);

  const profilesWithMetadata: IProfileWithMetadata[] = await Promise.all(
    profiles.map(async (profile) => {
      const { effectiveLevel, hasDestacado, hasImpulso, originalLevel } = await calculateEffectiveLevelAndVariant(profile, now);
      const priorityScore = await calculateVisibilityScore(profile, now);
      return { ...profile, effectiveLevel, priorityScore } as unknown as IProfileWithMetadata;
    })
  );

  const validProfiles = profilesWithMetadata.filter(profile => {
    return typeof profile.effectiveLevel === 'number' && !isNaN(profile.effectiveLevel);
  });

  const profilesByLevel: { [level: number]: IProfileWithMetadata[] } = {};
  for (const profile of validProfiles) {
    if (!profilesByLevel[profile.effectiveLevel]) {
      profilesByLevel[profile.effectiveLevel] = [];
    }
    profilesByLevel[profile.effectiveLevel].push(profile);
  }

  const levelsFound = Object.keys(profilesByLevel).map(Number).sort((a, b) => a - b);
  const sortedProfiles: IProfile[] = [];

  for (const level of levelsFound) {
    console.log(`\n📊 [${context}] Ordenando nivel ${level} - ${profilesByLevel[level].length} perfiles`);
    const sortedLevelProfiles = await sortProfilesWithinLevel(profilesByLevel[level], now);
    sortedProfiles.push(...sortedLevelProfiles);
  }

  // --- LOGGING DETALLADO SOLICITADO ---
  console.log(`\n🔍 [DEBUG ORDENAMIENTO - ${context}] Top 15 Perfiles Finales:`);
  console.log('--------------------------------------------------');

  const top15 = sortedProfiles.slice(0, 15);
  let currentLogLevel = -1;

  top15.forEach((profile, index) => {
    const p = profile as IProfileWithMetadata;

    // Detectar cambio de nivel para encabezado
    if (p.effectiveLevel !== currentLogLevel) {
      currentLogLevel = p.effectiveLevel || 0;
      console.log(`\n📂 --- NIVEL ACTUAL: ${currentLogLevel} ---`);
    }

    // Obtener upgrades activos para mostrar
    const activeUpgrades = profile.upgrades?.filter(u =>
      u.startAt && u.endAt && new Date(u.startAt) <= now && new Date(u.endAt) > now
    ).map(u => u.code).join(', ') || 'Ninguno';

    // Obtener fecha relevante (Impulso)
    const impulsoUpgrade = profile.upgrades?.find(u => u.code === 'IMPULSO');
    const dateInfo = impulsoUpgrade?.purchaseAt
      ? ` | 📅 Fecha Impulso: ${new Date(impulsoUpgrade.purchaseAt).toISOString()}`
      : '';

    console.log(`   ${index + 1}. ${p.name || 'Sin Nombre'} (_id: ${p._id})`);
    console.log(`      Score: ${p.priorityScore?.toLocaleString()} | Upgrades: [${activeUpgrades}]${dateInfo}`);
  });
  console.log('--------------------------------------------------\n');

  console.log(`\n✅ [${context}] ========== ORDENAMIENTO COMPLETADO ==========\n`);

  return sortedProfiles;
};