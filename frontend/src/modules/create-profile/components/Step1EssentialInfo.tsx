'use client';

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
import { useDepartments, useCitiesByDepartment } from '@/hooks/use-locations';
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
  const locationDepartment = watch('location.department');
  const locationDepartmentValue = watch('location.departmentValue'); // Valor normalizado para queries
  const locationCityValue = watch('location.cityValue'); // Valor normalizado para queries
  const profileName = watch('profileName') || '';

  // Obtener departamentos y ciudades del backend
  const { data: departments = [], isLoading: loadingDepartments } = useDepartments();
  // Usar el value normalizado para obtener las ciudades
  const { data: cities = [], isLoading: loadingCities } = useCitiesByDepartment(locationDepartmentValue || '');

  return (
    <div className="space-y-6 animate-in fade-in-50 slide-in-from-right-4 duration-500">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-8 h-8 bg-gradient-to-r from-red-600 to-pink-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
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
            <div className="relative">
              <Input
                id="profileName"
                placeholder="Sexy Jane"
                className={`mt-2 ${errors.profileName ? 'border-red-500' : ''}`}
                {...register('profileName')}
                maxLength={40}
              />
              <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
                {profileName.length}/40
              </div>
            </div>
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
              render={({ field }) => {
                return (
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || ''}
                    key={`gender-${field.value}`} // Forzar re-render cuando cambie el valor
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder="Selecciona tu género"
                        className={field.value ? 'text-foreground' : 'text-muted-foreground'}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {genderGroup?.variants && genderGroup.variants.length > 0 ? (
                        genderGroup.variants
                          .filter((v) => v.active)
                          .map((variant) => (
                            <SelectItem key={variant._id} value={variant.value}>
                              {variant.label || variant.value}
                            </SelectItem>
                          ))
                      ) : (
                        <SelectItem value="loading" disabled>
                          Cargando opciones...
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                );
              }}
            />
            {errors.gender && (
              <p className="text-red-500 text-sm mt-1">{errors.gender.message}</p>
            )}
          </div>

          <div>
            <Label className="text-foreground">
              ¿Dónde quieres que se muestre tu anuncio?{' '}
              <span className="text-red-500">*</span>
            </Label>
            <Controller
              name="category"
              control={control}
              render={({ field }) => {
                return (
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || ''}
                    key={`category-${field.value}`} // Forzar re-render cuando cambie el valor
                  >
                    <SelectTrigger className={errors.category ? 'border-red-500' : ''}>
                      <SelectValue
                        placeholder="Selecciona una categoría"
                        className={field.value ? 'text-foreground' : 'text-muted-foreground'}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryGroup?.variants && categoryGroup.variants.length > 0 ? (
                        categoryGroup.variants
                          .filter((variant) => variant.active)
                          .map((variant) => (
                            <SelectItem key={variant._id} value={variant.value}>
                              {variant.label || variant.value}
                            </SelectItem>
                          ))
                      ) : (
                        <SelectItem value="loading" disabled>
                          Cargando categorías...
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                );
              }}
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
                name="location.department"
                control={control}
                render={({ field }) => {
                  // Obtener el value del departamento almacenado
                  const storedDeptValue = watch('location.departmentValue');

                  return (
                    <Select
                      onValueChange={(selectedValue) => {
                        // Encontrar el departamento seleccionado para obtener tanto value como label
                        const selectedDept = departments.find(d => d.value === selectedValue);
                        if (selectedDept) {
                          field.onChange(selectedDept.label); // Guardar el label para el backend
                          setValue('location.departmentValue', selectedDept.value); // Guardar el value para queries
                        } else {
                          field.onChange(selectedValue);
                        }
                        setValue('location.city', ''); // Reset city when department changes
                        setValue('location.cityValue', ''); // Reset city value
                      }}
                      value={storedDeptValue || ''}
                      key={`department-${storedDeptValue}`}
                      disabled={loadingDepartments}
                    >
                      <SelectTrigger className={errors.location?.department ? 'border-red-500' : ''}>
                        <SelectValue
                          placeholder={loadingDepartments ? "Cargando..." : "Selecciona departamento"}
                          className={field.value ? 'text-foreground' : 'text-muted-foreground'}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((department) => (
                          <SelectItem key={department.value} value={department.value}>
                            {department.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  );
                }}
              />
              {errors.location?.department && (
                <p className="text-red-500 text-sm mt-1">{errors.location.department.message}</p>
              )}
            </div>

            <div>
              <Label className="text-sm text-muted-foreground">Ciudad</Label>
              <Controller
                name="location.city"
                control={control}
                render={({ field }) => {
                  // Obtener el value de la ciudad almacenado
                  const storedCityValue = watch('location.cityValue');

                  return (
                    <Select
                      onValueChange={(selectedValue) => {
                        // Encontrar la ciudad seleccionada para obtener el label
                        const selectedCity = cities.find(c => c.value === selectedValue);
                        if (selectedCity) {
                          field.onChange(selectedCity.label); // Guardar el label (nombre) para el backend
                          setValue('location.cityValue', selectedCity.value); // Guardar el value para el Select
                        } else {
                          field.onChange(selectedValue);
                        }
                      }}
                      value={storedCityValue || ''}
                      key={`city-${storedCityValue}`}
                      disabled={!locationDepartmentValue || loadingCities}
                    >
                      <SelectTrigger className={errors.location?.city ? 'border-red-500' : ''}>
                        <SelectValue
                          placeholder={
                            !locationDepartmentValue
                              ? "Primero selecciona departamento"
                              : loadingCities
                                ? "Cargando..."
                                : "Selecciona ciudad"
                          }
                          className={field.value ? 'text-foreground' : 'text-muted-foreground'}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {cities.map((city) => (
                          <SelectItem key={city.value} value={city.value}>
                            {city.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  );
                }}
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
