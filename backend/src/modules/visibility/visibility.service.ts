import { PlanDefinitionModel } from '../plans/plan.model';
import { UpgradeDefinitionModel } from '../plans/upgrade.model';
import type { IProfile } from '../profile/profile.types';

/**
 * Generador de números pseudo-aleatorios con seed
 * Usado para rotación consistente durante un intervalo de tiempo
 * @param seed - Semilla para generar secuencia reproducible
 * @returns Función que genera números entre 0 y 1
 */
function seededRandom(seed: number) {
  let state = seed;
  return () => {
    state = (state * 9301 + 49297) % 233280;
    return state / 233280;
  };
}

/**
 * Calcula el intervalo de rotación actual
 * @returns Seed basado en timestamp redondeado a intervalos definidos
 * 
 * ⚠️ CONFIGURACIÓN DE ROTACIÓN:
 * Para PRODUCCIÓN: usar 15 * 60 * 1000 (15 minutos)
 * Para DEBUG: usar 10 * 1000 (10 segundos)
 */
function getRotationSeed(): number {
  const now = Date.now();
  // 🔧 CAMBIAR AQUÍ EL INTERVALO:
  // PRODUCCIÓN: const rotationInterval = 15 * 60 * 1000; // 15 minutos
  // DEBUG:      const rotationInterval = 10 * 1000;      // 10 segundos
  const rotationInterval = 10 * 1000; // ⚠️ ACTUALMENTE EN MODO DEBUG (10 segundos)

  const seed = Math.floor(now / rotationInterval);
  // console.log(`🔄 [getRotationSeed] Intervalo: ${rotationInterval / 1000}s | Seed actual: ${seed} | Timestamp: ${now}`);
  return seed;
}/**
 * Función auxiliar para mezclar arrays usando Fisher-Yates shuffle con seed
 * Proporciona rotación consistente durante el intervalo definido, luego cambia
 * @param array - Array a mezclar
 * @param seed - Semilla para reproducibilidad (opcional, usa intervalo actual por defecto)
 * @returns Array mezclado de forma consistente para el intervalo
 */
function shuffleArray<T>(array: T[], seed?: number): T[] {
  const shuffled = [...array];
  const usedSeed = seed ?? getRotationSeed();
  const random = seededRandom(usedSeed);

  // console.log(`🎲 [shuffleArray] Mezclando ${array.length} elementos con seed: ${usedSeed}`);

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}/**
 * Interfaz para el resultado del cálculo de nivel y variante efectivos
 */
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
 * 
 * REGLAS:
 * - DESTACADO: Sube 1 nivel por 24 horas, asigna variante de 7 días en el nuevo nivel
 * - IMPULSO: Requiere DESTACADO activo, mejora variante de 7 días a 15 días
 * 
 * @param profile - El perfil a evaluar
 * @param now - Fecha actual para determinar upgrades activos
 * @returns Objeto con nivel y variante efectivos
 */
