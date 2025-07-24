'use client';

import { AvailabilitySchedule } from '@/components/availability/AvailabilitySchedule';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormData, Rate } from '../types';
import { skinColorOptions, sexualityOptions, eyeColorOptions, hairColorOptions, bodyTypeOptions } from '../data';
import { RatesManager } from './RatesManager';

interface Step3DetailsProps {
  formData: FormData;
  onChange: (data: Partial<FormData>) => void;
}

export function Step3Details({ formData, onChange }: Step3DetailsProps) {
  const handleRatesChange = (rates: Rate[]) => {
    onChange({ rates });
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
        <RatesManager rates={formData.rates} onChange={handleRatesChange} />

        {/* Availability Section */}
        <AvailabilitySchedule
          availability={formData.availability}
          onChange={(newAvailability) => onChange({ availability: newAvailability })}
        />

        {/* Contact Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="phone" className="text-foreground">
              Número de contacto
            </Label>
            <div className="flex mt-2">
              <div className="flex items-center px-3 bg-muted border border-r-0 rounded-l-md">
                <span className="text-sm">🇨🇴</span>
              </div>
              <Input
                id="phone"
                placeholder="+57 300 123 4567"
                value={formData.phoneNumber}
                onChange={(e) => onChange({ phoneNumber: e.target.value })}
                className="rounded-l-none"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="age" className="text-foreground">
              Edad <span className="text-red-500">*</span>
            </Label>
            <Input
              id="age"
              type="number"
              placeholder="23"
              value={formData.age}
              onChange={(e) => onChange({ age: e.target.value })}
              className="mt-2"
            />
          </div>
        </div>

        {/* Physical Characteristics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label className="text-foreground">Piel</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {skinColorOptions.map((color) => (
                <Button
                  key={color}
                  variant={
                    formData.skinColor === color ? 'default' : 'outline'
                  }
                  size="sm"
                  onClick={() => onChange({ skinColor: color })}
                >
                  {color}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-foreground">Sexo</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {sexualityOptions.map((sexuality) => (
                <Button
                  key={sexuality}
                  variant={
                    formData.sexuality === sexuality ? 'default' : 'outline'
                  }
                  size="sm"
                  onClick={() => onChange({ sexuality })}
                >
                  {sexuality}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Appearance Details */}
        <div>
          <Label className="text-foreground text-lg font-semibold mb-4 block">
            ¿Cómo me veo?
          </Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="text-foreground">Ojos</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {eyeColorOptions.map((color) => (
                  <Button
                    key={color}
                    variant={
                      formData.eyeColor === color ? 'default' : 'outline'
                    }
                    size="sm"
                    onClick={() => onChange({ eyeColor: color })}
                  >
                    {color}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-foreground">Pelo</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {hairColorOptions.map((color) => (
                  <Button
                    key={color}
                    variant={
                      formData.hairColor === color ? 'default' : 'outline'
                    }
                    size="sm"
                    onClick={() => onChange({ hairColor: color })}
                  >
                    {color}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-foreground">Cuerpo</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {bodyTypeOptions.map((type) => (
                  <Button
                    key={type}
                    variant={
                      formData.bodyType === type ? 'default' : 'outline'
                    }
                    size="sm"
                    onClick={() => onChange({ bodyType: type })}
                  >
                    {type}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="height" className="text-foreground">
                Altura
              </Label>
              <Input
                id="height"
                placeholder="173 cm"
                value={formData.height}
                onChange={(e) => onChange({ height: e.target.value })}
                className="mt-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div>
              <Label htmlFor="cuerpo" className="text-foreground">
                Cuerpo
              </Label>
              <Input
                id="cuerpo"
                placeholder="Descripción del cuerpo"
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="bustSize" className="text-foreground">
                Talla del busto
              </Label>
              <Input
                id="bustSize"
                placeholder="COPA_D"
                value={formData.bustSize}
                onChange={(e) => onChange({ bustSize: e.target.value })}
                className="mt-2"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
