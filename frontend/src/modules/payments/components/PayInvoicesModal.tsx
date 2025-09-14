'use client';

import { useState } from 'react';
import { Clock, CreditCard, MessageCircle, ExternalLink, Copy, CheckCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import toast from 'react-hot-toast';
import { usePendingInvoices } from '@/hooks/use-pending-invoices';
import type { Invoice } from '@/services/invoice.service';

interface PayInvoicesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoices: Invoice[];
}

export function PayInvoicesModal({ open, onOpenChange, invoices }: PayInvoicesModalProps) {
  const { getWhatsAppData, markAsPaid } = usePendingInvoices();
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [whatsappData, setWhatsappData] = useState<any>(null);
  const [loadingWhatsApp, setLoadingWhatsApp] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [markingAsPaid, setMarkingAsPaid] = useState(false);

  const totalAmount = invoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0);

  const handleGenerateWhatsApp = async (invoice: Invoice) => {
    try {
      setLoadingWhatsApp(true);
      const data = await getWhatsAppData(invoice._id, phoneNumber || undefined);
      setWhatsappData(data);
      setSelectedInvoice(invoice);
    } catch (error) {
      console.error('Error generating WhatsApp data:', error);
    } finally {
      setLoadingWhatsApp(false);
    }
  };

  const handleOpenWhatsApp = () => {
    if (whatsappData?.whatsappUrl) {
      window.open(whatsappData.whatsappUrl, '_blank');
    }
  };

  const handleCopyMessage = async () => {
    if (whatsappData?.message) {
      try {
        await navigator.clipboard.writeText(whatsappData.message);
        toast.success('El mensaje ha sido copiado al portapapeles.');
      } catch (error) {
        toast.error('No se pudo copiar el mensaje.');
      }
    }
  };

  const handleMarkAsPaid = async (invoice: Invoice) => {
    if (!paymentMethod.trim()) {
      toast.error('Por favor ingresa el método de pago.');
      return;
    }

    try {
      setMarkingAsPaid(true);
      await markAsPaid(invoice._id, {
        paymentMethod: paymentMethod.trim(),
        paymentReference: paymentReference.trim() || undefined,
      });
      
      // Limpiar formulario
      setPaymentMethod('');
      setPaymentReference('');
      setSelectedInvoice(null);
      setWhatsappData(null);
      
      toast.success('La factura ha sido marcada como pagada exitosamente.');
    } catch (error) {
      console.error('Error marking as paid:', error);
    } finally {
      setMarkingAsPaid(false);
    }
  };

  const formatExpirationTime = (expiresAt: string) => {
    const expirationDate = new Date(expiresAt);
    const now = new Date();
    const diffMs = expirationDate.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffMs <= 0) {
      return 'Expirada';
    }

    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m restantes`;
    }
    
    return `${diffMinutes}m restantes`;
  };

  const getExpirationColor = (expiresAt: string) => {
    const expirationDate = new Date(expiresAt);
    const now = new Date();
    const diffMs = expirationDate.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffMs <= 0) return 'text-red-600 dark:text-red-400';
    if (diffHours <= 2) return 'text-red-600 dark:text-red-400';
    if (diffHours <= 6) return 'text-orange-600 dark:text-orange-400';
    return 'text-green-600 dark:text-green-400';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <CreditCard className="h-5 w-5 mr-2" />
            Pagar Facturas Pendientes
          </DialogTitle>
          <DialogDescription>
            Tienes {invoices.length} factura{invoices.length > 1 ? 's' : ''} pendiente{invoices.length > 1 ? 's' : ''} por un total de ${totalAmount.toLocaleString()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Configuración de WhatsApp */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center">
                <MessageCircle className="h-4 w-4 mr-2" />
                Configuración de WhatsApp
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="phone">Número de WhatsApp (opcional)</Label>
                <Input
                  id="phone"
                  placeholder="+57 300 123 4567"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Si no especificas un número, se usará el número de WhatsApp del negocio por defecto.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Lista de facturas */}
          <div className="space-y-4">
            <h3 className="font-medium">Facturas Pendientes</h3>
            {invoices.map((invoice) => (
              <Card key={invoice._id} className="border-l-4 border-l-orange-500">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">#{invoice._id.slice(-8)}</Badge>
                        <Badge 
                          variant={invoice.status === 'pending' ? 'secondary' : 'default'}
                          className="capitalize"
                        >
                          {invoice.status === 'pending' ? 'Pendiente' : invoice.status}
                        </Badge>
                      </div>
                      
                      <div>
                        <p className="font-medium">${invoice.totalAmount.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">
                          {invoice.items.map(item => item.name).join(', ')}
                        </p>
                      </div>
                      
                      <div className="flex items-center text-sm">
                        <Clock className="h-3 w-3 mr-1" />
                        <span className={getExpirationColor(invoice.expiresAt)}>
                          {formatExpirationTime(invoice.expiresAt)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col space-y-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleGenerateWhatsApp(invoice)}
                        disabled={loadingWhatsApp}
                        className="w-full"
                      >
                        <MessageCircle className="h-4 w-4 mr-1" />
                        {loadingWhatsApp ? 'Generando...' : 'WhatsApp'}
                      </Button>
                      
                      <Button
                        size="sm"
                        onClick={() => setSelectedInvoice(invoice)}
                        className="w-full"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Marcar Pagada
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Modal de WhatsApp */}
          {whatsappData && (
            <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
              <CardHeader>
                <CardTitle className="text-green-800 dark:text-green-200 flex items-center justify-between">
                  <div className="flex items-center">
                    <MessageCircle className="h-5 w-5 mr-2" />
                    Mensaje de WhatsApp Generado
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" onClick={handleCopyMessage}>
                      <Copy className="h-4 w-4 mr-1" />
                      Copiar
                    </Button>
                    <Button size="sm" onClick={handleOpenWhatsApp}>
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Abrir WhatsApp
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
                  <pre className="whitespace-pre-wrap text-sm font-mono">
                    {whatsappData.message}
                  </pre>
                </div>
                <p className="text-xs text-green-700 dark:text-green-300 mt-2">
                  Número de destino: {whatsappData.phoneNumber}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Formulario para marcar como pagada */}
          {selectedInvoice && !whatsappData && (
            <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
              <CardHeader>
                <CardTitle className="text-blue-800 dark:text-blue-200 flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Marcar Factura como Pagada
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="paymentMethod">Método de Pago *</Label>
                    <Input
                      id="paymentMethod"
                      placeholder="Ej: Transferencia, Efectivo, Tarjeta"
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="paymentReference">Referencia de Pago</Label>
                    <Input
                      id="paymentReference"
                      placeholder="Ej: Número de transacción"
                      value={paymentReference}
                      onChange={(e) => setPaymentReference(e.target.value)}
                    />
                  </div>
                </div>
                
                <Separator />
                
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">Factura #{selectedInvoice._id.slice(-8)}</p>
                    <p className="text-sm text-muted-foreground">
                      Total: ${selectedInvoice.totalAmount.toLocaleString()}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedInvoice(null);
                        setPaymentMethod('');
                        setPaymentReference('');
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={() => handleMarkAsPaid(selectedInvoice)}
                      disabled={markingAsPaid || !paymentMethod.trim()}
                    >
                      {markingAsPaid ? 'Procesando...' : 'Confirmar Pago'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}