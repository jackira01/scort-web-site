import { DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
              className="flex justify-between items-center p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors duration-200"
            >
              <div className="flex flex-col">
                <span className="text-foreground text-sm">{rate.hour}</span>
                {rate.delivery !== undefined && (
                  <span className="text-xs text-muted-foreground mt-1">
                    {rate.delivery ? "Domicilio incluido" : "Domicilio no incluido"}
                  </span>
                )}
              </div>
              <span className="text-foreground font-semibold">
                ${rate.price.toLocaleString('es-CO')} COP
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
