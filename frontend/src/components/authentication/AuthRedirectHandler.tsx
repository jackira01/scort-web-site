'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

/**
 * Componente que maneja la redirección automática a post-register
 * cuando el usuario necesita configurar su contraseña
 */
export default function AuthRedirectHandler() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') return;
    if (!session?.user) return;

    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
    const hasPassword = session.user.hasPassword;

    // Solo redirigir si el usuario no tiene contraseña y no está ya en post-register
    if (hasPassword === false && currentPath !== '/autenticacion/post-register') {
      router.push('/autenticacion/post-register');
    }
  }, [status, session?.user?.hasPassword, router]);

  // Este componente no renderiza nada visible
  return null;
}