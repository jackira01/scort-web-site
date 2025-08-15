/**
 * Convierte un texto en un slug amigable para URLs
 * @param text - El texto a convertir
 * @returns El slug generado
 */
export const createSlug = (text: string): string => {
  return text
    .toLowerCase()
    .normalize('NFD') // Descompone caracteres acentuados
    .replace(/[\u0300-\u036f]/g, '') // Elimina diacríticos
    .replace(/[^a-z0-9\s-]/g, '') // Elimina caracteres especiales
    .replace(/\s+/g, '-') // Reemplaza espacios con guiones
    .replace(/-+/g, '-') // Elimina guiones duplicados
    .trim()
    .replace(/^-+|-+$/g, ''); // Elimina guiones al inicio y final
};

/**
 * Convierte un slug de vuelta a texto legible
 * @param slug - El slug a convertir
 * @returns El texto original aproximado
 */
export const slugToText = (slug: string): string => {
  return slug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

/**
 * Valida si un string es un slug válido
 * @param slug - El slug a validar
 * @returns true si es válido, false si no
 */
export const isValidSlug = (slug: string): boolean => {
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugRegex.test(slug);
};