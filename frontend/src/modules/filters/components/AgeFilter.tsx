import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

interface AgeFilterProps {
  ageRange?: {
    min?: number;
    max?: number;
  };
  onAgeRangeChange: (range: { min?: number; max?: number }) => void;
}

const AgeFilter = ({ ageRange, onAgeRangeChange }: AgeFilterProps) => {
  const [localAgeRange, setLocalAgeRange] = useState({
    min: ageRange?.min || undefined,
    max: ageRange?.max || undefined,
  });

  // Sincronizar el estado local cuando las props cambien externamente
  useEffect(() => {
    setLocalAgeRange({
      min: ageRange?.min || undefined,
      max: ageRange?.max || undefined,
    });
  }, [ageRange]);

  const handleMinChange = (value: string) => {
    const min = value ? parseInt(value) : undefined;
    setLocalAgeRange(prev => ({ ...prev, min }));
  };

  const handleMaxChange = (value: string) => {
    const max = value ? parseInt(value) : undefined;
    setLocalAgeRange(prev => ({ ...prev, max }));
  };

  const handleApplyFilter = () => {
    onAgeRangeChange(localAgeRange);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleApplyFilter();
    }
  };

  return (
    <div className="space-y-3">
      <h4 className="font-medium text-foreground">Edad</h4>
      <div className="flex space-x-2">
        <Input 
          placeholder="Min" 
          type="number" 
          value={localAgeRange.min || ''}
          onChange={(e) => handleMinChange(e.target.value)}
          onKeyPress={handleKeyPress}
          className="flex-1"
        />
        <Input 
          placeholder="Max" 
          type="number" 
          value={localAgeRange.max || ''}
          onChange={(e) => handleMaxChange(e.target.value)}
          onKeyPress={handleKeyPress}
          className="flex-1"
        />
        <Button 
          onClick={handleApplyFilter}
          size="sm"
          variant="outline"
          className="px-3 hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700 dark:hover:bg-purple-950 dark:hover:border-purple-700"
        >
          <Search className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default AgeFilter;