export const calculateEffectiveLevelAndVariant = async (
  profile: IProfile,
  now: Date = new Date()
): Promise<EffectiveLevelAndVariant> => {
  // Obtener plan original
  const planDefinition = await PlanDefinitionModel.findOne({
    code: profile.planAssignment?.planCode,
  }).lean();

  if (!planDefinition) {
    return {
      effectiveLevel: 999,
      effectiveVariantDays: 0,
      hasDestacado: false,
      hasImpulso: false,
      originalLevel: 999,
      originalVariantDays: 0,
    };
  }

  const originalLevel = planDefinition.level;
  const originalVariantDays = profile.planAssignment?.variantDays || 0;

  let effectiveLevel = originalLevel;
  let effectiveVariantDays = originalVariantDays;
  let hasDestacado = false;
  let hasImpulso = false;

  // Verificar upgrades activos (usando el campo 'upgrades' correcto)
  const activeUpgrades = profile.upgrades?.filter(
    (upgrade) =>
      upgrade.startAt &&
      upgrade.endAt &&
      new Date(upgrade.startAt) <= now &&
      new Date(upgrade.endAt) > now
  ) || [];

  // Buscar upgrade DESTACADO
  const destacadoUpgrade = activeUpgrades.find(
    (u) => u.code === 'DESTACADO'
  );

  if (destacadoUpgrade) {
    hasDestacado = true;

    // DESTACADO: Subir 1 nivel (menor número = mejor nivel)
    effectiveLevel = Math.max(1, effectiveLevel - 1);

    // DESTACADO: Asignar variante de 7 días en el nuevo nivel
    effectiveVariantDays = 7;

    // console.log(`⬆️ [calculateEffectiveLevelAndVariant] ${profile.name} - DESTACADO activo: Nivel ${originalLevel} → ${effectiveLevel}, Variante: ${originalVariantDays} días → 7 días`);
  }

  // Buscar upgrade IMPULSO (solo si tiene DESTACADO activo)
  if (hasDestacado) {
    const impulsoUpgrade = activeUpgrades.find(
      (u) => u.code === 'IMPULSO'
    );

    if (impulsoUpgrade) {
      hasImpulso = true;

      // IMPULSO: Mejorar variante de 7 días a 15 días
      effectiveVariantDays = 15;

      // console.log(`🚀 [calculateEffectiveLevelAndVariant] ${profile.name} - IMPULSO activo: Variante 7 días → 15 días`);
    }
  }

  return {
    effectiveLevel,
    effectiveVariantDays,
    hasDestacado,
    hasImpulso,
    originalLevel,
    originalVariantDays,
  };
};

/**
 * Calcula el nivel efectivo de un perfil considerando su plan y upgrades activos
 * NUEVA VERSIÓN: Usa calculateEffectiveLevelAndVariant para considerar DESTACADO e IMPULSO
 * @param profile - El perfil a evaluar
 * @param now - Fecha actual para determinar upgrades activos
 * @returns Nivel efectivo (1-5)
 */
export const getEffectiveLevel = async (profile: IProfile, now: Date = new Date()): Promise<number> => {
  const result = await calculateEffectiveLevelAndVariant(profile, now);
  return result.effectiveLevel;
};

/**
 * Calcula el score de visibilidad completo para un perfil
 * Considera: Nivel efectivo, Variante efectiva, Upgrades, y Recencia
 * 
 * PESOS:
 * - Nivel efectivo: 1,000,000 por nivel (garantiza jerarquía estricta)
 * - Variante efectiva: 10,000 por durationRank (secundario)
 * - Upgrades activos: 100-200 puntos (terciario)
 * - Otros upgrades: 10-50 puntos (mínimo)
 * - Penalización reciente: -1 a -50 puntos
 * 
 * @param profile - El perfil a evaluar
 * @param now - Fecha actual para determinar upgrades activos
 * @returns Score de visibilidad (mayor = más prioritario)
 */
