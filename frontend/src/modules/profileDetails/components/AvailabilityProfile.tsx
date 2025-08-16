import { Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AvailabilitySlot {
  start: string;
  end: string;
  timezone?: string;
}

interface DayAvailability {
  dayOfWeek: string;
  slots: AvailabilitySlot[];
  _id?: string;
}

export default function AvailabilityProfile({
  availability,
}: {
  availability: DayAvailability[] | Record<string, string>;
}) {
  // Handle both array format (from backend) and object format (mock data)
  const availabilityData = Array.isArray(availability) 
    ? availability.reduce((acc, day) => {
        if (day.slots && day.slots.length > 0) {
          const firstSlot = day.slots[0];
          acc[day.dayOfWeek] = `${firstSlot.start} - ${firstSlot.end}`;
        }
        return acc;
      }, {} as Record<string, string>)
    : availability;
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
          {Object.entries(availabilityData).map(([day, hours]) => (
            <div
              key={day}
              className="flex justify-between items-center text-xs"
            >
              <span className="text-muted-foreground capitalize">
                {day === 'lunes'
                  ? 'Lunes'
                  : day === 'martes'
                    ? 'Martes'
                    : day === 'miercoles'
                      ? 'Miércoles'
                      : day === 'jueves'
                        ? 'Jueves'
                        : day === 'viernes'
                          ? 'Viernes'
                          : day === 'sábado'
                            ? 'Sábado'
                            : day === 'domingo'
                              ? 'Domingo'
                              : day === 'monday'
                                ? 'Lunes'
                                : day === 'tuesday'
                                  ? 'Martes'
                                  : day === 'wednesday'
                                    ? 'Miércoles'
                                    : day === 'thursday'
                                      ? 'Jueves'
                                      : day === 'friday'
                                        ? 'Viernes'
                                        : day === 'saturday'
                                          ? 'Sábado'
                                          : 'Domingo'}
              </span>
              <span className="text-foreground font-medium">{hours}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
