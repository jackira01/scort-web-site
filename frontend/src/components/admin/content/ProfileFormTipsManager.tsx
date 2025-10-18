'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Save, AlertCircle, Lightbulb, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useConfigValues, useUpdateConfigParameter } from '@/hooks/use-config-parameters';
import { toast } from 'react-hot-toast';
import Loader from '@/components/Loader';

interface TipItem {
  type: 'tip' | 'warning';
  text: string[];
}

interface StepTips {
  [key: string]: TipItem[];
}

const ProfileFormTipsManager = () => {
  const [stepTips, setStepTips] = useState<StepTips>({});
  const [saving, setSaving] = useState(false);
  const updateParameter = useUpdateConfigParameter({ showToast: false }); // Deshabilitar toast automático

  // Definir las keys específicas para cada paso
  const stepKeys = [
    'profile.form.step.1',
    'profile.form.step.2',
    'profile.form.step.3',
    'profile.form.step.4',
    'profile.form.step.5'
  ];

  const { values, loading: isLoading, error, refetch } = useConfigValues(stepKeys);

  // Cargar datos existentes
  useEffect(() => {
    if (values && Object.keys(values).length > 0) {
      const formattedTips: StepTips = {};

      stepKeys.forEach(key => {
        const stepValue = values[key];
        if (stepValue && Array.isArray(stepValue)) {
          formattedTips[key] = stepValue.map(item => ({
            type: item.type || 'tip',
            text: Array.isArray(item.text) ? item.text : [item.text || '']
          }));
        } else {
          formattedTips[key] = [];
        }
      });

      setStepTips(formattedTips);
    }
  }, [values]); // Removiendo la dependencia de stepKeys que causaba el loop infinito

  // Inicializar con arrays vacíos si no hay datos al montar el componente
  useEffect(() => {
    if (!isLoading && (!values || Object.keys(values).length === 0)) {
      const emptyTips: StepTips = {};
      stepKeys.forEach(key => {
        emptyTips[key] = [];
      });
      setStepTips(emptyTips);
    }
  }, [isLoading, values]);

  const addTip = (stepKey: string) => {
    setStepTips(prev => ({
      ...prev,
      [stepKey]: [
        ...prev[stepKey],
        { type: 'tip', text: [''] }
      ]
    }));
  };

  const removeTip = (stepKey: string, tipIndex: number) => {
    setStepTips(prev => ({
      ...prev,
      [stepKey]: prev[stepKey].filter((_, index) => index !== tipIndex)
    }));
  };

  const updateTipType = (stepKey: string, tipIndex: number, type: 'tip' | 'warning') => {
    setStepTips(prev => ({
      ...prev,
      [stepKey]: prev[stepKey].map((tip, index) =>
        index === tipIndex ? { ...tip, type } : tip
      )
    }));
  };

  const updateTipText = (stepKey: string, tipIndex: number, textIndex: number, text: string) => {
    setStepTips(prev => ({
      ...prev,
      [stepKey]: prev[stepKey].map((tip, index) =>
        index === tipIndex
          ? {
            ...tip,
            text: tip.text.map((t, tIndex) => tIndex === textIndex ? text : t)
          }
          : tip
      )
    }));
  };

  const addTextToTip = (stepKey: string, tipIndex: number) => {
    setStepTips(prev => ({
      ...prev,
      [stepKey]: prev[stepKey].map((tip, index) =>
        index === tipIndex
          ? { ...tip, text: [...tip.text, ''] }
          : tip
      )
    }));
  };

  const removeTextFromTip = (stepKey: string, tipIndex: number, textIndex: number) => {
    setStepTips(prev => ({
      ...prev,
      [stepKey]: prev[stepKey].map((tip, index) =>
        index === tipIndex
          ? { ...tip, text: tip.text.filter((_, tIndex) => tIndex !== textIndex) }
          : tip
      )
    }));
  };

  const saveTips = async () => {
    setSaving(true);
    try {
      // Preparar los datos para enviar
      const updates = Object.entries(stepTips)
        .filter(([_, tips]) => tips.length > 0) // Solo procesar steps que tienen tips
        .map(([key, tips]) => ({
          key,
          value: tips.filter(tip => tip.text.some(t => t.trim() !== '')) // Filtrar tips vacíos
        }));

      // Actualizar cada parámetro individualmente
      for (const update of updates) {
        try {
          // Obtener el parámetro existente para obtener su ID
          const parameter = await import('@/services/config-parameter.service').then(
            service => service.ConfigParameterService.getByKey(update.key)
          );

          if (parameter) {
            await updateParameter.update(parameter._id, {
              value: update.value
            });
          }
        } catch (paramError) {
          console.error(`Error updating parameter ${update.key}:`, paramError);
          // Continuar con el siguiente parámetro
        }
      }

      // Solo mostrar un toast al final cuando todo esté completado
      toast.success("Tips actualizados correctamente");

      // Refrescar los datos
      refetch();
    } catch (error) {
      console.error('Error updating tips:', error);
      toast.error("Error al actualizar los tips");
    } finally {
      setSaving(false);
    }
  };

  const getStepNumber = (stepKey: string) => {
    const match = stepKey.match(/step\.(\d+)/);
    return match ? match[1] : '';
  };

  const getStepTitle = (stepKey: string) => {
    const stepNumber = getStepNumber(stepKey);
    const titles: { [key: string]: string } = {
      '1': 'Información Básica',
      '2': 'Descripción y Servicios',
      '3': 'Contacto y Tarifas',
      '4': 'Multimedia',
      '5': 'Planes y Verificación'
    };
    return titles[stepNumber] || `Paso ${stepNumber}`;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">Error: {error}</p>
        <Button onClick={refetch} className="mt-4">
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Button
            variant="ghost"
            onClick={() => window.location.href = '/adminboard?section=contenido'}
            className="mb-2 p-0 h-auto text-muted-foreground hover:text-foreground"
          >
            ← Volver a Contenido
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Tips del Formulario de Perfil</h1>
          <p className="text-muted-foreground">
            Gestiona los consejos y advertencias que se muestran en cada paso del formulario de perfil.
          </p>
        </div>
        <Button
          onClick={saveTips}
          disabled={saving}
          className="flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
      </div>

      <Separator />

      {/* Steps */}
      <div className="space-y-6">
        {stepKeys.map((stepKey) => (
          <Card key={stepKey}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Badge variant="outline">Paso {getStepNumber(stepKey)}</Badge>
                  {getStepTitle(stepKey)}
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addTip(stepKey)}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Agregar Tip
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {stepTips[stepKey]?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Lightbulb className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No hay tips configurados para este paso.</p>
                  <p className="text-sm">Haz clic en "Agregar Tip" para comenzar.</p>
                </div>
              ) : (
                stepTips[stepKey]?.map((tip, tipIndex) => (
                  <Card key={tipIndex} className="border-l-4 border-l-blue-500">
                    <CardContent className="pt-4">
                      <div className="space-y-3">
                        {/* Tipo y botón eliminar */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Select
                              value={tip.type}
                              onValueChange={(value: 'tip' | 'warning') =>
                                updateTipType(stepKey, tipIndex, value)
                              }
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="tip">
                                  <div className="flex items-center gap-2">
                                    <Lightbulb className="h-4 w-4" />
                                    Tip
                                  </div>
                                </SelectItem>
                                <SelectItem value="warning">
                                  <div className="flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4" />
                                    Warning
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <Badge variant={tip.type === 'warning' ? 'destructive' : 'default'}>
                              {tip.type === 'warning' ? 'Advertencia' : 'Consejo'}
                            </Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeTip(stepKey, tipIndex)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Textos */}
                        <div className="space-y-2">
                          {tip.text.map((text, textIndex) => (
                            <div key={textIndex} className="flex items-center gap-2">
                              <Input
                                value={text}
                                onChange={(e) => updateTipText(stepKey, tipIndex, textIndex, e.target.value)}
                                placeholder="Escribe el texto del tip..."
                                className="flex-1"
                              />
                              {tip.text.length > 1 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeTextFromTip(stepKey, tipIndex, textIndex)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          ))}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addTextToTip(stepKey, tipIndex)}
                            className="flex items-center gap-2"
                          >
                            <Plus className="h-4 w-4" />
                            Agregar Texto
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ProfileFormTipsManager;