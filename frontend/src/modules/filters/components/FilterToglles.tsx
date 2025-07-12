import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

const FilterToglles = () => {
  const [filters, setFilters] = useState({
    presentado: false,
    verificado: false,
    enLinea: false,
    video: false,
    favoritos: false,
  });

  return (
    <div className="space-y-4 mb-6">
      {Object.entries({
        presentado: 'Presentado',
        verificado: 'Verificado',
        enLinea: 'En línea',
        video: 'Video',
        favoritos: 'Favoritos',
      }).map(([key, label]) => (
        <div key={key} className="flex items-center justify-between">
          <Label
            htmlFor={key}
            className="text-sm font-medium text-muted-foreground"
          >
            {label}
          </Label>
          <Switch
            id={key}
            checked={filters[key as keyof typeof filters]}
            onCheckedChange={(checked) =>
              setFilters((prev) => ({ ...prev, [key]: checked }))
            }
          />
        </div>
      ))}
    </div>
  );
};

export default FilterToglles;
