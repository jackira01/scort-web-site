'use client';

import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAttributeGroupByKey } from '@/hooks/use-filter-attribute-groups';

interface GenderFilterProps {
  selectedGender?: string;
  onGenderChange?: (gender: string) => void;
}

const GenderFilter = ({ selectedGender, onGenderChange }: GenderFilterProps) => {
  const { data: genderGroup, isLoading, error } = useAttributeGroupByKey('gender');

  if (isLoading) {
    return (
      <div className="space-y-3">
        <h4 className="font-medium text-foreground">Género</h4>
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex items-center space-x-2">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-5 w-8 ml-auto rounded-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !genderGroup) {
    return (
      <div className="space-y-3">
        <h4 className="font-medium text-foreground">Género</h4>
        <p className="text-sm text-muted-foreground">Error al cargar opciones</p>
      </div>
    );
  }

  const activeVariants = genderGroup.variants.filter(variant => variant.active !== false);

  return (
    <div className="space-y-3">
      <h4 className="font-medium text-foreground">{genderGroup.name}</h4>
      <div className="space-y-2">
        {activeVariants.map((variant) => {
          const isSelected = selectedGender === variant.value;
          return (
            <div key={variant.value} className="flex items-center space-x-2">
              <input
                type="radio"
                id={`gender-${variant.value}`}
                name="gender"
                value={variant.value}
                checked={isSelected}
                onChange={() => onGenderChange?.(variant.value)}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
              />
              <label
                htmlFor={`gender-${variant.value}`}
                className="text-sm font-medium text-foreground cursor-pointer flex-1"
              >
                {variant.label || variant.value}
              </label>
              {/* TODO: Implementar conteo de perfiles por género */}
              <Badge variant="secondary" className="ml-auto">
                0
              </Badge>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GenderFilter;