export const calculateVisibilityScore = async (profile: IProfile, now: Date = new Date()): Promise<number> => {
  let score = 0;

  // 1. Calcular nivel y variante efectivos (considerando DESTACADO e IMPULSO)
  const {
    effectiveLevel,
    effectiveVariantDays,
    hasDestacado,
    hasImpulso,
    originalLevel,
    originalVariantDays
  } = await calculateEffectiveLevelAndVariant(profile, now);

  // 2. NIVEL EFECTIVO (peso: 1,000,000)
  // Nivel 1 = 5,000,000, Nivel 2 = 4,000,000, ..., Nivel 5 = 1,000,000
  // Este peso garantiza que NUNCA un nivel inferior supere a uno superior
  const levelScore = (6 - effectiveLevel) * 1000000;
  score += levelScore;

  // console.log(`📊 [calculateVisibilityScore] ${profile.name} - Nivel efectivo ${effectiveLevel}${effectiveLevel !== originalLevel ? ` (original: ${originalLevel})` : ''}: +${levelScore} puntos`);

  // 3. VARIANTE EFECTIVA (peso: 10,000)
  // Mapeo de días a durationRank: 30 días = 3, 15 días = 2, 7 días = 1
  const variantRankMap: Record<number, number> = {
    180: 6, // AMATISTA
    30: 3,
    15: 2,
    7: 1,
  };

  const durationRank = variantRankMap[effectiveVariantDays] || 1;
  const variantScore = durationRank * 10000;
  score += variantScore;

  // console.log(`📊 [calculateVisibilityScore] ${profile.name} - Variante efectiva ${effectiveVariantDays} días${effectiveVariantDays !== originalVariantDays ? ` (original: ${originalVariantDays})` : ''} (rank ${durationRank}): +${variantScore} puntos`);

  // 4. BONUS POR UPGRADES DESTACADO e IMPULSO (adicional pequeño para diferenciar)
  if (hasDestacado && hasImpulso) {
    score += 200; // Ambos upgrades activos
    // console.log(`📊 [calculateVisibilityScore] ${profile.name} - DESTACADO + IMPULSO: +200 puntos`);
  } else if (hasDestacado) {
    score += 100; // Solo destacado
    // console.log(`📊 [calculateVisibilityScore] ${profile.name} - DESTACADO: +100 puntos`);
  }

  // 5. OTROS UPGRADES (peso: 10-50)
  if (profile.upgrades && profile.upgrades.length > 0) {
    const otherActiveUpgrades = profile.upgrades.filter(
      (upgrade) =>
        upgrade.code !== 'DESTACADO' &&
        upgrade.code !== 'IMPULSO' &&
        upgrade.startAt &&
        upgrade.endAt &&
        new Date(upgrade.startAt) <= now &&
        new Date(upgrade.endAt) > now
    );

    for (const upgrade of otherActiveUpgrades) {
      const upgradeDefinition = await UpgradeDefinitionModel.findOne({
        code: upgrade.code,
      }).lean();

      if (upgradeDefinition?.effect?.priorityBonus) {
        const upgradeScore = upgradeDefinition.effect.priorityBonus * 10;
        score += upgradeScore;
        // console.log(`📊 [calculateVisibilityScore] ${profile.name} - Upgrade ${upgrade.code}: +${upgradeScore} puntos`);
      }
    }
  }

  // 6. PENALIZACIÓN POR VISUALIZACIONES RECIENTES (peso: -1 a -50)
  if (profile.lastShownAt) {
    const hoursSinceLastShown =
      (now.getTime() - new Date(profile.lastShownAt).getTime()) / (1000 * 60 * 60);

    // Penalización que disminuye con el tiempo
    // 0 horas = -50, 25 horas = -1, 50+ horas = 0
    const recencyPenalty = Math.max(-50, -50 + hoursSinceLastShown * 2);
    score += recencyPenalty;

    // console.log(`📊 [calculateVisibilityScore] ${profile.name} - Última vez hace ${hoursSinceLastShown.toFixed(2)}h: ${recencyPenalty.toFixed(2)} puntos`);
  }

  // console.log(`✅ [calculateVisibilityScore] ${profile.name} - Score total: ${score}`);

  return Math.max(0, score); // Nunca negativo
};

/**
 * Calcula el score de prioridad para ordenamiento dentro del nivel
 * DEPRECATED: Usar calculateVisibilityScore en su lugar
 * Mantenida por compatibilidad con código existente
 * @param profile - El perfil a evaluar
 * @param now - Fecha actual para determinar upgrades activos
 * @returns Score de prioridad (mayor = más prioritario)
 */
export const getPriorityScore = async (profile: IProfile, now: Date = new Date()): Promise<number> => {
  // Redirigir a la nueva función
  return await calculateVisibilityScore(profile, now);
};

/**
 * Ordena una lista de perfiles dentro del mismo nivel
 * Agrupa por score exacto y aplica rotación aleatoria dentro de cada grupo
 * @param profiles - Lista de perfiles con metadata (effectiveLevel, priorityScore)
 * @returns Lista ordenada por prioridad con rotación aleatoria
 */
