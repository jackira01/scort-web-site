'use client';

import { CheckCircle } from 'lucide-react';
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
import { Controller } from 'react-hook-form';
import { colombiaDepartments } from '../colombiaData';
import type { AttributeGroup } from '../types';
import { useFormContext } from '../context/FormContext';

interface Step1EssentialInfoProps {
  genderGroup: AttributeGroup;
  categoryGroup: AttributeGroup;
}

export function Step1EssentialInfo({
  genderGroup,
  categoryGroup,
}: Step1EssentialInfoProps) {
  const { register, control, watch, setValue, formState: { errors } } = useFormContext();
  const gender = watch('gender');
  const locationState = watch('location.state');

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

      <form className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="profileName" className="text-foreground">
              Cree un nombre para mostrar para su perfil.{' '}
              <span className="text-red-500">*</span>
            </Label>
            <Input
              id="profileName"
              placeholder="Sexy Jane"
              className={`mt-2 ${errors.profileName ? 'border-red-500' : ''}`}
              {...register('profileName')}
            />
            {errors.profileName && (
              <p className="text-red-500 text-sm mt-1">{errors.profileName.message}</p>
            )}
          </div>

          <div>
            <Label className="text-foreground">
              Mi género es <span className="text-red-500">*</span>
            </Label>
            <Controller
              name="gender"
              control={control}
              render={({ field }) => (
            <Select
             onValueChange={field.onChange}
             value={field.value}
             >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona tu género" />
              </SelectTrigger>
              <SelectContent>
                {genderGroup.variants
                  .filter((v) => v.active)
                  .map((variant) => (
                    <SelectItem key={variant._id} value={variant.value}>
                      {variant.value}
                    </SelectItem>
                  ))}
              </SelectContent>

             </Select>
              )}
              />
            {errors.gender && (
              <p className="text-red-500 text-sm mt-1">{errors.gender.message}</p>
            )}
          </div>

          {/* <div className="flex flex-wrap gap-2 mt-2">
              {genderGroup.variants
                .filter((v) => v.active)
                .map((variant) => (
                  <Button
                    key={variant._id}
                    variant={
                      gender === variant.value ? 'default' : 'outline'
                    }
                    onClick={() => setValue('gender', variant.value)}
                    className={
                      gender === variant.value
                        ? 'bg-green-600 hover:bg-green-700'
                        : ''
                    }
                  >
                    {gender === variant.value && (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    {variant.value}
                  </Button>
                ))}
            </div>  */}
          <div>
            <Label className="text-foreground">
              ¿Dónde quieres que se muestre tu anuncio?{' '}
              <span className="text-red-500">*</span>
            </Label>
            <Controller
              name="category"
              control={control}
              render={({ field }) => (
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <SelectTrigger className={errors.category ? 'border-red-500' : ''}>
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
              )}
            />
            {errors.category && (
              <p className="text-red-500 text-sm mt-1">{errors.category.message}</p>
            )}
          </div>
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
              <Controller
              name="location.state"
              control={control}
              render={({ field }) => (
                <Select
                  onValueChange={(value) => {
                    field.onChange(value);
                    setValue('location.city', ''); // Reset city when department changes
                  }}
                  value={field.value}
                >
                  <SelectTrigger className={errors.location?.state ? 'border-red-500' : ''}>
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
              )}
            />
            {errors.location?.state && (
              <p className="text-red-500 text-sm mt-1">{errors.location.state.message}</p>
            )}
            </div>

            <div>
              <Label className="text-sm text-muted-foreground">Ciudad</Label>
              <Controller
              name="location.city"
              control={control}
              render={({ field }) => (
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={!locationState}
                >
                  <SelectTrigger className={errors.location?.city ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Selecciona ciudad" />
                  </SelectTrigger>
                  <SelectContent>
                    {locationState &&
                      colombiaDepartments[
                        locationState as keyof typeof colombiaDepartments
                      ]?.map((city) => (
                        <SelectItem key={city} value={city}>
                          {city}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.location?.city && (
              <p className="text-red-500 text-sm mt-1">{errors.location.city.message}</p>
            )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
