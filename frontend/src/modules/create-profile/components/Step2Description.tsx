'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Controller } from 'react-hook-form';
import { useFormContext } from '../context/FormContext';
import type { AttributeGroup, Variant } from '../types';

interface Step2DescriptionProps {
  serviceGroup: AttributeGroup;
}

export function Step2Description({
  serviceGroup,
}: Step2DescriptionProps) {
  const { control, watch, setValue } = useFormContext();
  const formData = watch();
  const handleServiceToggle = (service: string) => {
    const selectedServices = formData.selectedServices.includes(service)
      ? formData.selectedServices.filter((s) => s !== service)
      : [...formData.selectedServices, service];

    setValue('selectedServices', selectedServices);
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
        <div>
          <div className="flex justify-between items-center mb-2">
            <Label htmlFor="description" className="text-foreground">
              Acerca de mí <span className="text-red-500">*</span>
            </Label>
            <span className="text-sm text-muted-foreground">
              {formData.description.length} / 1000 caracteres restantes
            </span>
          </div>
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <Textarea
                id="description"
                placeholder="Cuéntanos sobre ti, tus intereses, personalidad y lo que te hace especial..."
                value={field.value}
                onChange={field.onChange}
                className="min-h-32"
                maxLength={1000}
              />
            )}
          />
        </div>

        <div>
          <Label className="text-foreground text-lg font-semibold mb-4 block">
            Servicios
          </Label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {serviceGroup.variants
              .filter((variant: Variant) => variant.active)
              .map((service: Variant) => (
                <div key={service.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={service.value}
                    checked={formData.selectedServices.includes(service.value)}
                    onCheckedChange={() => handleServiceToggle(service.value)}
                  />
                  <Label
                    htmlFor={service.value}
                    className="text-sm text-foreground cursor-pointer"
                  >
                    {service.value}
                  </Label>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
