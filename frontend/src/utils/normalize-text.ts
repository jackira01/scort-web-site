// Función para normalizar texto (quitar tildes y caracteres especiales)
export const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quitar tildes
    .replace(/ñ/g, 'n')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, ''); // Quitar otros caracteres especiales
};

// Función para normalizar texto simple (solo quitar tildes y convertir a minúsculas)
export const normalizeSimpleText = (text: string): string => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // Quitar tildes
};