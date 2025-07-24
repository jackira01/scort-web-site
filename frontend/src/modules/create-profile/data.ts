import { Step, UpgradeOption } from './types';

export const steps: Step[] = [
  { id: 1, title: 'Lo esencial', description: 'Información básica del perfil' },
  { id: 2, title: 'Descripción', description: 'Descripción y servicios' },
  {
    id: 3,
    title: 'Detalles',
    description: 'Características físicas y contacto',
  },
  { id: 4, title: 'Multimedia', description: 'Fotos, videos y audios' },
  { id: 5, title: 'Finalizar', description: 'Revisión y publicación' },
];

export const services = [
  'Atención Hombres',
  'Atención Mujeres',
  'Atención Parejas',
  'Atención Discapacitados',
  'Trato de novios',
  'Besos en la boca',
  'Beso francés',
  'Hablar sucio',
  'Fetiches',
  'Juguetes',
  'Juegos de Rol',
  'Disfraces',
  'Squirt',
  'Dejarte Lamer mis pies',
  'Besar tus pies',
  'Masajes',
  'Masajes relajantes',
  'Masaje Terapeutico',
  'Masaje cuerpo a cuerpo',
  'Masaje Tailandés',
  'Masaje Tántrico',
  'Masaje Prostático',
  'Masaje Final Feliz',
  'Videollamada erotica',
  'Videollamada con rostro',
  'Strip tease',
  'Sexting',
  'Venta audios',
  'Venta videos',
  'Venta Lencería',
  'Pack Fotos',
  'Videos Personalizados',
  'Valorar tu pene',
];

export const upgradeOptions: UpgradeOption[] = [
  {
    id: 'presentado',
    title: 'Presentado',
    price: 250000,
    emoji: '😊',
    description:
      'Los anuncios destacados se destacan en los resultados de búsqueda y se muestran 10 veces más que los anuncios estándar.',
  },
  {
    id: 'patrocinado',
    title: 'Patrocinado',
    price: 350000,
    emoji: '😎',
    description:
      'Los anuncios patrocinados se muestran en rotación en la parte superior de la página de resultados de búsqueda.',
  },
  {
    id: 'pagina-principal',
    title: 'Página principal',
    price: 450000,
    emoji: '🤩',
    description:
      'Haga que su anuncio aparezca en nuestra página de inicio y sea visto por miles de personas.',
  },
];

export const genderOptions = ['Mujer', 'Hombre', 'Trans'];
export const workTypeOptions = ['Yo mismo (independiente)', 'Agencia'];
export const skinColorOptions = ['Blanca', 'Trigueña', 'Morena', 'Negra'];
export const sexualityOptions = ['Straight', 'Gay', 'Lesbian', 'Bisexual', 'Other'];
export const eyeColorOptions = ['Negros', 'Café', 'Avellana', 'Verdes', 'Azul'];
export const hairColorOptions = [
  'Negro',
  'Castaño Claro',
  'Castaño Oscuro',
  'Rubio',
  'Pelirrojo',
  'Canoso',
];
export const bodyTypeOptions = [
  'Curvy',
  'Delgado',
  'Atlético',
  'Promedio',
  'Voluptuoso',
  'Rellenito/a',
  'Gordibuen@/a',
];
