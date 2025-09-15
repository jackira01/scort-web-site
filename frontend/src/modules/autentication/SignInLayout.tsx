'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Eye, EyeOff, Loader2, Mail, Lock, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { z } from 'zod';
import { initiatePasswordCreation } from '@/lib/account-linking';

// Esquema de validación
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'El email es requerido')
    .email('Formato de email inválido'),
  password: z
    .string()
    .min(1, 'La contraseña es requerida')
    .min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function SignInLayout() {
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Partial<LoginFormData>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Manejar mensajes de URL
  useEffect(() => {
    const message = searchParams.get('message');
    const errorParam = searchParams.get('error');
    
    if (message === 'password_created') {
      setSuccess('Contraseña creada exitosamente. Ya puedes iniciar sesión.');
    } else if (errorParam) {
      switch (errorParam) {
        case 'CredentialsSignin':
          setAuthError('Credenciales inválidas. Verifica tu email y contraseña.');
          break;
        case 'AccessDenied':
          setAuthError('Acceso denegado. Contacta al administrador.');
          break;
        default:
          setAuthError('Error de autenticación. Intenta de nuevo.');
      }
    }
  }, [searchParams]);

  // Validar campo individual
  const validateField = (name: keyof LoginFormData, value: string) => {
    try {
      loginSchema.shape[name].parse(value);
      setErrors(prev => ({ ...prev, [name]: undefined }));
    } catch (error) {
      if (error instanceof z.ZodError) {
        setErrors(prev => ({ ...prev, [name]: error.errors[0]?.message }));
      }
    }
  };

  // Manejar cambios en inputs
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Validar en tiempo real si el campo ya tiene error
    if (errors[name as keyof LoginFormData]) {
      validateField(name as keyof LoginFormData, value);
    }
  };

  // Validar formulario completo
  const validateForm = (): boolean => {
    try {
      loginSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Partial<LoginFormData> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as keyof LoginFormData] = err.message;
          }
        });
        setErrors(fieldErrors);
      }
      return false;
    }
  };

  // Manejar creación de contraseña
  const handleCreatePassword = async () => {
    if (!formData.email) {
      setAuthError('Por favor ingresa tu email primero');
      return;
    }

    setIsLoading(true);
    try {
      const result = await initiatePasswordCreation(formData.email);
      if (result.success) {
        router.push(`/autenticacion/crear-contrasena?email=${encodeURIComponent(formData.email)}`);
      } else {
        setAuthError(result.message);
      }
    } catch (err) {
      setAuthError('Error al procesar la solicitud');
    } finally {
      setIsLoading(false);
    }
  };

  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setSuccess(null);
    setInfo(null);
    setShowCreatePassword(false);

    // Validar formulario
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email: formData.email,
        password: formData.password,
      });

      if (!result) {
        setAuthError('Error inesperado. Por favor, intenta recargar la página.');
        return;
      }

      if (result.error) {
        // Manejar errores específicos
        if (result.error.includes('Cuenta creada con Google')) {
          setInfo('Esta cuenta fue creada con Google. Puedes crear una contraseña o usar Google para iniciar sesión.');
          setShowCreatePassword(true);
        } else if (result.error.includes('crear una contraseña')) {
          setInfo('Para usar email/contraseña, primero debes crear una contraseña para tu cuenta.');
          setShowCreatePassword(true);
        } else {
          switch (result.error) {
            case 'CredentialsSignin':
              setAuthError('Email o contraseña incorrectos');
              break;
            case 'AccessDenied':
              setAuthError('Acceso denegado. Verifica tu cuenta.');
              break;
            default:
              setAuthError('Error de autenticación. Intenta nuevamente.');
          }
        }
        return;
      }

      // Login exitoso - redirigir
      setSuccess('¡Bienvenido! Redirigiendo...');
      setTimeout(() => {
        router.push('/cuenta');
        router.refresh();
      }, 1000);
    } catch (error) {
      console.error('Error durante el login:', error);
      setAuthError('Error de conexión. Verifica tu internet e intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Manejar login con Google
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn('google', { callbackUrl: '/cuenta' });
    } catch (error) {
      console.error('Error con Google Sign-In:', error);
      setAuthError('Error al conectar con Google. Intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Iniciar Sesión</CardTitle>
          <CardDescription>
            Ingresa a tu cuenta para continuar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Mensajes de estado */}
          {authError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{authError}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert className="border-green-200 bg-green-50 text-green-800">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}
          
          {info && (
            <Alert className="border-blue-200 bg-blue-50 text-blue-800">
              <Info className="h-4 w-4" />
              <AlertDescription>{info}</AlertDescription>
            </Alert>
          )}

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Campo Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  onBlur={() => validateField('email', formData.email)}
                  className={`pl-10 ${errors.email ? 'border-destructive' : ''}`}
                  disabled={isLoading}
                  autoComplete="email"
                />
              </div>
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            {/* Campo Contraseña */}
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleInputChange}
                  onBlur={() => validateField('password', formData.password)}
                  className={`pl-10 pr-10 ${errors.password ? 'border-destructive' : ''}`}
                  disabled={isLoading}
                  autoComplete="current-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
            </div>

            {/* Botón de envío */}
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                'Iniciar Sesión'
              )}
            </Button>
            
            {/* Botón para crear contraseña */}
            {showCreatePassword && (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleCreatePassword}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  'Crear Contraseña'
                )}
              </Button>
            )}
          </form>

          {/* Separador */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                O continúa con
              </span>
            </div>
          </div>

          {/* Login con Google */}
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            Continuar con Google
          </Button>

          {/* Enlaces adicionales */}
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              ¿No tienes una cuenta?{' '}
              <Link
                href="/autenticacion/registrarse"
                className="font-medium text-primary hover:underline"
              >
                Regístrate aquí
              </Link>
            </p>
            <Link
              href="/"
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              ← Volver al inicio
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}