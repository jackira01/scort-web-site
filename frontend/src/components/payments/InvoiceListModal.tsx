'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';
import { CreditCard, Calendar, Package, X } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface InvoiceItem {
  description: string;
  quantity: number;
  price: number;
}

interface Invoice {
  _id: string;
  invoiceNumber: string;
  status: 'pending' | 'paid' | 'expired';
  items: InvoiceItem[];
  totalAmount: number;
  createdAt: string;
  expiresAt: string;
}

interface InvoiceListModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoices: Invoice[];
  onPayInvoice: (invoiceId: string) => void;
  onPayAll: () => void;
  isLoading?: boolean;
}

export const InvoiceListModal: React.FC<InvoiceListModalProps> = ({
  isOpen,
  onClose,
  invoices,
  onPayInvoice,
  onPayAll,
  isLoading = false
}) => {
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  
  const pendingInvoices = invoices.filter(invoice => invoice.status === 'pending');
  const totalAmount = pendingInvoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0);
  
  const getStatusBadge = (status: string, expiresAt: string) => {
    const isExpired = new Date(expiresAt) < new Date();
    
    if (status === 'paid') {
      return <Badge className="bg-green-100 text-green-800 border-green-200">Pagada</Badge>;
    }
    
    if (isExpired) {
      return <Badge className="bg-red-100 text-red-800 border-red-200">Vencida</Badge>;
    }
    
    return <Badge className="bg-orange-100 text-orange-800 border-orange-200">Pendiente</Badge>;
  };
  
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd MMM yyyy, HH:mm', { locale: es });
  };
  
  const isExpiringSoon = (expiresAt: string) => {
    const expiryDate = new Date(expiresAt);
    const now = new Date();
    const hoursUntilExpiry = (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursUntilExpiry <= 6 && hoursUntilExpiry > 0;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-semibold">
                Facturas pendientes
              </DialogTitle>
              <DialogDescription>
                Gestiona tus facturas pendientes y realiza pagos
              </DialogDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Resumen */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-700">
                    {pendingInvoices.length} {pendingInvoices.length === 1 ? 'factura pendiente' : 'facturas pendientes'}
                  </p>
                  <p className="text-2xl font-bold text-blue-900">
                    ${totalAmount.toLocaleString()}
                  </p>
                </div>
                <Button 
                  onClick={onPayAll}
                  disabled={pendingInvoices.length === 0 || isLoading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Pagar todas
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Lista de facturas */}
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {invoices.map((invoice) => (
                <Card key={invoice._id} className="relative">
                  {isExpiringSoon(invoice.expiresAt) && invoice.status === 'pending' && (
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-red-100 text-red-800 border-red-200 text-xs">
                        ¡Vence pronto!
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          Factura #{invoice.invoiceNumber}
                        </CardTitle>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Creada: {formatDate(invoice.createdAt)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Vence: {formatDate(invoice.expiresAt)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        {getStatusBadge(invoice.status, invoice.expiresAt)}
                        <p className="text-xl font-bold mt-1">
                          ${invoice.totalAmount.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-2">
                      <h4 className="font-medium flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        Elementos de la factura
                      </h4>
                      {invoice.items.map((item, index) => (
                        <div key={index} className="flex justify-between items-center text-sm">
                          <span>{item.description}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-600">x{item.quantity}</span>
                            <span className="font-medium">${item.price.toLocaleString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {invoice.status === 'pending' && (
                      <>
                        <Separator className="my-3" />
                        <div className="flex justify-end">
                          <Button 
                            onClick={() => onPayInvoice(invoice._id)}
                            disabled={isLoading}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CreditCard className="h-4 w-4 mr-2" />
                            Pagar esta factura
                          </Button>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              ))}
              
              {invoices.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No tienes facturas en este momento</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceListModal;