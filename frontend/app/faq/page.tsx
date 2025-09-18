import { Metadata } from 'next';
import FAQPage from '@/modules/faq/components/FAQPage';

export const metadata: Metadata = {
  title: 'FAQ - Online Escorts',
  description: 'Encuentra respuestas a las preguntas más frecuentes sobre nuestros servicios.',
};

export default function FAQ() {
  return <FAQPage />;
}
