'use client';

import { useState } from 'react';
import { Ticket, Gift, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import toast from 'react-hot-toast';

interface AppliedCoupon {
  id: string;
  code: string;
  discount: number;
  type: 'percentage' | 'fixed';
  appliedAt: string;
  expiresAt: string;
  status: 'active' | 'expired' | 'used';
}

export default function CouponSection() {
  const [couponCode, setCouponCode] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const [appliedCoupons, setAppliedCoupons] = useState<AppliedCoupon[]>([
    {
      id: '1',
      code: 'WELCOME20',
      discount: 20,
      type: 'percentage',
      appliedAt: '2024-01-15T10:30:00Z',
      expiresAt: '2024-02-15T23:59:59Z',
      status: 'active'
    },
    {
      id: '2',
      code: 'SAVE50',
      discount: 50,
      type: 'fixed',
      appliedAt: '2024-01-10T14:20:00Z',
      expiresAt: '2024-01-20T23:59:59Z',
      status: 'expired'
    }
  ]);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error('Por favor ingresa un código de cupón');
      return;
    }

    setIsApplying(true);
    
    try {
      // Simular llamada a la API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simular validación del cupón
      const validCodes = ['NEWUSER10', 'DISCOUNT25', 'SAVE100'];
      
      if (validCodes.includes(couponCode.toUpperCase())) {
        const newCoupon: AppliedCoupon = {
          id: Date.now().toString(),
          code: couponCode.toUpperCase(),
          discount: couponCode.toUpperCase() === 'NEWUSER10' ? 10 : 
                   couponCode.toUpperCase() === 'DISCOUNT25' ? 25 : 100,
          type: couponCode.toUpperCase() === 'SAVE100' ? 'fixed' : 'percentage',
          appliedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'active'
        };
        
        setAppliedCoupons(prev => [newCoupon, ...prev]);
        setCouponCode('');
        toast.success('¡Cupón aplicado exitosamente!');
      } else {
        toast.error('Código de cupón inválido o expirado');
      }
    } catch (error) {
      toast.error('Error al aplicar el cupón. Inténtalo de nuevo.');
    } finally {
      setIsApplying(false);
    }
  };

  const formatDiscount = (coupon: AppliedCoupon) => {
    return coupon.type === 'percentage' 
      ? `${coupon.discount}% OFF`
      : `$${coupon.discount} OFF`;
  };

  const getStatusBadge = (status: AppliedCoupon['status']) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Activo</Badge>;
      case 'expired':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Expirado</Badge>;
      case 'used':
        return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">Usado</Badge>;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 slide-in-from-right-4 duration-500">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 rounded-lg">
          <Ticket className="h-6 w-6 text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Cupones y Descuentos
          </h1>
          <p className="text-muted-foreground mt-1">
            Ingresa códigos de cupón para obtener descuentos en tus compras
          </p>
        </div>
      </div>

      {/* Aplicar nuevo cupón */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Gift className="h-5 w-5 text-purple-600" />
            Aplicar Cupón
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                placeholder="Ingresa tu código de cupón"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                className="bg-background border-border focus:border-purple-500 focus:ring-purple-500"
                disabled={isApplying}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleApplyCoupon();
                  }
                }}
              />
            </div>
            <Button 
              onClick={handleApplyCoupon}
              disabled={isApplying || !couponCode.trim()}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6"
            >
              {isApplying ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Aplicando...
                </>
              ) : (
                'Aplicar'
              )}
            </Button>
          </div>
          
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <p className="font-medium mb-1">Códigos de prueba disponibles:</p>
                <ul className="space-y-1 text-xs">
                  <li><code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">NEWUSER10</code> - 10% de descuento</li>
                  <li><code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">DISCOUNT25</code> - 25% de descuento</li>
                  <li><code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">SAVE100</code> - $100 de descuento</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cupones aplicados */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Mis Cupones ({appliedCoupons.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {appliedCoupons.length === 0 ? (
            <div className="text-center py-8">
              <Ticket className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No tienes cupones aplicados</p>
              <p className="text-sm text-muted-foreground mt-1">
                Ingresa un código de cupón arriba para comenzar a ahorrar
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {appliedCoupons.map((coupon) => (
                <div 
                  key={coupon.id}
                  className="flex items-center justify-between p-4 bg-background rounded-lg border border-border hover:border-purple-300 dark:hover:border-purple-700 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 rounded-lg">
                      <Ticket className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-foreground">{coupon.code}</span>
                        {getStatusBadge(coupon.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Aplicado el {formatDate(coupon.appliedAt)} • Expira el {formatDate(coupon.expiresAt)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600 dark:text-green-400">
                      {formatDiscount(coupon)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {coupon.type === 'percentage' ? 'Porcentaje' : 'Monto fijo'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Información adicional */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200 dark:border-purple-800">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-purple-800 dark:text-purple-200">
              <h3 className="font-semibold mb-2">Información sobre cupones</h3>
              <ul className="space-y-1 text-xs">
                <li>• Los cupones se aplican automáticamente en tu próxima compra</li>
                <li>• Solo puedes usar un cupón por transacción</li>
                <li>• Los cupones tienen fecha de expiración</li>
                <li>• Algunos cupones pueden tener restricciones específicas</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}