'use client';

import { Clock, Receipt, User, CreditCard, Calendar, Hash } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { Invoice } from '@/services/invoice.service';

interface InvoiceDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: Invoice;
}

export function InvoiceDetailsModal({ open, onOpenChange, invoice }: InvoiceDetailsModalProps) {
  const getStatusBadge = (status: Invoice['status']) => {
    const statusConfig = {
      pending: { 
        label: 'Pendiente', 
        className: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
        icon: Clock 
      },
      paid: { 
        label: 'Pagada', 
        className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        icon: CreditCard 
      },
      cancelled: { 
        label: 'Cancelada', 
        className: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
        icon: Receipt 
      },
      expired: { 
        label: 'Expirada', 
        className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
        icon: Clock 
      },
    };

    const config = statusConfig[status];
    const IconComponent = config.icon;
    
    return (
      <Badge className={`${config.className} flex items-center space-x-1`}>
        <IconComponent className="h-3 w-3" />
        <span>{config.label}</span>
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    });
  };

  const getTimeUntilExpiry = (expiresAt: string) => {
    const expirationDate = new Date(expiresAt);
    const now = new Date();
    const diffMs = expirationDate.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffMs <= 0) {
      return { text: 'Expirada', color: 'text-red-600 dark:text-red-400' };
    }
    
    if (diffHours <= 2) {
      return { 
        text: `${diffHours}h ${diffMinutes}m restantes`, 
        color: 'text-red-600 dark:text-red-400' 
      };
    }
    
    if (diffHours <= 6) {
      return { 
        text: `${diffHours}h ${diffMinutes}m restantes`, 
        color: 'text-orange-600 dark:text-orange-400' 
      };
    }
    
    return { 
      text: `${diffHours}h ${diffMinutes}m restantes`, 
      color: 'text-green-600 dark:text-green-400' 
    };
  };

  const expiryInfo = invoice.status === 'pending' ? getTimeUntilExpiry(invoice.expiresAt) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Receipt className="h-5 w-5" />
            <span>Detalles de Factura</span>
          </DialogTitle>
          <DialogDescription>
            Información completa de la factura #{invoice._id.slice(-8)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información general */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Hash className="h-4 w-4" />
                  <span>Información General</span>
                </div>
                {getStatusBadge(invoice.status)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">ID de Factura</p>
                  <p className="font-mono text-sm">{invoice._id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    ${invoice.totalAmount.toLocaleString()}
                  </p>
                </div>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Fecha de Creación</p>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{formatDate(invoice.createdAt)}</span>
                  </div>
                </div>
                
                {invoice.status === 'pending' && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Fecha de Expiración</p>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{formatDate(invoice.expiresAt)}</span>
                    </div>
                    {expiryInfo && (
                      <p className={`text-xs mt-1 ${expiryInfo.color}`}>
                        {expiryInfo.text}
                      </p>
                    )}
                  </div>
                )}
                
                {invoice.paidAt && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Fecha de Pago</p>
                    <div className="flex items-center space-x-2">
                      <CreditCard className="h-4 w-4 text-green-600" />
                      <span className="text-sm">{formatDate(invoice.paidAt)}</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Información de pago */}
          {(invoice.paymentData?.paymentMethod || invoice.paymentData?.paymentReference) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <CreditCard className="h-4 w-4" />
                  <span>Información de Pago</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {invoice.paymentData?.paymentMethod && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Método de Pago</p>
                    <p className="text-sm">{invoice.paymentData.paymentMethod}</p>
                  </div>
                )}
                
                {invoice.paymentData?.paymentReference && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Referencia de Pago</p>
                    <p className="text-sm font-mono">{invoice.paymentData.paymentReference}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Detalles de productos/servicios */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <Receipt className="h-4 w-4" />
                <span>Productos/Servicios</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {invoice.items.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{item.name}</p>
                      {item.days && (
                        <p className="text-sm text-muted-foreground">
                          Duración: {item.days} días
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        ${item.price.toLocaleString()} x {item.quantity}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Subtotal: ${(item.price * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
                
                <Separator />
                
                <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
                  <p className="font-semibold text-lg">Total</p>
                  <p className="font-bold text-xl text-primary">
                    ${invoice.totalAmount.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información adicional */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span>Información Adicional</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">ID de Usuario</p>
                  <p className="text-sm font-mono">{typeof invoice.userId === 'string' ? invoice.userId : invoice.userId._id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">ID de Perfil</p>
                  <p className="text-sm font-mono">{typeof invoice.profileId === 'string' ? invoice.profileId : invoice.profileId._id}</p>
                </div>
              </div>
              
              {invoice.isExpired && (
                <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-800 dark:text-red-200 font-medium">
                    ⚠️ Esta factura ha expirado
                  </p>
                  <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                    Las facturas expiradas no pueden ser pagadas y deben ser regeneradas.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}