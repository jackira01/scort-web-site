'use client';

import { AvailabilitySchedule } from '@/components/availability/AvailabilitySchedule';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle } from 'lucide-react';
import { Controller } from 'react-hook-form';
import { useFormContext } from '../context/FormContext';
import { Rate } from '../types';
import { RatesManager } from './RatesManager';

interface Step3DetailsProps {
  isEditing?: boolean;
}

export function Step3Details({
  isEditing = false,
}: Step3DetailsProps) {
  const { control, watch, setValue, formState: { errors } } = useFormContext();
  const formData = watch();

  const handleRatesChange = (rates: Rate[]) => {
    setValue('rates', rates);
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 slide-in-from-right-4 duration-500">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-8 h-8 bg-gradient-to-r from-red-600 to-pink-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
          03
        </div>
        <h2 className="text-2xl font-bold text-foreground">Detalles</h2>
      </div>

      <div className="space-y-6">
        {/* Contact Details */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-foreground">Donde contactarme</h3>
          <p className="text-sm text-muted-foreground -mt-2">
            Debes proporcionar al menos un método de contacto
          </p>

          {isEditing && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-500 shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-700 dark:text-yellow-400">
                <p className="font-semibold mb-1">Advertencia de Verificación</p>
                <p>
                  Si modificas tu número de contacto principal, tu estado de verificación de "Confiabilidad de numero de contacto" (si ya estás verificado)
                  se vera afectado y será necesario volver a realizar el proceso de validación.
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Número de contacto */}
            <div>
              <Label htmlFor="phone" className="text-foreground">
                Número de contacto
              </Label>
              <div className="flex mt-2">
                <div className="flex items-center px-3 bg-muted border border-r-0 rounded-l-md">
                  <span className="text-sm">🇨🇴</span>
                </div>
                <Controller
                  name="contact.number"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="phone"
                      placeholder="3001234567"
                      value={field.value}
                      onChange={field.onChange}
                      className={`rounded-l-none ${errors.contact?.number ? 'border-red-500 focus:border-red-500' : ''
                        }`}
                    />
                  )}
                />
              </div>
              {errors.contact?.number && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.contact.number.message as string}
                </p>
              )}
            </div>

            {/* WhatsApp */}
            <div>
              <Label htmlFor="whatsapp" className="text-foreground">
                WhatsApp
              </Label>
              <div className="flex mt-2">
                <div className="flex items-center px-3 bg-muted border border-r-0 rounded-l-md">
                  <span className="text-sm">📱</span>
                </div>
                <Controller
                  name="contact.whatsapp"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="whatsapp"
                      placeholder="3001234567"
                      value={field.value || ''}
                      onChange={field.onChange}
                      className={`rounded-l-none ${errors.contact?.whatsapp ? 'border-red-500 focus:border-red-500' : ''
                        }`}
                    />
                  )}
                />
              </div>
              {errors.contact?.whatsapp && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.contact.whatsapp.message as string}
                </p>
              )}
            </div>

            {/* Telegram */}
            <div>
              <Label htmlFor="telegram" className="text-foreground">
                Telegram
              </Label>
              <div className="flex mt-2">
                <div className="flex items-center px-3 bg-muted border border-r-0 rounded-l-md">
                  <span className="text-sm">✈️</span>
                </div>
                <Controller
                  name="contact.telegram"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="telegram"
                      placeholder="3001234567"
                      value={field.value || ''}
                      onChange={field.onChange}
                      className={`rounded-l-none ${errors.contact?.telegram ? 'border-red-500 focus:border-red-500' : ''
                        }`}
                    />
                  )}
                />
              </div>
              {errors.contact?.telegram && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.contact.telegram.message as string}
                </p>
              )}
            </div>
          </div>

          {/* Error general de contacto (cuando no se proporciona ninguno) */}
          {errors.contact && typeof errors.contact.message === 'string' && (
            <p className="text-red-500 text-sm mt-2">
              {errors.contact.message}
            </p>
          )}
        </div>

        {/* Rates Section */}
        <div>
          <RatesManager
            rates={formData.rates || []}
            onChange={handleRatesChange}
            deposito={formData.deposito}
            onDepositChange={(value) => setValue('deposito', value, { shouldValidate: true, shouldDirty: true, shouldTouch: true })}
          />
          {errors.rates && (
            <p className="text-red-500 text-sm mt-2">
              {errors.rates.message as string}
            </p>
          )}
        </div>

        {/* Availability Section */}
        <AvailabilitySchedule
          availability={formData.availability || []}
          onChange={(newAvailability) =>
            setValue('availability', newAvailability)
          }
        />
        {errors.availability && (
          <p className="text-red-500 text-sm mt-1">
            {errors.availability.message as string}
          </p>
        )}
      </div>
    </div>
  );
}

