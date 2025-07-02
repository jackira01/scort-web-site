import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const LocationFilter = () => {
  return (
    <div className="space-y-3">
      <h4 className="font-medium text-foreground">Ubicación</h4>
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Seleccionar ciudad" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="bogota">Bogotá</SelectItem>
          <SelectItem value="medellin">Medellín</SelectItem>
          <SelectItem value="cali">Cali</SelectItem>
          <SelectItem value="barranquilla">Barranquilla</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default LocationFilter;
