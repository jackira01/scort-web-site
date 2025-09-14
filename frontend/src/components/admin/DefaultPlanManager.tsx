'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Settings, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usePlans } from '@/hooks/usePlans';
import toast from 'react-hot-toast';
import { useConfigValue } from '@/hooks/use-config-parameters';
import { ConfigParameterService } from '@/services/config-parameter.service';
import { AxiosError } from 'axios';

// Types
interface Plan {
  _id: string;
  name: string;
  code: string;
  variants: PlanVariant[];
  isActive: boolean;
}

interface PlanVariant {
  price: number;
  days: number;
  durationRank: number;
}

interface DefaultPlanConfig {
  enabled: boolean;
  planId: string | null;
  planCode: string | null;
}

// API functions

const updateDefaultPlanConfig = async (config: DefaultPlanConfig): Promise<void> => {
  try {
    const existingParam = await ConfigParameterService.getByKey('system.default_plan', false);
    
    if (existingParam) {
      const updateData = {
        value: config,
        isActive: true
      };
      
      await ConfigParameterService.update(existingParam._id, updateData);
    } else {
      const createData = {
        key: 'system.default_plan',
        name: 'Plan por Defecto',
        value: config,
        type: 'object',
        category: 'system',
        metadata: {
          description: 'Configuración del plan por defecto para nuevos perfiles'
        }
      };
      
      await ConfigParameterService.create(createData);
    }
  } catch (error) {
    if (error instanceof AxiosError && error.response?.status === 404) {
      try {
        const createData = {
          key: 'system.default_plan',
          name: 'Plan por Defecto',
          value: config,
          type: 'object',
          category: 'system',
          metadata: {
            description: 'Configuración del plan por defecto para nuevos perfiles'
          },
          isActive: true
        };
        
        await ConfigParameterService.create(createData);
      } catch (createError) {
        throw createError;
      }
    } else {
      throw error;
    }
  }
};

