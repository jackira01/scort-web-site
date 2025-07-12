import { Input } from '@/components/ui/input';

const AgeFilter = () => {
  return (
    <div className="space-y-3">
      <h4 className="font-medium text-foreground">Edad</h4>
      <div className="flex space-x-2">
        <Input placeholder="Min" type="number" />
        <Input placeholder="Max" type="number" />
      </div>
    </div>
  );
};

export default AgeFilter;
