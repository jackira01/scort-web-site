'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Check, X, Tag, AlertCircle } from 'lucide-react';
import { couponService } from '@/services/coupon.service';
import type { CouponApplicationResult } from '@/types/coupon.types';

interface CouponInputProps {
  originalPrice: number;
  planCode?: string;
  onCouponApplied?: (result: CouponApplicationResult) => void;
  onCouponRemoved?: () => void;
  disabled?: boolean;
  className?: string;
}

interface CouponInputState {
  couponCode: string;
  loading: boolean;
  appliedCoupon: CouponApplicationResult | null;
  error: string | null;
}

export default function CouponInput({
  originalPrice,
  planCode,
  onCouponApplied,
  onCouponRemoved,
  disabled = false,
  className = ''
}: CouponInputProps) {
  const [state, setState] = useState<CouponInputState>({
    couponCode: '',
    loading: false,
    appliedCoupon: null,
    error: null
  });

  const handleApplyCoupon = async () => {
    if (!state.couponCode.trim()) {
      setState(prev => ({ ...prev, error: 'Ingresa un código de cupón' }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = await couponService.applyCoupon(
        state.couponCode.trim(),
        originalPrice,
        planCode
      );

      if (result.success) {
        setState(prev => ({
          ...prev,
          appliedCoupon: result,
          loading: false,
          error: null
        }));
        onCouponApplied?.(result);
      } else {
        setState(prev => ({
          ...prev,
          loading: false,
          error: result.error || 'Error al aplicar cupón'
        }));
      }
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Error al aplicar cupón'
      }));
    }
  };

  const handleRemoveCoupon = () => {
    setState({
      couponCode: '',
      loading: false,
      appliedCoupon: null,
      error: null
    });
    onCouponRemoved?.();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !disabled && !state.loading) {
      e.preventDefault();
      handleApplyCoupon();
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {!state.appliedCoupon ? (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-muted-foreground" />
                <Label htmlFor="coupon-code">¿Tienes un cupón de descuento?</Label>
              </div>
              
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    id="coupon-code"
                    placeholder="Ingresa tu código de cupón"
                    value={state.couponCode}
                    onChange={(e) => {
                      setState(prev => ({
                        ...prev,
                        couponCode: e.target.value.toUpperCase(),
                        error: null
                      }));
                    }}
                    onKeyPress={handleKeyPress}
                    disabled={disabled || state.loading}
                    className={state.error ? 'border-red-500' : ''}
                  />
                </div>
                <Button
                  onClick={handleApplyCoupon}
                  disabled={disabled || state.loading || !state.couponCode.trim()}
                  variant="outline"
                >
                  {state.loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Aplicar'
                  )}
                </Button>
              </div>

              {state.error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{state.error}</AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="font-medium text-green-800">Cupón aplicado</span>
                  <Badge variant="secondary">{state.couponCode}</Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveCoupon}
                  disabled={disabled}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Precio original:</span>
                  <span>${state.appliedCoupon.originalPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>Descuento ({state.appliedCoupon.discountPercentage}%):</span>
                  <span>-${state.appliedCoupon.discount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-semibold text-lg border-t pt-2">
                  <span>Total a pagar:</span>
                  <span className="text-green-600">
                    ${state.appliedCoupon.finalPrice.toLocaleString()}
                  </span>
                </div>
                {state.appliedCoupon.planCode && state.appliedCoupon.planCode !== planCode && (
                  <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                    <p className="text-sm text-blue-800">
                      <strong>Plan actualizado:</strong> Este cupón te asigna el plan {state.appliedCoupon.planCode}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Hook personalizado para usar el componente CouponInput
export function useCouponInput(originalPrice: number, planCode?: string) {
  const [appliedCoupon, setAppliedCoupon] = useState<CouponApplicationResult | null>(null);

  const handleCouponApplied = (result: CouponApplicationResult) => {
    setAppliedCoupon(result);
  };

  const handleCouponRemoved = () => {
    setAppliedCoupon(null);
  };

  const finalPrice = appliedCoupon?.finalPrice ?? originalPrice;
  const discount = appliedCoupon?.discount ?? 0;
  const discountPercentage = appliedCoupon?.discountPercentage ?? 0;
  const assignedPlanCode = appliedCoupon?.planCode;

  return {
    appliedCoupon,
    finalPrice,
    discount,
    discountPercentage,
    assignedPlanCode,
    handleCouponApplied,
    handleCouponRemoved,
    hasCoupon: !!appliedCoupon
  };
}