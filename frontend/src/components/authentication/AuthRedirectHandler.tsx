'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

/**
 * Componente que maneja la redirección automática a post-register
 * cuando el usuario necesita configurar su contraseña
 */
export default function AuthRedirectHandler() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [hasCheckedSession, setHasCheckedSession] = useState(false);

  useEffect(() => {
    // Solo actualizar la sesión si el usuario está autenticado y no hemos verificado aún
    if (status === 'authenticated' && session?.user && !hasCheckedSession) {
      console.log('🔄 AuthRedirectHandler: Actualizando sesión para obtener datos más recientes...');
      console.log('📊 Datos de sesión ANTES de actualizar:', {
        userId: session.user.id,
        email: session.user.email,
        hasPassword: session.user.hasPassword,
        hasPasswordType: typeof session.user.hasPassword,
        fullUser: session.user
      });
      
      update().then(() => {
        setHasCheckedSession(true);
      });
    }
  }, [session, status, update, hasCheckedSession]);

  useEffect(() => {
    // Solo proceder si hemos verificado la sesión actualizada
    if (status === 'authenticated' && session?.user && hasCheckedSession) {
      console.log('🔍 AuthRedirectHandler: Verificando datos de sesión actualizados...');
      console.log('📊 Datos de sesión DESPUÉS de actualizar:', {
        userId: session.user.id,
        email: session.user.email,
        hasPassword: session.user.hasPassword,
        hasPasswordType: typeof session.user.hasPassword,
        fullUser: session.user
      });
      
      const userHasPassword = session.user.hasPassword;
      
      // Verificar si el usuario necesita configurar su contraseña
      if (!userHasPassword) {
        console.log('❌ Usuario sin contraseña configurada, redirigiendo a post-register');
        console.log('🔍 Detalles de hasPassword:', {
          value: userHasPassword,
          type: typeof userHasPassword,
          isFalse: userHasPassword === false,
          isUndefined: userHasPassword === undefined,
          isNull: userHasPassword === null
        });
        router.replace('/autenticacion/post-register');
      } else {
        console.log('✅ Usuario con contraseña configurada, no se requiere redirección');
        console.log('🔍 hasPassword válido encontrado:', {
          value: userHasPassword,
          type: typeof userHasPassword
        });
      }
    }
  }, [session, status, router, hasCheckedSession]);

  // Este componente no renderiza nada visible
  return null;
}