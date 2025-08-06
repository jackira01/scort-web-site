import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAttributeGroups } from '@/hooks/use-attribute-groups';

export default function PhysicalTraitsProfile({
  physicalTraits,
}: {
  physicalTraits: Record<string, string>;
}) {
  const { data: attributeGroups } = useAttributeGroups();

  // Crear un mapa de key -> name para los labels
  const labelMap = useMemo(() => {
    if (!attributeGroups) return {};
    
    const map: Record<string, string> = {};
    attributeGroups.forEach((group: any) => {
      map[group.key] = group.name;
    });
    return map;
  }, [attributeGroups]);

  return (
    <Card className="bg-card border-border animate-in fade-in-50 slide-in-from-right-8 duration-900">
      <CardHeader>
        <CardTitle className="text-foreground text-sm">¿Cómo me veo?</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-3">
          {Object.entries(physicalTraits).map(([key, value]) => (
            <div key={key} className="flex justify-between items-center">
              <span className="text-muted-foreground text-sm capitalize">
                {labelMap[key] || key}
              </span>
              <span className="text-foreground text-sm font-medium">
                {value}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
