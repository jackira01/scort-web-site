'use client';

import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface WhatsAppRedirectModalProps {
    isOpen: boolean;
    onContinue: () => void;
}

export function WhatsAppRedirectModal({
    isOpen,
    onContinue,
}: WhatsAppRedirectModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={() => {
            // No permitir cierre - solo mediante el botón Continuar
        }}>
            <DialogContent
                className="sm:max-w-[500px] [&>button]:hidden"
                onInteractOutside={(e) => {
                    // Prevenir cierre al hacer click fuera del modal
                    e.preventDefault();
                }}
                onEscapeKeyDown={(e) => {
                    // Prevenir cierre con la tecla Escape
                    e.preventDefault();
                }}
            >
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-center space-x-2 text-2xl">
                        <MessageCircle className="h-7 w-7 text-green-600" />
                        <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                            Continuar con WhatsApp
                        </span>
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 pt-4">
                    <div className="flex items-center justify-center py-4">
                        <div className="w-24 h-24 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900 dark:to-emerald-900 rounded-full flex items-center justify-center">
                            <MessageCircle className="h-16 w-16 text-green-600 dark:text-green-400" />
                        </div>
                    </div>

                    <DialogDescription className="text-center text-lg">
                        Serás redirigido a nuestro chat de WhatsApp para continuar la compra
                    </DialogDescription>

                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                        <p className="text-sm text-green-800 dark:text-green-200 text-center">
                            Al hacer clic en "Continuar", se abrirá WhatsApp en una nueva pestaña para completar el proceso de pago.
                        </p>
                    </div>
                </div>

                <DialogFooter className="flex justify-center">
                    <Button
                        onClick={onContinue}
                        className="w-full sm:w-auto bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                    >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Continuar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
