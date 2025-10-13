'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, XCircle, Clock, Eye, FileText, Building } from 'lucide-react';
import { DateTime } from 'luxon';

interface AgencyConversionRequest {
  _id: string;
  user: {
    _id: string;
    email: string;
    name: string;
  };
  businessName: string;
  businessDocument: string;
  conversionRequestedAt: Date;
  conversionStatus: 'pending' | 'approved' | 'rejected';
  conversionApprovedAt?: Date;
  conversionApprovedBy?: string;
  rejectionReason?: string;
}

interface ConversionStats {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}

interface AgencyConversionManagerProps {
  pendingRequests: AgencyConversionRequest[];
  conversionHistory: AgencyConversionRequest[];
  stats: ConversionStats;
  onProcessConversion: (userId: string, action: 'approve' | 'reject', reason?: string) => Promise<void>;
  isLoading?: boolean;
}

const AgencyConversionManager: React.FC<AgencyConversionManagerProps> = ({
  pendingRequests,
  conversionHistory,
  stats,
  onProcessConversion,
  isLoading = false
}) => {
  const [selectedRequest, setSelectedRequest] = useState<AgencyConversionRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleApprove = async (request: AgencyConversionRequest) => {
    setProcessingId(request._id);
    try {
      await onProcessConversion(request.user._id, 'approve');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (request: AgencyConversionRequest) => {
    if (!rejectionReason.trim()) {
      alert('Por favor, proporciona una razón para el rechazo');
      return;
    }
    
    setProcessingId(request._id);
    try {
      await onProcessConversion(request.user._id, 'reject', rejectionReason);
      setRejectionReason('');
      setSelectedRequest(null);
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600"><Clock className="w-3 h-3 mr-1" />Pendiente</Badge>;
      case 'approved':
        return <Badge variant="outline" className="text-green-600 border-green-600"><CheckCircle className="w-3 h-3 mr-1" />Aprobada</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="text-red-600 border-red-600"><XCircle className="w-3 h-3 mr-1" />Rechazada</Badge>;
      default:
        return <Badge variant="outline">Desconocido</Badge>;
    }
  };

  const RequestCard: React.FC<{ request: AgencyConversionRequest; showActions?: boolean }> = ({ request, showActions = false }) => (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Building className="w-5 h-5" />
              {request.businessName}
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Solicitado por: {request.user.name} ({request.user.email})
            </p>
          </div>
          {getStatusBadge(request.conversionStatus)}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium text-gray-700">Documento empresarial:</p>
            <p className="text-sm text-gray-600">{request.businessDocument}</p>
          </div>
          
          <div>
            <p className="text-sm font-medium text-gray-700">Fecha de solicitud:</p>
            <p className="text-sm text-gray-600">
              {DateTime.fromJSDate(new Date(request.conversionRequestedAt)).setLocale('es').toFormat('dd/MM/yyyy HH:mm')}
            </p>
          </div>

          {request.conversionApprovedAt && (
            <div>
              <p className="text-sm font-medium text-gray-700">Fecha de procesamiento:</p>
              <p className="text-sm text-gray-600">
                {DateTime.fromJSDate(new Date(request.conversionApprovedAt)).setLocale('es').toFormat('dd/MM/yyyy HH:mm')}
              </p>
            </div>
          )}

          {request.rejectionReason && (
            <div>
              <p className="text-sm font-medium text-gray-700">Razón del rechazo:</p>
              <p className="text-sm text-gray-600 bg-red-50 p-2 rounded">{request.rejectionReason}</p>
            </div>
          )}

          {showActions && request.conversionStatus === 'pending' && (
            <div className="flex gap-2 pt-3 border-t">
              <Button
                onClick={() => handleApprove(request)}
                disabled={processingId === request._id || isLoading}
                className="bg-green-600 hover:bg-green-700"
                size="sm"
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                {processingId === request._id ? 'Procesando...' : 'Aprobar'}
              </Button>
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={processingId === request._id || isLoading}
                    className="border-red-600 text-red-600 hover:bg-red-50"
                    onClick={() => setSelectedRequest(request)}
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    Rechazar
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Rechazar solicitud de conversión</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      ¿Estás seguro de que deseas rechazar la solicitud de <strong>{request.businessName}</strong>?
                    </p>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Razón del rechazo:</label>
                      <Textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Explica por qué se rechaza esta solicitud..."
                        className="mt-1"
                        rows={3}
                      />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedRequest(null);
                          setRejectionReason('');
                        }}
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={() => handleReject(request)}
                        disabled={!rejectionReason.trim() || processingId === request._id}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        {processingId === request._id ? 'Procesando...' : 'Confirmar rechazo'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pendientes</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Aprobadas</p>
                <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Rechazadas</p>
                <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <FileText className="w-8 h-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pestañas para solicitudes */}
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Solicitudes Pendientes ({stats.pending})
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Historial ({stats.approved + stats.rejected})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="pending" className="mt-6">
          <div className="space-y-4">
            {pendingRequests.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No hay solicitudes pendientes</p>
                </CardContent>
              </Card>
            ) : (
              pendingRequests.map((request) => (
                <RequestCard key={request._id} request={request} showActions={true} />
              ))
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="history" className="mt-6">
          <div className="space-y-4">
            {conversionHistory.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No hay historial de conversiones</p>
                </CardContent>
              </Card>
            ) : (
              conversionHistory.map((request) => (
                <RequestCard key={request._id} request={request} showActions={false} />
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AgencyConversionManager;