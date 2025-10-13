import { Step, UpgradeOption } from '../create-profile/types';

// Steps para edición de perfil (sin selección de plan)
export const editSteps: Step[] = [
  { id: 1, title: 'Lo esencial', description: 'Información básica del perfil' },
  { id: 2, title: 'Descripción', description: 'Descripción y servicios' },
  {
    id: 3,
    title: 'Detalles',
    description: 'Características físicas y contacto',
  },
  { id: 4, title: 'Multimedia', description: 'Fotos, videos y audios' },
];

// Re-exportar otros datos necesarios del módulo de creación
export { services, upgradeOptions, genderOptions, workTypeOptions, skinColorOptions, /* sexualityOptions, */ eyeColorOptions, hairColorOptions, bodyTypeOptions } from '../create-profile/data';