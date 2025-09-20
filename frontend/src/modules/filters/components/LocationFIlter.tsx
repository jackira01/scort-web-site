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
  onDepartmentChange?: (department: string) => void;
  onCityChange?: (city: string) => void;
}

const LocationFilter = ({
  selectedDepartment,
  selectedCity,
  onDepartmentChange,
  onCityChange,
}: LocationFilterProps) => {
  const departments = getAllDepartments();
  const cities = selectedDepartment ? getCitiesByDepartment(selectedDepartment) : [];

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Departamento</label>
        <Select value={selectedDepartment} onValueChange={onDepartmentChange}>
          <SelectTrigger>
            <SelectValue placeholder="Selecciona un departamento" />
          </SelectTrigger>
          <SelectContent>
            {departments.map((department) => (
              <SelectItem key={department} value={department}>
                {department}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedDepartment && (
        <div>
          <label className="block text-sm font-medium mb-2">Ciudad</label>
          <Select value={selectedCity} onValueChange={onCityChange}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona una ciudad" />
            </SelectTrigger>
            <SelectContent>
              {cities.map((city) => (
                <SelectItem key={city} value={city}>
                  {city}
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