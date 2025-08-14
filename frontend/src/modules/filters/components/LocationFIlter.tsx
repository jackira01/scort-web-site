import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LOCATIONS } from '@/lib/config';

interface LocationFilterProps {
  selectedDepartment?: string;
  selectedCity?: string;
  onLocationChange: (department?: string, city?: string) => void;
}

const LocationFilter = ({
  selectedDepartment,
  selectedCity,
  onLocationChange,
}: LocationFilterProps) => {
  const handleDepartmentChange = (department: string) => {
    // Al cambiar departamento, limpiar la ciudad
    onLocationChange(department === 'all' ? undefined : department, undefined);
  };

  const handleCityChange = (city: string) => {
    // Mantener el departamento actual y cambiar solo la ciudad
    onLocationChange(
      selectedDepartment,
      city === 'all' ? undefined : city
    );
  };

  const availableCities = selectedDepartment
    ? LOCATIONS[selectedDepartment as keyof typeof LOCATIONS]?.cities || []
    : [];

  return (
    <div className="space-y-3">
      <h4 className="font-medium text-foreground">Ubicación</h4>
      
      {/* Selector de Departamento */}
      <Select
        value={selectedDepartment || 'all'}
        onValueChange={handleDepartmentChange}
      >
        <SelectTrigger>
          <SelectValue placeholder="Seleccionar departamento" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los departamentos</SelectItem>
          {Object.entries(LOCATIONS).map(([key, location]) => (
            <SelectItem key={key} value={key}>
              {location.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Selector de Ciudad - Solo visible si hay departamento seleccionado */}
      {selectedDepartment && availableCities.length > 0 && (
        <Select
          value={selectedCity || 'all'}
          onValueChange={handleCityChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar ciudad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las ciudades</SelectItem>
            {availableCities.map((city) => (
              <SelectItem key={city.value} value={city.value}>
                {city.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
};

export default LocationFilter;
