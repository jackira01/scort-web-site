'use client';

import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAttributeGroupByKey } from '@/hooks/use-filter-attribute-groups';
import { useCategoryFilterCounts } from '@/hooks/use-filter-counts';

interface CategoryFilterProps {
  selectedCategory?: string;
  onCategoryChange?: (category: string) => void;
}

const CategoryFilter = ({ selectedCategory, onCategoryChange }: CategoryFilterProps) => {
  const { data: categoryGroup, isLoading, error } = useAttributeGroupByKey('category');
  const { data: categoryCounts, isLoading: countsLoading } = useCategoryFilterCounts();



  if (isLoading) {
    return (
      <div className="space-y-3">
        <h4 className="font-medium text-foreground">Categoría</h4>
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex items-center space-x-2">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-8 ml-auto rounded-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !categoryGroup) {
    return (
      <div className="space-y-3">
        <h4 className="font-medium text-foreground">Categoría</h4>
        <p className="text-sm text-muted-foreground">Error al cargar opciones</p>
      </div>
    );
  }

  const activeVariants = categoryGroup.variants.filter(variant => variant.active !== false);

  return (
    <div className="space-y-3">
      <h4 className="font-medium text-foreground">{categoryGroup.name}</h4>
      <div className="space-y-2">
        {activeVariants.map((variant) => {
          const isSelected = selectedCategory === variant.value;
          return (
            <div key={variant.value} className="flex items-center space-x-2">
              <input
                type="radio"
                id={`category-${variant.value}`}
                name="category"
                value={variant.value}
                checked={isSelected}
                onChange={() => onCategoryChange?.(variant.value)}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
              />
              <label
                htmlFor={`category-${variant.value}`}
                className="text-sm font-medium text-foreground cursor-pointer flex-1"
              >
                {typeof variant === 'object' && variant !== null && 'label' in variant ? variant.label : (typeof variant === 'object' && variant !== null && 'value' in variant ? variant.value : variant)}
              </label>
              
              <Badge variant="secondary" className="ml-auto">
                {countsLoading ? '...' : (categoryCounts?.[variant.value] || 0)}
              </Badge>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryFilter;