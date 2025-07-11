import { DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
export default function RatesProfile({
  rates,
}: {
  rates: { duration: string; price: number; currency: string }[];
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
          {rates.map((rate) => (
            <div
              key={`${rate.duration}-${rate.currency}`}
              className="flex justify-between items-center p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors duration-200"
            >
              <span className="text-foreground text-sm">{rate.duration}</span>
              <span className="text-foreground font-semibold">
                ${rate.price} {rate.currency}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
