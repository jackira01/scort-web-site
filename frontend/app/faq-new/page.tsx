import { Metadata } from 'next';
import PublicContentPage from '@/components/public/PublicContentPage';
import FAQPage from '@/modules/faq/components/FAQPage';

export const metadata: Metadata = {
  title: 'FAQ - Online Escorts',
  description: 'Encuentra respuestas a las preguntas más frecuentes sobre nuestros servicios.',
};

export default function FAQNewPage() {
  return (
    <PublicContentPage 
      slug="faq"
      fallbackContent={<FAQPage />}
      showBackButton={true}
      backButtonText="Volver al inicio"
      backButtonHref="/"
    />
  );
}