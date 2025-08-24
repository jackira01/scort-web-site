'use client';

import React, { useState, useEffect } from 'react';
import { Save, RefreshCw, Users, Shield, Eye } from 'lucide-react';
import { useConfigParameterByKey, useUpdateConfigParameter } from '../../../hooks/use-config-parameters';
import type { ConfigParameter } from '../../../types/config-parameter.types';

interface ProfileLimitsConfig {
  freeProfilesMax: number;
  paidProfilesMax: number;
  totalVisibleMax: number;
}

export function ProfileLimitsManager() {
  const [config, setConfig] = useState<ProfileLimitsConfig>({
    freeProfilesMax: 3,
    paidProfilesMax: 10,
    totalVisibleMax: 13
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Hooks para obtener valores actuales
  console.log('[DEBUG] ProfileLimitsManager: Initializing hooks');
  const { parameter: freeProfilesData, loading: loadingFree, error: errorFree } = useConfigParameterByKey('profiles.limits.free_profiles_max');
  const { parameter: paidProfilesData, loading: loadingPaid, error: errorPaid } = useConfigParameterByKey('profiles.limits.paid_profiles_max');
  const { parameter: totalVisibleData, loading: loadingTotal, error: errorTotal } = useConfigParameterByKey('profiles.limits.total_visible_max');
  
  console.log('[DEBUG] ProfileLimitsManager: Hook results:', {
    freeProfilesData,
    paidProfilesData,
    totalVisibleData,
    loadingFree,
    loadingPaid,
    loadingTotal,
    errorFree,
    errorPaid,
    errorTotal
  });

  const updateParameter = useUpdateConfigParameter();

  // Cargar configuraciones actuales
  useEffect(() => {
    console.log('[DEBUG] ProfileLimitsManager useEffect triggered:', {
      loadingFree,
      loadingPaid,
      loadingTotal,
      freeProfilesData,
      paidProfilesData,
      totalVisibleData
    });
    
    if (!loadingFree && !loadingPaid && !loadingTotal) {
      console.log('[DEBUG] All loading completed, setting config');
      const newConfig = {
        freeProfilesMax: freeProfilesData?.value || 3,
        paidProfilesMax: paidProfilesData?.value || 10,
        totalVisibleMax: totalVisibleData?.value || 13
      };
      console.log('[DEBUG] New config to set:', newConfig);
      setConfig(newConfig);
    } else {
      console.log('[DEBUG] Still loading, skipping config update');
    }
  }, [freeProfilesData, paidProfilesData, totalVisibleData, loadingFree, loadingPaid, loadingTotal]);

  const validateConfig = (newConfig: ProfileLimitsConfig): Record<string, string> => {
    const newErrors: Record<string, string> = {};

    if (newConfig.freeProfilesMax < 1) {
      newErrors.freeProfilesMax = 'Debe ser al menos 1';
    }
    if (newConfig.freeProfilesMax > 10) {
      newErrors.freeProfilesMax = 'No puede ser mayor a 10';
    }

    if (newConfig.paidProfilesMax < 1) {
      newErrors.paidProfilesMax = 'Debe ser al menos 1';
    }
    if (newConfig.paidProfilesMax > 50) {
      newErrors.paidProfilesMax = 'No puede ser mayor a 50';
    }

    if (newConfig.totalVisibleMax < (newConfig.freeProfilesMax + 1)) {
      newErrors.totalVisibleMax = `Debe ser al menos ${newConfig.freeProfilesMax + 1} (perfiles gratuitos + 1)`;
    }
    if (newConfig.totalVisibleMax > 100) {
      newErrors.totalVisibleMax = 'No puede ser mayor a 100';
    }

    // Validar que el total sea coherente
    if (newConfig.totalVisibleMax < (newConfig.freeProfilesMax + newConfig.paidProfilesMax)) {
      newErrors.totalVisibleMax = 'El total debe ser al menos la suma de perfiles gratuitos y de pago';
    }

    return newErrors;
  };

  const handleInputChange = (field: keyof ProfileLimitsConfig, value: string) => {
    const numValue = parseInt(value) || 0;
    const newConfig = { ...config, [field]: numValue };
    
    setConfig(newConfig);
    
    // Validar en tiempo real
    const newErrors = validateConfig(newConfig);
    setErrors(newErrors);
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
          key: 'profiles.limits.free_profiles_max',
          value: config.freeProfilesMax,
          name: 'Máximo de Perfiles Gratuitos'
        },
        {
          key: 'profiles.limits.paid_profiles_max',
          value: config.paidProfilesMax,
          name: 'Máximo de Perfiles de Pago'
        },
        {
          key: 'profiles.limits.total_visible_max',
          value: config.totalVisibleMax,
          name: 'Máximo Total de Perfiles Visibles'
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
                type: 'number',
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
      // Mostrar mensaje de éxito (podrías usar un toast aquí)
      console.log('Configuraciones actualizadas exitosamente');
    } catch (error) {
      console.error('Error al guardar configuraciones:', error);
      setErrors({ general: 'Error al guardar las configuraciones' });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setConfig({
      freeProfilesMax: freeProfilesData?.value || 3,
      paidProfilesMax: paidProfilesData?.value || 10,
      totalVisibleMax: totalVisibleData?.value || 13
    });
    setErrors({});
  };

  const isLoading = loadingFree || loadingPaid || loadingTotal || loading;
  const hasChanges = 
    config.freeProfilesMax !== (freeProfilesData?.value || 3) ||
    config.paidProfilesMax !== (paidProfilesData?.value || 10) ||
    config.totalVisibleMax !== (totalVisibleData?.value || 13);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Users className="w-5 h-5 mr-2 text-blue-600" />
              Límites de Perfiles por Usuario
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Configura los límites máximos de perfiles que puede tener un usuario
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
              disabled={isLoading || saving || !hasChanges || Object.keys(errors).length > 0}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className={`w-4 h-4 ${saving ? 'animate-spin' : ''}`} />
              <span>{saving ? 'Guardando...' : 'Guardar Cambios'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {errors.general && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{errors.general}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Perfiles Gratuitos */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-green-600" />
              <label className="block text-sm font-medium text-gray-700">
                Perfiles Gratuitos (AMATISTA)
              </label>
            </div>
            <input
              type="number"
              min="1"
              max="10"
              value={config.freeProfilesMax}
              onChange={(e) => handleInputChange('freeProfilesMax', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.freeProfilesMax ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Ej: 3"
            />
            {errors.freeProfilesMax && (
              <p className="text-sm text-red-600">{errors.freeProfilesMax}</p>
            )}
            <p className="text-xs text-gray-500">
              Número máximo de perfiles gratuitos que puede tener un usuario
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
              max="50"
              value={config.paidProfilesMax}
              onChange={(e) => handleInputChange('paidProfilesMax', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.paidProfilesMax ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Ej: 10"
            />
            {errors.paidProfilesMax && (
              <p className="text-sm text-red-600">{errors.paidProfilesMax}</p>
            )}
            <p className="text-xs text-gray-500">
              Número máximo de perfiles con planes de pago activos
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
              max="100"
              value={config.totalVisibleMax}
              onChange={(e) => handleInputChange('totalVisibleMax', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.totalVisibleMax ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Ej: 13"
            />
            {errors.totalVisibleMax && (
              <p className="text-sm text-red-600">{errors.totalVisibleMax}</p>
            )}
            <p className="text-xs text-gray-500">
              Número máximo total de perfiles visibles (gratuitos + pagos)
            </p>
          </div>
        </div>

        {/* Información adicional */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-sm font-medium text-blue-900 mb-2">Lógica de Negocio</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Los usuarios pueden tener hasta <strong>{config.freeProfilesMax} perfiles gratuitos</strong> (plan AMATISTA)</li>
            <li>• Los usuarios pueden tener hasta <strong>{config.paidProfilesMax} perfiles con planes de pago</strong> activos</li>
            <li>• El total máximo de perfiles visibles es <strong>{config.totalVisibleMax}</strong></li>
            <li>• Si un plan de pago vence, el perfil queda inactivo hasta renovar o cambiar a gratuito</li>
            <li>• No se puede convertir un perfil vencido a gratuito si ya se alcanzó el límite de perfiles gratuitos</li>
          </ul>
        </div>

        {/* Resumen actual */}
        <div className="mt-6 grid grid-cols-3 gap-4">
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
        </div>
      </div>
    </div>
  );
}

export default ProfileLimitsManager;