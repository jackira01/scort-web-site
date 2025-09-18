'use client';

import { AlertTriangle, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CouponConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isProcessing?: boolean;
  profileName: string;
  couponCode: string;
  couponType?: string;
  couponValue?: number;
  originalPrice?: number;
  finalPrice?: number;
  discount?: number;
  currentPlanCode?: string;
  assignedPlanCode?: string;
}

export default function CouponConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  isProcessing = false,
  profileName,
  couponCode,
  couponType,
  couponValue,
  originalPrice,
  finalPrice,
  discount,
  currentPlanCode,
  assignedPlanCode
}: CouponConfirmationModalProps) {
  
  const formatCurrency = (amount: number) => `$${amount.toLocaleString()}`;
  
  const getDiscountDescription = () => {
    if (!couponType || !couponValue) return 'Descuento aplicado';
    
    switch (couponType) {
      case 'percentage':
        return `${couponValue}% de descuento`;
      case 'fixed_amount':
        return `${formatCurrency(couponValue)} de descuento`;
      case 'plan_assignment':
        return assignedPlanCode 
          ? `Asignación de plan ${assignedPlanCode}` 
          : 'Asignación de plan gratuito';
      default:
        return 'Descuento aplicado';
    }
  };

  const getPlanChangeMessage = () => {
    if (couponType === 'plan_assignment' && currentPlanCode && assignedPlanCode) {
      return `Tu plan cambiará de ${currentPlanCode} a ${assignedPlanCode}`;
    }
    return null;
  };
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <MessageCircle className="h-5 w-5 text-green-600" />
            <span>Confirmar Aplicación</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertDescription className="text-amber-800 dark:text-amber-200">
              <strong>¿Está seguro?</strong>
              <br />
              Esta acción lo redirigirá a WhatsApp para proceder con el pago.
            </AlertDescription>
          </Alert>

          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Detalles de la aplicación:
            </h4>
            <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <p><span className="font-medium">Cupón:</span> {couponCode}</p>
              <p><span className="font-medium">Perfil:</span> {profileName}</p>
              <p><span className="font-medium">Tipo de descuento:</span> {getDiscountDescription()}</p>
              
              {/* Mostrar cambio de plan para cupones de asignación */}
              {getPlanChangeMessage() && (
                <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950/20 rounded border border-blue-200 dark:border-blue-800">
                  <p className="text-blue-800 dark:text-blue-200 font-medium text-sm">
                    📋 {getPlanChangeMessage()}
                  </p>
                </div>
              )}
              
              {originalPrice !== undefined && finalPrice !== undefined && discount !== undefined && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                  <div className="space-y-1">
                    {couponType === 'plan_assignment' ? (
                      <>
                        <p><span className="font-medium">Plan anterior:</span> {currentPlanCode || 'N/A'} - {formatCurrency(originalPrice)}</p>
                        <p className="text-green-600 dark:text-green-400">
                          <span className="font-medium">Plan nuevo:</span> {assignedPlanCode || 'N/A'} - {formatCurrency(finalPrice)}
                        </p>
                        <p className="text-green-600 dark:text-green-400 font-bold">
                          <span className="font-medium">Ahorro total:</span> {formatCurrency(discount)}
                        </p>
                      </>
                    ) : (
                      <>
                        <p><span className="font-medium">Precio original:</span> {formatCurrency(originalPrice)}</p>
                        <p className="text-green-600 dark:text-green-400">
                          <span className="font-medium">Descuento:</span> -{formatCurrency(discount)}
                        </p>
                        <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                          <span className="font-medium">Precio final:</span> {formatCurrency(finalPrice)}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="text-sm text-gray-600 dark:text-gray-400">
            <p>
              Al confirmar, se creará una factura con el descuento aplicado y 
              se generará un mensaje para WhatsApp con todos los detalles del pago.
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isProcessing}
            >
              Cancelar
            </Button>
            <Button
              onClick={onConfirm}
              disabled={isProcessing}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isProcessing ? 'Procesando...' : 'Confirmar y Continuar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}