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
    // Solo procesar si la sesión está cargada
    if (status === 'loading') {
      console.log('🔍 [AUTH-REDIRECT] Sesión cargando...');
      return;
    }

    console.log('🔍 [AUTH-REDIRECT] Verificando necesidad de redirección...');
    console.log('🔍 [AUTH-REDIRECT] Status de sesión:', status);
    console.log('🔍 [AUTH-REDIRECT] Sesión:', session ? 'Presente' : 'Ausente');

    // Si no hay sesión, no hacer nada
    if (status === 'unauthenticated' || !session?.user) {
      console.log('🔍 [AUTH-REDIRECT] Usuario no autenticado, no se requiere redirección');
      return;
    }

    // Verificar si el usuario necesita configurar contraseña
    const user = session.user as any;
    console.log('🔍 [AUTH-REDIRECT] Datos del usuario:', {
      email: user.email,
      password: user.password ? `[${typeof user.password}] ${user.password.length > 0 ? 'NO_EMPTY' : 'EMPTY'}` : 'undefined',
      action: user.action,
      provider: user.provider
    });

    // Verificar si necesita configurar contraseña
    const hasValidPassword = user.password && 
                           user.password !== '' && 
                           user.password !== 'null' && 
                           user.password !== 'undefined';

    console.log('🔍 [AUTH-REDIRECT] ¿Tiene contraseña válida?:', hasValidPassword);
    console.log('🔍 [AUTH-REDIRECT] Valor de password:', user.password);
    console.log('🔍 [AUTH-REDIRECT] Tipo de password:', typeof user.password);

    // Si no tiene contraseña válida, redirigir a post-register
    if (!hasValidPassword) {
      console.log('🚨 [AUTH-REDIRECT] ¡¡¡EJECUTANDO REDIRECCIÓN A POST-REGISTER!!!');
      console.log('🔍 [AUTH-REDIRECT] Razón: Usuario sin contraseña configurada');
      
      // Usar replace para evitar que el usuario pueda volver atrás
      router.replace('/autenticacion/post-register');
    } else {
      console.log('✅ [AUTH-REDIRECT] Usuario tiene contraseña válida, no se requiere redirección');
    }
  }, [session, status, router]);

  // Este componente no renderiza nada visible
  return null;
}