'use client';

import { useFormContext } from '../context/FormContext';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, Star, Plus } from 'lucide-react';
import type { AttributeGroup } from '../types';

interface Step2DescriptionProps {
  serviceGroup: AttributeGroup | null;
}

export const Step2Description = ({ serviceGroup }: Step2DescriptionProps) => {
  const {
    register,
    formState: { errors },
    watch,
    setValue,
    getValues,
  } = useFormContext();

  const description = watch('description');
  const selectedServices = watch('selectedServices') || [];
  const basicServices = watch('basicServices') || [];
  const additionalServices = watch('additionalServices') || [];

  const handleServiceToggle = (serviceValue: string) => {
    const currentServices = getValues('selectedServices') || [];
    const updatedServices = currentServices.includes(serviceValue)
      ? currentServices.filter((s: string) => s !== serviceValue)
      : [...currentServices, serviceValue];
    setValue('selectedServices', updatedServices);

    // Si se deselecciona un servicio, también removerlo de las clasificaciones
    if (!updatedServices.includes(serviceValue)) {
      const currentBasic = getValues('basicServices') || [];
      const currentAdditional = getValues('additionalServices') || [];

      setValue('basicServices', currentBasic.filter((s: string) => s !== serviceValue));
      setValue('additionalServices', currentAdditional.filter((s: string) => s !== serviceValue));
    } else {
      // Si se selecciona un servicio, automáticamente asignarlo como básico por defecto
      const currentBasic = getValues('basicServices') || [];
      if (!currentBasic.includes(serviceValue)) {
        setValue('basicServices', [...currentBasic, serviceValue]);
      }
    }
  };

  const handleServiceClassification = (serviceValue: string, type: 'basic' | 'additional') => {
    const currentBasic = getValues('basicServices') || [];
    const currentAdditional = getValues('additionalServices') || [];

    if (type === 'basic') {
      // Agregar a básicos y remover de adicionales
      const updatedBasic = currentBasic.includes(serviceValue)
        ? currentBasic.filter((s: string) => s !== serviceValue)
        : [...currentBasic.filter((s: string) => s !== serviceValue), serviceValue];

      setValue('basicServices', updatedBasic);
      setValue('additionalServices', currentAdditional.filter((s: string) => s !== serviceValue));
    } else {
      // Agregar a adicionales y remover de básicos
      const updatedAdditional = currentAdditional.includes(serviceValue)
        ? currentAdditional.filter((s: string) => s !== serviceValue)
        : [...currentAdditional.filter((s: string) => s !== serviceValue), serviceValue];

      setValue('additionalServices', updatedAdditional);
      setValue('basicServices', currentBasic.filter((s: string) => s !== serviceValue));
    }
  };

  const getServiceClassification = (serviceValue: string) => {
    if (basicServices.includes(serviceValue)) return 'basic';
    if (additionalServices.includes(serviceValue)) return 'additional';
    return null;
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 slide-in-from-right-4 duration-500">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
          02
        </div>
        <h2 className="text-2xl font-bold text-foreground">Descripción</h2>
      </div>

      <div className="space-y-6">
        {/* Descripción */}
        <div className="space-y-2">
          <Label htmlFor="description" className="text-sm font-medium">
            Acerca de mí *
          </Label>
          <div className="relative">
            <Textarea
              id="description"
              placeholder="Describe tu personalidad, servicios y lo que te hace especial..."
              className="min-h-[120px] resize-none"
              {...register('description', {
                required: 'La descripción es requerida',
                minLength: {
                  value: 50,
                  message: 'La descripción debe tener al menos 50 caracteres',
                },
                maxLength: {
                  value: 1000,
                  message: 'La descripción no puede exceder 1000 caracteres',
                },
              })}
            />
            <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
              {description?.length || 0} / 1000 caracteres restantes
            </div>
          </div>
          {errors.description && (
            <div className="flex items-center gap-1 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              {errors.description.message as string}
            </div>
          )}
        </div>

        {/* Servicios */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Servicios *</Label>
          </div>

          {serviceGroup?.variants && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {serviceGroup.variants
                .filter((variant) => variant.active)
                .map((variant) => {
                  const isSelected = selectedServices.includes(variant.value);
                  const classification = getServiceClassification(variant.value);

                  return (
                    <div key={variant._id} className="space-y-2">
                      <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                        <Checkbox
                          id={variant._id}
                          checked={isSelected}
                          onCheckedChange={() => handleServiceToggle(variant.value)}
                        />
                        <Label
                          htmlFor={variant._id}
                          className="text-sm cursor-pointer flex-1"
                        >
                          {variant.label}
                        </Label>
                        {classification && (
                          <Badge
                            variant={classification === 'basic' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {classification === 'basic' ? 'Básico' : 'Adicional'}
                          </Badge>
                        )}
                      </div>

                      {/* Clasificación de servicios - Mostrar automáticamente cuando se selecciona */}
                      {isSelected && (
                        <div className="ml-6 flex gap-2">
                          <Button
                            type="button"
                            variant={classification === 'basic' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handleServiceClassification(variant.value, 'basic')}
                            className="text-xs flex-1"
                          >
                            <Star className="h-3 w-3 mr-1" />
                            Básico
                          </Button>
                          <Button
                            type="button"
                            variant={classification === 'additional' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handleServiceClassification(variant.value, 'additional')}
                            className="text-xs flex-1"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Adicional
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          )}

          {errors.selectedServices && (
            <div className="flex items-center gap-1 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              {errors.selectedServices.message as string}
            </div>
          )}

          {/* Resumen de clasificación */}
          {(basicServices.length > 0 || additionalServices.length > 0) && (
            <div className="mt-4 p-4 bg-muted/30 rounded-lg space-y-3">
              <h4 className="text-sm font-medium">Resumen de clasificación:</h4>

              {basicServices.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Servicios básicos ({basicServices.length}):</p>
                  <div className="flex flex-wrap gap-1">
                    {basicServices.map((service) => (
                      <Badge key={service} variant="default" className="text-xs">
                        {serviceGroup?.variants.find(v => v.value === service)?.label || service}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {additionalServices.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Servicios adicionales ({additionalServices.length}):</p>
                  <div className="flex flex-wrap gap-1">
                    {additionalServices.map((service) => (
                      <Badge key={service} variant="secondary" className="text-xs">
                        {serviceGroup?.variants.find(v => v.value === service)?.label || service}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
