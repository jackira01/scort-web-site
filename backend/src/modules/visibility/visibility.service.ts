import { PlanDefinitionModel } from '../plans/plan.model';
import { UpgradeDefinitionModel } from '../plans/upgrade.model';
import type { IProfile } from '../profile/profile.types';

/**
 * Calcula el nivel efectivo de un perfil considerando su plan y upgrades activos
 * @param profile - El perfil a evaluar
 * @param now - Fecha actual para determinar upgrades activos
 * @returns Nivel efectivo (1-5)
 */
export const getEffectiveLevel = async (profile: IProfile, now: Date = new Date()): Promise<number> => {
  // Si no tiene plan asignado, nivel por defecto es 5 (AMATISTA)
  if (!profile.planAssignment || !profile.planAssignment.planCode) {
    return 5;
  }

  // Obtener el plan base
  const plan = await PlanDefinitionModel.findOne({ code: profile.planAssignment.planCode });
  if (!plan) {
    return 5; // Fallback si no se encuentra el plan
  }

  let effectiveLevel = plan.level;

  // Aplicar upgrades activos
  if (profile.upgrades && profile.upgrades.length > 0) {
    const activeUpgrades = profile.upgrades.filter(upgrade => 
      upgrade.startAt <= now && upgrade.endAt > now
    );

    for (const upgrade of activeUpgrades) {
      const upgradeDefinition = await UpgradeDefinitionModel.findOne({ code: upgrade.code });
      if (!upgradeDefinition || !upgradeDefinition.effect) continue;

      // Aplicar setLevelTo primero (tiene prioridad)
      if (upgradeDefinition.effect.setLevelTo !== undefined) {
        effectiveLevel = upgradeDefinition.effect.setLevelTo;
      }
      // Luego aplicar levelDelta
      else if (upgradeDefinition.effect.levelDelta !== undefined) {
        effectiveLevel += upgradeDefinition.effect.levelDelta;
      }
    }
  }

  // Asegurar que el nivel esté en el rango válido (1-5)
  return Math.max(1, Math.min(5, effectiveLevel));
};

/**
 * Calcula el score de prioridad para ordenamiento dentro del nivel
 * @param profile - El perfil a evaluar
 * @param now - Fecha actual para determinar upgrades activos
 * @returns Score de prioridad (mayor = más prioritario)
 */
export const getPriorityScore = async (profile: IProfile, now: Date = new Date()): Promise<number> => {
  let score = 0;

  // Base: durationRank del plan
  if (profile.planAssignment && profile.planAssignment.planCode) {
    const plan = await PlanDefinitionModel.findOne({ code: profile.planAssignment.planCode });
    if (plan) {
      const variant = plan.variants.find(v => v.days === profile.planAssignment!.variantDays);
      if (variant) {
        score += variant.durationRank;
      }
    }
  }

  // Upgrades activos: priorityBonus
  let hasBackPositionRule = false;
  if (profile.upgrades && profile.upgrades.length > 0) {
    const activeUpgrades = profile.upgrades.filter(upgrade => 
      upgrade.startAt <= now && upgrade.endAt > now
    );

    for (const upgrade of activeUpgrades) {
      const upgradeDefinition = await UpgradeDefinitionModel.findOne({ code: upgrade.code });
      if (!upgradeDefinition || !upgradeDefinition.effect) continue;

      // Sumar priorityBonus
      if (upgradeDefinition.effect.priorityBonus !== undefined) {
        score += upgradeDefinition.effect.priorityBonus;
      }

      // Detectar si tiene positionRule BACK
      if (upgradeDefinition.effect.positionRule === 'BACK') {
        hasBackPositionRule = true;
      }
    }
  }

  // Regla "nuevo plan al inicio": recencyScore por planAssignment.startAt
  if (profile.planAssignment && profile.planAssignment.startAt) {
    const daysSinceStart = (now.getTime() - profile.planAssignment.startAt.getTime()) / (1000 * 60 * 60 * 24);
    // Bonus decreciente: más reciente = mayor bonus (máximo 100 puntos en el primer día)
    const recencyScore = Math.max(0, 100 - daysSinceStart);
    score += recencyScore;
  }

  // Regla "IMPULSO al final": penalización suave para positionRule BACK
  if (hasBackPositionRule) {
    score -= 1000; // Penalización significativa para que quede al final del nivel
  }

  return score;
};

/**
 * Ordena una lista de perfiles dentro del mismo nivel
 * @param profiles - Lista de perfiles a ordenar
 * @returns Lista ordenada por prioridad
 */
export const sortProfilesWithinLevel = (profiles: IProfile[]): IProfile[] => {
  return profiles.sort((a, b) => {
    // Primero por score DESC (asumiendo que ya se calculó)
    const scoreA = (a as any).priorityScore || 0;
    const scoreB = (b as any).priorityScore || 0;
    
    if (scoreA !== scoreB) {
      return scoreB - scoreA; // DESC
    }

    // Empate: por lastShownAt ASC (null va al final)
    const lastShownA = a.lastShownAt?.getTime() || 0;
    const lastShownB = b.lastShownAt?.getTime() || 0;
    
    if (lastShownA !== lastShownB) {
      return lastShownA - lastShownB; // ASC
    }

    // Último criterio: createdAt ASC (usando _id como fallback para createdAt)
    const createdA = (a as any).createdAt?.getTime() || (a._id as any).getTimestamp?.() || 0;
    const createdB = (b as any).createdAt?.getTime() || (b._id as any).getTimestamp?.() || 0;
    
    return createdA - createdB; // ASC
  });
};

/**
 * Función principal para ordenar perfiles de forma determinista
 * @param profiles - Lista de perfiles a ordenar
 * @param now - Fecha actual (opcional)
 * @returns Lista de perfiles ordenados por nivel y prioridad
 */
export const sortProfiles = async (profiles: IProfile[], now: Date = new Date()): Promise<IProfile[]> => {
  // Calcular nivel efectivo y score para cada perfil
  const profilesWithMetadata = await Promise.all(
    profiles.map(async (profile) => {
      const effectiveLevel = await getEffectiveLevel(profile, now);
      const priorityScore = await getPriorityScore(profile, now);
      
      return {
        ...profile,
        effectiveLevel,
        priorityScore
      };
    })
  );

  // Agrupar por nivel
  const profilesByLevel: { [level: number]: any[] } = {};
  for (const profile of profilesWithMetadata) {
    if (!profilesByLevel[profile.effectiveLevel]) {
      profilesByLevel[profile.effectiveLevel] = [];
    }
    profilesByLevel[profile.effectiveLevel].push(profile);
  }

  // Ordenar dentro de cada nivel y concatenar
  const sortedProfiles: IProfile[] = [];
  for (let level = 1; level <= 5; level++) {
    if (profilesByLevel[level]) {
      const sortedLevelProfiles = sortProfilesWithinLevel(profilesByLevel[level]);
      sortedProfiles.push(...sortedLevelProfiles);
    }
  }

  return sortedProfiles;
};