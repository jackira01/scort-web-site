'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building, AlertCircle } from 'lucide-react';
import AgencyConversionManager from '@/components/admin/AgencyConversionManager';
import { useAgencyConversions, useProcessConversion, useConversionStats } from '@/hooks/useAgencyConversion';
import { Alert, AlertDescription } from '@/components/ui/alert';

const AgencyConversionsPage: React.FC = () => {
  const { data: pendingRequests = [], isLoading: loadingPending, error: errorPending } = useAgencyConversions('pending');
  const { data: conversionHistory = [], isLoading: loadingHistory, error: errorHistory } = useAgencyConversions('all');
  const { data: stats, isLoading: loadingStats, error: errorStats } = useConversionStats();
  const processConversion = useProcessConversion();

  const handleProcessConversion = async (userId: string, action: 'approve' | 'reject', reason?: string) => {
    try {
      await processConversion.mutateAsync({ userId, action, reason });
    } catch (error) {
      throw error;
    }
  };

  const isLoading = loadingPending || loadingHistory || loadingStats || processConversion.isPending;
  const hasError = errorPending || errorHistory || errorStats;

  if (hasError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Error al cargar las conversiones de agencia. Por favor, intenta nuevamente.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Building className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Conversiones a Agencia</h1>
            <p className="text-gray-600 mt-1">
              Administra las solicitudes de conversión de usuarios comunes a cuentas de agencia
            </p>
          </div>
        </div>
      </div>

      {/* Información sobre el sistema híbrido */}
      <Card className="mb-8 border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-900 flex items-center gap-2">
            <Building className="w-5 h-5" />
            Sistema Híbrido de Usuarios
          </CardTitle>
        </CardHeader>
        <CardContent className="text-blue-800">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">Usuarios Comunes</h4>
              <ul className="text-sm space-y-1">
                <li>• Límite de perfiles según configuración del sistema</li>
                <li>• Verificación heredada entre perfiles del mismo usuario</li>
                <li>• Proceso de verificación simplificado para perfiles adicionales</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Agencias</h4>
              <ul className="text-sm space-y-1">
                <li>• Pueden crear múltiples perfiles independientes</li>
                <li>• Cada perfil requiere verificación individual completa</li>
                <li>• Requieren aprobación administrativa para la conversión</li>
                <li>• Deben proporcionar información empresarial válida</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gestor de conversiones */}
      {stats && (
        <AgencyConversionManager
          pendingRequests={pendingRequests.filter(req => req.conversionStatus === 'pending')}
          conversionHistory={conversionHistory.filter(req => req.conversionStatus !== 'pending')}
          stats={{
            pending: stats.pending || 0,
            approved: stats.approved || 0,
            rejected: stats.rejected || 0,
            total: (stats.pending || 0) + (stats.approved || 0) + (stats.rejected || 0)
          }}
          onProcessConversion={handleProcessConversion}
          isLoading={isLoading}
        />
      )}

      {/* Indicador de carga */}
      {isLoading && !stats && (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando conversiones...</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AgencyConversionsPage;