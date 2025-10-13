'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, Shield, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import { z } from 'zod';

// Esquemas de validación
const emailSchema = z.object({
  email: z
    .string()
    .min(1, 'El email es requerido')
    .email('Formato de email inválido'),
});

const codeSchema = z.object({
  code: z
    .string()
    .min(6, 'El código debe tener 6 dígitos')
    .max(6, 'El código debe tener 6 dígitos')
    .regex(/^\d{6}$/, 'El código debe contener solo números'),
});

type EmailFormData = z.infer<typeof emailSchema>;
type CodeFormData = z.infer<typeof codeSchema>;

export default function PasswordRecoveryLayout() {
  const router = useRouter();
  
  // Estados del formulario
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [emailData, setEmailData] = useState<EmailFormData>({ email: '' });
  const [codeData, setCodeData] = useState<CodeFormData>({ code: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Estados para el temporizador
  const [countdown, setCountdown] = useState(0);
  const [canResend, setCanResend] = useState(true);

  // Errores de validación
  const [emailErrors, setEmailErrors] = useState<Partial<EmailFormData>>({});
  const [codeErrors, setCodeErrors] = useState<Partial<CodeFormData>>({});

  // Validación de email
  const validateEmail = (email: string) => {
    try {
      emailSchema.parse({ email });
      setEmailErrors({});
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldErrors: Partial<EmailFormData> = {};
        err.errors.forEach((error) => {
          if (error.path[0]) {
            fieldErrors[error.path[0] as keyof EmailFormData] = error.message;
          }
        });
        setEmailErrors(fieldErrors);
      }
      return false;
    }
  };

  // Validación de código
  const validateCode = (code: string) => {
    try {
      codeSchema.parse({ code });
      setCodeErrors({});
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldErrors: Partial<CodeFormData> = {};
        err.errors.forEach((error) => {
          if (error.path[0]) {
            fieldErrors[error.path[0] as keyof CodeFormData] = error.message;
          }
        });
        setCodeErrors(fieldErrors);
      }
      return false;
    }
  };

  // Manejar cambios en el input de email
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setEmailData({ email: value });
    setError('');
  };

  // Manejar cambios en el input de código
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    // Solo permitir números y máximo 6 caracteres
    if (/^\d{0,6}$/.test(value)) {
      setCodeData({ code: value });
      setError('');
    }
  };

  // Iniciar temporizador
  const startCountdown = () => {
    setCanResend(false);
    setCountdown(60);
    
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Enviar código de recuperación
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEmail(emailData.email)) {
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/request-password-reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: emailData.email }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(data.message);
        setStep('code');
        startCountdown();
      } else {
        setError(data.message || 'Error al enviar el código');
      }
    } catch (error) {
      console.error('Error al enviar código:', error);
      setError('Error de conexión. Intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Reenviar código
  const handleResendCode = async () => {
    if (!canResend) return;
    
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/request-password-reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: emailData.email }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Código reenviado correctamente');
        startCountdown();
      } else {
        setError(data.message || 'Error al reenviar el código');
      }
    } catch (error) {
      console.error('Error al reenviar código:', error);
      setError('Error de conexión. Intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Verificar código
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateCode(codeData.code)) {
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/verify-reset-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: emailData.email, 
          code: codeData.code 
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('¡Código verificado correctamente! Redirigiendo...');
        setTimeout(() => {
          router.push(`/autenticacion/nueva-contrasena?email=${encodeURIComponent(emailData.email)}&token=${encodeURIComponent(data.resetToken)}`);
        }, 1500);
      } else {
        setError(data.message || 'Código inválido o expirado');
      }
    } catch (error) {
      console.error('Error al verificar código:', error);
      setError('Error de conexión. Intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">
            {step === 'email' ? 'Recuperar Contraseña' : 'Verificar Código'}
          </CardTitle>
          <CardDescription>
            {step === 'email' 
              ? 'Ingresa tu email para recibir un código de recuperación'
              : 'Ingresa el código de 6 dígitos que enviamos a tu correo'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Mensajes de estado */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert className="border-green-200 bg-green-50 text-green-800">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {step === 'email' ? (
            /* Formulario de email */
            <form onSubmit={handleSendCode} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="tu@email.com"
                    value={emailData.email}
                    onChange={handleEmailChange}
                    onBlur={() => validateEmail(emailData.email)}
                    className={`pl-10 ${emailErrors.email ? 'border-destructive' : ''}`}
                    disabled={isLoading}
                    autoComplete="email"
                  />
                </div>
                {emailErrors.email && (
                  <p className="text-sm text-destructive">{emailErrors.email}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando código...
                  </>
                ) : (
                  'Enviar Código'
                )}
              </Button>
            </form>
          ) : (
            /* Formulario de código */
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Código de Verificación</Label>
                <div className="relative">
                  <Shield className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="code"
                    name="code"
                    type="text"
                    placeholder="123456"
                    value={codeData.code}
                    onChange={handleCodeChange}
                    onBlur={() => validateCode(codeData.code)}
                    className={`pl-10 text-center text-lg tracking-widest ${codeErrors.code ? 'border-destructive' : ''}`}
                    disabled={isLoading}
                    maxLength={6}
                    autoComplete="one-time-code"
                  />
                </div>
                {codeErrors.code && (
                  <p className="text-sm text-destructive">{codeErrors.code}</p>
                )}
                <p className="text-xs text-muted-foreground text-center">
                  Código enviado a: <span className="font-medium">{emailData.email}</span>
                </p>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  'Verificar Código'
                )}
              </Button>

              {/* Botón para reenviar código */}
              <div className="text-center">
                {canResend ? (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleResendCode}
                    disabled={isLoading}
                    className="text-sm"
                  >
                    Reenviar código
                  </Button>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Reenviar código en {countdown}s
                  </p>
                )}
              </div>

              {/* Botón para volver al paso anterior */}
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep('email')}
                disabled={isLoading}
                className="w-full"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Cambiar correo electrónico
              </Button>
            </form>
          )}

          {/* Enlaces adicionales */}
          <div className="text-center space-y-2">
            <Link
              href="/autenticacion/ingresar"
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              ← Volver al inicio de sesión
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}