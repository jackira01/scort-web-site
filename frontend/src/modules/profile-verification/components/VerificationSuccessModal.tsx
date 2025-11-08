'use client';

import { MessageCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface VerificationSuccessModalProps {
    isOpen: boolean;
    onContinue: () => void;
}

export function VerificationSuccessModal({
    isOpen,
    onContinue,
}: VerificationSuccessModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={() => {
            // No permitir cierre - solo mediante el botón Continuar
        }}>
            <DialogContent
                className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto [&>button]:hidden p-4 sm:p-6"
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
                    <DialogTitle className="flex items-center justify-center space-x-2 text-xl sm:text-2xl">
                        <CheckCircle className="h-6 w-6 sm:h-7 sm:w-7 text-green-600 flex-shrink-0" />
                        <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                            ¡Verificación Enviada!
                        </span>
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-3 sm:space-y-4 pt-2 sm:pt-4">
                    <div className="flex items-center justify-center py-2 sm:py-4">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900 dark:to-emerald-900 rounded-full flex items-center justify-center">
                            <CheckCircle className="h-12 w-12 sm:h-16 sm:w-16 text-green-600 dark:text-green-400" />
                        </div>
                    </div>

                    <div className="text-center space-y-2">
                        <DialogDescription className="text-base sm:text-lg font-semibold text-foreground">
                            Tu verificación ha sido enviada exitosamente
                        </DialogDescription>
                        <p className="text-sm text-muted-foreground">
                            Los administradores han sido notificados y revisarán tu información pronto.
                        </p>
                    </div>

                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 sm:p-4">
                        <div className="flex items-start gap-3">
                            <MessageCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                    Continuar con la compra
                                </p>
                                <p className="text-xs text-blue-800 dark:text-blue-200">
                                    Serás redirigido a nuestro chat de WhatsApp para finalizar el proceso de pago de tu plan.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="flex justify-center pt-2 sm:pt-4">
                    <Button
                        onClick={onContinue}
                        className="w-full sm:w-auto bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-sm"
                    >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Continuar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