export const sortProfilesWithinLevel = (profiles: IProfile[]): IProfile[] => {
  // Agrupar perfiles por score exacto
  const profilesByScore: { [score: number]: IProfile[] } = {};

  profiles.forEach(profile => {
    const score = (profile as any).priorityScore || 0;
    if (!profilesByScore[score]) {
      profilesByScore[score] = [];
    }
    profilesByScore[score].push(profile);
  });

  // console.log(`🔢 [sortProfilesWithinLevel] Grupos por score:`, 
  //   Object.keys(profilesByScore).map(score => ({
  //     score: Number(score),
  //     count: profilesByScore[Number(score)].length,
  //     profiles: profilesByScore[Number(score)].map(p => p.name)
  //   }))
  // );  // Ordenar scores de mayor a menor (DESC)
  const sortedScores = Object.keys(profilesByScore)
    .map(Number)
    .sort((a, b) => b - a);

  // Para cada grupo de score, aplicar rotación aleatoria y luego ordenar por lastShownAt
  const result: IProfile[] = [];

  sortedScores.forEach(score => {
    const groupProfiles = profilesByScore[score];

    // Aplicar rotación aleatoria dentro del grupo (Fisher-Yates)
    const shuffledGroup = shuffleArray(groupProfiles);

    console.log(`🔀 [sortProfilesWithinLevel] Grupo score ${score} mezclado: ${shuffledGroup.map(p => p.name).join(', ')}`);

    // Ordenar el grupo mezclado por lastShownAt (dar oportunidad a los menos mostrados)
    const sortedGroup = shuffledGroup.sort((a, b) => {
      const lastShownA = a.lastShownAt?.getTime() || 0;
      const lastShownB = b.lastShownAt?.getTime() || 0;

      if (lastShownA !== lastShownB) {
        return lastShownA - lastShownB; // ASC - menos mostrados primero
      }

      // Empate final: mantener orden aleatorio del shuffle
      return 0;
    });

    result.push(...sortedGroup);
  });

  return result;
};

/**
 * Función principal para ordenar perfiles de forma determinista con rotación
 * Considera upgrades DESTACADO e IMPULSO para calcular nivel y variante efectivos
 * @param profiles - Lista de perfiles a ordenar
 * @param now - Fecha actual (opcional)
 * @returns Lista de perfiles ordenados por nivel efectivo y prioridad
 */
export const sortProfiles = async (profiles: IProfile[], now: Date = new Date()): Promise<IProfile[]> => {
  // console.log(`🎯 [sortProfiles] Iniciando ordenamiento de ${profiles.length} perfiles`);

  // Calcular nivel efectivo y score de visibilidad para cada perfil
  const profilesWithMetadata = await Promise.all(
    profiles.map(async (profile) => {
      const effectiveLevel = await getEffectiveLevel(profile, now);
      const priorityScore = await calculateVisibilityScore(profile, now);

      return {
        ...profile,
        effectiveLevel,
        priorityScore
      };
    })
  );

  // Agrupar por nivel efectivo
  const profilesByLevel: { [level: number]: any[] } = {};
  for (const profile of profilesWithMetadata) {
    if (!profilesByLevel[profile.effectiveLevel]) {
      profilesByLevel[profile.effectiveLevel] = [];
    }
    profilesByLevel[profile.effectiveLevel].push(profile);
  }

  // console.log(`📊 [sortProfiles] Distribución por nivel:`, 
  //   Object.keys(profilesByLevel).map(level => ({
  //     level: Number(level),
  //     count: profilesByLevel[Number(level)].length,
  //     profiles: profilesByLevel[Number(level)].map((p: any) => `${p.name} (score: ${p.priorityScore})`)
  //   }))
  // );

  // Ordenar dentro de cada nivel con rotación aleatoria y concatenar
  const sortedProfiles: IProfile[] = [];
  for (let level = 1; level <= 5; level++) {
    if (profilesByLevel[level]) {
      // console.log(`🔄 [sortProfiles] Procesando nivel ${level} (${profilesByLevel[level].length} perfiles)`);
      const sortedLevelProfiles = sortProfilesWithinLevel(profilesByLevel[level]);
      sortedProfiles.push(...sortedLevelProfiles);
    }
  }

  // console.log(`✅ [sortProfiles] Orden final:`, sortedProfiles.map((p, i) => `${i + 1}. ${p.name}`));

  return sortedProfiles;
};