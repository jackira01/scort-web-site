import { Receipt, Settings, User } from 'lucide-react';

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
    id: 'ajustes',
    label: 'Ajustes',
    icon: Settings,
    description: 'Configura tu cuenta, privacidad y preferencias.',
  },
];
