import { Step } from '../create-profile/types';

// Steps para edición de perfil (sin selección de plan)
export const editSteps: Step[] = [
  { id: 1, title: 'Lo esencial', description: 'Información básica del perfil' },
  { id: 2, title: 'Descripción', description: 'Descripción y físico' },
  {
    id: 3,
    title: 'Detalles',
    description: 'Contacto y tarifas',
  },
  { id: 4, title: 'Multimedia', description: 'Fotos, videos y audios' },
];

// Re-exportar otros datos necesarios del módulo de creación
export { bodyTypeOptions, /* sexualityOptions, */ eyeColorOptions, genderOptions, hairColorOptions, services, skinColorOptions, upgradeOptions, workTypeOptions } from '../create-profile/data';
