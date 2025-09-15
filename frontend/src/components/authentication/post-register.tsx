'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Eye, EyeOff, Lock, Mail, AlertCircle, CheckCircle, Shield } from 'lucide-react';
import { useSession } from 'next-auth/react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  setPasswordAfterGoogleRegister, 
  postRegisterPasswordSchema
} from '@/lib/account-linking';

type PostRegisterFormData = z.infer<typeof postRegisterPasswordSchema>;

export default function PostRegister() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const form = useForm<PostRegisterFormData>({
    resolver: zodResolver(postRegisterPasswordSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    }
  });

  // Verificar si el usuario está autenticado y obtener su email
  useEffect(() => {
    if (status === 'loading') return;
    
    if (status === 'unauthenticated') {
      router.push('/autenticacion/ingresar');
      return;
    }

    if (session?.user?.email) {
      form.setValue('email', session.user.email);
    }
  }, [session, status, router, form]);

  const handleSubmit = async (data: PostRegisterFormData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await setPasswordAfterGoogleRegister(data);
      
      if (result.success) {
        setSuccess(result.message);
        // Redirigir a la página principal después de 2 segundos
        setTimeout(() => {
          router.push('/');
          router.refresh(); // Refrescar para actualizar el estado de autenticación
        }, 2000);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Error al configurar la contraseña');
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center w-12 h-12 bg-pink-100 rounded-full mx-auto mb-4">
            <Shield className="w-6 h-6 text-pink-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            Configurar Contraseña
          </CardTitle>
          <CardDescription className="text-center">
            Para completar tu registro y acceder a todas las funciones, debes configurar una contraseña.
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

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  className="pl-10 bg-gray-50"
                  readOnly
                  {...form.register('email')}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Nueva Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mínimo 8 caracteres"
                  className="pl-10 pr-10"
                  {...form.register('password')}
                />
                <button
                  type="button"
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {form.formState.errors.password && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>

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

            <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
              <p className="font-medium mb-1">Requisitos de contraseña:</p>
              <ul className="text-xs space-y-1">
                <li>• Mínimo 8 caracteres</li>
                <li>• Al menos una letra mayúscula</li>
                <li>• Al menos una letra minúscula</li>
                <li>• Al menos un número</li>
              </ul>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>⚠️ Paso obligatorio:</strong> No podrás acceder a la aplicación hasta que configures tu contraseña.
              </p>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-pink-600 hover:bg-pink-700"
              disabled={isLoading}
            >
              {isLoading ? 'Configurando Contraseña...' : 'Configurar Contraseña'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}