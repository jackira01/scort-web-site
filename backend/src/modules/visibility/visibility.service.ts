import { PlanDefinitionModel } from '../plans/plan.model';
import { UpgradeDefinitionModel } from '../plans/upgrade.model';
import type { IProfile } from '../profile/profile.types';
import { ConfigParameterService } from '../config-parameter/config-parameter.service';

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
 * Calcula el intervalo de rotación actual basado en la configuración dinámica
 * @returns Seed basado en timestamp redondeado a intervalos configurados
 */
async function getRotationSeed(): Promise<number> {
  const now = Date.now();

  // Obtener intervalo desde config-parameters (valor en minutos)
  const intervalMinutes = await ConfigParameterService.getValue('profile.rotation.interval.minutes') as number;

  // Si no se encuentra o es inválido, usar 15 minutos por defecto
  const minutes = (intervalMinutes && intervalMinutes > 0) ? intervalMinutes : 15;
  const rotationInterval = minutes * 60 * 1000; // Convertir a milisegundos

  const seed = Math.floor(now / rotationInterval);
  return seed;
}

/**
 * Función auxiliar para mezclar arrays usando Fisher-Yates shuffle con seed
 * Proporciona rotación consistente durante el intervalo definido, luego cambia
 * @param array - Array a mezclar
 * @param seed - Semilla para reproducibilidad (opcional, usa intervalo actual por defecto)
 * @returns Array mezclado de forma consistente para el intervalo
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
  // Si el planAssignment ya tiene el plan populado (planId es un objeto), usarlo directamente
  let planDefinition;

  if (profile.planAssignment?.planId && typeof profile.planAssignment.planId === 'object') {
    // El plan ya está populado
    planDefinition = profile.planAssignment.planId;
  } else {
    // Buscar el plan por código
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
    // DESTACADO: Sube 1 nivel temporalmente (excepto si ya está en nivel 1)
    if (effectiveLevel > 1) {
      effectiveLevel = effectiveLevel - 1;
      console.log(`🌟 [DESTACADO] Perfil ${profile._id} sube de nivel ${originalLevel} → ${effectiveLevel}`);
    } else {
      console.log(`🌟 [DESTACADO] Perfil ${profile._id} ya está en nivel 1, no puede subir más`);
    }
  }

  // Buscar upgrade IMPULSO (solo funciona si tiene DESTACADO)
  const impulsoUpgrade = activeUpgrades.find(
    (u) => u.code === 'IMPULSO'
  );

  if (impulsoUpgrade && hasDestacado) {
    hasImpulso = true;
    console.log(`⚡ [IMPULSO] Perfil ${profile._id} tiene IMPULSO activo (reposiciona al inicio)`);
  } else if (impulsoUpgrade && !hasDestacado) {
    console.log(`⚠️ [IMPULSO] Perfil ${profile._id} tiene IMPULSO pero NO tiene DESTACADO - se ignora`);
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

  // 2. NIVEL BASE
  if (effectiveLevel === 999) {
    score = -1000000000;
    console.log(`❌ [SCORE] Perfil ${profile._id} sin plan válido - Score: ${score}`);
    return score;
  }

  // ESTRATEGIA MEJORADA CON 4 SUBCATEGORÍAS:
  // Cada nivel tiene 1,000,000 de rango dividido en:
  // 1. Nativos con IMPULSO: 750,000 - 999,999 (MÁXIMA PRIORIDAD)
  // 2. Nativos sin upgrades o solo DESTACADO: 500,000 - 749,999
  // 3. Destacados (subidos) con IMPULSO: 250,000 - 499,999
  // 4. Destacados (subidos) sin IMPULSO: 0 - 249,999

  const baseLevelScore = (6 - effectiveLevel) * 1000000;
  const isNative = (originalLevel === effectiveLevel);

  if (isNative && hasImpulso) {
    // SUBCATEGORÍA 1: NATIVOS CON IMPULSO - Máxima prioridad
    score = baseLevelScore + 750000;
    console.log(`⚡📊 [SCORE] Perfil ${profile._id} NATIVO nivel ${effectiveLevel} con IMPULSO - Base: ${score} (MÁXIMA PRIORIDAD)`);
  } else if (isNative) {
    // SUBCATEGORÍA 2: NATIVOS sin upgrades o solo con DESTACADO
    score = baseLevelScore + 500000;
    console.log(`📊 [SCORE] Perfil ${profile._id} NATIVO nivel ${effectiveLevel} - Base: ${score}`);
  } else if (hasDestacado && hasImpulso) {
    // SUBCATEGORÍA 3: DESTACADO + IMPULSO (subidos de nivel inferior)
    score = baseLevelScore + 250000;
    console.log(`🌟⚡ [SCORE] Perfil ${profile._id} DESTACADO+IMPULSO (de nivel ${originalLevel} → ${effectiveLevel}) - Base: ${score}`);
  } else if (hasDestacado) {
    // SUBCATEGORÍA 4: DESTACADO SOLO (subidos de nivel inferior)
    score = baseLevelScore;
    console.log(`🌟 [SCORE] Perfil ${profile._id} DESTACADO solo (de nivel ${originalLevel} → ${effectiveLevel}) - Base: ${score}`);
  } else {
    // Caso fallback (no debería ocurrir)
    score = baseLevelScore + 500000;
    console.log(`⚠️ [SCORE] Perfil ${profile._id} caso inesperado - Base: ${score}`);
  }

  // 3. DURACIÓN DEL PLAN (peso: hasta 249,999)
  // Mantiene separación entre subcategorías
  const planDurationScore = Math.min(effectiveVariantDays, 249) * 1000;
  score += planDurationScore;
  console.log(`📊 [SCORE] Perfil ${profile._id} - Días plan: ${effectiveVariantDays} - Duration Score: ${planDurationScore}`);

  // 6. OTROS UPGRADES (peso: 10,000-50,000)
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
        const upgradeScore = upgradeDefinition.effect.priorityBonus * 10000;
        score += upgradeScore;
      }
    }
  }

  // 7. PENALIZACIÓN POR VISUALIZACIONES RECIENTES (peso: -1,000 a -10,000)
  // Penalización más significativa para dar oportunidad a perfiles menos mostrados
  if (profile.lastShownAt) {
    const hoursSinceLastShown =
      (now.getTime() - new Date(profile.lastShownAt).getTime()) / (1000 * 60 * 60);

    // Penalización que disminuye con el tiempo
    // 0 horas = -10,000, 10 horas = -1,000, 20+ horas = 0
    const recencyPenalty = Math.max(-10000, -10000 + hoursSinceLastShown * 500);
    score += recencyPenalty;
  }

  console.log(`🎯 [SCORE FINAL] Perfil ${profile._id} - Score total: ${score} (Nivel: ${effectiveLevel}, Original: ${originalLevel}, Destacado: ${hasDestacado}, Impulso: ${hasImpulso})`);

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
export const sortProfilesWithinLevel = async (profiles: IProfile[]): Promise<IProfile[]> => {
  // Agrupar perfiles por score exacto
  const profilesByScore: { [score: number]: IProfile[] } = {};

  profiles.forEach(profile => {
    const score = (profile as any).priorityScore || 0;
    if (!profilesByScore[score]) {
      profilesByScore[score] = [];
    }
    profilesByScore[score].push(profile);
  });

  // Ordenar scores de mayor a menor (DESC) - mayor score = mayor prioridad = aparece primero
  const sortedScores = Object.keys(profilesByScore)
    .map(Number)
    .sort((a, b) => b - a);

  console.log(`   📊 Scores encontrados (ordenados DESC): ${sortedScores.join(', ')}`);

  // Para cada grupo de score, aplicar rotación aleatoria y luego ordenar por lastShownAt
  const result: IProfile[] = [];

  for (const score of sortedScores) {
    const groupProfiles = profilesByScore[score];

    // Aplicar rotación aleatoria dentro del grupo (Fisher-Yates)
    const shuffledGroup = await shuffleArray(groupProfiles);

    // Ordenar el grupo mezclado por lastShownAt (dar oportunidad a los menos mostrados)
    const sortedGroup = shuffledGroup.sort((a, b) => {
      const lastShownA = a.lastShownAt?.getTime() || 0;
      const lastShownB = b.lastShownAt?.getTime() || 0;

      if (lastShownA !== lastShownB) {
        return lastShownA - lastShownB; // ASC - menos mostrados primero
      }

      // Empate final: ordenar por _id para garantizar consistencia en paginación
      const idA = a._id?.toString() || '';
      const idB = b._id?.toString() || '';
      return idA.localeCompare(idB);
    });

    result.push(...sortedGroup);
  }

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
  console.log(`\n🔄 ========== INICIANDO ORDENAMIENTO DE ${profiles.length} PERFILES ==========`);

  // Calcular nivel efectivo y score de visibilidad para cada perfil
  const profilesWithMetadata = await Promise.all(
    profiles.map(async (profile) => {
      const { effectiveLevel, hasDestacado, hasImpulso, originalLevel } = await calculateEffectiveLevelAndVariant(profile, now);
      const priorityScore = await calculateVisibilityScore(profile, now);

      console.log(`📋 Perfil ${profile._id} (${profile.name || 'Sin nombre'})`);
      console.log(`   - Nivel original: ${originalLevel}, Nivel efectivo: ${effectiveLevel}`);
      console.log(`   - Destacado: ${hasDestacado ? '✅' : '❌'}, Impulso: ${hasImpulso ? '✅' : '❌'}`);
      console.log(`   - Score final: ${priorityScore}`);

      return {
        ...profile,
        effectiveLevel,
        priorityScore
      };
    })
  );

  // Filtrar perfiles con niveles inválidos (undefined o NaN)
  // Esto captura perfiles sin planAssignment válido que no deberían estar en resultados públicos
  const validProfiles = profilesWithMetadata.filter(profile => {
    const isValid = typeof profile.effectiveLevel === 'number' &&
      !isNaN(profile.effectiveLevel) &&
      typeof profile.priorityScore === 'number' &&
      !isNaN(profile.priorityScore);
    return isValid;
  });

  // Agrupar por nivel efectivo
  const profilesByLevel: { [level: number]: any[] } = {};
  for (const profile of validProfiles) {
    if (!profilesByLevel[profile.effectiveLevel]) {
      profilesByLevel[profile.effectiveLevel] = [];
    }
    profilesByLevel[profile.effectiveLevel].push(profile);
  }

  const levelsFound = Object.keys(profilesByLevel).map(Number).sort((a, b) => a - b);

  // Ordenar dentro de cada nivel con rotación aleatoria y concatenar
  const sortedProfiles: IProfile[] = [];

  // Iterar sobre TODOS los niveles encontrados, no solo 1-5
  for (const level of levelsFound) {
    console.log(`\n📊 Ordenando nivel ${level} - ${profilesByLevel[level].length} perfiles`);
    const sortedLevelProfiles = await sortProfilesWithinLevel(profilesByLevel[level]);

    sortedLevelProfiles.forEach((p, idx) => {
      console.log(`   ${idx + 1}. Perfil ${p._id} - Score: ${(p as any).priorityScore}`);
    });

    sortedProfiles.push(...sortedLevelProfiles);
  }

  console.log(`\n✅ ========== ORDENAMIENTO COMPLETADO - ${sortedProfiles.length} PERFILES ==========\n`);

  return sortedProfiles;
};