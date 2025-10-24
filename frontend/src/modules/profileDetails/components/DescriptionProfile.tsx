import { CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { AttributeValue } from '@/types/profile.types';

export const DescriptionProfile = ({
  description,
  services,
  basicServices,
  additionalServices,
}: {
  description: string;
  services?: AttributeValue[]; // Mantenemos para compatibilidad hacia atrás
  basicServices?: AttributeValue[];
  additionalServices?: AttributeValue[];
}) => {
  // Si tenemos la nueva clasificación, la usamos; si no, usamos el formato anterior
  const hasNewClassification = basicServices || additionalServices;
  const displayBasicServices = basicServices || services || [];
  const displayAdditionalServices = additionalServices || [];

  const renderServiceItem = (service: AttributeValue, index: number) => {
    // Determinar el valor a mostrar
    const displayValue = typeof service === 'object' && service !== null && 'label' in service
      ? service.label
      : typeof service === 'string'
        ? service
        : 'Servicio no especificado';

    // Generar una key única
    const key = typeof service === 'object' && service !== null && 'key' in service
      ? service.key
      : typeof service === 'string'
        ? service
        : `service-${index}`;

    return (
      <div
        key={key}
        className="flex items-center space-x-2 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors duration-200"
      >
        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
        <span className="text-foreground text-sm">{displayValue}</span>
      </div>
    );
  };

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
              {displayBasicServices.map((service, index) => renderServiceItem(service, index))}
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
              {displayAdditionalServices.map((service, index) => renderServiceItem(service, index))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};