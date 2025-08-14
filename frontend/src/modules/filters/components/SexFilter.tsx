'use client';

import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAttributeGroupByKey } from '@/hooks/use-filter-attribute-groups';

interface SexFilterProps {
  selectedSex?: string[];
  onSexChange?: (sex: string[]) => void;
}

const SexFilter = ({ selectedSex = [], onSexChange }: SexFilterProps) => {
  const { data: sexGroup, isLoading, error } = useAttributeGroupByKey('sex');

  if (isLoading) {
    return (
      <div className="space-y-3">
        <h4 className="font-medium text-foreground">Orientación Sexual</h4>
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

  if (error || !sexGroup) {
    return (
      <div className="space-y-3">
        <h4 className="font-medium text-foreground">Orientación Sexual</h4>
        <p className="text-sm text-muted-foreground">Error al cargar opciones</p>
      </div>
    );
  }

  const activeVariants = sexGroup.variants.filter(variant => variant.active !== false);

  const handleSexToggle = (sexValue: string) => {
    const newSelectedSex = selectedSex.includes(sexValue)
      ? selectedSex.filter(s => s !== sexValue)
      : [...selectedSex, sexValue];
    
    onSexChange?.(newSelectedSex);
  };

  return (
    <div className="space-y-3">
      <h4 className="font-medium text-foreground">{sexGroup.name}</h4>
      <div className="space-y-2">
        {activeVariants.map((variant) => {
          const isSelected = selectedSex.includes(variant.value);
          return (
            <div key={variant.value} className="flex items-center space-x-2">
              <input
                type="checkbox"
                id={`sex-${variant.value}`}
                className="rounded"
                checked={isSelected}
                onChange={() => handleSexToggle(variant.value)}
              />
              <label 
                htmlFor={`sex-${variant.value}`} 
                className="text-sm text-muted-foreground cursor-pointer flex-1"
              >
                {variant.value}
              </label>
              {/* TODO: Implementar conteo de perfiles por orientación sexual */}
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

export default SexFilter;