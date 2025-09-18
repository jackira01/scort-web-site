import { CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const DescriptionProfile = ({
  description,
  services,
}: {
  description: string;
  services: string[];
}) => {
  return (
    <div className="space-y-6 animate-in fade-in-50 slide-in-from-left-6 duration-700">
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Descripción</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground leading-relaxed">{description}</p>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Servicios</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {services.map((service) => (
              <div
                key={service}
                className="flex items-center space-x-2 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors duration-200"
              >
                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span className="text-foreground text-sm">
                  {typeof service === 'object' && service !== null && 'label' in service 
                    ? (service as any).label 
                    : typeof service === 'object' && service !== null 
                      ? JSON.stringify(service)
                      : service || 'Servicio no especificado'
                  }
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
