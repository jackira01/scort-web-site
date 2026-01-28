import PlansPage from '@/modules/plans/components/PlansPage';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Planes - PrepagoYa',
  description: 'Elige el plan perfecto para tu perfil. Opciones flexibles y precios competitivos.',
};

export default function Plans() {
  return <PlansPage />;
}