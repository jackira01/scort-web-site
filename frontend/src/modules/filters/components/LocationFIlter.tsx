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
  onLocationChange?: (department?: string, city?: string) => void;
}

const LocationFilter = ({
  selectedDepartment,
  selectedCity,
  onLocationChange,
}: LocationFilterProps) => {
  const departments = getAllDepartments();
  const cities = selectedDepartment ? getCitiesByDepartment(selectedDepartment) : [];

  const handleDepartmentChange = (departmentValue: string) => {
    onLocationChange?.(departmentValue, undefined); // Reset city when department changes
  };

  const handleCityChange = (cityValue: string) => {
    onLocationChange?.(selectedDepartment, cityValue);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Departamento</label>
        <Select value={selectedDepartment} onValueChange={handleDepartmentChange}>
          <SelectTrigger>
            <SelectValue placeholder="Selecciona un departamento" />
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
          <Select value={selectedCity} onValueChange={handleCityChange}>
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