import { Suspense } from 'react';
import PostRegister from '@/components/authentication/post-register';

function PostRegisterContent() {
  return <PostRegister />;
}

export default function PostRegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
      </div>
    }>
      <PostRegisterContent />
    </Suspense>
  );
}

export const metadata = {
  title: 'Crear Contraseña | Scort Web Site',
  description: 'Crea una contraseña para completar tu registro',
};