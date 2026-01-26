import { getDisplayDuration } from '@/utils/time-format';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign } from 'lucide-react';
export default function RatesProfile({
  rates,
}: {
  rates: { hour: string; price: number; delivery?: boolean }[];
}) {
  return (
    <Card className="bg-card border-border animate-in fade-in-50 slide-in-from-right-12 duration-1100">
      <CardHeader>
        <CardTitle className="text-foreground text-sm flex items-center">
          <DollarSign className="h-4 w-4 mr-2" />
          Tarifas
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-3">
          {rates.map((rate, index) => (
            <div
              key={`${rate.hour}-${index}`}
              className="p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors duration-200 space-y-2"
            >
              {/* Precio */}
              <div className="flex flex-col items-start gap-1">
                <span className="text-foreground text-sm font-medium">Tarifa/precio</span>
                <span className="text-foreground font-medium">
                  ${rate.price.toLocaleString('es-CO')} COP
                </span>
              </div>

              {/* Tiempo */}
              <div className="flex flex-col items-start gap-1">
                <span className="text-muted-foreground text-xs">Tiempo</span>
                <span className="text-foreground text-xs">
                  {getDisplayDuration(rate.hour)}
                </span>
              </div>

              {/* Domicilio */}
              {rate.delivery !== undefined && (
                <div className="flex flex-col items-start gap-1">
                  <span className="text-muted-foreground text-xs">Domicilio</span>
                  <span className="text-xs text-foreground">
                    {rate.delivery ? "Incluido" : "No incluido"}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
