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
    const numValue = value === '' ? undefined : parseInt(value);
    setLocalAgeRange(prev => ({ ...prev, min: numValue }));
  };

  const handleMaxChange = (value: string) => {
    const numValue = value === '' ? undefined : parseInt(value);
    setLocalAgeRange(prev => ({ ...prev, max: numValue }));
  };

  const handleApplyFilter = () => {
    const filteredRange: { min?: number; max?: number } = {};

    // Si min está definido y es válido, usarlo. Si no, usar 1 por defecto
    if (localAgeRange.min !== undefined && localAgeRange.min !== null && !isNaN(localAgeRange.min) && localAgeRange.min > 0) {
      filteredRange.min = localAgeRange.min;
    } else if (localAgeRange.max !== undefined && localAgeRange.max !== null && !isNaN(localAgeRange.max)) {
      // Si hay max pero no min, usar 1 como mínimo por defecto
      filteredRange.min = 1;
    }

    // Si max está definido y es válido, usarlo. Si no, dejarlo undefined (búsqueda abierta)
    if (localAgeRange.max !== undefined && localAgeRange.max !== null && !isNaN(localAgeRange.max) && localAgeRange.max > 0) {
      filteredRange.max = localAgeRange.max;
    }

    // Solo enviar si hay al menos min definido
    if (filteredRange.min !== undefined) {
      onAgeRangeChange(filteredRange);
    }
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
