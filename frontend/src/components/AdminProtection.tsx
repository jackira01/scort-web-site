'use client';

import { useCentralizedSession } from '@/hooks/use-centralized-session';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Home } from 'lucide-react';
import Loader from '@/components/Loader';

interface AdminProtectionProps {
  children: React.ReactNode;
}

export default function AdminProtection({ children }: AdminProtectionProps) {
  const { session, status, isAdmin } = useCentralizedSession();
  const router = useRouter();
  const hasRedirected = useRef(false); // ✅ Prevenir múltiples redirects

  useEffect(() => {
    if (status === 'loading' || hasRedirected.current) return;

    if (!session) {
      // No autenticado, redirigir al login
      hasRedirected.current = true;
      router.push('/autenticacion/login');
      return;
    }

    if (!isAdmin) {
      // No es admin, redirigir al home
      hasRedirected.current = true;
      router.push('/');
      return;
    }
  }, [session, status, isAdmin, router]);

  // Mostrar loader mientras se verifica la sesión
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  // Si no hay sesión, mostrar mensaje de redirección
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Shield className="h-12 w-12 mx-auto text-red-500 mb-4" />
            <CardTitle>Acceso Denegado</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Debes iniciar sesión para acceder a esta página.
            </p>
            <Button onClick={() => router.push('/autenticacion/login')} className="w-full">
              Iniciar Sesión
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Si no es admin, mostrar mensaje de acceso denegado
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Shield className="h-12 w-12 mx-auto text-red-500 mb-4" />
            <CardTitle>Acceso Denegado</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              No tienes permisos para acceder al panel de administración.
            </p>
            <Button onClick={() => router.push('/')} className="w-full">
              <Home className="h-4 w-4 mr-2" />
              Volver al Inicio
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Si es admin, mostrar el contenido
  return <>{children}</>;
}