export default function DefaultPlanManager() {
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const queryClient = useQueryClient();
  


  // Queries
  const { data: plansResponse, isLoading: plansLoading } = usePlans({
    limit: 10,
    page: 1,
    isActive: true
  });
  const plans = plansResponse?.plans || [];
  


  const { value: defaultConfig, loading: configLoading } = useConfigValue<DefaultPlanConfig>(
    'system.default_plan',
    {
      enabled: true,
      defaultValue: { enabled: false, planId: null, planCode: null }
    }
  );

  // Mutations
  const updateConfigMutation = useMutation({
    mutationFn: updateDefaultPlanConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config-parameters', 'values', 'system.default_plan'] });
      queryClient.invalidateQueries({ queryKey: ['config-parameters'] });
      toast.success('Configuración actualizada correctamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || error?.message || 'Error al actualizar la configuración');
    },
  });


  
  // Get selected plan details
  const selectedPlan = plans.find(plan => plan._id === (selectedPlanId || defaultConfig?.planId));
  // Mostrar solo planes activos en el selector, pero permitir que el plan seleccionado sea inactivo
  const activePlans = plans.filter(plan => plan.isActive);
  


  const handleToggleEnabled = async (enabled: boolean) => {
    if (enabled && !selectedPlan) {
      toast.error('Debe seleccionar un plan antes de habilitar');
      return;
    }
    
    if (defaultConfig?.enabled === enabled) {
      return;
    }
    
    const newConfig: DefaultPlanConfig = {
      enabled,
      planId: enabled ? (selectedPlanId || defaultConfig?.planId || null) : null,
      planCode: enabled && selectedPlan ? selectedPlan.code : null,
    };
    
    updateConfigMutation.mutate(newConfig);
  };

  const handlePlanChange = (planId: string) => {
    setSelectedPlanId(planId);
    const plan = plans.find(p => p._id === planId);
    
    if (plan && defaultConfig?.enabled) {
      if (defaultConfig?.planId === planId) {
        return;
      }
      
      const newConfig: DefaultPlanConfig = {
        enabled: true,
        planId: planId,
        planCode: plan.code,
      };
      
      updateConfigMutation.mutate(newConfig);
    }
  };

  const isLoading = plansLoading || configLoading || updateConfigMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Settings className="h-6 w-6 text-purple-600" />
        <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Plan por Defecto
        </h1>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Configura si los nuevos perfiles creados deben tener asignado automáticamente un plan por defecto.
          Esto permite que los usuarios tengan acceso inmediato a las funcionalidades básicas de la plataforma.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>Configuración del Plan por Defecto</span>
            {defaultConfig?.enabled && (
              <Badge variant="default" className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Activo
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Cuando esté habilitado, todos los nuevos perfiles creados tendrán asignado automáticamente el plan seleccionado.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
              <span className="ml-2 text-muted-foreground">Cargando configuración...</span>
            </div>
          ) : (
            <>
              {/* Toggle para habilitar/deshabilitar */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <Label htmlFor="enable-default-plan" className="text-base font-medium">
                    Habilitar Plan por Defecto
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Asignar automáticamente un plan a los nuevos perfiles
                  </p>
                </div>
                <Switch
                  id="enable-default-plan"
                  checked={defaultConfig?.enabled || false}
                  onCheckedChange={handleToggleEnabled}
                  disabled={updateConfigMutation.isPending}
                />
              </div>

              {/* Selector de plan */}
              {defaultConfig?.enabled && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="plan-select" className="text-base font-medium">
                      Seleccionar Plan
                    </Label>
                    <Select
                      value={selectedPlanId || defaultConfig?.planId || ''}
                      onValueChange={handlePlanChange}
                      disabled={updateConfigMutation.isPending}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un plan por defecto" />
                      </SelectTrigger>
                      <SelectContent>
                        {activePlans.map((plan) => (
                          <SelectItem key={plan._id} value={plan._id}>
                            <div className="flex items-center space-x-2">
                              <span>{plan.name}</span>
                              <Badge variant="outline" className="text-xs">
                                {plan.code}
                              </Badge>
                              {!plan.isActive && (
                                <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600">
                                  Inactivo
                                </Badge>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Detalles del plan seleccionado */}
                  {selectedPlan && (
                    <Card className="bg-muted/50">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center space-x-2">
                          <span>{selectedPlan.name}</span>
                          <Badge variant="outline">{selectedPlan.code}</Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                            Variantes Disponibles
                          </h4>
                          <div className="grid gap-3">
                            {selectedPlan.variants.map((variant, index) => (
                              <div key={index} className="flex items-center justify-between p-3 bg-background rounded-lg border">
                                <div>
                                  <p className="font-medium">Variante {variant.durationRank}</p>
                                  <p className="text-sm text-muted-foreground">
                                    ${variant.price.toLocaleString()} - {variant.days} días
                                  </p>
                                </div>
                                <div className="text-right">
                                  <div className="text-xs text-muted-foreground">
                                    <div>Duración: {variant.days} días</div>
                                    <div>Rango: {variant.durationRank}</div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* Estado actual */}
              <div className="p-4 bg-muted/30 rounded-lg">
                <h4 className="font-medium mb-2 flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4" />
                  <span>Estado Actual</span>
                </h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>
                    <strong>Plan por defecto:</strong>{' '}
                    {defaultConfig?.enabled ? (
                      <span className="text-green-600 font-medium">
                        Habilitado {selectedPlan && `(${selectedPlan.name})`}
                      </span>
                    ) : (
                      <span className="text-gray-600">Deshabilitado</span>
                    )}
                  </p>
                  <p>
                    <strong>Planes activos disponibles:</strong> {activePlans.length}
                  </p>
                  {defaultConfig?.enabled && !selectedPlan && (
                    <p className="text-amber-600 font-medium">
                      ⚠️ Plan por defecto habilitado pero no se ha seleccionado ningún plan
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}