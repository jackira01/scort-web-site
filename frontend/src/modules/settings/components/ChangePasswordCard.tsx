'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Key, Mail, Shield, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { useUser } from '@/hooks/use-user';
import toast from 'react-hot-toast';
import { z } from 'zod';

// Esquemas de validación
const emailSchema = z.object({
  email: z.string().email('Formato de email inválido'),
});

const codeSchema = z.object({
  code: z
    .string()
    .min(6, 'El código debe tener 6 dígitos')
    .max(6, 'El código debe tener 6 dígitos')
    .regex(/^\d{6}$/, 'El código debe contener solo números'),
});

const passwordSchema = z.object({
  newPassword: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'La contraseña debe contener al menos una mayúscula, una minúscula y un número'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

type EmailFormData = z.infer<typeof emailSchema>;
type CodeFormData = z.infer<typeof codeSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

const ChangePasswordCard = () => {
  const { data: user } = useUser();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [step, setStep] = useState<'email' | 'code' | 'password'>('email');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resetToken, setResetToken] = useState('');

  // Estados de formularios
  const [emailData, setEmailData] = useState<EmailFormData>({ email: user?.email || '' });
  const [codeData, setCodeData] = useState<CodeFormData>({ code: '' });
  const [passwordData, setPasswordData] = useState<PasswordFormData>({ 
    newPassword: '', 
    confirmPassword: '' 
  });

  // Estados de errores
  const [emailErrors, setEmailErrors] = useState<Partial<EmailFormData>>({});
  const [codeErrors, setCodeErrors] = useState<Partial<CodeFormData>>({});
  const [passwordErrors, setPasswordErrors] = useState<Partial<PasswordFormData>>({});

  // Validaciones
  const validateEmail = (email: string) => {
    try {
      emailSchema.parse({ email });
      setEmailErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        setEmailErrors({ email: error.errors[0].message });
      }
      return false;
    }
  };

  const validateCode = (code: string) => {
    try {
      codeSchema.parse({ code });
      setCodeErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        setCodeErrors({ code: error.errors[0].message });
      }
      return false;
    }
  };

  const validatePassword = (data: PasswordFormData) => {
    try {
      passwordSchema.parse(data);
      setPasswordErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Partial<PasswordFormData> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            errors[err.path[0] as keyof PasswordFormData] = err.message;
          }
        });
        setPasswordErrors(errors);
      }
      return false;
    }
  };

  // Handlers de cambio
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmailData({ email: value });
    if (emailErrors.email) {
      validateEmail(value);
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCodeData({ code: value });
    if (codeErrors.code) {
      validateCode(value);
    }
  };

  const handlePasswordChange = (field: keyof PasswordFormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const newData = { ...passwordData, [field]: value };
    setPasswordData(newData);
    if (passwordErrors[field]) {
      validatePassword(newData);
    }
  };

  // Enviar código de verificación
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
        setSuccess('Código enviado a tu correo electrónico');
        setStep('code');
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
        setSuccess('Código verificado correctamente');
        setResetToken(data.resetToken);
        setStep('password');
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

  // Cambiar contraseña
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePassword(passwordData)) {
      return;
    }

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
          email: emailData.email,
          token: resetToken,
          newPassword: passwordData.newPassword,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Contraseña cambiada exitosamente');
        toast.success('Contraseña actualizada correctamente');
        setTimeout(() => {
          handleCloseModal();
        }, 2000);
      } else {
        setError(data.message || 'Error al cambiar la contraseña');
      }
    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      setError('Error de conexión. Intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
    setEmailData({ email: user?.email || '' });
    setStep('email');
    setError('');
    setSuccess('');
    setResetToken('');
    setCodeData({ code: '' });
    setPasswordData({ newPassword: '', confirmPassword: '' });
    setEmailErrors({});
    setCodeErrors({});
    setPasswordErrors({});
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setStep('email');
    setError('');
    setSuccess('');
    setResetToken('');
    setCodeData({ code: '' });
    setPasswordData({ newPassword: '', confirmPassword: '' });
    setEmailErrors({});
    setCodeErrors({});
    setPasswordErrors({});
  };

  const getStepTitle = () => {
    switch (step) {
      case 'email': return 'Verificar Email';
      case 'code': return 'Código de Verificación';
      case 'password': return 'Nueva Contraseña';
      default: return 'Cambiar Contraseña';
    }
  };

  const getStepDescription = () => {
    switch (step) {
      case 'email': return 'Confirma tu email para recibir el código de verificación';
      case 'code': return 'Ingresa el código de 6 dígitos enviado a tu correo';
      case 'password': return 'Ingresa tu nueva contraseña';
      default: return '';
    }
  };

  return (
    <>
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Key className="h-5 w-5" />
            Cambiar Contraseña
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Actualiza tu contraseña para mantener tu cuenta segura.
          </div>
          
          <Button
            onClick={handleOpenModal}
            className="w-full bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white"
          >
            Cambiar Contraseña
          </Button>
        </CardContent>
      </Card>

      {/* Modal de cambio de contraseña */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-red-600" />
              {getStepTitle()}
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              {getStepDescription()}
            </p>
          </DialogHeader>

          <div className="py-4">
            {/* Mensajes de estado */}
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {success && (
              <Alert className="border-green-200 bg-green-50 mb-4">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">{success}</AlertDescription>
              </Alert>
            )}

            {step === 'email' && (
              <form onSubmit={handleSendCode} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Correo Electrónico</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="tu@email.com"
                      value={emailData.email}
                      onChange={handleEmailChange}
                      onBlur={() => validateEmail(emailData.email)}
                      className={`pl-10 ${emailErrors.email ? 'border-destructive' : ''}`}
                      disabled={isLoading}
                      readOnly
                    />
                  </div>
                  {emailErrors.email && (
                    <p className="text-sm text-destructive">{emailErrors.email}</p>
                  )}
                </div>
              </form>
            )}

            {step === 'code' && (
              <form onSubmit={handleVerifyCode} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Código de Verificación</Label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="code"
                      type="text"
                      placeholder="123456"
                      value={codeData.code}
                      onChange={handleCodeChange}
                      onBlur={() => validateCode(codeData.code)}
                      className={`pl-10 text-center text-lg tracking-widest ${codeErrors.code ? 'border-destructive' : ''}`}
                      disabled={isLoading}
                      maxLength={6}
                    />
                  </div>
                  {codeErrors.code && (
                    <p className="text-sm text-destructive">{codeErrors.code}</p>
                  )}
                  <p className="text-xs text-muted-foreground text-center">
                    Código enviado a: <span className="font-medium">{emailData.email}</span>
                  </p>
                </div>
              </form>
            )}

            {step === 'password' && (
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nueva Contraseña</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="Ingresa tu nueva contraseña"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange('newPassword')}
                    className={passwordErrors.newPassword ? 'border-destructive' : ''}
                    disabled={isLoading}
                  />
                  {passwordErrors.newPassword && (
                    <p className="text-sm text-destructive">{passwordErrors.newPassword}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirma tu nueva contraseña"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange('confirmPassword')}
                    className={passwordErrors.confirmPassword ? 'border-destructive' : ''}
                    disabled={isLoading}
                  />
                  {passwordErrors.confirmPassword && (
                    <p className="text-sm text-destructive">{passwordErrors.confirmPassword}</p>
                  )}
                </div>
              </form>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCloseModal}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              onClick={step === 'email' ? handleSendCode : step === 'code' ? handleVerifyCode : handleChangePassword}
              disabled={isLoading}
              className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {step === 'email' ? 'Enviando...' : step === 'code' ? 'Verificando...' : 'Cambiando...'}
                </>
              ) : (
                step === 'email' ? 'Enviar Código' : step === 'code' ? 'Verificar Código' : 'Cambiar Contraseña'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ChangePasswordCard;