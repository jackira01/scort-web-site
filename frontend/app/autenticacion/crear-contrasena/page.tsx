import { Suspense } from 'react';
import CreatePassword from '@/components/authentication/create-password';

function CreatePasswordContent() {
  return <CreatePassword />;
}

export default function CreatePasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
      </div>
    }>
      <CreatePasswordContent />
    </Suspense>
  );
}

export const metadata = {
  title: 'Crear Contraseña | Scort Web Site',
  description: 'Crea una contraseña para tu cuenta existente',
};