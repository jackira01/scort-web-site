'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
import { AlertCircle, ArrowLeft, Shield, UserX, Clock, Wifi } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ErrorInfo {
  title: string;
  description: string;
  icon: React.ReactNode;
  action?: {
    text: string;
    href: string;
  };
}

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const getErrorInfo = (errorCode: string | null): ErrorInfo => {
    switch (errorCode) {
      case 'Configuration':
        return {
          title: 'Error de Configuración',
          description: 'Hay un problema con la configuración del servidor. Por favor contacta al administrador.',
          icon: <Shield className="w-8 h-8 text-red-500" />,
        };
      
      case 'AccessDenied':
        return {
          title: 'Acceso Denegado',
          description: 'No tienes permisos para acceder a este recurso. Si crees que esto es un error, contacta al administrador.',
          icon: <UserX className="w-8 h-8 text-red-500" />,
        };
      
      case 'Verification':
        return {
          title: 'Error de Verificación',
          description: 'El enlace de verificación es inválido o ha expirado. Solicita un nuevo enlace.',
          icon: <Clock className="w-8 h-8 text-orange-500" />,
          action: {
            text: 'Solicitar Nuevo Enlace',
            href: '/autenticacion/crear-contrasena'
          }
        };
      
      case 'Default':
      case 'Signin':
      case 'OAuthSignin':
      case 'OAuthCallback':
      case 'OAuthCreateAccount':
      case 'EmailCreateAccount':
      case 'Callback':
        return {
          title: 'Error de Autenticación',
          description: 'Ocurrió un error durante el proceso de autenticación. Por favor intenta de nuevo.',
          icon: <AlertCircle className="w-8 h-8 text-red-500" />,
        };
      
      case 'SessionRequired':
        return {
          title: 'Sesión Requerida',
          description: 'Necesitas iniciar sesión para acceder a esta página.',
          icon: <UserX className="w-8 h-8 text-blue-500" />,
        };
      
      case 'rate_limit_exceeded':
        return {
          title: 'Demasiados Intentos',
          description: 'Has excedido el límite de intentos de inicio de sesión. Por favor espera unos minutos antes de intentar de nuevo.',
          icon: <Clock className="w-8 h-8 text-orange-500" />,
        };
      
      case 'network_error':
        return {
          title: 'Error de Conexión',
          description: 'No se pudo conectar con el servidor. Verifica tu conexión a internet e intenta de nuevo.',
          icon: <Wifi className="w-8 h-8 text-red-500" />,
        };
      
      default:
        return {
          title: 'Error Desconocido',
          description: 'Ocurrió un error inesperado. Por favor intenta de nuevo o contacta al soporte técnico.',
          icon: <AlertCircle className="w-8 h-8 text-red-500" />,
        };
    }
  };

  const errorInfo = getErrorInfo(error);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            {errorInfo.icon}
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            {errorInfo.title}
          </CardTitle>
          <CardDescription className="text-gray-600">
            {errorInfo.description}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Código de error:</strong> {error}
              </AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-3">
            {errorInfo.action && (
              <Button asChild className="w-full">
                <Link href={errorInfo.action.href}>
                  {errorInfo.action.text}
                </Link>
              </Button>
            )}
            
            <Button asChild variant="outline" className="w-full">
              <Link href="/autenticacion/ingresar">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver al Login
              </Link>
            </Button>
            
            <Button asChild variant="ghost" className="w-full">
              <Link href="/">
                Ir al Inicio
              </Link>
            </Button>
          </div>
          
          <div className="text-center pt-4">
            <p className="text-sm text-gray-500">
              ¿Necesitas ayuda?{' '}
              <Link 
                href="/contacto" 
                className="text-pink-600 hover:text-pink-700 underline"
              >
                Contacta soporte
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  );
}

