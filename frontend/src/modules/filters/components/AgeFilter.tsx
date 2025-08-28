import { Input } from '@/components/ui/input';

interface AgeFilterProps {
  ageRange?: {
    min?: number;
    max?: number;
  };
  onAgeRangeChange: (range: { min?: number; max?: number }) => void;
}

const AgeFilter = ({ ageRange, onAgeRangeChange }: AgeFilterProps) => {
  const handleMinChange = (value: string) => {
    const min = value ? parseInt(value) : undefined;
    onAgeRangeChange({ ...ageRange, min });
  };

  const handleMaxChange = (value: string) => {
    const max = value ? parseInt(value) : undefined;
    onAgeRangeChange({ ...ageRange, max });
  };

  return (
    <div className="space-y-3">
      <h4 className="font-medium text-foreground">Edad</h4>
      <div className="flex space-x-2">
        <Input 
          placeholder="Min" 
          type="number" 
          value={ageRange?.min || ''}
          onChange={(e) => handleMinChange(e.target.value)}
        />
        <Input 
          placeholder="Max" 
          type="number" 
          value={ageRange?.max || ''}
          onChange={(e) => handleMaxChange(e.target.value)}
        />
      </div>
    </div>
  );
};

export default AgeFilter;
