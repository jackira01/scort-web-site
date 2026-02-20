'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, Plus, Star } from 'lucide-react';
import { Controller } from 'react-hook-form';
import { useFormContext } from '../context/FormContext';
import type { AttributeGroup } from '../types';

interface Step2DescriptionProps {
  serviceGroup: AttributeGroup | null;
  skinGroup: AttributeGroup;
  eyeGroup: AttributeGroup;
  hairGroup: AttributeGroup;
  bodyGroup: AttributeGroup;
}

export const Step2Description = ({
  serviceGroup,
  skinGroup,
  eyeGroup,
  hairGroup,
  bodyGroup,
}: Step2DescriptionProps) => {
  const {
    register,
    control,
    formState: { errors },
    watch,
    setValue,
    getValues,
  } = useFormContext();

  const description = watch('description');
  const selectedServices = watch('selectedServices') || [];
  const basicServices = watch('basicServices') || [];
  const additionalServices = watch('additionalServices') || [];
  const formData = watch();

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
      // Si ya está en básicos, no hacer nada (no permitir desclickear)
      if (currentBasic.includes(serviceValue)) {
        return;
      }
      // Agregar a básicos y remover de adicionales
      setValue('basicServices', [...currentBasic, serviceValue]);
      setValue('additionalServices', currentAdditional.filter((s: string) => s !== serviceValue));
    } else {
      // Si ya está en adicionales, no hacer nada (no permitir desclickear)
      if (currentAdditional.includes(serviceValue)) {
        return;
      }
      // Agregar a adicionales y remover de básicos
      setValue('additionalServices', [...currentAdditional, serviceValue]);
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
        <div className="w-8 h-8 bg-gradient-to-r from-red-600 to-pink-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
          02
        </div>
        <h2 className="text-2xl font-bold text-foreground">Descripción</h2>
      </div>

      <div className="space-y-8">
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
                  value: 600,
                  message: 'La descripción no puede exceder 600 caracteres',
                },
              })}
            />
            <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
              {description?.length || 0} / 600 caracteres restantes
            </div>
          </div>
          {errors.description && (
            <div className="flex items-center gap-1 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              {errors.description.message as string}
            </div>
          )}
        </div>

        {/* Separator */}
        <div className="border-t border-border/50" />

        {/* Appearance Details & Age/Height - MOVED HERE */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="age" className="text-foreground">
                Edad <span className="text-red-500">*</span>
              </Label>
              <Controller
                name="age"
                control={control}
                render={({ field }) => (
                  <Input
                    id="age"
                    type="number"
                    step="1"
                    placeholder="23"
                    value={field.value}
                    onChange={field.onChange}
                    onInput={(e) => {
                      const input = e.target as HTMLInputElement;
                      input.value = input.value.replace(/[^0-9]/g, '');
                    }}
                    className={`mt-2 ${errors.age ? 'border-red-500 focus:border-red-500' : ''}`}
                  />
                )}
              />
              {errors.age && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.age.message as string}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="height" className="text-foreground">
                Altura <span className="text-red-500">*</span>
              </Label>
              <Input
                id="height"
                type="number"
                step="1"
                placeholder="173"
                value={formData.height}
                onChange={(e) => setValue('height', e.target.value)}
                onInput={(e) => {
                  const input = e.target as HTMLInputElement;
                  input.value = input.value.replace(/[^0-9]/g, '');
                }}
                className={`mt-2 ${errors.height ? 'border-red-500 focus:border-red-500' : ''}`}
              />
              {errors.height && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.height.message as string}
                </p>
              )}
            </div>
          </div>

          <div>
            <Label className="text-foreground text-lg font-semibold mb-4 block">
              ¿Cómo me veo?
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-foreground">Ojos <span className="text-red-500">*</span></Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {eyeGroup?.variants
                    .filter((v) => v.active)
                    .map((variant) => (
                      <Button
                        key={variant._id}
                        type="button"
                        variant={formData.eyeColor === variant.value ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setValue('eyeColor', variant.value)}
                      >
                        {variant.label || variant.value}
                      </Button>
                    ))}
                </div>
                {errors.eyeColor && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.eyeColor.message as string}
                  </p>
                )}
              </div>

              {/* Physical Characteristics */}
              <div>
                <Label className="text-foreground">Piel <span className="text-red-500">*</span></Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {skinGroup?.variants
                    .filter((v) => v.active)
                    .map((variant) => (
                      <Button
                        key={variant._id}
                        type="button"
                        variant={formData.skinColor === variant.value ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setValue('skinColor', variant.value)}
                      >
                        {variant.label || variant.value}
                      </Button>
                    ))}
                </div>
                {errors.skinColor && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.skinColor.message as string}
                  </p>
                )}
              </div>

              <div>
                <Label className="text-foreground">Pelo <span className="text-red-500">*</span></Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {hairGroup?.variants
                    .filter((v) => v.active)
                    .map((variant) => (
                      <Button
                        key={variant._id}
                        type="button"
                        variant={formData.hairColor === variant.value ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setValue('hairColor', variant.value)}
                      >
                        {variant.label || variant.value}
                      </Button>
                    ))}
                </div>
                {errors.hairColor && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.hairColor.message as string}
                  </p>
                )}
              </div>

              <div>
                <Label className="text-foreground">Cuerpo <span className="text-red-500">*</span></Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {bodyGroup?.variants
                    .filter((v) => v.active)
                    .map((variant) => (
                      <Button
                        key={variant._id}
                        type="button"
                        variant={formData.bodyType === variant.value ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setValue('bodyType', variant.value)}
                      >
                        {variant.label || variant.value}
                      </Button>
                    ))}
                </div>
                {errors.bodyType && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.bodyType.message as string}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Separator */}
        <div className="border-t border-border/50" />

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
                    {basicServices.map((service: string) => (
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
                    {additionalServices.map((service: string) => (
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


