'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertTriangle, Building2, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import type { User } from '@/types/user.types';
import { useRequestAgencyConversion, type AgencyConversionRequest } from '@/hooks/useAgencyConversion';

interface AgencyConversionCardProps {
  user: User;
}

const AgencyConversionCard = ({ user }: AgencyConversionCardProps) => {
  const [showWarningModal, setShowWarningModal] = useState(false);

  const requestConversion = useRequestAgencyConversion();

  const isCommonUser = user.accountType === 'common';
  const isAgency = user.accountType === 'agency';
  const hasAgencyInfo = user.agencyInfo !== undefined;
  const hasPendingRequest = hasAgencyInfo && user.agencyInfo?.conversionStatus === 'pending';
  const isApproved = hasAgencyInfo && user.agencyInfo?.conversionStatus === 'approved';
  const isRejected = hasAgencyInfo && user.agencyInfo?.conversionStatus === 'rejected';

  const handleAcceptConversion = async () => {
    // Datos básicos para la conversión - el servicio solo envía notificación por correo
    const conversionData: AgencyConversionRequest = {
      businessName: user.name || 'Empresa',
      businessDocument: 'Pendiente de verificación',
      reason: 'Solicitud de conversión a cuenta de agencia',
      _id: '',
      user: {
        _id: user._id || '',
        email: user.email || '',
        name: user.name || ''
      },
      conversionRequestedAt: new Date(),
      conversionStatus: 'pending'
    };

    requestConversion.mutate(conversionData, {
      onSuccess: () => {
        setShowWarningModal(false);
        toast.success('Solicitud enviada correctamente. Recibirás una notificación por correo.');
      },
      onError: () => {
        toast.error('Error al enviar la solicitud. Inténtalo nuevamente.');
      }
    });
  };

  const getStatusBadge = () => {
    // Si es agencia confirmada
    if (isAgency || isApproved) {
      return (
        <Badge variant="outline" className="text-green-600">
          Cuenta de Agencia
        </Badge>
      );
    }

    // Si tiene solicitud rechazada
    if (isRejected) {
      return (
        <Badge variant="outline" className="text-red-600">
          Solicitud Rechazada
        </Badge>
      );
    }

    // Si tiene solicitud pendiente Y existe una fecha de solicitud
    if (hasPendingRequest && user.agencyInfo?.conversionRequestedAt) {
      return (
        <Badge variant="outline" className="text-yellow-600">
          Conversión Pendiente
        </Badge>
      );
    }

    // Por defecto, usuario común (incluso si tiene agencyInfo sin solicitud válida)
    return (
      <Badge variant="outline" className="text-blue-600">
        Usuario Común
      </Badge>
    );
  };

  const getDescription = () => {
    // Si es agencia confirmada
    if (isAgency || isApproved) {
      return 'Como agencia, cada perfil requiere verificación independiente de documentos.';
    }

    // Si tiene solicitud rechazada
    if (isRejected) {
      return 'Tu solicitud fue rechazada. Puedes enviar una nueva solicitud con información actualizada.';
    }

    // Si tiene solicitud pendiente Y existe una fecha de solicitud
    if (hasPendingRequest && user.agencyInfo?.conversionRequestedAt) {
      return 'Tu solicitud de conversión está siendo revisada por nuestro equipo administrativo.';
    }

    // Por defecto, usuario común
    return 'Como usuario común, todos tus perfiles comparten la misma verificación de identidad.';
  };

  return (
    <>
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Tipo de Cuenta
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-foreground">Estado actual</span>
            {getStatusBadge()}
          </div>

          <div className="text-sm text-muted-foreground">
            {getDescription()}
          </div>

          {user.agencyInfo?.conversionRequestedAt && (
            <div className="text-xs text-muted-foreground">
              Solicitud enviada: {new Date(user.agencyInfo.conversionRequestedAt).toLocaleDateString()}
            </div>
          )}

          {user.agencyInfo?.conversionApprovedAt && (
            <div className="text-xs text-muted-foreground">
              Aprobada: {new Date(user.agencyInfo.conversionApprovedAt).toLocaleDateString()}
            </div>
          )}

          {/* Información sobre diferencias */}
          <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-blue-800 dark:text-blue-200">
                <p className="font-medium mb-1">Diferencias entre tipos de cuenta:</p>
                <ul className="space-y-1">
                  <li>• <strong>Usuario Común:</strong> Un documento verifica todos los perfiles</li>
                  <li>• <strong>Agencia:</strong> Cada perfil requiere documento independiente</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Botón de acción */}
          {(isCommonUser && (!hasAgencyInfo || !user.agencyInfo?.conversionStatus || isRejected)) ? (
            <Button
              onClick={() => setShowWarningModal(true)}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
            >
              Solicitar conversión
            </Button>
          ) : (hasPendingRequest && user.agencyInfo?.conversionRequestedAt) ? (
            <Button
              variant="outline"
              disabled
              className="w-full"
            >
              Solicitud en Revisión
            </Button>
          ) : null}
        </CardContent>
      </Card>

      {/* Modal de advertencia */}
      <Dialog open={showWarningModal} onOpenChange={setShowWarningModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              Confirmación de Conversión
            </DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <p className="text-foreground">
              Al aceptar, tu cuenta cambiará a tipo Agencia. Esta acción es irreversible. ¿Deseas continuar?
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowWarningModal(false)}
              disabled={requestConversion.isPending}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAcceptConversion}
              disabled={requestConversion.isPending}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
            >
              {requestConversion.isPending ? 'Procesando...' : 'Aceptar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AgencyConversionCard;