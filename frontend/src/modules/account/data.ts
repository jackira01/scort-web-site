import { Receipt, Settings, User, Tags, Newspaper, Ticket } from 'lucide-react';

export const sidebarItems = [
  {
    id: 'perfiles',
    label: 'Mis Perfiles',
    icon: User,
    description: 'Administra y visualiza todos tus perfiles activos.',
  },
  {
    id: 'pagos',
    label: 'Historial de Pagos',
    icon: Receipt,
    description: 'Revisa tu historial completo de transacciones y pagos.',
  },
  {
    id: 'grupos-atributos',
    label: 'Configuración',
    icon: Tags,
    description: 'Gestiona la configuración de tu cuenta, datos personales y preferencias del perfil',
  },
  {
    id: 'tablero-noticias',
    label: 'Tablero de Noticias',
    icon: Newspaper,
    description: 'Consulta las últimas actualizaciones y cambios del sistema',
  },
  // Sección de cupones temporalmente deshabilitada
  // {
  //   id: 'cupones',
  //   label: 'Cupones y Descuentos',
  //   icon: Ticket,
  //   description: 'Ingresa códigos de cupón para obtener descuentos en tus compras',
  // },
];
