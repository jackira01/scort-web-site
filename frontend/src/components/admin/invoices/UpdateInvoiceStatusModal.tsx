import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useUpdateInvoiceStatus } from '@/hooks/useUpdateInvoiceStatus';
import { Invoice } from '@/services/invoice.service';
import { formatCurrency } from '@/lib/utils';

interface UpdateInvoiceStatusModalProps {
  invoice: Invoice | null;
  isOpen: boolean;
  onClose: () => void;
}

const getStatusText = (status: string) => {
  const statusMap = {
    pending: 'Pendiente',
    paid: 'Pagada',
    cancelled: 'Cancelada',
    expired: 'Expirada'
  };
  return statusMap[status as keyof typeof statusMap] || status;
};

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case 'paid':
      return 'default' as const;
    case 'pending':
      return 'secondary' as const;
    case 'cancelled':
      return 'destructive' as const;
    case 'expired':
      return 'outline' as const;
    default:
      return 'secondary' as const;
  }
};

const UpdateInvoiceStatusModal: React.FC<UpdateInvoiceStatusModalProps> = ({
  invoice,
  isOpen,
  onClose
}) => {
  const [newStatus, setNewStatus] = useState<'pending' | 'paid' | 'cancelled' | 'expired'>('pending');
  const [reason, setReason] = useState('');
  const updateStatusMutation = useUpdateInvoiceStatus();

  const handleSubmit = async () => {
    if (!invoice) return;

    try {
      await updateStatusMutation.mutateAsync({
        invoiceId: invoice._id,
        status: newStatus,
        reason: reason.trim() || undefined
      });
      onClose();
      setReason('');
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const handleClose = () => {
    onClose();
    setReason('');
    setNewStatus('pending');
  };

  if (!invoice) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cambiar Estado de Factura</DialogTitle>
          <DialogDescription>
            Actualiza el estado de la factura seleccionada.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Información de la factura */}
          <div className="bg-gray-50 p-3 dark:bg-gray-800 rounded-lg space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">ID:</span>
              <span className="text-sm text-gray-50 dark:text-gray-400">{invoice._id}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Monto:</span>
              <span className="text-sm font-semibold">{formatCurrency(invoice.totalAmount)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Estado actual:</span>
              <Badge variant={getStatusBadgeVariant(invoice.status)} className="text-xs">
                {getStatusText(invoice.status)}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Usuario:</span>
              <span className="text-sm text-gray-600 dark:text-gray-50">{invoice.userId.name}</span>
            </div>
          </div>

          {/* Notas/Descripción de la factura (solo lectura) */}
          {invoice.notes && (
            <div className="space-y-2">
              <Label>Descripción</Label>
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {invoice.notes}
                </p>
              </div>
            </div>
          )}

          {/* Selector de nuevo estado */}
          <div className="space-y-2">
            <Label htmlFor="status">Nuevo Estado</Label>
            <Select value={newStatus} onValueChange={(value: any) => setNewStatus(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="paid">Pagada</SelectItem>
                <SelectItem value="cancelled">Cancelada</SelectItem>
                <SelectItem value="expired">Expirada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Razón del cambio */}
          {/* <div className="space-y-2">
            <Label htmlFor="reason">Razón del cambio (opcional)</Label>
            <Textarea
              id="reason"
              placeholder="Describe la razón del cambio de estado..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div> */}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={updateStatusMutation.isPending || newStatus === invoice.status}
          >
            {updateStatusMutation.isPending ? 'Actualizando...' : 'Actualizar Estado'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UpdateInvoiceStatusModal;