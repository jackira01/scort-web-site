'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCoupon, useUpdateCoupon } from '@/hooks/use-coupons';
import { plansService } from '@/services/plans.service';
import type { UpdateCouponInput } from '@/types/coupon.types';
import type { IPlanDefinition } from '@/types/plans.types';

interface EditCouponState {
  loading: boolean;
  plans: IPlanDefinition[];
  formData: UpdateCouponInput;
  errors: Record<string, string>;
}

export default function EditCouponPage() {
  const router = useRouter();
  const params = useParams();
  const couponId = params.id as string;
  
  const { data: coupon, isLoading: couponLoading, error: couponError } = useCoupon(couponId);
  const updateCouponMutation = useUpdateCoupon();

  const [state, setState] = useState<EditCouponState>({
    loading: false,
    plans: [],
    formData: {},
    errors: {}
  });

  // Cargar datos del cupón en el formulario cuando se obtienen
  useEffect(() => {
    if (coupon) {
      setState(prev => ({
        ...prev,
        formData: {
          name: coupon.name,
          description: coupon.description || '',
          value: coupon.value,
          planCode: coupon.planCode || '',
          variantDays: coupon.variantDays,
          maxUses: coupon.maxUses,
          validFrom: coupon.validFrom ? new Date(coupon.validFrom).toISOString().split('T')[0] : '',
          validUntil: coupon.validUntil ? new Date(coupon.validUntil).toISOString().split('T')[0] : '',
          isActive: coupon.isActive
        }
      }));
    }
  }, [coupon]);

  const loadPlans = async () => {
    try {
      const plans = await plansService.getAvailablePlans();
      setState(prev => ({ ...prev, plans }));
    } catch (error) {
      console.error('Error loading plans:', error);
      toast.error('Error al cargar planes');
    }
  };

  const updateFormData = (field: keyof UpdateCouponInput, value: any) => {
    setState(prev => ({
      ...prev,
      formData: { ...prev.formData, [field]: value },
      errors: { ...prev.errors, [field]: '' }
    }));
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!state.formData.name?.trim()) {
      errors.name = 'El nombre es requerido';
    }

    if (state.formData.value !== undefined) {
      if (coupon?.type === 'percentage' && (state.formData.value < 0 || state.formData.value > 100)) {
        errors.value = 'El porcentaje debe estar entre 0 y 100';
      } else if (coupon?.type === 'fixed_amount' && state.formData.value < 0) {
        errors.value = 'El valor debe ser mayor o igual a 0';
      }
    }

    if (coupon?.type === 'plan_assignment' && !state.formData.planCode?.trim()) {
      errors.planCode = 'Debe seleccionar un plan para cupones de asignación';
    }

    if (coupon?.type === 'plan_assignment' && !state.formData.variantDays) {
      errors.variantDays = 'Debe seleccionar una variante de días para cupones de asignación';
    }

    if (state.formData.maxUses !== undefined && state.formData.maxUses < -1) {
      errors.maxUses = 'Los usos máximos deben ser -1 (ilimitado) o mayor a 0';
    }

    if (state.formData.validFrom && state.formData.validUntil) {
      const validFrom = new Date(state.formData.validFrom);
      const validUntil = new Date(state.formData.validUntil);
      if (validFrom >= validUntil) {
        errors.validUntil = 'La fecha de vencimiento debe ser posterior a la fecha de inicio';
      }
    }

    setState(prev => ({ ...prev, errors }));
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Por favor corrige los errores en el formulario');
      return;
    }

    setState(prev => ({ ...prev, loading: true }));

    try {
      await updateCouponMutation.mutateAsync({
        id: couponId,
        data: state.formData
      });
      
      toast.success('Cupón actualizado exitosamente');
      router.push('/adminboard/coupons');
    } catch (error: any) {
      toast.error(error.message || 'Error al actualizar el cupón');
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  // Mostrar loading mientras se carga el cupón
  if (couponLoading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Cargando cupón...</span>
        </div>
      </div>
    );
  }

  // Mostrar error si no se encuentra el cupón
  if (couponError || !coupon) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-red-600">Error: Cupón no encontrado</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Editar Cupón</h1>
          <p className="text-muted-foreground">Modifica los datos del cupón {coupon.code}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Información Básica</CardTitle>
            <CardDescription>Datos principales del cupón</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Código</Label>
                <Input
                  id="code"
                  value={coupon.code}
                  disabled
                  className="bg-muted"
                />
                <p className="text-sm text-muted-foreground">El código no se puede modificar</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  value={state.formData.name || ''}
                  onChange={(e) => updateFormData('name', e.target.value)}
                  placeholder="Nombre descriptivo del cupón"
                  className={state.errors.name ? 'border-red-500' : ''}
                />
                {state.errors.name && (
                  <p className="text-sm text-red-500">{state.errors.name}</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={state.formData.description || ''}
                onChange={(e) => updateFormData('description', e.target.value)}
                placeholder="Descripción del cupón (opcional)"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Configuración del Descuento</CardTitle>
            <CardDescription>Define el tipo y valor del descuento</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Tipo de Cupón</Label>
                <Input
                  id="type"
                  value={
                    coupon.type === 'percentage' ? 'Porcentaje' :
                    coupon.type === 'fixed_amount' ? 'Monto Fijo' :
                    'Asignación de Plan'
                  }
                  disabled
                  className="bg-muted"
                />
                <p className="text-sm text-muted-foreground">El tipo no se puede modificar</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="value">
                  Valor *
                  {coupon.type === 'percentage' && ' (%)'}
                  {coupon.type === 'fixed_amount' && ' ($)'}
                </Label>
                <Input
                  id="value"
                  type="number"
                  value={state.formData.value || ''}
                  onChange={(e) => updateFormData('value', parseFloat(e.target.value) || 0)}
                  placeholder={coupon.type === 'percentage' ? '10' : '5000'}
                  min="0"
                  max={coupon.type === 'percentage' ? '100' : undefined}
                  step={coupon.type === 'percentage' ? '0.01' : '1'}
                  className={state.errors.value ? 'border-red-500' : ''}
                />
                {state.errors.value && (
                  <p className="text-sm text-red-500">{state.errors.value}</p>
                )}
              </div>
            </div>
            {coupon.type === 'plan_assignment' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="planCode">Plan a Asignar *</Label>
                  <Select 
                    value={state.formData.planCode || ''} 
                    onValueChange={(value) => {
                      updateFormData('planCode', value);
                      // Reset variant days when plan changes
                      updateFormData('variantDays', undefined);
                    }}
                  >
                    <SelectTrigger className={state.errors.planCode ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Seleccionar plan" />
                    </SelectTrigger>
                    <SelectContent>
                      {state.plans.map((plan) => (
                        <SelectItem key={plan.code} value={plan.code}>
                          {plan.name} ({plan.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {state.errors.planCode && (
                    <p className="text-sm text-red-500">{state.errors.planCode}</p>
                  )}
                </div>

                {state.formData.planCode && (
                  <div className="space-y-2">
                    <Label htmlFor="variantDays">Variante de Días *</Label>
                    <Select
                      value={state.formData.variantDays?.toString() || ''}
                      onValueChange={(value) => updateFormData('variantDays', parseInt(value))}
                    >
                      <SelectTrigger className={state.errors.variantDays ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Seleccionar variante" />
                      </SelectTrigger>
                      <SelectContent>
                        {state.plans
                          .find(plan => plan.code === state.formData.planCode)
                          ?.variants.map((variant) => (
                            <SelectItem key={variant.days} value={variant.days.toString()}>
                              {variant.days} días - ${variant.price.toLocaleString()}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    {state.errors.variantDays && (
                      <p className="text-sm text-red-500">{state.errors.variantDays}</p>
                    )}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Configuración de Uso</CardTitle>
            <CardDescription>Define las limitaciones y vigencia del cupón</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxUses">Usos Máximos</Label>
                <Input
                  id="maxUses"
                  type="number"
                  value={state.formData.maxUses || ''}
                  onChange={(e) => updateFormData('maxUses', parseInt(e.target.value) || -1)}
                  placeholder="-1 para ilimitado"
                  min="-1"
                  className={state.errors.maxUses ? 'border-red-500' : ''}
                />
                {state.errors.maxUses && (
                  <p className="text-sm text-red-500">{state.errors.maxUses}</p>
                )}
                <p className="text-sm text-muted-foreground">
                  Usos actuales: {coupon.currentUses}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="validFrom">Válido Desde</Label>
                <Input
                  id="validFrom"
                  type="date"
                  value={state.formData.validFrom || ''}
                  onChange={(e) => updateFormData('validFrom', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="validUntil">Válido Hasta *</Label>
                <Input
                  id="validUntil"
                  type="date"
                  value={state.formData.validUntil || ''}
                  onChange={(e) => updateFormData('validUntil', e.target.value)}
                  className={state.errors.validUntil ? 'border-red-500' : ''}
                />
                {state.errors.validUntil && (
                  <p className="text-sm text-red-500">{state.errors.validUntil}</p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={state.formData.isActive ?? true}
                onCheckedChange={(checked) => updateFormData('isActive', checked)}
              />
              <Label htmlFor="isActive">Cupón activo</Label>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={state.loading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={state.loading}
          >
            {state.loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Actualizando...
              </>
            ) : (
              'Actualizar Cupón'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}