import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDepartments, useCitiesByDepartment } from '@/hooks/use-locations';

interface LocationFilterProps {
  selectedDepartment?: string;
  selectedCity?: string;
  onLocationChange?: (department?: string, city?: string) => void;
}

const LocationFilter = ({
  selectedDepartment,
  selectedCity,
  onLocationChange,
}: LocationFilterProps) => {
  const { data: departments = [] } = useDepartments();
  const { data: cities = [] } = useCitiesByDepartment(selectedDepartment || '');

  const handleDepartmentChange = (departmentValue: string) => {
    onLocationChange?.(departmentValue, undefined); // Reset city when department changes
  };

  const handleCityChange = (cityValue: string) => {
    onLocationChange?.(selectedDepartment, cityValue);
  };

  // Usar key para forzar remount cuando los valores se limpien completamente
  // Esto asegura que los Select se reseteen visualmente
  const departmentKey = `dept-${selectedDepartment || 'none'}`;
  const cityKey = `city-${selectedCity || 'none'}-${selectedDepartment || 'none'}`;

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Departamento</label>
        <Select
          key={departmentKey}
          value={selectedDepartment || undefined}
          onValueChange={handleDepartmentChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar departamento" />
          </SelectTrigger>
          <SelectContent>
            {departments.map((department) => (
              <SelectItem key={department.value} value={department.value}>
                {department.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedDepartment && (
        <div>
          <label className="block text-sm font-medium mb-2">Ciudad</label>
          <Select
            key={cityKey}
            value={selectedCity || undefined}
            onValueChange={handleCityChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona una ciudad" />
            </SelectTrigger>
            <SelectContent>
              {cities.map((city) => (
                <SelectItem key={city.value} value={city.value}>
                  {city.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
};

export default LocationFilter;