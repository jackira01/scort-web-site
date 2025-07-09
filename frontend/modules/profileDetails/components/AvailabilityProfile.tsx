import { Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AvailabilityProfile({
  availability,
}: {
  availability: Record<string, string>;
}) {
  return (
    <Card className="bg-card border-border animate-in fade-in-50 slide-in-from-right-14 duration-1200">
      <CardHeader>
        <CardTitle className="text-foreground text-sm flex items-center">
          <Clock className="h-4 w-4 mr-2" />
          Disponibilidad
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-2">
          {Object.entries(availability).map(([day, hours]) => (
            <div
              key={day}
              className="flex justify-between items-center text-xs"
            >
              <span className="text-muted-foreground capitalize">
                {day === 'monday'
                  ? 'Lun'
                  : day === 'tuesday'
                    ? 'Mar'
                    : day === 'wednesday'
                      ? 'Mié'
                      : day === 'thursday'
                        ? 'Jue'
                        : day === 'friday'
                          ? 'Vie'
                          : day === 'saturday'
                            ? 'Sáb'
                            : 'Dom'}
              </span>
              <span className="text-foreground font-medium">{hours}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
