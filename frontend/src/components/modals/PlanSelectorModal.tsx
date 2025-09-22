'use client';

import { useState, useEffect } from 'react';
import { ExternalLink, Package, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePlans } from '@/hooks/usePlans';
import { ICoupon } from '@/types/coupon.types';
import { Plan } from '@/types/plans';

interface PlanSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPlan: (planCode: string, originalPrice: number, variantDays?: number) => void;
  coupon: ICoupon | null;
  isProcessing?: boolean;
}

export default function PlanSelectorModal({
  isOpen,
  onClose,
  onSelectPlan,
  coupon,
  isProcessing = false
}: PlanSelectorModalProps) {
  const [selectedPlanCode, setSelectedPlanCode] = useState<string>('');
  const [selectedVariantDays, setSelectedVariantDays] = useState<number>(30);
  
  const { data: plansResponse, isLoading } = usePlans({ isActive: true });
  const plans = plansResponse?.plans || [];

  // Filtrar planes aplicables según el cupón
  const applicablePlans = plans.filter(plan => {
    if (!coupon?.applicablePlans || coupon.applicablePlans.length === 0) {
      return true; // Si no hay restricciones, todos los planes son aplicables
    }
    return coupon.applicablePlans.includes(plan.code);
  });

  const selectedPlan = applicablePlans.find(plan => plan.code === selectedPlanCode);
  const selectedVariant = selectedPlan?.variants.find(variant => variant.days === selectedVariantDays);

  const formatCurrency = (amount: number) => `$${amount.toLocaleString()}`;

  const calculateDiscount = (originalPrice: number) => {
    if (!coupon) return { discount: 0, finalPrice: originalPrice };

    let discount = 0;
    if (coupon.type === 'percentage') {
      discount = (originalPrice * coupon.value) / 100;
    } else if (coupon.type === 'fixed_amount') {
      discount = coupon.value;
    }

    const finalPrice = Math.max(0, originalPrice - discount);
    return { discount, finalPrice };
  };

  const handleConfirm = () => {
    if (selectedPlan && selectedVariant) {
      onSelectPlan(selectedPlan.code, selectedVariant.price, selectedVariantDays);
    }
  };

  const getDiscountDescription = () => {
    if (!coupon) return '';
    
    switch (coupon.type) {
      case 'percentage':
        return `${coupon.value}% de descuento`;
      case 'fixed_amount':
        return `${formatCurrency(coupon.value)} de descuento`;
      default:
        return 'Descuento aplicado';
    }
  };

  // Reset selection when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedPlanCode('');
      setSelectedVariantDays(30);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5 text-purple-600" />
            <span>Seleccionar Plan para Aplicar Cupón</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información del cupón */}
          {coupon && (
            <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200 dark:border-purple-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-purple-900 dark:text-purple-100">
                      Cupón: {coupon.code}
                    </h3>
                    <p className="text-sm text-purple-700 dark:text-purple-300">
                      {getDiscountDescription()}
                    </p>
                  </div>
                  <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                    {coupon.type === 'percentage' ? 'Porcentual' : 'Monto Fijo'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Selector de plan */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Selecciona un plan:
              </label>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Cargando planes...</span>
                </div>
              ) : (
                <Select value={selectedPlanCode} onValueChange={setSelectedPlanCode}>
                  <SelectTrigger>
                    <SelectValue placeholder="Elige un plan para aplicar el descuento" />
                  </SelectTrigger>
                  <SelectContent>
                    {applicablePlans.map((plan) => (
                      <SelectItem key={plan.code} value={plan.code}>
                        <div className="flex items-center justify-between w-full">
                          <span className="font-medium">{plan.name}</span>
                          <span className="text-sm text-muted-foreground ml-2">
                            desde {formatCurrency(Math.min(...plan.variants.map(v => v.price)))}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Selector de duración si hay un plan seleccionado */}
            {selectedPlan && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Duración del plan:
                </label>
                <Select 
                  value={selectedVariantDays.toString()} 
                  onValueChange={(value) => setSelectedVariantDays(Number(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar duración" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedPlan.variants.map((variant) => (
                      <SelectItem key={variant.days} value={variant.days.toString()}>
                        <div className="flex items-center justify-between w-full">
                          <span>{variant.days} días</span>
                          <span className="font-medium ml-2">
                            {formatCurrency(variant.price)}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Vista previa del descuento */}
          {selectedPlan && selectedVariant && coupon && (
            <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
              <CardContent className="p-4">
                <h4 className="font-semibold text-green-900 dark:text-green-100 mb-3 flex items-center">
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Vista previa del descuento
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Plan seleccionado:</span>
                    <span className="font-medium">{selectedPlan.name} ({selectedVariantDays} días)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Precio original:</span>
                    <span>{formatCurrency(selectedVariant.price)}</span>
                  </div>
                  <div className="flex justify-between text-green-700 dark:text-green-300">
                    <span>Descuento ({getDiscountDescription()}):</span>
                    <span>-{formatCurrency(calculateDiscount(selectedVariant.price).discount)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold text-green-900 dark:text-green-100 pt-2 border-t border-green-200 dark:border-green-700">
                    <span>Precio final:</span>
                    <span>{formatCurrency(calculateDiscount(selectedVariant.price).finalPrice)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Enlace a detalles de planes */}
          <div className="text-center">
            <Button
              variant="link"
              className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
              onClick={() => window.open('/planes', '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Ver detalles de planes
            </Button>
          </div>

          {/* Botones de acción */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isProcessing}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!selectedPlan || !selectedVariant || isProcessing}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : (
                'Continuar con este plan'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}