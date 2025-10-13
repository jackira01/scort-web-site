import { CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const DescriptionProfile = ({
  description,
  services,
  basicServices,
  additionalServices,
}: {
  description: string;
  services?: string[]; // Mantenemos para compatibilidad hacia atrás
  basicServices?: string[];
  additionalServices?: string[];
}) => {
  // Si tenemos la nueva clasificación, la usamos; si no, usamos el formato anterior
  const hasNewClassification = basicServices || additionalServices;
  const displayBasicServices = basicServices || services || [];
  const displayAdditionalServices = additionalServices || [];

  const renderServiceItem = (service: string) => (
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
  );

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

      {/* Servicios Básicos */}
      {displayBasicServices.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">
              {hasNewClassification ? 'Servicios Básicos' : 'Servicios'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {displayBasicServices.map(renderServiceItem)}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Servicios Adicionales - Solo se muestra si hay nueva clasificación */}
      {hasNewClassification && displayAdditionalServices.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Servicios Adicionales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {displayAdditionalServices.map(renderServiceItem)}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
