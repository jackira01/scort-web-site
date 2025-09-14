'use client';

import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Button } from '../ui/button';
import { CreditCard, AlertTriangle } from 'lucide-react';
import { Badge } from '../ui/badge';

interface PaymentAlertProps {
  invoiceCount: number;
  totalAmount: number;
  onPayClick: () => void;
  className?: string;
}

export const PaymentAlert: React.FC<PaymentAlertProps> = ({
  invoiceCount,
  totalAmount,
  onPayClick,
  className = ''
}) => {
  if (invoiceCount === 0) return null;

  return (
    <Alert className={`border-orange-200 bg-orange-50 ${className}`}>
      <AlertTriangle className="h-4 w-4 text-orange-600" />
      <AlertTitle className="text-orange-800">
        Tienes facturas pendientes de pago
      </AlertTitle>
      <AlertDescription className="text-orange-700">
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2">
            <span>
              {invoiceCount} {invoiceCount === 1 ? 'factura pendiente' : 'facturas pendientes'}
            </span>
            <Badge variant="outline" className="border-orange-300 text-orange-700">
              ${totalAmount.toLocaleString()}
            </Badge>
          </div>
          <Button 
            onClick={onPayClick}
            size="sm"
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Pagar facturas
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default PaymentAlert;