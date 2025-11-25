import { PlanDefinitionModel } from '../plans/plan.model';
import { UpgradeDefinitionModel } from '../plans/upgrade.model';
import type { IProfile } from '../profile/profile.types';
import { ConfigParameterService } from '../config-parameter/config-parameter.service';

export interface IProfileWithMetadata extends IProfile {
  effectiveLevel?: number;
  priorityScore?: number;
}

// --- UTILIDADES DE ROTACIÓN ---

/**
 * Generador pseudo-aleatorio para rotación consistente
 */
function seededRandom(seed: number) {
  let state = seed;
  return () => {
    state = (state * 9301 + 49297) % 233280;
    return state / 233280;
  };
}

/**
 * Calcula la semilla de rotación basada en intervalos de tiempo
 */
async function getRotationSeed(): Promise<number> {
  const now = Date.now();
  // Obtener intervalo (por defecto 15 minutos)
  const intervalMinutes = await ConfigParameterService.getValue('profile.rotation.interval.minutes') as number;
  const minutes = (intervalMinutes && intervalMinutes > 0) ? intervalMinutes : 15;

  const rotationInterval = minutes * 60 * 1000;
  const seed = Math.floor(now / rotationInterval);

  // console.log(`🔄 [ROTATION] Seed: ${seed} (cada ${minutes} min)`);
  return seed;
}

/**
 * Fisher-Yates shuffle con seed.
 * Mezcla el array de forma determinística durante el intervalo de tiempo.
 */
