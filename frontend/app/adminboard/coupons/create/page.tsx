'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { couponService } from '@/services/coupon.service';
import { plansService } from '@/services/plans.service';
import type { CreateCouponInput } from '@/types/coupon.types';
import type { IPlanDefinition } from '@/types/plans.types';

interface CreateCouponState {
  loading: boolean;
  plans: IPlanDefinition[];
  upgrades: any[];
  formData: CreateCouponInput;
  errors: Record<string, string>;
}

export default function CreateCouponPage() {
  const router = useRouter();
  const [state, setState] = useState<CreateCouponState>({
    loading: false,
    plans: [],
    upgrades: [],
    formData: {
      code: '',
      name: '',
      description: '',
      type: 'percentage',
      value: 0,
      planCode: '',
      variantDays: undefined,
      validPlanIds: [],
      validUpgradeIds: [],
      maxUses: -1,
      validFrom: new Date().toISOString().split('T')[0],
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 días
      isActive: true
    },
    errors: {}
  });

  const loadPlans = async () => {
    try {
      const plans = await plansService.getAvailablePlans();
      setState(prev => ({ ...prev, plans }));
    } catch (error) {
      console.error('Error loading plans:', error);
      toast.error('Error al cargar planes');
    }
  };

  const loadUpgrades = async () => {
    try {
      const upgrades = await plansService.getAvailableUpgrades();
      setState(prev => ({ ...prev, upgrades }));
    } catch (error) {
      console.error('Error loading upgrades:', error);
      toast.error('Error al cargar upgrades');
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!state.formData.code.trim()) {
      errors.code = 'El código es requerido';
    } else if (!/^[A-Z0-9_-]+$/.test(state.formData.code)) {
      errors.code = 'El código solo puede contener letras mayúsculas, números, guiones y guiones bajos';
    }

    if (!state.formData.name.trim()) {
      errors.name = 'El nombre es requerido';
    }

    if (state.formData.type === 'percentage') {
      if (state.formData.value < 0 || state.formData.value > 100) {
        errors.value = 'El porcentaje debe estar entre 0 y 100';
      }
    } else if (state.formData.type === 'fixed_amount') {
      if (state.formData.value < 0) {
        errors.value = 'El monto debe ser mayor o igual a 0';
      }
    }

    if (state.formData.type === 'plan_assignment' && !state.formData.planCode) {
      errors.planCode = 'Debe seleccionar un plan para asignación';
    }

    if (state.formData.type === 'plan_assignment' && !state.formData.variantDays) {
      errors.variantDays = 'Debe seleccionar una variante de días para asignación';
    }

    if (state.formData.type === 'plan_specific' && (!state.formData.validPlanIds?.length && !state.formData.validUpgradeIds?.length)) {
      errors.validPlanIds = 'Debe seleccionar al menos un plan o upgrade válido para cupones específicos';
    }

    if (state.formData.maxUses !== -1 && state.formData.maxUses <= 0) {
      errors.maxUses = 'Los usos máximos deben ser mayor a 0 o -1 para ilimitado';
    }

    if (new Date(state.formData.validFrom) >= new Date(state.formData.validUntil)) {
      errors.validUntil = 'La fecha de vencimiento debe ser posterior a la fecha de inicio';
    }

    setState(prev => ({ ...prev, errors }));
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setState(prev => ({ ...prev, loading: true }));

    try {
      await couponService.createCoupon(state.formData);
      toast.success('Cupón creado exitosamente');
      router.push('/adminboard/coupons');
    } catch (error: any) {
      console.error('Error creating coupon:', error);

      // Capturar el mensaje específico del backend
      const errorMessage = error.response?.data?.message || error.message || 'Error al crear cupón';
      toast.error(errorMessage);
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const updateFormData = (field: keyof CreateCouponInput, value: any) => {
    setState(prev => ({
      ...prev,
      formData: { ...prev.formData, [field]: value },
      errors: { ...prev.errors, [field]: '' }
    }));
  };

  useEffect(() => {
    loadPlans();
    loadUpgrades();
  }, []);

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" onClick={() => router.push('/adminboard')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Crear Cupón</h1>
          <p className="text-muted-foreground">Crea un nuevo cupón de descuento</p>
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
                <Label htmlFor="code">Código *</Label>
                <Input
                  id="code"
                  value={state.formData.code}
                  onChange={(e) => updateFormData('code', e.target.value.toUpperCase())}
                  placeholder="DESCUENTO20"
                  className={state.errors.code ? 'border-red-500' : ''}
                />
                {state.errors.code && (
                  <p className="text-sm text-red-500">{state.errors.code}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  value={state.formData.name}
                  onChange={(e) => updateFormData('name', e.target.value)}
                  placeholder="Descuento 20%"
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
                value={state.formData.description}
                onChange={(e) => updateFormData('description', e.target.value)}
                placeholder="Descripción del cupón..."
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
                <Label htmlFor="type">Tipo de Cupón *</Label>
                <Select
                  value={state.formData.type}
                  onValueChange={(value: any) => updateFormData('type', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="plan_assignment">Asignación de Plan</SelectItem>
                    <SelectItem value="fixed_amount">Monto Fijo</SelectItem>
                    <SelectItem value="percentage">Porcentual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="value">
                  {state.formData.type === 'percentage' ? 'Porcentaje (%)' :
                    state.formData.type === 'fixed_amount' ? 'Monto ($)' : 'Valor'} *
                </Label>
                <Input
                  id="value"
                  type="number"
                  value={state.formData.value}
                  onChange={(e) => updateFormData('value', parseFloat(e.target.value) || 0)}
                  placeholder={state.formData.type === 'percentage' ? '20' : '50000'}
                  min="0"
                  max={state.formData.type === 'percentage' ? '100' : undefined}
                  className={state.errors.value ? 'border-red-500' : ''}
                  disabled={state.formData.type === 'plan_assignment'}
                />
                {state.errors.value && (
                  <p className="text-sm text-red-500">{state.errors.value}</p>
                )}
              </div>
            </div>

            {state.formData.type === 'plan_assignment' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="planCode">Plan a Asignar *</Label>
                  <Select
                    value={state.formData.planCode}
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

            {(state.formData.type === 'percentage' || state.formData.type === 'fixed_amount') && (
              <>
                <div className="space-y-2">
                  <Label>Planes Válidos</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-md p-3">
                    {state.plans.flatMap(plan =>
                      plan.variants.map(variant => ({
                        id: plan._id, // ✅ Solo el ID del plan, sin concatenar días
                        displayId: `${plan.code}-${variant.days}`,
                        name: `${plan.name} - ${variant.days} días - $${variant.price.toLocaleString()}`,
                        planId: plan._id,
                        planCode: plan.code,
                        days: variant.days
                      }))
                    ).map((planVariant) => (
                      <div key={planVariant.displayId} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`plan-${planVariant.displayId}`}
                          checked={state.formData.validPlanIds?.includes(planVariant.planId) || false}
                          onChange={(e) => {
                            const currentPlans = state.formData.validPlanIds || [];
                            if (e.target.checked) {
                              // Evitar duplicados al agregar solo planId sin días
                              if (!currentPlans.includes(planVariant.planId)) {
                                updateFormData('validPlanIds', [...currentPlans, planVariant.planId]);
                              }
                            } else {
                              updateFormData('validPlanIds', currentPlans.filter(id => id !== planVariant.planId));
                            }
                          }}
                          className="rounded"
                        />
                        <label htmlFor={`plan-${planVariant.displayId}`} className="text-sm font-medium">
                          {planVariant.name}
                        </label>
                      </div>
                    ))}
                  </div>
                  {state.errors.validPlanIds && (
                    <p className="text-sm text-red-500">{state.errors.validPlanIds}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Upgrades Válidos</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-md p-3">
                    {state.upgrades.map((upgrade) => (
                      <div key={upgrade.code} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`upgrade-${upgrade.code}`}
                          checked={state.formData.validUpgradeIds?.includes(upgrade.code) || false}
                          onChange={(e) => {
                            const currentUpgrades = state.formData.validUpgradeIds || [];
                            if (e.target.checked) {
                              updateFormData('validUpgradeIds', [...currentUpgrades, upgrade.code]);
                            } else {
                              updateFormData('validUpgradeIds', currentUpgrades.filter(id => id !== upgrade.code));
                            }
                          }}
                          className="rounded"
                        />
                        <label htmlFor={`upgrade-${upgrade.code}`} className="text-sm font-medium">
                          {upgrade.name}
                        </label>
                      </div>
                    ))}
                  </div>
                  {state.errors.validUpgradeIds && (
                    <p className="text-sm text-red-500">{state.errors.validUpgradeIds}</p>
                  )}
                </div>
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
                  value={state.formData.maxUses}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    // Permitir -1 para ilimitados o números positivos
                    if (isNaN(value)) {
                      updateFormData('maxUses', -1);
                    } else if (value === 0) {
                      updateFormData('maxUses', 1); // Cambiar 0 por 1 como mínimo válido
                    } else {
                      updateFormData('maxUses', value);
                    }
                  }}
                  placeholder="-1 para ilimitado"
                  min="-1"
                  step="1"
                  className={state.errors.maxUses ? 'border-red-500' : ''}
                />
                {state.errors.maxUses && (
                  <p className="text-sm text-red-500">{state.errors.maxUses}</p>
                )}
                <p className="text-xs text-muted-foreground">-1 para usos ilimitados, números positivos para límite específico</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="validFrom">Válido Desde *</Label>
                <Input
                  id="validFrom"
                  type="date"
                  value={state.formData.validFrom}
                  onChange={(e) => updateFormData('validFrom', e.target.value)}
                  className={state.errors.validFrom ? 'border-red-500' : ''}
                />
                {state.errors.validFrom && (
                  <p className="text-sm text-red-500">{state.errors.validFrom}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="validUntil">Válido Hasta *</Label>
                <Input
                  id="validUntil"
                  type="date"
                  value={state.formData.validUntil}
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
                checked={state.formData.isActive}
                onCheckedChange={(checked) => updateFormData('isActive', checked)}
              />
              <Label htmlFor="isActive">Cupón activo</Label>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button type="submit" disabled={state.loading}>
            {state.loading ? 'Creando...' : 'Crear Cupón'}
          </Button>
        </div>
      </form>
    </div>
  );
}