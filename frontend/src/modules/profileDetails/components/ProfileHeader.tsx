import { Badge } from '@/components/ui/badge';
import { CheckCircle } from 'lucide-react';

export default function ProfielHeader({
  name,
  age,
  category,
}: {
  name: string;
  age: number;
  category: string;
}) {
  return (
    <div className="text-center animate-in fade-in-50 slide-in-from-right-4 duration-500">
      <div className="flex items-center justify-center gap-2 mb-2">
        <h2 className="text-2xl font-bold bg-gradient-to-r dark:text-gray-200 text-gray-800 bg-clip-text">
          {name}
        </h2>
      </div>
      <p className="text-muted-foreground">
        {age} años • {typeof category === 'object' && category !== null && 'label' in category
          ? (category as any).label
          : typeof category === 'object' && category !== null
            ? JSON.stringify(category)
            : category || 'Categoría no especificada'
        }
      </p>
    </div>
  );
}