async function shuffleArray<T>(array: T[], seed?: number): Promise<T[]> {
  const shuffled = [...array];
  const usedSeed = seed ?? await getRotationSeed();
  const random = seededRandom(usedSeed);

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

// --- LÓGICA DE NEGOCIO ---

interface EffectiveLevelAndVariant {
  effectiveLevel: number;
  effectiveVariantDays: number;
  hasDestacado: boolean;
  hasImpulso: boolean;
  originalLevel: number;
}

/**
 * Calcula nivel efectivo basado en la documentación original:
 * - DESTACADO: Sube 1 nivel (ej: Nivel 3 -> Nivel 2).
 * - IMPULSO: Se marca para tratamiento especial en el ordenamiento.
 */
export const calculateEffectiveLevelAndVariant = async (
  profile: IProfile,
  now: Date = new Date()
): Promise<EffectiveLevelAndVariant> => {
  let planDefinition;

  // Obtener definición del plan (populado o consulta)
  if (profile.planAssignment?.planId && typeof profile.planAssignment.planId === 'object') {
    planDefinition = profile.planAssignment.planId;
  } else {
    planDefinition = await PlanDefinitionModel.findOne({
      code: profile.planAssignment?.planCode,
    }).lean();
  }

  if (!planDefinition) {
    return {
      effectiveLevel: 999,
      effectiveVariantDays: 0,
      hasDestacado: false,
      hasImpulso: false,
      originalLevel: 999,
    };
  }

  const originalLevel = planDefinition.level;
  const originalVariantDays = profile.planAssignment?.variantDays || 0;

  let effectiveLevel = originalLevel;
  let hasDestacado = false;
  let hasImpulso = false;

  // Filtrar upgrades activos por fecha
  const activeUpgrades = profile.upgrades?.filter(
    (upgrade) =>
      upgrade.startAt &&
      upgrade.endAt &&
      new Date(upgrade.startAt) <= now &&
      new Date(upgrade.endAt) > now
  ) || [];

  // 1. Lógica DESTACADO
  const destacadoUpgrade = activeUpgrades.find(u => u.code === 'DESTACADO');

  // Si el plan base ya es Nivel 1 (Diamante), actúa como destacado implícito para efectos visuales,
  // pero no puede subir más de nivel.
  const isNativeDiamond = originalLevel === 1;

  if (destacadoUpgrade || isNativeDiamond) {
    hasDestacado = true;
    // Solo sube de nivel si no es ya el nivel máximo (1) y si tiene el upgrade comprado explícitamente
    if (effectiveLevel > 1 && destacadoUpgrade) {
      effectiveLevel = effectiveLevel - 1;
    }
  }

  // 2. Lógica IMPULSO
  // Según doc: "Requiere que primero hayas comprado el upgrade DESTACADO"
  // O si es Nivel 1 nativo, también puede tener impulso.
  const impulsoUpgrade = activeUpgrades.find(u => u.code === 'IMPULSO');

  if (impulsoUpgrade) {
    // Validamos que tenga derecho al impulso (Destacado activo O ser Nivel 1)
    if (hasDestacado || isNativeDiamond) {
      hasImpulso = true;
    } else {
      // Log silencioso para debug si es necesario
      // console.log(`Perfil ${profile._id}: Impulso ignorado por falta de Destacado`);
    }
  }

  return {
    effectiveLevel,
    effectiveVariantDays: originalVariantDays,
    hasDestacado,
    hasImpulso,
    originalLevel,
  };
};

export const getEffectiveLevel = async (profile: IProfile, now: Date = new Date()): Promise<number> => {
  const result = await calculateEffectiveLevelAndVariant(profile, now);
  return result.effectiveLevel;
};

/**
 * Calcula el SCORE DE VISIBILIDAD.
 * * CAMBIO CRÍTICO:
 * Se eliminó la penalización por recencia (minutos desde última vista) y se usa Math.floor.
 * Esto asegura que todos los perfiles con las mismas condiciones (Nivel, Plan)
 * tengan EXACTAMENTE el mismo score numérico, permitiendo que la agrupación
 * y el posterior 'shuffle' funcionen correctamente.
 */
export const calculateVisibilityScore = async (profile: IProfile, now: Date = new Date()): Promise<number> => {
  let score = 0;

  const { effectiveLevel, effectiveVariantDays, hasImpulso } = await calculateEffectiveLevelAndVariant(profile, now);

  // Sin plan válido
  if (effectiveLevel === 999) return -1000000000;

  // 1. BASE POR NIVEL (Jerarquía estricta: 1M puntos por nivel)
  // Nivel 1: 5M, Nivel 2: 4M, etc.
  const baseLevelScore = (6 - effectiveLevel) * 1000000;
  score += baseLevelScore;

  // 2. IMPULSO (Prioridad dentro del nivel)
  // Si tiene impulso, le damos un bono masivo para que quede arriba de los normales del mismo nivel.
  // Nota: El ordenamiento fino de impulsos se hace por fecha en 'sortProfilesWithinLevel', 
  // aquí solo aseguramos que el score base sea alto.
  if (hasImpulso) {
    score += 500000;
  }

  // 3. DURACIÓN DEL PLAN (Prioridad secundaria)
  // 30 días > 15 días > 7 días
  const planDurationScore = Math.min(effectiveVariantDays, 249) * 1000;
  score += planDurationScore;

  // 4. OTROS UPGRADES (Bonos pequeños)
  if (profile.upgrades && profile.upgrades.length > 0) {
    // Filtramos upgrades que no sean de visibilidad core
    const miscUpgrades = profile.upgrades.filter(
      u => u.code !== 'DESTACADO' && u.code !== 'IMPULSO' &&
        u.startAt && new Date(u.startAt) <= now && new Date(u.endAt) > now
    );

    for (const u of miscUpgrades) {
      // Aquí podrías buscar el definition si es necesario, o usar un valor fijo
      // score += 10000; 
    }
  }

  // Retornamos ENTERO para garantizar agrupación correcta
  return Math.max(0, Math.floor(score));
};

export const getPriorityScore = async (profile: IProfile, now: Date = new Date()): Promise<number> => {
  return await calculateVisibilityScore(profile, now);
};

/**
 * ORDENAMIENTO DENTRO DE UN NIVEL ESPECÍFICO
 * Aquí ocurre la magia de la rotación vs. fijeza.
 */
export const sortProfilesWithinLevel = async (profiles: IProfile[], now: Date = new Date()): Promise<IProfile[]> => {

  const profilesWithImpulso: Array<{ profile: IProfile, impulsoDate: Date, score: number }> = [];
  const profilesWithoutImpulso: IProfile[] = [];

  // 1. Separación
  for (const profile of profiles) {
    const p = profile as IProfileWithMetadata;
    const score = p.priorityScore || 0;

    // Chequeo robusto de Impulso (ya validado en calculateEffectiveLevel, pero re-verificamos objeto)
    const impulsoUpgrade = profile.upgrades?.find(
      u => u.code === 'IMPULSO' && u.startAt && new Date(u.startAt) <= now && new Date(u.endAt) > now
    );

    // Usamos el flag calculado previamente en el score, o la presencia del upgrade válido
    // Para ser consistentes con la lógica de negocio: Impulso = Fijeza.
    // Asumimos que si llegó aquí con un score alto (calculado antes), es válido.
    if (impulsoUpgrade && impulsoUpgrade.purchaseAt) {
      // Doble check de lógica de negocio (Impulso requiere Destacado o ser Nivel 1)
      // En 'calculateVisibilityScore' ya se filtró si era inválido, así que aquí confiamos
      // o hacemos una verificación rápida.
      profilesWithImpulso.push({
        profile,
        impulsoDate: new Date(impulsoUpgrade.purchaseAt), // Fecha de compra define orden
        score
      });
    } else {
      profilesWithoutImpulso.push(profile);
    }
  }

  // 2. GRUPO VIP (IMPULSO): Ordenamiento Fijo por Fecha (LIFO o FIFO según negocio)
  // "te devolverá a los primeros lugares" -> Generalmente el más reciente va arriba, o antigüedad.
  // Vamos a usar: Más reciente compra = Más arriba (LIFO).
  profilesWithImpulso.sort((a, b) => {
    return b.impulsoDate.getTime() - a.impulsoDate.getTime();
  });

  if (profilesWithImpulso.length > 0) {
    // console.log(`   🚀 VIP (Impulso): ${profilesWithImpulso.length} perfiles ordenados por fecha.`);
  }

  // 3. GRUPO ROTATIVO (SIN IMPULSO): Agrupación por Score + Shuffle
  const profilesByScore: { [score: number]: IProfile[] } = {};

  profilesWithoutImpulso.forEach(profile => {
    const p = profile as IProfileWithMetadata;
    const score = p.priorityScore || 0;
    if (!profilesByScore[score]) profilesByScore[score] = [];
    profilesByScore[score].push(profile);
  });

  // Ordenar los grupos de mayor a menor score
  const sortedScores = Object.keys(profilesByScore).map(Number).sort((a, b) => b - a);

  const profilesRotated: IProfile[] = [];

  for (const score of sortedScores) {
    const group = profilesByScore[score];

    // APLICAR ROTACIÓN (SHUFFLE)
    // Al haber eliminado los decimales del score, este grupo debería contener
    // a todos los perfiles del mismo plan/variante, permitiendo una mezcla real.
    const shuffledGroup = await shuffleArray(group);

    if (shuffledGroup.length > 1) {
      // console.log(`   🔀 Rotando grupo score ${score}: ${shuffledGroup.length} perfiles.`);
    }

    profilesRotated.push(...shuffledGroup);
  }

  // 4. FUSIÓN FINAL: VIPs primero, luego los Rotativos
  return [
    ...profilesWithImpulso.map(x => x.profile),
    ...profilesRotated
  ];
};

/**
 * ORDENAMIENTO GLOBAL (Entry Point)
 */
export const sortProfiles = async (
  profiles: IProfile[],
  now: Date = new Date(),
  context: string = 'GENERAL'
): Promise<IProfile[]> => {
  console.log(`\n🔄 [${context}] Procesando ${profiles.length} perfiles...`);

  // 1. Calcular Metadata (Nivel Efectivo y Score) en Paralelo
  const profilesWithMetadata: IProfileWithMetadata[] = await Promise.all(
    profiles.map(async (profile) => {
      const { effectiveLevel } = await calculateEffectiveLevelAndVariant(profile, now);
      const priorityScore = await calculateVisibilityScore(profile, now);

      return {
        ...profile,
        effectiveLevel,
        priorityScore
      } as unknown as IProfileWithMetadata;
    })
  );

  // 2. Filtrar inválidos
  const validProfiles = profilesWithMetadata.filter(p =>
    p.priorityScore !== undefined && p.effectiveLevel !== undefined && p.effectiveLevel !== 999
  );

  // 3. Agrupar por Nivel Efectivo
  const profilesByLevel: { [level: number]: IProfileWithMetadata[] } = {};
  for (const p of validProfiles) {
    if (!profilesByLevel[p.effectiveLevel!]) profilesByLevel[p.effectiveLevel!] = [];
    profilesByLevel[p.effectiveLevel!].push(p);
  }

  // 4. Ordenar Niveles (1 es mejor que 5)
  const levels = Object.keys(profilesByLevel).map(Number).sort((a, b) => a - b);
  const finalSortedList: IProfile[] = [];

  // 5. Procesar cada nivel
  for (const level of levels) {
    // console.log(`   📊 Nivel ${level}: ${profilesByLevel[level].length} perfiles`);
    const sortedLevel = await sortProfilesWithinLevel(profilesByLevel[level], now);
    finalSortedList.push(...sortedLevel);
  }

  console.log(`✅ [${context}] Ordenamiento finalizado: ${finalSortedList.length} perfiles.\n`);
  return finalSortedList;
};