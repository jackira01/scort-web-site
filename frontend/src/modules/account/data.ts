import { Receipt, Settings, User, Tags } from 'lucide-react';

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
    label: 'Grupos de Atributos',
    icon: Tags,
    description: 'Gestiona grupos de atributos y categorías del sistema',
  },
];
