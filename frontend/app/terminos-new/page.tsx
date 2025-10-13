import { Metadata } from 'next';
import PublicContentPage from '@/components/public/PublicContentPage';
import TermsPage from '../terminos/page';

export const metadata: Metadata = {
  title: 'Términos y Condiciones - Online Escorts',
  description: 'Términos y condiciones de uso de nuestros servicios.',
};

export default function TermsNewPage() {
  return (
    <PublicContentPage 
      slug="terminos"
      fallbackContent={<TermsPage />}
      showBackButton={true}
      backButtonText="Volver al inicio"
      backButtonHref="/"
    />
  );
}