'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';

// Esquema de validación para nueva contraseña
const newPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
  token: z.string().min(1, 'Token es requerido'),
  newPassword: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'La contraseña debe contener al menos una mayúscula, una minúscula y un número'),
  confirmPassword: z.string().min(1, 'Confirma tu contraseña')
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword']
});

type NewPasswordFormData = z.infer<typeof newPasswordSchema>;

export function NewPasswordLayout() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<NewPasswordFormData>({
    resolver: zodResolver(newPasswordSchema),
    defaultValues: {
      email: '',
      token: '',
      newPassword: '',
      confirmPassword: ''
    }
  });

  // Obtener email y token de los parámetros de URL
  useEffect(() => {
    const email = searchParams.get('email');
    const token = searchParams.get('token');
    
    if (!email || !token) {
      setError('Enlace de recuperación inválido. Por favor, solicita un nuevo código de recuperación.');
      return;
    }

    form.setValue('email', email);
    form.setValue('token', token);
  }, [searchParams, form]);

  const handleSubmit = async (data: NewPasswordFormData) => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email,
          token: data.token,
          newPassword: data.newPassword
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess('¡Contraseña restablecida exitosamente! Redirigiendo al login...');
        setTimeout(() => {
          router.push('/autenticacion/ingresar');
        }, 2000);
      } else {
        setError(result.message || 'Error al restablecer la contraseña');
      }
    } catch (err) {
      setError('Error de conexión. Por favor, intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center w-12 h-12 bg-pink-100 rounded-full mx-auto mb-4">
            <Lock className="w-6 h-6 text-pink-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            Nueva Contraseña
          </CardTitle>
          <CardDescription className="text-center">
            Ingresa tu nueva contraseña para completar el proceso de recuperación
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {success && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">{success}</AlertDescription>
              </Alert>
            )}

            {/* Campo de email (solo lectura) */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                className="bg-gray-50"
                readOnly
                {...form.register('email')}
              />
            </div>

            {/* Campo de nueva contraseña */}
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nueva Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mínimo 8 caracteres"
                  className="pl-10 pr-10"
                  {...form.register('newPassword')}
                />
                <button
                  type="button"
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {form.formState.errors.newPassword && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.newPassword.message}
                </p>
              )}
            </div>

            {/* Campo de confirmar contraseña */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Repite la contraseña"
                  className="pl-10 pr-10"
                  {...form.register('confirmPassword')}
                />
                <button
                  type="button"
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {form.formState.errors.confirmPassword && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* Requisitos de contraseña */}
            <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
              <p className="font-medium mb-1">Requisitos de contraseña:</p>
              <ul className="text-xs space-y-1">
                <li>• Mínimo 8 caracteres</li>
                <li>• Al menos una letra mayúscula</li>
                <li>• Al menos una letra minúscula</li>
                <li>• Al menos un número</li>
              </ul>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-pink-600 hover:bg-pink-700"
              disabled={isLoading}
            >
              {isLoading ? 'Restableciendo Contraseña...' : 'Restablecer Contraseña'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link 
              href="/autenticacion/ingresar"
              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Volver al Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}