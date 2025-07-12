import { Badge } from '@/components/ui/badge';

const GenderFilter = () => {
  return (
    <div className="space-y-3">
      <h4 className="font-medium text-foreground">Género</h4>
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="mujer"
            className="rounded"
            defaultChecked
          />
          <label htmlFor="mujer" className="text-sm text-muted-foreground">
            Mujer
          </label>
          <Badge variant="secondary" className="ml-auto">
            23
          </Badge>
        </div>
        <div className="flex items-center space-x-2">
          <input type="checkbox" id="trans" className="rounded" />
          <label htmlFor="trans" className="text-sm text-muted-foreground">
            Trans
          </label>
          <Badge variant="secondary" className="ml-auto">
            8
          </Badge>
        </div>
      </div>
    </div>
  );
};

export default GenderFilter;
