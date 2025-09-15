'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tag, TrendingDown, DollarSign } from 'lucide-react';
import type { CouponApplicationResult } from '@/types/coupon.types';

interface PriceSummaryProps {
  originalPrice: number;
  appliedCoupon?: CouponApplicationResult | null;
  items?: Array<{
    name: string;
    price: number;
    quantity?: number;
  }>;
  showDetails?: boolean;
  className?: string;
}

export default function PriceSummary({
  originalPrice,
  appliedCoupon,
  items = [],
  showDetails = true,
  className = ''
}: PriceSummaryProps) {
  const finalPrice = appliedCoupon?.finalPrice ?? originalPrice;
  const discount = appliedCoupon?.discount ?? 0;
  const discountPercentage = appliedCoupon?.discountPercentage ?? 0;
  const hasCoupon = !!appliedCoupon;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="w-5 h-5" />
          Resumen de Precio
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Items detallados */}
        {showDetails && items.length > 0 && (
          <div className="space-y-2">
            {items.map((item, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {item.name} {item.quantity && item.quantity > 1 && `x${item.quantity}`}
                </span>
                <span>${(item.price * (item.quantity || 1)).toLocaleString()}</span>
              </div>
            ))}
            <Separator />
          </div>
        )}

        {/* Precio original */}
        <div className="flex justify-between">
          <span className={hasCoupon ? 'text-muted-foreground' : 'font-medium'}>
            {hasCoupon ? 'Subtotal:' : 'Total:'}
          </span>
          <span className={hasCoupon ? 'text-muted-foreground line-through' : 'font-medium'}>
            ${originalPrice.toLocaleString()}
          </span>
        </div>

        {/* Información del cupón */}
        {hasCoupon && appliedCoupon && (
          <>
            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">
                  Cupón aplicado
                </span>
                <Badge variant="secondary" className="text-xs">
                  {/* Aquí necesitarías el código del cupón, que no está en CouponApplicationResult */}
                  DESCUENTO
                </Badge>
              </div>
              <div className="flex items-center gap-1 text-green-600">
                <TrendingDown className="w-4 h-4" />
                <span className="text-sm font-medium">
                  -{discountPercentage}%
                </span>
              </div>
            </div>

            <div className="flex justify-between text-green-600">
              <span>Descuento:</span>
              <span>-${discount.toLocaleString()}</span>
            </div>

            {appliedCoupon.planCode && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Plan actualizado:</strong> {appliedCoupon.planCode}
                </p>
              </div>
            )}

            <Separator />
          </>
        )}

        {/* Precio final */}
        <div className="flex justify-between text-lg font-bold">
          <span>Total a pagar:</span>
          <span className={hasCoupon ? 'text-green-600' : 'text-foreground'}>
            ${finalPrice.toLocaleString()}
          </span>
        </div>

        {/* Ahorro total */}
        {hasCoupon && discount > 0 && (
          <div className="text-center p-2 bg-green-100 border border-green-300 rounded-lg">
            <p className="text-sm font-medium text-green-800">
              ¡Ahorras ${discount.toLocaleString()} ({discountPercentage}%)!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Componente simplificado para mostrar solo el precio final
export function SimplePriceSummary({
  originalPrice,
  appliedCoupon,
  className = ''
}: Pick<PriceSummaryProps, 'originalPrice' | 'appliedCoupon' | 'className'>) {
  const finalPrice = appliedCoupon?.finalPrice ?? originalPrice;
  const discount = appliedCoupon?.discount ?? 0;
  const hasCoupon = !!appliedCoupon;

  return (
    <div className={`space-y-2 ${className}`}>
      {hasCoupon && (
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Precio original:</span>
          <span className="line-through">${originalPrice.toLocaleString()}</span>
        </div>
      )}
      
      {hasCoupon && discount > 0 && (
        <div className="flex justify-between text-sm text-green-600">
          <span>Descuento:</span>
          <span>-${discount.toLocaleString()}</span>
        </div>
      )}
      
      <div className="flex justify-between text-lg font-bold border-t pt-2">
        <span>Total:</span>
        <span className={hasCoupon ? 'text-green-600' : 'text-foreground'}>
          ${finalPrice.toLocaleString()}
        </span>
      </div>
    </div>
  );
}