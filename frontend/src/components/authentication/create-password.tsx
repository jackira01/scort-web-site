'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Eye, EyeOff, Lock, Mail, AlertCircle, CheckCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  createPasswordForExistingAccount, 
  createPasswordSchema,
  initiatePasswordCreation 
} from '@/lib/account-linking';

type CreatePasswordFormData = z.infer<typeof createPasswordSchema>;

interface CreatePasswordProps {
  email?: string;
  token?: string;
}

export default function CreatePassword({ email: initialEmail, token: initialToken }: CreatePasswordProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [step, setStep] = useState<'request' | 'create'>(
    initialToken || searchParams.get('token') ? 'create' : 'request'
  );

  // Formulario para solicitar creación de contraseña
  const requestForm = useForm<{ email: string }>({
    resolver: zodResolver(z.object({
      email: z.string().email('Email inválido')
    })),
    defaultValues: {
      email: initialEmail || searchParams.get('email') || ''
    }
  });

  // Formulario para crear contraseña
  const createForm = useForm<CreatePasswordFormData>({
    resolver: zodResolver(createPasswordSchema),
    defaultValues: {
      email: initialEmail || searchParams.get('email') || '',
      password: '',
      confirmPassword: '',
      verificationToken: initialToken || searchParams.get('token') || ''
    }
  });

  const handleRequestPassword = async (data: { email: string }) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await initiatePasswordCreation(data.email);
      
      if (result.success) {
        setSuccess(result.message);
        setStep('create');
        createForm.setValue('email', data.email);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Error al procesar la solicitud');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePassword = async (data: CreatePasswordFormData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await createPasswordForExistingAccount(data);
      
      if (result.success) {
        setSuccess(result.message);
        // Redirigir al login después de 2 segundos
        setTimeout(() => {
          router.push('/autenticacion/ingresar?message=password_created');
        }, 2000);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Error al crear la contraseña');
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 'request') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center w-12 h-12 bg-pink-100 rounded-full mx-auto mb-4">
              <Lock className="w-6 h-6 text-pink-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-center">
              Crear Contraseña
            </CardTitle>
            <CardDescription className="text-center">
              Tu cuenta fue creada con Google. Para usar email/contraseña, primero debes crear una contraseña.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={requestForm.handleSubmit(handleRequestPassword)} className="space-y-4">
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
                    placeholder="tu@email.com"
                    className="pl-10"
                    {...requestForm.register('email')}
                  />
                </div>
                {requestForm.formState.errors.email && (
                  <p className="text-sm text-red-600">
                    {requestForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full bg-pink-600 hover:bg-pink-700"
                disabled={isLoading}
              >
                {isLoading ? 'Enviando...' : 'Enviar Enlace de Verificación'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Button 
                variant="link" 
                onClick={() => router.push('/autenticacion/ingresar')}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                Volver al Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center w-12 h-12 bg-pink-100 rounded-full mx-auto mb-4">
            <Lock className="w-6 h-6 text-pink-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            Crear Nueva Contraseña
          </CardTitle>
          <CardDescription className="text-center">
            Crea una contraseña segura para tu cuenta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={createForm.handleSubmit(handleCreatePassword)} className="space-y-4">
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
                  {...createForm.register('email')}
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
                  {...createForm.register('password')}
                />
                <button
                  type="button"
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {createForm.formState.errors.password && (
                <p className="text-sm text-red-600">
                  {createForm.formState.errors.password.message}
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
                  {...createForm.register('confirmPassword')}
                />
                <button
                  type="button"
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {createForm.formState.errors.confirmPassword && (
                <p className="text-sm text-red-600">
                  {createForm.formState.errors.confirmPassword.message}
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

            <Button 
              type="submit" 
              className="w-full bg-pink-600 hover:bg-pink-700"
              disabled={isLoading}
            >
              {isLoading ? 'Creando Contraseña...' : 'Crear Contraseña'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Button 
              variant="link" 
              onClick={() => router.push('/autenticacion/ingresar')}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Volver al Login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}