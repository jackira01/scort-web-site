import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface FilterToggleProps {
  filters: {
    verified: boolean;
    video: boolean;
  };
  onFilterChange: (key: string, value: boolean) => void;
}

const FilterToglles = ({ filters, onFilterChange }: FilterToggleProps) => {
  return (
    <div className="space-y-4 mb-6">
      {Object.entries({
        verified: 'Verificado',
        video: 'Video',
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
            onCheckedChange={(checked) => {
              if (key === 'verified') {
                onFilterChange('isVerified', checked);
              } else if (key === 'video') {
                onFilterChange('hasVideos', checked);
              }
            }}
          />
        </div>
      ))}
    </div>
  );
};

export default FilterToglles;
