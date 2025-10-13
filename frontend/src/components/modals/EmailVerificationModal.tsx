'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Clock, RefreshCw, Send, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import toast from 'react-hot-toast';

interface EmailVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
}

export default function EmailVerificationModal({
  isOpen,
  onClose,
  userEmail
}: EmailVerificationModalProps) {
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [codeSent, setCodeSent] = useState(false);
  const [codeExpiration, setCodeExpiration] = useState<Date | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  // Timer para el cooldown de reenvío
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (timeLeft > 0) {
      timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [timeLeft]);

  // Timer para la expiración del código
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (codeExpiration) {
      timer = setInterval(() => {
        const now = new Date();
        if (now >= codeExpiration) {
          setCodeSent(false);
          setCodeExpiration(null);
          toast.error('El código ha expirado. Solicita uno nuevo.');
        }
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [codeExpiration]);

  const handleSendCode = async () => {
    setIsSending(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/resend-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userEmail,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Código de verificación enviado a tu email');
        setCodeSent(true);
        setTimeLeft(60); // Cooldown de 60 segundos

        // Establecer expiración del código (15 minutos)
        const expiration = new Date();
        expiration.setMinutes(expiration.getMinutes() + 15);
        setCodeExpiration(expiration);
      } else {
        toast.error(result.message || 'Error al enviar el código');
      }
    } catch (error) {
      toast.error('Error al enviar el código. Inténtalo de nuevo.');
    } finally {
      setIsSending(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode.trim()) {
      toast.error('Por favor ingresa el código de verificación');
      return;
    }

    if (verificationCode.length !== 6) {
      toast.error('El código debe tener 6 dígitos');
      return;
    }

    // Verificar si el código ha expirado
    if (codeExpiration && new Date() >= codeExpiration) {
      toast.error('El código ha expirado. Solicita uno nuevo.');
      setCodeSent(false);
      setCodeExpiration(null);
      return;
    }

    setIsVerifying(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/verify-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userEmail,
          code: verificationCode,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('¡Email verificado exitosamente!');
        // Recargar la página para actualizar la sesión
        window.location.reload();
      } else {
        toast.error(result.message || 'Código de verificación inválido');
      }
    } catch (error) {
      toast.error('Error al verificar el código. Inténtalo de nuevo.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    await handleSendCode();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (codeSent) {
        handleVerifyCode();
      } else {
        handleSendCode();
      }
    }
  };

  const getTimeRemaining = () => {
    if (!codeExpiration) return null;
    const now = new Date();
    const diff = codeExpiration.getTime() - now.getTime();
    if (diff <= 0) return null;

    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="relative bg-gradient-to-r from-pink-500 to-purple-600 p-6 text-white">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/20 rounded-full">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Verificar Email</h2>
                  <p className="text-pink-100 text-sm">
                    Confirma tu dirección de correo electrónico
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {!codeSent ? (
                // Paso 1: Enviar código
                <>
                  <Alert>
                    <Mail className="h-4 w-4" />
                    <AlertDescription>
                      Para verificar tu cuenta, necesitamos enviar un código de verificación a <strong>{userEmail}</strong>.
                    </AlertDescription>
                  </Alert>

                  <Button
                    onClick={handleSendCode}
                    disabled={isSending || timeLeft > 0}
                    className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                  >
                    {isSending ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Enviando código...
                      </>
                    ) : timeLeft > 0 ? (
                      <>
                        <Clock className="w-4 h-4 mr-2" />
                        Espera {timeLeft}s para reenviar
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Enviar código
                      </>
                    )}
                  </Button>
                </>
              ) : (
                // Paso 2: Verificar código
                <>
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      Hemos enviado un código de 6 dígitos a <strong>{userEmail}</strong>.
                      {codeExpiration && (
                        <div className="mt-2 text-sm">
                          Tiempo restante: <strong>{getTimeRemaining()}</strong>
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Código de verificación
                      </label>
                      <Input
                        type="text"
                        placeholder="Ingresa el código de 6 dígitos"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        onKeyPress={handleKeyPress}
                        className="text-center text-lg tracking-widest"
                        maxLength={6}
                      />
                    </div>

                    <Button
                      onClick={handleVerifyCode}
                      disabled={isVerifying || verificationCode.length !== 6}
                      className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                    >
                      {isVerifying ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Verificando...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Verificar Email
                        </>
                      )}
                    </Button>

                    {/* Botón de reenvío */}
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-2">
                        ¿No recibiste el código?
                      </p>
                      <Button
                        variant="outline"
                        onClick={handleResendCode}
                        disabled={timeLeft > 0 || isSending}
                        className="text-sm"
                      >
                        {timeLeft > 0 ? (
                          <>
                            <Clock className="w-4 h-4 mr-2" />
                            Reenviar en {timeLeft}s
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Reenviar código
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}