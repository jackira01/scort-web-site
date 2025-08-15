import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getAllDepartments, getCitiesByDepartment } from '@/utils/colombiaData';

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
    ? getCitiesByDepartment(selectedDepartment)
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
          {getAllDepartments().map((department) => (
            <SelectItem key={department.value} value={department.value}>
              {department.label}
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
