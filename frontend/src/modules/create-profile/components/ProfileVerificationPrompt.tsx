'use client';

import { CheckCircle, Shield, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { WhatsAppRedirectModal } from './WhatsAppRedirectModal';
import { saveWhatsAppRedirectData } from '@/lib/whatsapp-redirect-storage';

interface ProfileVerificationPromptProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  profileId: string;
  profileName: string;
  whatsAppData?: {
    companyNumber: string;
    message: string;
  } | null;
}

export function ProfileVerificationPrompt({
  isOpen,
  onOpenChange,
  profileId,
  profileName,
  whatsAppData,
}: ProfileVerificationPromptProps) {
  const router = useRouter();
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);

  const handleVerifyNow = () => {
    // Si el usuario elige "Verificar ahora", siempre va directo a verificación
    // El modal de WhatsApp se mostrará DESPUÉS de enviar la verificación

    // Guardar datos de WhatsApp en localStorage si existen (para usar después de la verificación)
    if (whatsAppData) {
      saveWhatsAppRedirectData({
        companyNumber: whatsAppData.companyNumber,
        message: whatsAppData.message,
        profileId,
      });
    }

    router.push(`/cuenta/verificar-perfil/${profileId}`);
    onOpenChange(false);
  };

  const handleVerifyLater = () => {
    // Si hay factura/WhatsApp, mostrar modal de redirección
    if (whatsAppData) {
      onOpenChange(false);
      setShowWhatsAppModal(true);
    } else {
      // Si no hay WhatsApp, ir directo a /cuenta
      router.push('/cuenta');
      onOpenChange(false);
    }
  };

  const handleWhatsAppContinue = () => {
    // Abrir WhatsApp
    if (whatsAppData) {
      const whatsappUrl = `https://wa.me/${whatsAppData.companyNumber}?text=${encodeURIComponent(whatsAppData.message)}`;
      window.open(whatsappUrl, '_blank');
    }

    // Redirigir a /cuenta después de abrir WhatsApp
    setTimeout(() => {
      setShowWhatsAppModal(false);
      router.push('/cuenta');
    }, 300);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => {
        // Prevenir cierre accidental - solo permitir cierre mediante botones
        if (!open) return;
        onOpenChange(open);
      }}>
        <DialogContent
          className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto [&>button]:hidden p-4 sm:p-6"
          onInteractOutside={(e) => {
            // Prevenir cierre al hacer click fuera del modal
            e.preventDefault();
          }}
          onEscapeKeyDown={(e) => {
            // Prevenir cierre con la tecla Escape
            e.preventDefault();
          }}
        >
          <DialogHeader className="space-y-2">
            <DialogTitle className="flex items-center space-x-2 text-xl sm:text-2xl">
              <Shield className="h-6 w-6 sm:h-7 sm:w-7 text-purple-600 flex-shrink-0" />
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                ¡Perfil Creado Exitosamente!
              </span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 sm:space-y-4 pt-2 sm:pt-4">
            <div className="flex items-center justify-center py-2 sm:py-4">
              <div className="relative">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900 dark:to-emerald-900 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-10 w-10 sm:h-12 sm:w-12 text-green-600 dark:text-green-400" />
                </div>
                <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center animate-pulse">
                  <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
              </div>
            </div>

            <p className="text-center text-base sm:text-lg font-semibold text-foreground px-2">
              Tu perfil <span className="text-purple-600">"{profileName}"</span> ha sido creado
            </p>

            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200 dark:border-purple-800">
              <CardContent className="p-3 sm:p-4 space-y-2 sm:space-y-3">
                <div className="flex items-start space-x-2 sm:space-x-3">
                  <Shield className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-semibold text-sm sm:text-base text-purple-900 dark:text-purple-100">
                      ¿Quieres verificar tu perfil ahora?
                    </div>
                    <div className="text-xs sm:text-sm text-purple-800 dark:text-purple-200 mt-1">
                      La verificación aumenta tu credibilidad y confianza con los usuarios
                    </div>
                  </div>
                </div>

                <div className="bg-white/50 dark:bg-black/20 rounded-lg p-2 sm:p-3 space-y-1.5 sm:space-y-2">
                  <div className="text-xs sm:text-sm font-medium text-purple-900 dark:text-purple-100">
                    Beneficios de verificar tu perfil:
                  </div>
                  <ul className="text-xs sm:text-sm space-y-1 sm:space-y-1.5 text-purple-800 dark:text-purple-200">
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600 flex-shrink-0" />
                      <span>Mayor visibilidad en búsquedas</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600 flex-shrink-0" />
                      <span>Placa de verificación en tu perfil</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600 flex-shrink-0" />
                      <span>Más confianza de los usuarios</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600 flex-shrink-0" />
                      <span>Incrementas la posibilidad de conseguir clientes</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <div className="text-xs sm:text-sm text-muted-foreground text-center px-2">
              Si prefieres, puedes verificar tu perfil más tarde desde tu panel de cuenta
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 pt-2 sm:pt-4">
            <Button
              variant="outline"
              onClick={handleVerifyLater}
              className="w-full sm:w-auto text-sm"
            >
              Verificar más tarde
            </Button>
            <Button
              onClick={handleVerifyNow}
              className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-sm"
            >
              <Shield className="h-4 w-4 mr-2" />
              Verificar ahora
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de redirección a WhatsApp */}
      <WhatsAppRedirectModal
        isOpen={showWhatsAppModal}
        onContinue={handleWhatsAppContinue}
      />
    </>
  );
}
