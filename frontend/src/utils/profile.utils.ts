import type {
  ProfileCardData,
} from '@/types/profile.types';
import type { Profile } from '@/types/user.types';

/**
 * Transforma un perfil de la API al formato esperado por las cards
 */
export const transformProfileToCard = (profile: Profile): ProfileCardData => {
  // Obtener la primera imagen disponible

  // Verificar si tiene videos - usando la estructura actual de Profile
  const checkHasVideo = (media: { gallery: string[]; videos: { link: string; preview: string; }[]; profilePicture: string; }): boolean => {
    return (media.videos?.length || 0) > 0;
  };

  return {
    _id: profile._id,
    name: profile.name,
    age: parseInt(profile.age) || 0, // Convertir string a number
    location: profile.location,
    description: profile.description || '',
    media: {
      gallery: profile.media.gallery || [],
      videos: profile.media.videos?.map(v => ({ link: v.link, type: 'video' as const })) || [],
      audios: [],
      stories: []
    },
    verification: {
      _id: '',
      isVerified: false,
      verificationStatus: 'pending' as const
    },
    featured: false, // Este campo se puede agregar al backend si es necesario
    online: false, // Este campo se puede agregar al backend si es necesario
    hasVideo: checkHasVideo(profile.media),
    hasDestacadoUpgrade: profile.hasDestacadoUpgrade, // Agregar la verificación de upgrade destacado
  };
};

/**
 * Transforma una lista de perfiles de la API al formato esperado por las cards
 */
export const transformProfilesToCards = (
  profiles: Profile[],
): ProfileCardData[] => {
  if (!profiles || !Array.isArray(profiles)) {
    return [];
  }
  return profiles.map(transformProfileToCard);
};

/**
 * Formatea la ubicación para mostrar en las cards
 */
export const formatLocation = (location: {
  department: { value: string; label: string } | string;
  city: { value: string; label: string } | string;
}): string => {
  const departmentLabel = typeof location.department === 'object' ? location.department.label : location.department;
  const cityLabel = typeof location.city === 'object' ? location.city.label : location.city;
  return `${cityLabel}, ${departmentLabel}`;
};

/**
 * Verifica si un perfil está verificado
 */
export const isProfileVerified = (): boolean => {
  // La interfaz Profile actual no tiene verification ni user.isVerified
  // Por ahora retornamos false hasta que se defina la estructura correcta
  return false;
};

/**
 * Obtiene la primera imagen de un perfil
 */
export const getProfileImage = (profile: Profile): string => {
  return profile.media?.profilePicture || profile.media?.gallery?.[0] || '/placeholder.svg';
};

/**
 * Verifica si un perfil tiene videos
 */
export const hasProfileVideo = (profile: Profile): boolean => {
  return (profile.media?.videos?.length || 0) > 0;
};

/**
 * Verifica si un perfil tiene el upgrade "DESTACADO" activo
 */
export const hasDestacadoUpgrade = (profile: Profile): boolean => {
  // Verificar si el perfil tiene upgrades activos
  if (!profile.activeUpgrades || !Array.isArray(profile.activeUpgrades)) {
    return false;
  }

  // Verificar si 'DESTACADO' está en los upgrades activos
  return profile.activeUpgrades.some((upgrade: { code: string; startAt: Date; endAt: Date }) => upgrade.code === 'DESTACADO');
};

/**
 * Verifica si un perfil tiene el upgrade "IMPULSO" activo
 */
export const hasImpulsoUpgrade = (profile: Profile): boolean => {
  // Verificar si el perfil tiene upgrades activos
  if (!profile.activeUpgrades || !Array.isArray(profile.activeUpgrades)) {
    return false;
  }

  // Verificar si 'IMPULSO' está en los upgrades activos
  return profile.activeUpgrades.some((upgrade: { code: string; startAt: Date; endAt: Date }) => upgrade.code === 'IMPULSO');
};
