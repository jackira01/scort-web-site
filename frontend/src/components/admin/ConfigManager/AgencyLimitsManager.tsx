import React, { useState, useEffect } from 'react';
import { Building2, Shield, Eye, Users, RefreshCw, Save, AlertCircle } from 'lucide-react';
import { useConfigParameterByKey, useUpdateConfigParameter } from '../../../hooks/use-config-parameters';

interface AgencyLimitsConfig {
  freeProfilesMax: number;
  paidProfilesMax: number;
  totalVisibleMax: number;
  independentVerificationRequired: boolean;
}

export function AgencyLimitsManager() {
  const [config, setConfig] = useState<AgencyLimitsConfig>({
    freeProfilesMax: 5,
    paidProfilesMax: 50,
    totalVisibleMax: 55,
    independentVerificationRequired: true
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Hooks para obtener valores actuales
  const { parameter: freeProfilesData, loading: loadingFree } = useConfigParameterByKey('profiles.limits.agency.free_profiles_max');
  const { parameter: paidProfilesData, loading: loadingPaid } = useConfigParameterByKey('profiles.limits.agency.paid_profiles_max');
  const { parameter: totalVisibleData, loading: loadingTotal } = useConfigParameterByKey('profiles.limits.agency.total_visible_max');
  const { parameter: independentVerificationData, loading: loadingVerification } = useConfigParameterByKey('profiles.limits.agency.independent_verification_required');
  
  const updateParameter = useUpdateConfigParameter();

  // Cargar configuraciones actuales
  useEffect(() => {
    if (!loadingFree && !loadingPaid && !loadingTotal && !loadingVerification) {
      const newConfig = {
        freeProfilesMax: freeProfilesData?.value || 5,
        paidProfilesMax: paidProfilesData?.value || 50,
        totalVisibleMax: totalVisibleData?.value || 55,
        independentVerificationRequired: independentVerificationData?.value ?? true
      };
      setConfig(newConfig);
    }
  }, [freeProfilesData, paidProfilesData, totalVisibleData, independentVerificationData, loadingFree, loadingPaid, loadingTotal, loadingVerification]);

  const validateConfig = (newConfig: AgencyLimitsConfig): Record<string, string> => {
    const newErrors: Record<string, string> = {};

    if (newConfig.freeProfilesMax < 1) {
      newErrors.freeProfilesMax = 'Debe ser al menos 1';
    }
    if (newConfig.freeProfilesMax > 20) {
      newErrors.freeProfilesMax = 'No puede ser mayor a 20';
    }

    if (newConfig.paidProfilesMax < 1) {
      newErrors.paidProfilesMax = 'Debe ser al menos 1';
    }
    if (newConfig.paidProfilesMax > 200) {
      newErrors.paidProfilesMax = 'No puede ser mayor a 200';
    }

    if (newConfig.totalVisibleMax < (newConfig.freeProfilesMax + 1)) {
      newErrors.totalVisibleMax = `Debe ser al menos ${newConfig.freeProfilesMax + 1} (perfiles gratuitos + 1)`;
    }
    if (newConfig.totalVisibleMax > 300) {
      newErrors.totalVisibleMax = 'No puede ser mayor a 300';
    }

    // Validar que el total sea coherente
    if (newConfig.totalVisibleMax < (newConfig.freeProfilesMax + newConfig.paidProfilesMax)) {
      newErrors.totalVisibleMax = 'El total debe ser al menos la suma de perfiles gratuitos y de pago';
    }

    return newErrors;
  };

  const handleInputChange = (field: keyof AgencyLimitsConfig, value: string | boolean) => {
    const processedValue = typeof value === 'string' ? (parseInt(value) || 0) : value;
    const newConfig = { ...config, [field]: processedValue };
    
    setConfig(newConfig);
    
    // Validar en tiempo real solo para campos numéricos
    if (typeof processedValue === 'number') {
      const newErrors = validateConfig(newConfig);
      setErrors(newErrors);
    }
  };

  const handleSave = async () => {
    const validationErrors = validateConfig(config);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSaving(true);
    try {
      // Actualizar cada configuración
      const updates = [
        {
          key: 'profiles.limits.agency.free_profiles_max',
          value: config.freeProfilesMax,
          name: 'Máximo de Perfiles Gratuitos para Agencias',
          type: 'number'
        },
        {
          key: 'profiles.limits.agency.paid_profiles_max',
          value: config.paidProfilesMax,
          name: 'Máximo de Perfiles de Pago para Agencias',
          type: 'number'
        },
        {
          key: 'profiles.limits.agency.total_visible_max',
          value: config.totalVisibleMax,
          name: 'Máximo Total de Perfiles Visibles para Agencias',
          type: 'number'
        },
        {
          key: 'profiles.limits.agency.independent_verification_required',
          value: config.independentVerificationRequired,
          name: 'Verificación Independiente Requerida para Agencias',
          type: 'boolean'
        }
      ];

      for (const update of updates) {
        // Buscar el parámetro existente por clave
        const existingParam = await fetch(`/api/config-parameters/key/${update.key}`);
        
        if (existingParam.ok) {
          const paramData = await existingParam.json();
          if (paramData.success && paramData.data && paramData.data._id) {
            await updateParameter.mutateAsync({
              id: paramData.data._id,
              data: {
                value: update.value,
                name: update.name,
                type: update.type,
                category: 'profiles'
              }
            });
          } else {
            console.error('Invalid parameter data structure:', paramData);
            throw new Error(`No se pudo obtener el ID del parámetro ${update.key}`);
          }
        } else {
          console.error('Failed to fetch parameter:', update.key, existingParam.status);
          throw new Error(`No se pudo encontrar el parámetro ${update.key}`);
        }
      }

      setErrors({});
      console.log('Configuraciones de agencias actualizadas exitosamente');
    } catch (error) {
      console.error('Error al guardar configuraciones de agencias:', error);
      setErrors({ general: 'Error al guardar las configuraciones' });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setConfig({
      freeProfilesMax: freeProfilesData?.value || 5,
      paidProfilesMax: paidProfilesData?.value || 50,
      totalVisibleMax: totalVisibleData?.value || 55,
      independentVerificationRequired: independentVerificationData?.value ?? true
    });
    setErrors({});
  };

  const isLoading = loadingFree || loadingPaid || loadingTotal || loadingVerification || loading;
  const hasChanges = 
    config.freeProfilesMax !== (freeProfilesData?.value || 5) ||
    config.paidProfilesMax !== (paidProfilesData?.value || 50) ||
    config.totalVisibleMax !== (totalVisibleData?.value || 55) ||
    config.independentVerificationRequired !== (independentVerificationData?.value ?? true);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Building2 className="w-5 h-5 mr-2 text-purple-600" />
              Límites de Perfiles para Agencias
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Configura los límites específicos para cuentas de agencia
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={handleReset}
              disabled={isLoading || !hasChanges}
              className="flex items-center space-x-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Restablecer</span>
            </button>
            
            <button
              onClick={handleSave}
              disabled={isLoading || !hasChanges || Object.keys(errors).length > 0}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{saving ? 'Guardando...' : 'Guardar Cambios'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {errors.general && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-700">{errors.general}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Perfiles Gratuitos */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-green-600" />
              <label className="block text-sm font-medium text-gray-700">
                Perfiles Gratuitos
              </label>
            </div>
            <input
              type="number"
              min="1"
              max="20"
              value={config.freeProfilesMax}
              onChange={(e) => handleInputChange('freeProfilesMax', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                errors.freeProfilesMax ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Ej: 5"
            />
            {errors.freeProfilesMax && (
              <p className="text-sm text-red-600">{errors.freeProfilesMax}</p>
            )}
            <p className="text-xs text-gray-500">
              Número máximo de perfiles gratuitos para agencias
            </p>
          </div>

          {/* Perfiles de Pago */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-purple-600" />
              <label className="block text-sm font-medium text-gray-700">
                Perfiles de Pago
              </label>
            </div>
            <input
              type="number"
              min="1"
              max="200"
              value={config.paidProfilesMax}
              onChange={(e) => handleInputChange('paidProfilesMax', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                errors.paidProfilesMax ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Ej: 50"
            />
            {errors.paidProfilesMax && (
              <p className="text-sm text-red-600">{errors.paidProfilesMax}</p>
            )}
            <p className="text-xs text-gray-500">
              Número máximo de perfiles con planes de pago para agencias
            </p>
          </div>

          {/* Total Visible */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Eye className="w-5 h-5 text-blue-600" />
              <label className="block text-sm font-medium text-gray-700">
                Total Perfiles Visibles
              </label>
            </div>
            <input
              type="number"
              min={config.freeProfilesMax + 1}
              max="300"
              value={config.totalVisibleMax}
              onChange={(e) => handleInputChange('totalVisibleMax', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                errors.totalVisibleMax ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Ej: 55"
            />
            {errors.totalVisibleMax && (
              <p className="text-sm text-red-600">{errors.totalVisibleMax}</p>
            )}
            <p className="text-xs text-gray-500">
              Número máximo total de perfiles visibles para agencias
            </p>
          </div>

          {/* Verificación Independiente */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-orange-600" />
              <label className="block text-sm font-medium text-gray-700">
                Verificación Independiente
              </label>
            </div>
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={config.independentVerificationRequired}
                onChange={(e) => handleInputChange('independentVerificationRequired', e.target.checked)}
                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <span className="text-sm text-gray-700">
                Requerir verificación independiente para perfiles adicionales
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Si está habilitado, las agencias necesitarán verificación completa para cada perfil adicional
            </p>
          </div>
        </div>

        {/* Información adicional */}
        <div className="mt-8 p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <h3 className="text-sm font-medium text-purple-900 mb-2">Lógica de Negocio para Agencias</h3>
          <ul className="text-sm text-purple-800 space-y-1">
            <li>• Las agencias pueden tener hasta <strong>{config.freeProfilesMax} perfiles gratuitos</strong> (plan AMATISTA)</li>
            <li>• Las agencias pueden tener hasta <strong>{config.paidProfilesMax} perfiles con planes de pago</strong> activos</li>
            <li>• El total máximo de perfiles visibles es <strong>{config.totalVisibleMax}</strong></li>
            <li>• La verificación independiente está <strong>{config.independentVerificationRequired ? 'habilitada' : 'deshabilitada'}</strong></li>
            <li>• Las agencias deben tener conversión aprobada para crear perfiles adicionales</li>
          </ul>
        </div>

        {/* Resumen actual */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="text-2xl font-bold text-green-700">{config.freeProfilesMax}</div>
            <div className="text-sm text-green-600">Perfiles Gratuitos</div>
          </div>
          <div className="text-center p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <div className="text-2xl font-bold text-purple-700">{config.paidProfilesMax}</div>
            <div className="text-sm text-purple-600">Perfiles de Pago</div>
          </div>
          <div className="text-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-2xl font-bold text-blue-700">{config.totalVisibleMax}</div>
            <div className="text-sm text-blue-600">Total Máximo</div>
          </div>
          <div className="text-center p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="text-2xl font-bold text-orange-700">
              {config.independentVerificationRequired ? 'SÍ' : 'NO'}
            </div>
            <div className="text-sm text-orange-600">Verificación Independiente</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AgencyLimitsManager;