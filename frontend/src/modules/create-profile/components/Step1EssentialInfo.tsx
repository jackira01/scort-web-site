'use client';

import { CheckCircle, Plus, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormData } from '../types';
import { genderOptions, workTypeOptions } from '../data';

interface Step1EssentialInfoProps {
  formData: FormData;
  onChange: (data: Partial<FormData>) => void;
}

export function Step1EssentialInfo({ formData, onChange }: Step1EssentialInfoProps) {
  return (
    <div className="space-y-6 animate-in fade-in-50 slide-in-from-right-4 duration-500">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
          01
        </div>
        <h2 className="text-2xl font-bold text-foreground">
          Crear un nuevo perfil
        </h2>
      </div>

      <div className="space-y-6">
        <div>
          <Label htmlFor="profileName" className="text-foreground">
            Cree un nombre para mostrar para su perfil.{' '}
            <span className="text-red-500">*</span>
          </Label>
          <Input
            id="profileName"
            placeholder="Sexy Jane"
            value={formData.profileName}
            onChange={(e) => onChange({ profileName: e.target.value })}
            className="mt-2"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label className="text-foreground">
              Mi género es <span className="text-red-500">*</span>
            </Label>
            <div className="flex space-x-2 mt-2">
              {genderOptions.map((gender) => (
                <Button
                  key={gender}
                  variant={
                    formData.gender === gender ? 'default' : 'outline'
                  }
                  onClick={() => onChange({ gender })}
                  className={
                    formData.gender === gender
                      ? 'bg-green-600 hover:bg-green-700'
                      : ''
                  }
                >
                  {formData.gender === gender && (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  {gender}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-foreground">trabajo para</Label>
            <div className="flex space-x-2 mt-2">
              {workTypeOptions.map((type) => (
                <Button
                  key={type}
                  variant={
                    formData.workType === type ? 'default' : 'outline'
                  }
                  onClick={() => onChange({ workType: type })}
                  className={
                    formData.workType === type
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : ''
                  }
                >
                  {type}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <Label className="text-foreground">
            ¿Dónde quieres que se muestre tu anuncio?{' '}
            <span className="text-red-500">*</span>
          </Label>
          <Button variant="outline" className="mt-2 w-full justify-start">
            <Plus className="h-4 w-4 mr-2" />
            Categoría
          </Button>
        </div>

        <div>
          <Label className="text-foreground">
            ¿Dónde te encuentras? <span className="text-red-500">*</span>
          </Label>
          <div className="mt-2 border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 text-center">
            <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">Cambio</p>
          </div>
        </div>
      </div>
    </div>
  );
}
