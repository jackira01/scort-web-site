import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const FilterBar = () => {
  return (
    <div className="bg-background/50 backdrop-blur border-b transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Género', placeholder: 'Seleccionar género' },
            { label: 'Ubicación', placeholder: 'Seleccionar ciudad' },
            { label: 'Edad', placeholder: 'Rango de edad' },
            { label: 'Cuerpo', placeholder: 'Tipo de cuerpo' },
          ].map((filter, index) => (
            <div
              key={filter.label}
              className="animate-in slide-in-from-bottom-2"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <Select>
                <SelectTrigger className="w-full hover:border-purple-500 transition-all duration-200 focus:border-purple-500 focus:shadow-lg focus:shadow-purple-500/10">
                  <SelectValue placeholder={filter.placeholder} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="option1">Opción 1</SelectItem>
                  <SelectItem value="option2">Opción 2</SelectItem>
                  <SelectItem value="option3">Opción 3</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
