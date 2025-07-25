'use client';

import { CheckCircle, Loader } from 'lucide-react';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useVerifyProfileName } from '@/hooks/use-check-profile-name';
import { colombiaDepartments } from '../colombiaData';
import type { FormData } from '../types';

interface Variant {
  _id: string;
  value: string;
  active: boolean;
}

interface AttributeGroup {
  _id: string;
  name: string;
  key: string;
  variants: Variant[];
}

interface Step1EssentialInfoProps {
  formData: FormData;
  onChange: (data: Partial<FormData>) => void;
  genderGroup: AttributeGroup;
  categoryGroup: AttributeGroup;
  onValidName: (isValid: boolean) => void;
}

export function Step1EssentialInfo({
  formData,
  onChange,
  genderGroup,
  categoryGroup,
  onValidName,
}: Step1EssentialInfoProps) {
  const {
    data: isAvailable,
    isFetching,
    refetch,
  } = useVerifyProfileName(formData.profileName);

  useEffect(() => {
    if (isAvailable) onValidName(isAvailable.exists);
  }, [isAvailable, onValidName]);

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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            {isAvailable !== undefined && isAvailable.exists === true ? (
              <p className="text-xs text-red-500 mt-2">
                El nombre debe ser único y no puede contener caracteres especiales.
              </p>
            ) : isAvailable !== undefined && isAvailable.exists === false ? (
              <p className="text-xs text-green-500 mt-2">
                El nombre es válido.
              </p>
            ) : (
              <p className="text-xs text-red-500 mt-2">
                El nombre debe ser único y no puede contener caracteres especiales.
              </p>
            )}
          </div>
          <div className="flex items-center mt-2">
            <Button
              onClick={() => refetch()}
              disabled={!formData.profileName || isFetching}
            >
              {isFetching ? <Loader size={16} /> : 'Verificar nombre'}
            </Button>

            {isAvailable && isAvailable.exists === false && (
              <span className="text-green-500 ml-2">✓ Disponible</span>
            )}
            {isAvailable && isAvailable.exists === true && (
              <span className="text-red-500 ml-2">✕ Ya existe</span>
            )}

          </div>

          <div>
            <Label className="text-foreground">
              Mi género es <span className="text-red-500">*</span>
            </Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {genderGroup.variants
                .filter((v) => v.active)
                .map((variant) => (
                  <Button
                    key={variant._id}
                    variant={
                      formData.gender === variant.value ? 'default' : 'outline'
                    }
                    onClick={() => onChange({ gender: variant.value })}
                    className={
                      formData.gender === variant.value
                        ? 'bg-green-600 hover:bg-green-700'
                        : ''
                    }
                  >
                    {formData.gender === variant.value && (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    {variant.value}
                  </Button>
                ))}
            </div>
          </div>

          {/* <div>
            <Label className="text-foreground">Trabajo para</Label>
            <div className="flex space-x-2 mt-2">
              {workTypeOptions.map((type) => (
                <Button
                  key={type}
                  variant={formData.workType === type ? 'default' : 'outline'}
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
          </div> */}
        </div>

        <div>
          <Label className="text-foreground">
            ¿Dónde quieres que se muestre tu anuncio?{' '}
            <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.category}
            onValueChange={(value) => onChange({ category: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona una categoría" />
            </SelectTrigger>
            <SelectContent>
              {categoryGroup.variants
                .filter((variant) => variant.active)
                .map((variant) => (
                  <SelectItem key={variant._id} value={variant.value}>
                    {variant.value}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-foreground">
            ¿Dónde te encuentras? <span className="text-red-500">*</span>
          </Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            <div>
              <Label className="text-sm text-muted-foreground">
                Departamento
              </Label>
              <Select
                value={formData.location.state}
                onValueChange={(value) =>
                  onChange({
                    location: {
                      ...formData.location,
                      state: value,
                      city: '', // Reset city when department changes
                    },
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona departamento" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(colombiaDepartments).map((department) => (
                    <SelectItem key={department} value={department}>
                      {department}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm text-muted-foreground">Ciudad</Label>
              <Select
                value={formData.location.city}
                onValueChange={(value) =>
                  onChange({
                    location: {
                      ...formData.location,
                      city: value,
                    },
                  })
                }
                disabled={!formData.location.state}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona ciudad" />
                </SelectTrigger>
                <SelectContent>
                  {formData.location.state &&
                    colombiaDepartments[
                      formData.location
                        .state as keyof typeof colombiaDepartments
                    ]?.map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
