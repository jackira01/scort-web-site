'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Eye, EyeOff, Lock, Mail, AlertCircle, CheckCircle, Shield, User, Building2 } from 'lucide-react';
import { useSession, signOut, signIn } from 'next-auth/react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  setPasswordAfterGoogleRegister,
  postRegisterPasswordSchema
} from '@/lib/account-linking';

type PostRegisterFormData = z.infer<typeof postRegisterPasswordSchema>;

export default function PostRegister() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status, update } = useSession();
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
      accountType: 'common', // Valor por defecto
    }
  });

  useEffect(() => {
    console.log('🔵 [POST-REGISTER] useEffect 1 - Estado de carga');
    console.log('   Status:', status);
    console.log('   Session:', session);

    if (status === 'loading') {
      console.log('   ⏳ Cargando sesión...');
      return;
    }

    if (status === 'unauthenticated') {
      console.log('   ❌ Usuario no autenticado, redirigiendo...');
      router.push('/autenticacion/iniciar-sesion');
      return;
    }

    if (session?.user?.email) {
      console.log('   ✅ Email encontrado, configurando formulario:', session.user.email);
      form.setValue('email', session.user.email);
    }
  }, [status, session, router, form]);

  useEffect(() => {
    console.log('\n🟢 [POST-REGISTER] useEffect 2 - Verificación hasPassword');
    console.log('   Status:', status);
    console.log('   Session completa:', JSON.stringify(session, null, 2));
    console.log('   User ID:', session?.user?.id);
    console.log('   Has Password:', session?.user?.hasPassword);

    if (status === 'loading') {
      console.log('   ⏳ Status loading, esperando...');
      return;
    }

    if (!session?.user?.id) {
      console.log('   ⚠️ No hay user ID, esperando...');
      return;
    }

    const hasPassword = session.user.hasPassword;
    console.log('   📋 Valor de hasPassword extraído:', hasPassword, 'Tipo:', typeof hasPassword);

    if (hasPassword === true) {
      console.log('   ✅ Usuario ya tiene contraseña, REDIRIGIENDO A HOME...');
      router.replace('/');
      return;
    }

    if (hasPassword !== false) {
      // Valor inesperado, mantener en la página
      console.warn('   ⚠️ Valor inesperado de hasPassword:', hasPassword, 'Tipo:', typeof hasPassword);
      console.warn('   Manteniendo en página post-register');
      return;
    }

    console.log('   ℹ️ hasPassword es false, usuario debe configurar contraseña');
  }, [status, session?.user?.hasPassword, session?.user?.id, router]);

  const handleSubmit = async (data: PostRegisterFormData) => {
    console.log('\n🚀 [POST-REGISTER] handleSubmit - INICIO');
    console.log('   User ID:', session?.user?.id);
    console.log('   Data:', data);

    if (!session?.user?.id) {
      console.error('   ❌ No hay user ID, abortando');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('   📤 Enviando datos al backend...');

      const response = await setPasswordAfterGoogleRegister({
        email: data.email,
        password: data.password,
        confirmPassword: data.confirmPassword,
        accountType: data.accountType
      });

      console.log('   📥 Respuesta del backend:', response);

      if (response.success) {
        console.log('   ✅ Contraseña configurada exitosamente');
        setSuccess('Contraseña configurada exitosamente. Cerrando sesión para actualizar...');

        // Guardar email y provider para re-login automático
        const userEmail = session?.user?.email;
        const userProvider = session?.user?.provider;

        console.log('   💾 Guardando datos para re-login:', { userEmail, userProvider });

        // ESTRATEGIA: Hacer signOut y luego signIn para forzar recreación del token
        try {
          console.log('   🚪 Cerrando sesión...');
          await signOut({ redirect: false });

          console.log('   ⏳ Esperando 500ms...');
          await new Promise(resolve => setTimeout(resolve, 500));

          if (userProvider === 'google') {
            console.log('   🔑 Usuario de Google - redirigiendo a home (auto-login en siguiente visita)');
            window.location.href = '/';
          } else {
            console.log('   🔑 Re-autenticando con credenciales...');
            // Para usuarios con credenciales, hacer signIn automático
            const signInResult = await signIn('credentials', {
              email: userEmail,
              password: data.password,
              redirect: false
            });

            console.log('   📋 Resultado de signIn:', signInResult);

            if (signInResult?.ok) {
              console.log('   ✅ Re-autenticación exitosa, redirigiendo...');
              window.location.href = '/';
            } else {
              console.error('   ❌ Error en re-autenticación');
              setError('Por favor inicia sesión nuevamente');
              setTimeout(() => {
                window.location.href = '/autenticacion/iniciar-sesion';
              }, 2000);
            }
          }
        } catch (error) {
          console.error('   💥 Error en proceso de re-login:', error);
          window.location.href = '/';
        }
      } else {
        console.error('   ❌ Error en respuesta del backend:', response.message);
        setError(response.message || 'Error al configurar la contraseña');
      }
    } catch (error) {
      console.error('   💥 Excepción en handleSubmit:', error);
      setError('Error al crear la contraseña. Por favor, intenta de nuevo.');
    } finally {
      console.log('   🏁 handleSubmit - FIN (isLoading = false)');
      setIsLoading(false);
    }
  };

  if (status === 'loading') {
    console.log('⏳ [POST-REGISTER] Renderizando loading state...');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
      </div>
    );
  }

  console.log('🎨 [POST-REGISTER] Renderizando formulario principal');
  console.log('   Status:', status);
  console.log('   HasPassword actual:', session?.user?.hasPassword);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center w-12 h-12 bg-pink-100 rounded-full mx-auto mb-4">
            <Shield className="w-6 h-6 text-pink-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            Crear Contraseña
          </CardTitle>
          <CardDescription className="text-center">
            Para completar tu registro y acceder a todas las funciones, debes crear una contraseña.
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

            <div className="space-y-3">
              <Label>Tipo de cuenta</Label>
              <RadioGroup
                value={form.watch('accountType')}
                onValueChange={(value) => form.setValue('accountType', value as 'common' | 'agency')}
                className="space-y-3"
              >
                <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors">
                  <RadioGroupItem value="common" id="common" />
                  <Label htmlFor="common" className="flex items-center gap-3 cursor-pointer flex-1">
                    <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-full">
                      <User className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Cuenta Individual</p>
                      <p className="text-sm text-gray-500">Para uso personal</p>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors">
                  <RadioGroupItem value="agency" id="agency" />
                  <Label htmlFor="agency" className="flex items-center gap-3 cursor-pointer flex-1">
                    <div className="flex items-center justify-center w-10 h-10 bg-pink-100 rounded-full">
                      <Building2 className="w-5 h-5 text-pink-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Cuenta de Agencia</p>
                      <p className="text-sm text-gray-500">Para gestionar múltiples perfiles</p>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
              {form.formState.errors.accountType && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.accountType.message}
                </p>
              )}
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
                <strong>⚠️ Paso obligatorio:</strong> No podrás acceder a la aplicación hasta que crees tu contraseña.
              </p>
            </div>

            <Button
              type="submit"
              className="w-full bg-pink-600 hover:bg-pink-700"
              disabled={isLoading}
            >
              {isLoading ? 'Creando Contraseña...' : 'Crear Contraseña'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}