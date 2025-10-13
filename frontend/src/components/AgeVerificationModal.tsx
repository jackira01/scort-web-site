"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Shield, Calendar } from 'lucide-react';

interface AgeVerificationModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onDeny: () => void;
}

const AgeVerificationModal: React.FC<AgeVerificationModalProps> = ({
  isOpen,
  onConfirm,
  onDeny,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto shadow-2xl border-2">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Shield className="h-16 w-16 text-primary" />
              <AlertTriangle className="h-6 w-6 text-yellow-500 absolute -top-1 -right-1" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">
            Verificación de Edad
          </CardTitle>
          <CardDescription className="text-base text-muted-foreground">
            Este sitio web contiene contenido para adultos
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-primary flex-shrink-0" />
              <p className="text-sm font-medium">
                Debes ser mayor de 18 años para acceder a este contenido
              </p>
            </div>
            <p className="text-xs text-muted-foreground ml-8">
              Al confirmar, declaras que tienes al menos 18 años de edad y que tienes 
              la capacidad legal para acceder a contenido para adultos en tu jurisdicción.
            </p>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Advertencia Legal
                </p>
                <p className="text-xs text-yellow-700 dark:text-yellow-300">
                  El acceso a menores de edad está estrictamente prohibido. 
                  Si eres menor de 18 años, debes abandonar este sitio inmediatamente.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={onConfirm}
              className="w-full h-12 text-base font-semibold"
              size="lg"
            >
              Soy mayor de 18 años - Continuar
            </Button>
            
            <Button 
              onClick={onDeny}
              variant="outline"
              className="w-full h-12 text-base"
              size="lg"
            >
              Soy menor de 18 años - Salir
            </Button>
          </div>

          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Esta verificación se recordará durante 1 año en este dispositivo
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AgeVerificationModal;