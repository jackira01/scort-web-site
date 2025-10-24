'use client';

import { AvailabilitySchedule } from '@/components/availability/AvailabilitySchedule';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Controller } from 'react-hook-form';
import { useFormContext } from '../context/FormContext';
import type { AttributeGroup, Rate } from '../types';
import { RatesManager } from './RatesManager';

interface Step3DetailsProps {
  skinGroup: AttributeGroup;
  eyeGroup: AttributeGroup;
  hairGroup: AttributeGroup;
  bodyGroup: AttributeGroup;
}

export function Step3Details({
  skinGroup,
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
          <RatesManager rates={formData.rates || []} onChange={handleRatesChange} />
          {errors.rates && (
            <p className="text-red-500 text-sm mt-2">
              {errors.rates.message}
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
            {errors.availability.message}
          </p>
        )}

        {/* Contact Details */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-foreground">Donde contactarme</h3>

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
                  {errors.contact.number.message}
                </p>
              )}
            </div>

            {/* WhatsApp */}
            <div>
              <Label htmlFor="whatsapp" className="text-foreground">
                WhatsApp (opcional)
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
                  {errors.contact.whatsapp.message}
                </p>
              )}
            </div>

            {/* Telegram */}
            <div>
              <Label htmlFor="telegram" className="text-foreground">
                Telegram (opcional)
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
                  {errors.contact.telegram.message}
                </p>
              )}
            </div>
          </div>
        </div>

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
                  className={`mt-2 ${errors.age ? 'border-red-500 focus:border-red-500' : ''
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
                      {variant.label || variant.value}
                    </Button>
                  ))}
              </div>
              {errors.eyeColor && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.eyeColor.message}
                </p>
              )}
            </div>

            {/* Physical Characteristics */}
            <div>
              <Label className="text-foreground">Piel <span className="text-red-500">*</span></Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {skinGroup.variants
                  .filter((v) => v.active)
                  .map((variant) => (
                    <Button
                      key={variant._id}
                      variant={
                        formData.skinColor === variant.value ? 'default' : 'outline'
                      }
                      size="sm"
                      onClick={() => setValue('skinColor', variant.value)}
                    >
                      {variant.label || variant.value}
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
                      {variant.label || variant.value}
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
                      {variant.label || variant.value}
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
                type="number"
                step="1"
                placeholder="173"
                value={formData.height}
                onChange={(e) => setValue('height', e.target.value)}
                onInput={(e) => {
                  const input = e.target as HTMLInputElement;
                  input.value = input.value.replace(/[^0-9]/g, '');
                }}
                className={`mt-2 ${errors.height ? 'border-red-500 focus:border-red-500' : ''
                  }`}
              />
              {errors.height && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.height.message}
                </p>
              )}
            </div>
          </div>

          {/* Social Media Section */}
          <div className="mt-6">
            <Label className="text-foreground text-lg font-semibold mb-4 block">
              Redes Sociales (opcional)
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Instagram */}
              <div>
                <Label htmlFor="instagram" className="text-foreground">
                  Instagram
                </Label>
                <div className="flex mt-2">
                  <div className="flex items-center px-3 bg-muted border border-r-0 rounded-l-md">
                    <span className="text-sm">📷</span>
                  </div>
                  <Controller
                    name="socialMedia.instagram"
                    control={control}
                    render={({ field }) => {
                      console.log('Instagram field:', field);
                      return (
                        <Input
                          id="instagram"
                          placeholder="@tu_usuario"
                          value={field.value || ''}
                          onChange={(e) => {
                            console.log('Instagram onChange:', e.target.value);
                            field.onChange(e.target.value);
                          }}
                          className="rounded-l-none"
                        />
                      );
                    }}
                  />
                </div>
              </div>

              {/* Facebook */}
              <div>
                <Label htmlFor="facebook" className="text-foreground">
                  Facebook
                </Label>
                <div className="flex mt-2">
                  <div className="flex items-center px-3 bg-muted border border-r-0 rounded-l-md">
                    <span className="text-sm">📘</span>
                  </div>
                  <Controller
                    name="socialMedia.facebook"
                    control={control}
                    render={({ field }) => (
                      <Input
                        id="facebook"
                        placeholder="tu.perfil"
                        value={field.value || ''}
                        onChange={field.onChange}
                        className="rounded-l-none"
                      />
                    )}
                  />
                </div>
              </div>

              {/* TikTok */}
              <div>
                <Label htmlFor="tiktok" className="text-foreground">
                  TikTok
                </Label>
                <div className="flex mt-2">
                  <div className="flex items-center px-3 bg-muted border border-r-0 rounded-l-md">
                    <span className="text-sm">🎵</span>
                  </div>
                  <Controller
                    name="socialMedia.tiktok"
                    control={control}
                    render={({ field }) => (
                      <Input
                        id="tiktok"
                        placeholder="@tu_usuario"
                        value={field.value || ''}
                        onChange={field.onChange}
                        className="rounded-l-none"
                      />
                    )}
                  />
                </div>
              </div>

              {/* Twitter */}
              <div>
                <Label htmlFor="twitter" className="text-foreground">
                  Twitter/X
                </Label>
                <div className="flex mt-2">
                  <div className="flex items-center px-3 bg-muted border border-r-0 rounded-l-md">
                    <span className="text-sm">🐦</span>
                  </div>
                  <Controller
                    name="socialMedia.twitter"
                    control={control}
                    render={({ field }) => (
                      <Input
                        id="twitter"
                        placeholder="@tu_usuario"
                        value={field.value || ''}
                        onChange={field.onChange}
                        className="rounded-l-none"
                      />
                    )}
                  />
                </div>
              </div>

              {/* OnlyFans */}
              <div className="md:col-span-2">
                <Label htmlFor="onlyFans" className="text-foreground">
                  OnlyFans
                </Label>
                <div className="flex mt-2">
                  <div className="flex items-center px-3 bg-muted border border-r-0 rounded-l-md">
                    <span className="text-sm">🔞</span>
                  </div>
                  <Controller
                    name="socialMedia.onlyFans"
                    control={control}
                    render={({ field }) => (
                      <Input
                        id="onlyFans"
                        placeholder="tu_usuario"
                        value={field.value || ''}
                        onChange={field.onChange}
                        className="rounded-l-none"
                      />
                    )}
                  />
                </div>
              </div>
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
