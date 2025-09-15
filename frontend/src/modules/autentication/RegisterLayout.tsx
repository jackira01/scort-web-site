'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Eye, EyeOff, Loader2, Mail, Lock, AlertCircle, CheckCircle, Info, User } from 'lucide-react';
import { z } from 'zod';
import { signIn } from 'next-auth/react';

// Esquemas de validación
const registerSchema = z.object({
  name: z
    .string()
    .min(1, 'El nombre es requerido')
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede exceder 50 caracteres'),
  email: z
    .string()
    .min(1, 'El email es requerido')
    .email('Formato de email inválido'),
  password: z
    .string()
    .min(1, 'La contraseña es requerida')
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Debe contener al menos una mayúscula, una minúscula y un número'),
  confirmPassword: z
    .string()
    .min(1, 'Confirma tu contraseña'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

const verificationSchema = z.object({
  verificationCode: z
    .string()
    .min(1, 'El código de verificación es requerido')
    .length(6, 'El código debe tener 6 dígitos')
    .regex(/^\d{6}$/, 'El código debe contener solo números'),
});

type RegisterFormData = z.infer<typeof registerSchema>;
type VerificationFormData = z.infer<typeof verificationSchema>;

export default function RegisterLayout() {
  const [step, setStep] = useState<'register' | 'verify'>('register');
  const [formData, setFormData] = useState<RegisterFormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [verificationData, setVerificationData] = useState<VerificationFormData>({
    verificationCode: '',
  });
  const [errors, setErrors] = useState<Partial<RegisterFormData & VerificationFormData>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string>('');
  const router = useRouter();
  const searchParams = useSearchParams();

  // Manejar mensajes de URL
  useEffect(() => {
    const message = searchParams.get('message');
    const errorParam = searchParams.get('error');
    const email = searchParams.get('email');
    
    if (email) {
      setPendingEmail(email);
      setStep('verify');
      setInfo('Se ha enviado un código de verificación a tu email. Revisa tu bandeja de entrada.');
    }
    
    if (message === 'verification_sent') {
      setSuccess('Código de verificación enviado. Revisa tu email.');
    } else if (errorParam) {
      switch (errorParam) {
        case 'verification_failed':
          setAuthError('Código de verificación inválido o expirado.');
          break;
        case 'email_exists':
          setAuthError('Este email ya está registrado. ¿Deseas iniciar sesión?');
          break;
        default:
          setAuthError('Error en el registro. Intenta de nuevo.');
      }
    }
  }, [searchParams]);

  // Validar campo individual
  const validateField = (name: keyof (RegisterFormData & VerificationFormData), value: string) => {
    try {
      if (step === 'register') {
        // Para ZodEffects, necesitamos acceder al schema interno
        const baseSchema = registerSchema._def.schema;
        baseSchema.shape[name as keyof RegisterFormData]?.parse(value);
      } else {
        verificationSchema.shape[name as keyof VerificationFormData]?.parse(value);
      }
      setErrors(prev => ({ ...prev, [name]: undefined }));
    } catch (error) {
      if (error instanceof z.ZodError) {
        setErrors(prev => ({ ...prev, [name]: error.errors[0]?.message }));
      }
    }
  };

  // Manejar cambios en inputs del registro
  const handleRegisterInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Validar en tiempo real si el campo ya tiene error
    if (errors[name as keyof RegisterFormData]) {
      validateField(name as keyof RegisterFormData, value);
    }
  };

  // Manejar cambios en inputs de verificación
  const handleVerificationInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setVerificationData(prev => ({ ...prev, [name]: value }));
    
    // Validar en tiempo real si el campo ya tiene error
    if (errors[name as keyof VerificationFormData]) {
      validateField(name as keyof VerificationFormData, value);
    }
  };

  // Validar formulario de registro
  const validateRegisterForm = (): boolean => {
    try {
      registerSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Partial<RegisterFormData> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as keyof RegisterFormData] = err.message;
          }
        });
        setErrors(fieldErrors);
      }
      return false;
    }
  };

  // Validar formulario de verificación
  const validateVerificationForm = (): boolean => {
    try {
      verificationSchema.parse(verificationData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Partial<VerificationFormData> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as keyof VerificationFormData] = err.message;
          }
        });
        setErrors(fieldErrors);
      }
      return false;
    }
  };

  // Manejar envío del formulario de registro
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setSuccess(null);
    setInfo(null);

    // Validar formulario
    if (!validateRegisterForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Usar el endpoint del backend para registro
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          name: formData.name,
          password: formData.password,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        setAuthError(result.message);
        setIsLoading(false);
        return;
      }

      setSuccess('¡Registro exitoso! Redirigiendo al login...');
      
      // Redirigir al login después de un breve delay
      setTimeout(() => {
        router.push('/autenticacion/ingresar?message=registration_success');
      }, 2000);
      
    } catch (error) {
      console.error('Error en registro:', error);
      setAuthError('Error al procesar el registro. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  // Estas funciones ya no son necesarias con el sistema unificado
  const handleVerificationSubmit = async (e: React.FormEvent) => {
    // Esta función ya no se usa con el registro directo
  };

  const handleResendCode = async () => {
    // Esta función ya no se usa con el registro directo
  };

  // Manejar login con Google
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn('google', {
        callbackUrl: '/dashboard',
      });
    } catch (error) {
      setAuthError('Error al conectar con Google');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md bg-white dark:bg-gray-800 shadow-xl border-0">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
            {step === 'register' ? 'Crear cuenta' : 'Verificar email'}
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            {step === 'register' 
              ? 'Completa los datos para crear tu cuenta'
              : `Ingresa el código enviado a ${pendingEmail}`
            }
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
            <Alert className="border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {info && (
            <Alert className="border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
              <Info className="h-4 w-4" />
              <AlertDescription>{info}</AlertDescription>
            </Alert>
          )}

          {step === 'register' ? (
            <>
              {/* Formulario de registro */}
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Nombre completo
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="Tu nombre completo"
                      value={formData.name}
                      onChange={handleRegisterInputChange}
                      className={`pl-10 ${errors.name ? 'border-red-500 focus:border-red-500' : ''}`}
                      disabled={isLoading}
                    />
                  </div>
                  {errors.name && (
                    <p className="text-sm text-red-600 dark:text-red-400">{errors.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="tu@email.com"
                      value={formData.email}
                      onChange={handleRegisterInputChange}
                      className={`pl-10 ${errors.email ? 'border-red-500 focus:border-red-500' : ''}`}
                      disabled={isLoading}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-sm text-red-600 dark:text-red-400">{errors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Contraseña
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Mínimo 8 caracteres"
                      value={formData.password}
                      onChange={handleRegisterInputChange}
                      className={`pl-10 pr-10 ${errors.password ? 'border-red-500 focus:border-red-500' : ''}`}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      disabled={isLoading}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-red-600 dark:text-red-400">{errors.password}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Confirmar contraseña
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Repite tu contraseña"
                      value={formData.confirmPassword}
                      onChange={handleRegisterInputChange}
                      className={`pl-10 pr-10 ${errors.confirmPassword ? 'border-red-500 focus:border-red-500' : ''}`}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      disabled={isLoading}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-sm text-red-600 dark:text-red-400">{errors.confirmPassword}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium py-2.5"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creando cuenta...
                    </>
                  ) : (
                    'Crear cuenta'
                  )}
                </Button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white dark:bg-gray-800 px-2 text-gray-500 dark:text-gray-400">
                    O continúa con
                  </span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
              >
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
                Continuar con Google
              </Button>

              <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                ¿Ya tienes cuenta?{' '}
                <Link
                  href="/autenticacion/ingresar"
                  className="font-medium text-purple-600 hover:text-purple-500 dark:text-purple-400 dark:hover:text-purple-300"
                >
                  Inicia sesión
                </Link>
              </div>
            </>
          ) : (
            <>
              {/* Formulario de verificación */}
              <form onSubmit={handleVerificationSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="verificationCode" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Código de verificación
                  </Label>
                  <Input
                    id="verificationCode"
                    name="verificationCode"
                    type="text"
                    placeholder="123456"
                    value={verificationData.verificationCode}
                    onChange={handleVerificationInputChange}
                    className={`text-center text-lg tracking-widest ${errors.verificationCode ? 'border-red-500 focus:border-red-500' : ''}`}
                    disabled={isLoading}
                    maxLength={6}
                  />
                  {errors.verificationCode && (
                    <p className="text-sm text-red-600 dark:text-red-400">{errors.verificationCode}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium py-2.5"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verificando...
                    </>
                  ) : (
                    'Verificar código'
                  )}
                </Button>
              </form>

              <div className="text-center space-y-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  ¿No recibiste el código?
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleResendCode}
                  disabled={isLoading}
                  className="text-purple-600 hover:text-purple-500 dark:text-purple-400 dark:hover:text-purple-300"
                >
                  Reenviar código
                </Button>
              </div>

              <div className="text-center">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setStep('register')}
                  disabled={isLoading}
                  className="text-gray-600 hover:text-gray-500 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  ← Volver al registro
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}