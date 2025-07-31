'use client';

import { AvailabilitySchedule } from '@/components/availability/AvailabilitySchedule';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Controller } from 'react-hook-form';
import { useFormContext } from '../context/FormContext';
import type { AttributeGroup, Rate } from '../types';
import { RatesManager } from './RatesManager';

interface Step3DetailsProps {
  skinGroup: AttributeGroup;
  sexualityGroup: AttributeGroup;
  eyeGroup: AttributeGroup;
  hairGroup: AttributeGroup;
  bodyGroup: AttributeGroup;
}

export function Step3Details({
  skinGroup,
  sexualityGroup,
  eyeGroup,
  hairGroup,
  bodyGroup,
}: Step3DetailsProps) {
  const { control, watch, setValue, formState: { errors } } = useFormContext();
  const formData = watch();
  
  const handleRatesChange = (rates: Rate[]) => {
    setValue('rates', rates);
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 slide-in-from-right-4 duration-500">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
          03
        </div>
        <h2 className="text-2xl font-bold text-foreground">Detalles</h2>
      </div>

      <div className="space-y-6">
        {/* Rates Section */}
        <div>
          <RatesManager rates={formData.rates} onChange={handleRatesChange} />
          {errors.rates && (
            <p className="text-red-500 text-sm mt-2">
              {errors.rates.message}
            </p>
          )}
        </div>

        {/* Availability Section */}
        <AvailabilitySchedule
          availability={formData.availability}
          onChange={(newAvailability) =>
            setValue('availability', newAvailability)
          }
        />
        {errors.availability && (
          <p className="text-red-500 text-sm mt-1">
            {errors.availability.message}
          </p>
        )}

        {/* Contact Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="phone" className="text-foreground">
              Número de contacto <span className="text-red-500">*</span>
            </Label>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex flex-1">
                <div className="flex items-center px-3 bg-muted border border-r-0 rounded-l-md">
                  <span className="text-sm">🇨🇴</span>
                </div>
                <Controller
                  name="phoneNumber.phone"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="phone"
                      placeholder="+57 300 123 4567"
                      value={field.value}
                      onChange={field.onChange}
                      className={`rounded-l-none ${
                        errors.phoneNumber?.phone ? 'border-red-500 focus:border-red-500' : ''
                      }`}
                    />
                  )}
                />
              </div>
              
              {/* WhatsApp and Telegram checkboxes */}
              <div className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="whatsapp"
                    checked={formData.phoneNumber.whatsapp}
                    onCheckedChange={(checked) =>
                      setValue('phoneNumber.whatsapp', checked === true)
                    }
                  />
                  <Label htmlFor="whatsapp" className="text-sm text-foreground cursor-pointer">
                    WhatsApp
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="telegram"
                    checked={formData.phoneNumber.telegram}
                    onCheckedChange={(checked) =>
                      setValue('phoneNumber.telegram', checked === true)
                    }
                  />
                  <Label htmlFor="telegram" className="text-sm text-foreground cursor-pointer">
                    Telegram
                  </Label>
                </div>
              </div>
            </div>
            {errors.phoneNumber?.phone && (
              <p className="text-red-500 text-sm mt-1">
                {errors.phoneNumber.phone.message}
              </p>
            )}
          </div>

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
                  placeholder="23"
                  value={field.value}
                  onChange={field.onChange}
                  className={`mt-2 ${
                    errors.age ? 'border-red-500 focus:border-red-500' : ''
                  }`}
                />
              )}
            />
            {errors.age && (
              <p className="text-red-500 text-sm mt-1">
                {errors.age.message}
              </p>
            )}
          </div>
        </div>

        {/* Physical Characteristics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label className="text-foreground">Piel <span className="text-red-500">*</span></Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {skinGroup.variants
                .filter((v) => v.active)
                .map((variant) => (
                  <Button
                    key={variant._id}
                    variant={formData.skinColor === variant.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setValue('skinColor', variant.value)}
                  >
                    {variant.value}
                  </Button>
                ))}
            </div>
            {errors.skinColor && (
              <p className="text-red-500 text-sm mt-1">
                {errors.skinColor.message}
              </p>
            )}
          </div>

          <div>
            <Label className="text-foreground">Sexo <span className="text-red-500">*</span></Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {sexualityGroup.variants
                .filter((v) => v.active)
                .map((variant) => (
                  <Button
                    key={variant._id}
                    variant={
                      formData.sexuality === variant.value ? 'default' : 'outline'
                    }
                    size="sm"
                    onClick={() => setValue('sexuality', variant.value)}
                  >
                    {variant.value}
                  </Button>
                ))}
            </div>
            {errors.sexuality && (
              <p className="text-red-500 text-sm mt-1">
                {errors.sexuality.message}
              </p>
            )}
          </div>
        </div>

        {/* Appearance Details */}
        <div>
          <Label className="text-foreground text-lg font-semibold mb-4 block">
            ¿Cómo me veo?
          </Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="text-foreground">Ojos <span className="text-red-500">*</span></Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {eyeGroup.variants
                  .filter((v) => v.active)
                  .map((variant) => (
                    <Button
                      key={variant._id}
                      variant={
                        formData.eyeColor === variant.value ? 'default' : 'outline'
                      }
                      size="sm"
                      onClick={() => setValue('eyeColor', variant.value)}
                    >
                      {variant.value}
                    </Button>
                  ))}
              </div>
              {errors.eyeColor && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.eyeColor.message}
                </p>
              )}
            </div>

            <div>
              <Label className="text-foreground">Pelo <span className="text-red-500">*</span></Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {hairGroup.variants
                  .filter((v) => v.active)
                  .map((variant) => (
                    <Button
                      key={variant._id}
                      variant={
                        formData.hairColor === variant.value ? 'default' : 'outline'
                      }
                      size="sm"
                      onClick={() => setValue('hairColor', variant.value)}
                    >
                      {variant.value}
                    </Button>
                  ))}
              </div>
              {errors.hairColor && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.hairColor.message}
                </p>
              )}
            </div>

            <div>
              <Label className="text-foreground">Cuerpo <span className="text-red-500">*</span></Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {bodyGroup.variants
                  .filter((v) => v.active)
                  .map((variant) => (
                    <Button
                      key={variant._id}
                      variant={formData.bodyType === variant.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setValue('bodyType', variant.value)}
                    >
                      {variant.value}
                    </Button>
                  ))}
              </div>
              {errors.bodyType && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.bodyType.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="height" className="text-foreground">
                Altura <span className="text-red-500">*</span>
              </Label>
              <Input
                id="height"
                placeholder="173 cm"
                value={formData.height}
                onChange={(e) => setValue('height', e.target.value)}
                className={`mt-2 ${
                  errors.height ? 'border-red-500 focus:border-red-500' : ''
                }`}
              />
              {errors.height && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.height.message}
                </p>
              )}
            </div>
          </div>

          {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div>
              <Label htmlFor="bustSize" className="text-foreground">
                Talla del busto <span className="text-red-500">*</span>
              </Label>
              <Input
                id="bustSize"
                placeholder="COPA_D"
                value={formData.bustSize}
                onChange={(e) => setValue('bustSize', e.target.value)}
                className={`mt-2 ${
                  errors.bustSize ? 'border-red-500 focus:border-red-500' : ''
                }`}
              />
              {errors.bustSize && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.bustSize.message}
                </p>
              )}
            </div>
          </div> */}
        </div>
      </div>
    </div>
  );
}
