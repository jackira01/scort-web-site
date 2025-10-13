import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface FilterToggleProps {
  filters: {
    verified: boolean | undefined;
    video: boolean | undefined;
    destacado: boolean | undefined;
  };
  onFilterChange: (key: string, value: boolean) => void;
}

const FilterToglles = ({ filters, onFilterChange }: FilterToggleProps) => {
  return (
    <div className="space-y-4 mb-6">
      {Object.entries({
        verified: 'Verificado',
        video: 'Video',
        destacado: 'Destacado',
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
            checked={filters[key as keyof typeof filters] || false}
            onCheckedChange={(checked) => {
              if (key === 'verified') {
                onFilterChange('profileVerified', checked);
              } else if (key === 'video') {
                onFilterChange('hasVideos', checked);
              } else if (key === 'destacado') {
                onFilterChange('hasDestacadoUpgrade', checked);
              }
            }}
          />
        </div>
      ))}
    </div>
  );
};

export default FilterToglles;
