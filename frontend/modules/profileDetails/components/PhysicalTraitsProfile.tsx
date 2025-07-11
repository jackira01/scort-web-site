import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PhysicalTraitsProfile({
  physicalTraits,
}: {
  physicalTraits: Record<string, string>;
}) {
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
                {key}
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
