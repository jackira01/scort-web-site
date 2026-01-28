import PublicContentPage from '@/components/public/PublicContentPage';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Políticas de Privacidad - PrepagoYa',
  description: 'Conoce nuestras políticas de privacidad y protección de datos.',
};

export default function PoliticasPage() {
  return (
    <PublicContentPage
      slug="politicas"
      fallbackContent={
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-pink-900/20">
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-3xl font-bold text-center mb-8">Políticas de Privacidad</h1>
              <p className="text-center text-gray-600 dark:text-gray-300">
                Esta página está siendo configurada con contenido dinámico.
              </p>
            </div>
          </div>
        </div>
      }
      showBackButton={true}
      backButtonText="Volver al inicio"
      backButtonHref="/"
    />
  );
}