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
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 py-3 text-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-900 transition"
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <svg
                    className="h-8 w-8" // tamaño real más grande
                    viewBox="0 0 48 48"
                  >
                    <path
                      fill="#EA4335"
                      d="M24 9.5c3.94 0 6.58 1.7 8.1 3.12l5.93-5.93C34.6 3.6 29.8 1.5 24 1.5 14.82 1.5 7 7.44 3.84 15.5l7.02 5.46C12.38 15.6 17.6 9.5 24 9.5z"
                    />
                    <path
                      fill="#34A853"
                      d="M46.5 24c0-1.6-.15-3.12-.43-4.5H24v9h12.7c-.57 2.9-2.27 5.35-4.8 7.02l7.38 5.74C43.3 37.35 46.5 31.25 46.5 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M10.86 28.12a13.9 13.9 0 0 1-.86-4.12c0-1.43.3-2.8.86-4.12l-7.02-5.46A22.46 22.46 0 0 0 1.5 24c0 3.7.9 7.18 2.34 10.12l7.02-6z"
                    />
                    <path
                      fill="#4285F4"
                      d="M24 46.5c6.48 0 11.9-2.14 15.88-5.84l-7.38-5.74c-2.07 1.4-4.72 2.23-8.5 2.23-6.4 0-11.62-4.1-13.62-9.79l-7.02 6C7 40.56 14.82 46.5 24 46.5z"
                    />
                  </svg>
                )}
                <span className="text-lg font-semibold">Continuar con Google</span>
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