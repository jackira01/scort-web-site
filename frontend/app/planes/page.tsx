import { Metadata } from 'next';
import PlansPage from '@/modules/plans/components/PlansPage';

export const metadata: Metadata = {
  title: 'Planes - Online Escorts',
  description: 'Elige el plan perfecto para tu perfil. Opciones flexibles y precios competitivos.',
};

export default function Plans() {
  return <PlansPage />;
}