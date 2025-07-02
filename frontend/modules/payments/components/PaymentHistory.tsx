import { Clock, CreditCard, DollarSign, Receipt } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Payment {
  id: number;
  date: string;
  description: string;
  amount: number;
  status: string;
  method: string;
}

interface PaymentHistoryProps {
  payments: Payment[];
}

const PaymentHistory = ({ payments }: PaymentHistoryProps) => {
  return (
    <div className="space-y-6 animate-in fade-in-50 slide-in-from-right-4 duration-500">
      <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
        Historial de Pagos
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-8 w-8" />
              <div>
                <p className="text-sm opacity-90">Total Gastado</p>
                <p className="text-2xl font-bold">$650.00</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <CreditCard className="h-8 w-8" />
              <div>
                <p className="text-sm opacity-90">Este Mes</p>
                <p className="text-2xl font-bold">$325.00</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-purple-500 to-pink-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-8 w-8" />
              <div>
                <p className="text-sm opacity-90">Pendientes</p>
                <p className="text-2xl font-bold">$50.00</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">
            Transacciones Recientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {payments.map((payment, index) => (
              <div
                key={payment.id}
                className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-all duration-200 animate-in slide-in-from-left-2"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 rounded-full flex items-center justify-center">
                    <Receipt className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {payment.description}
                    </p>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <span>{payment.date}</span>
                      <span>•</span>
                      <span>{payment.method}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-foreground">
                    ${payment.amount.toFixed(2)}
                  </p>
                  <Badge
                    variant={
                      payment.status === 'Completado' ? 'default' : 'secondary'
                    }
                    className={
                      payment.status === 'Completado'
                        ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100'
                        : 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-100'
                    }
                  >
                    {payment.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentHistory;
