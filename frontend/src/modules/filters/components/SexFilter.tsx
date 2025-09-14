'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { useAttributeGroupByKey } from '@/hooks/use-filter-attribute-groups';

interface SexFilterProps {
  selectedSex?: string[];
  onSexChange?: (sex: string[]) => void;
  category?: string;
}

const SexFilter = ({ selectedSex, onSexChange, category }: SexFilterProps) => {
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
    const currentSelection = selectedSex || [];
    const newSelectedSex = currentSelection.includes(sexValue)
      ? currentSelection.filter(s => s !== sexValue)
      : [...currentSelection, sexValue];

    onSexChange?.(newSelectedSex);
  };

  return (
    <div className="space-y-3">
      <h4 className="font-medium text-foreground">{sexGroup.name}</h4>
      <div className="space-y-2">
        {activeVariants.map((variant) => {
          const isSelected = selectedSex?.includes(variant.value) || false;
          return (
            <div key={variant.value} className="flex items-center space-x-2">
              <input
                type="checkbox"
                id={`sex-${variant.value}`}
                value={variant.value}
                checked={isSelected}
                onChange={(e) => {
                  const value = e.target.value;
                  const currentSelection = selectedSex || [];
                  const newSelection = isSelected
                    ? currentSelection.filter(s => s !== value)
                    : [...currentSelection, value];
                  onSexChange?.(newSelection);
                }}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <label
                htmlFor={`sex-${variant.value}`}
                className="text-sm font-medium text-foreground cursor-pointer flex-1"
              >
                {variant.label || variant.value}
              </label>

            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SexFilter;