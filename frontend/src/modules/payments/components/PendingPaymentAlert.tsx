'use client';

import { useState } from 'react';
import { AlertTriangle, Clock, CreditCard, MessageCircle, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePendingInvoices } from '@/hooks/use-pending-invoices';
import { PayInvoicesModal } from './PayInvoicesModal';

interface PendingPaymentAlertProps {
  className?: string;
  showDismiss?: boolean;
}

export function PendingPaymentAlert({ className, showDismiss = true }: PendingPaymentAlertProps) {
  const { pendingInvoices, loading } = usePendingInvoices();
  const [isDismissed, setIsDismissed] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);

  // No mostrar si no hay facturas pendientes, está cargando o fue descartado
  if (loading || pendingInvoices.length === 0 || isDismissed) {
    return null;
  }

  const totalPendingAmount = pendingInvoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0);
  const expiringSoon = pendingInvoices.filter(invoice => {
    const expiresAt = new Date(invoice.expiresAt);
    const now = new Date();
    const hoursUntilExpiry = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursUntilExpiry <= 6 && hoursUntilExpiry > 0; // Expira en menos de 6 horas
  });

  return (
    <>
      <Alert className={`border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950 ${className}`}>
        <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
        <div className="flex items-center justify-between w-full">
          <div className="flex-1">
            <AlertDescription className="text-orange-800 dark:text-orange-200">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium">
                    Tienes {pendingInvoices.length} factura{pendingInvoices.length > 1 ? 's' : ''} pendiente{pendingInvoices.length > 1 ? 's' : ''}
                  </span>
                  <span className="ml-2 text-sm">
                    por un total de <span className="font-semibold">${totalPendingAmount.toLocaleString()}</span>
                  </span>
                  {expiringSoon.length > 0 && (
                    <div className="mt-1 flex items-center text-sm text-orange-700 dark:text-orange-300">
                      <Clock className="h-3 w-3 mr-1" />
                      {expiringSoon.length} factura{expiringSoon.length > 1 ? 's' : ''} expira{expiringSoon.length === 1 ? '' : 'n'} pronto
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    onClick={() => setShowPayModal(true)}
                    className="bg-orange-600 hover:bg-orange-700 text-white"
                  >
                    <CreditCard className="h-4 w-4 mr-1" />
                    Pagar Facturas
                  </Button>
                  {showDismiss && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setIsDismissed(true)}
                      className="text-orange-600 hover:text-orange-700 hover:bg-orange-100 dark:text-orange-400 dark:hover:text-orange-300 dark:hover:bg-orange-900"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </AlertDescription>
          </div>
        </div>
      </Alert>

      <PayInvoicesModal
        open={showPayModal}
        onOpenChange={setShowPayModal}
        invoices={pendingInvoices}
      />
    </>
  );
}

// Componente compacto para mostrar en la barra superior o sidebar
export function PendingPaymentBadge({ onClick }: { onClick?: () => void }) {
  const { pendingInvoices, loading } = usePendingInvoices();

  if (loading || pendingInvoices.length === 0) {
    return null;
  }

  const totalAmount = pendingInvoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0);

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className="relative border-orange-200 bg-orange-50 text-orange-800 hover:bg-orange-100 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-200 dark:hover:bg-orange-900"
    >
      <CreditCard className="h-4 w-4 mr-2" />
      <span className="hidden sm:inline">Facturas Pendientes</span>
      <span className="sm:hidden">Pendientes</span>
      <Badge className="ml-2 bg-orange-600 text-white hover:bg-orange-700">
        {pendingInvoices.length}
      </Badge>
      <span className="ml-1 text-xs font-medium">
        ${totalAmount.toLocaleString()}
      </span>
    </Button>
  );
}

// Componente de tarjeta detallada para dashboard
export function PendingPaymentCard() {
  const { pendingInvoices, loading } = usePendingInvoices();
  const [showPayModal, setShowPayModal] = useState(false);

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (pendingInvoices.length === 0) {
    return (
      <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
        <CardHeader>
          <CardTitle className="text-green-800 dark:text-green-200 flex items-center">
            <CreditCard className="h-5 w-5 mr-2" />
            Pagos al Día
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-green-700 dark:text-green-300 text-sm">
            No tienes facturas pendientes. ¡Excelente!
          </p>
        </CardContent>
      </Card>
    );
  }

  const totalAmount = pendingInvoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0);
  const expiringSoon = pendingInvoices.filter(invoice => {
    const expiresAt = new Date(invoice.expiresAt);
    const now = new Date();
    const hoursUntilExpiry = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursUntilExpiry <= 6 && hoursUntilExpiry > 0;
  });

  return (
    <>
      <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
        <CardHeader>
          <CardTitle className="text-orange-800 dark:text-orange-200 flex items-center justify-between">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Facturas Pendientes
            </div>
            <Badge variant="secondary" className="bg-orange-200 text-orange-800 dark:bg-orange-800 dark:text-orange-200">
              {pendingInvoices.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
              ${totalAmount.toLocaleString()}
            </p>
            <p className="text-sm text-orange-700 dark:text-orange-300">
              Total pendiente de pago
            </p>
          </div>
          
          {expiringSoon.length > 0 && (
            <div className="flex items-center text-sm text-orange-700 dark:text-orange-300">
              <Clock className="h-4 w-4 mr-1" />
              {expiringSoon.length} factura{expiringSoon.length > 1 ? 's' : ''} expira{expiringSoon.length === 1 ? '' : 'n'} en menos de 6 horas
            </div>
          )}

          <div className="flex space-x-2">
            <Button
              onClick={() => setShowPayModal(true)}
              className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Pagar Ahora
            </Button>
          </div>
        </CardContent>
      </Card>

      <PayInvoicesModal
        open={showPayModal}
        onOpenChange={setShowPayModal}
        invoices={pendingInvoices}
      />
    </>
  );
}