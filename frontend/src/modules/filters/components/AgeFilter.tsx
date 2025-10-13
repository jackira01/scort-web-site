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
    console.log('🔍 DEBUG AgeFilter - Min change:', { value, type: typeof value });
    const numValue = value === '' ? undefined : parseInt(value);
    console.log('🔍 DEBUG AgeFilter - Min parsed:', { numValue, type: typeof numValue });
    setLocalAgeRange(prev => ({ ...prev, min: numValue }));
  };

  const handleMaxChange = (value: string) => {
    console.log('🔍 DEBUG AgeFilter - Max change:', { value, type: typeof value });
    const numValue = value === '' ? undefined : parseInt(value);
    console.log('🔍 DEBUG AgeFilter - Max parsed:', { numValue, type: typeof numValue });
    setLocalAgeRange(prev => ({ ...prev, max: numValue }));
  };

  const handleApplyFilter = () => {
    console.log('🔍 DEBUG AgeFilter - Aplicando filtro con localAgeRange:', localAgeRange);
    
    const filteredRange: { min?: number; max?: number } = {};
    
    if (localAgeRange.min !== undefined && localAgeRange.min !== null && !isNaN(localAgeRange.min)) {
      filteredRange.min = localAgeRange.min;
      console.log('✅ DEBUG AgeFilter - Min válido:', filteredRange.min);
    } else {
      console.log('❌ DEBUG AgeFilter - Min inválido:', { 
        value: localAgeRange.min, 
        isUndefined: localAgeRange.min === undefined,
        isNull: localAgeRange.min === null,
        isNaN: isNaN(localAgeRange.min as number)
      });
    }
    
    if (localAgeRange.max !== undefined && localAgeRange.max !== null && !isNaN(localAgeRange.max)) {
      filteredRange.max = localAgeRange.max;
      console.log('✅ DEBUG AgeFilter - Max válido:', filteredRange.max);
    } else {
      console.log('❌ DEBUG AgeFilter - Max inválido:', { 
        value: localAgeRange.max, 
        isUndefined: localAgeRange.max === undefined,
        isNull: localAgeRange.max === null,
        isNaN: isNaN(localAgeRange.max as number)
      });
    }
    
    console.log('🚀 DEBUG AgeFilter - Enviando filteredRange:', filteredRange);
    onAgeRangeChange(filteredRange);
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
