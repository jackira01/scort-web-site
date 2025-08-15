import type {
  Profile,
  ProfileCardData,
  ProfileMedia,
} from '@/types/profile.types';

/**
 * Transforma un perfil de la API al formato esperado por las cards
 */
export const transformProfileToCard = (profile: Profile): ProfileCardData => {
  // Obtener la primera imagen disponible

  // Verificar si tiene videos
  const checkHasVideo = (media: ProfileMedia): boolean => {
    return (media.videos?.length || 0) > 0;
  };

  return {
    _id: profile._id,
    name: profile.name,
    age: profile.age,
    location: profile.location,
    description: profile.description,
    media: profile.media,
    verification: profile.verification,
    featured: false, // Este campo se puede agregar al backend si es necesario
    online: false, // Este campo se puede agregar al backend si es necesario
    hasVideo: checkHasVideo(profile.media),
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
export const isProfileVerified = (profile: Profile): boolean => {
  return profile.verification?.isVerified || profile.user?.isVerified || false;
};

/**
 * Obtiene la primera imagen de un perfil
 */
export const getProfileImage = (profile: Profile): string => {
  return profile.media?.gallery?.[0] || '/placeholder.svg';
};

/**
 * Verifica si un perfil tiene videos
 */
export const hasProfileVideo = (profile: Profile): boolean => {
  return (profile.media?.videos?.length || 0) > 0;
};
