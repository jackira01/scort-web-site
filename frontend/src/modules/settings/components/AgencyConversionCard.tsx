'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle, Building2, FileText, Info, Shield } from 'lucide-react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import type { User } from '@/types/user.types';
import { useRequestAgencyConversion, type AgencyConversionRequest } from '@/hooks/useAgencyConversion';

interface AgencyConversionCardProps {
  user: User;
}

const AgencyConversionCard = ({ user }: AgencyConversionCardProps) => {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    businessName: '',
    businessDocument: '',
    reason: ''
  });
  
  const requestConversion = useRequestAgencyConversion();

  const isCommonUser = user.accountType === 'common';
  const isAgency = user.accountType === 'agency';
  const hasPendingRequest = user.agencyInfo?.conversionStatus === 'pending';
  const isApproved = user.agencyInfo?.conversionStatus === 'approved';
  const isRejected = user.agencyInfo?.conversionStatus === 'rejected';

  const handleSubmitConversion = async () => {
    if (!formData.businessName.trim() || !formData.businessDocument.trim()) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    const conversionData: AgencyConversionRequest = {
      businessName: formData.businessName,
      businessDocument: formData.businessDocument,
      reason: formData.reason || undefined
    };

    requestConversion.mutate(conversionData, {
      onSuccess: () => {
        setShowModal(false);
        setFormData({ businessName: '', businessDocument: '', reason: '' });
      }
    });
  };

  const getStatusBadge = () => {
    if (isCommonUser && !hasPendingRequest) {
      return (
        <Badge variant="outline" className="text-blue-600">
          Usuario Común
        </Badge>
      );
    }
    if (hasPendingRequest) {
      return (
        <Badge variant="outline" className="text-yellow-600">
          Conversión Pendiente
        </Badge>
      );
    }
    if (isApproved || isAgency) {
      return (
        <Badge variant="outline" className="text-green-600">
          Cuenta de Agencia
        </Badge>
      );
    }
    if (isRejected) {
      return (
        <Badge variant="outline" className="text-red-600">
          Solicitud Rechazada
        </Badge>
      );
    }
  };

  const getDescription = () => {
    if (isCommonUser && !hasPendingRequest) {
      return 'Como usuario común, todos tus perfiles comparten la misma verificación de identidad.';
    }
    if (hasPendingRequest) {
      return 'Tu solicitud de conversión está siendo revisada por nuestro equipo administrativo.';
    }
    if (isApproved || isAgency) {
      return 'Como agencia, cada perfil requiere verificación independiente de documentos.';
    }
    if (isRejected) {
      return 'Tu solicitud fue rechazada. Puedes enviar una nueva solicitud con información actualizada.';
    }
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
          {(isCommonUser && !hasPendingRequest) || isRejected ? (
            <Button
              onClick={() => setShowModal(true)}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
            >
              Cambiar a Cuenta de Agencia
            </Button>
          ) : hasPendingRequest ? (
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

      {/* Modal de conversión */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Convertir a Cuenta de Agencia
            </DialogTitle>
            <DialogDescription>
              Para convertir tu cuenta a agencia, necesitamos algunos datos adicionales.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-amber-50 dark:bg-amber-950/20 p-3 rounded-lg border border-amber-200 dark:border-amber-800">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-amber-800 dark:text-amber-200">
                  <p className="font-medium mb-1">Importante:</p>
                  <p>Como agencia, cada perfil requerirá verificación independiente con documentos de identidad de diferentes personas.</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <Label htmlFor="businessName">Nombre del Negocio *</Label>
                <Input
                  id="businessName"
                  value={formData.businessName}
                  onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
                  placeholder="Ej: Agencia de Modelos XYZ"
                />
              </div>
              
              <div>
                <Label htmlFor="businessDocument">Documento del Negocio *</Label>
                <Input
                  id="businessDocument"
                  value={formData.businessDocument}
                  onChange={(e) => setFormData(prev => ({ ...prev, businessDocument: e.target.value }))}
                  placeholder="NIT, RUT o documento legal"
                />
              </div>
              
              <div>
                <Label htmlFor="reason">Motivo de la conversión (opcional)</Label>
                <Textarea
                  id="reason"
                  value={formData.reason}
                  onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="Explica brevemente por qué necesitas una cuenta de agencia"
                  rows={3}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowModal(false)}
              disabled={requestConversion.isLoading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmitConversion}
              disabled={requestConversion.isLoading}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
            >
              {requestConversion.isLoading ? 'Enviando...' : 'Enviar Solicitud'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AgencyConversionCard;