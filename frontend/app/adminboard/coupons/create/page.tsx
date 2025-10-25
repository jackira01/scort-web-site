'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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

// Esquema de validación con Zod
const createCouponSchema = z.object({
  code: z.string()
    .min(3, 'El código debe tener al menos 3 caracteres')
    .regex(/^[A-Z0-9_-]+$/, 'El código solo puede contener letras mayúsculas, números, guiones y guiones bajos'),
  name: z.string()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  description: z.string().optional(),
  type: z.enum(['percentage', 'fixed_amount', 'plan_assignment', 'plan_specific']),
  value: z.number().min(0, 'El valor debe ser mayor o igual a 0'),
  planCode: z.string().optional(),
  variantDays: z.number().optional(),
  validPlanIds: z.array(z.string()).optional(),
  validUpgradeIds: z.array(z.string()).optional(),
  maxUses: z.number(),
  validFrom: z.string(),
  validUntil: z.string(),
  isActive: z.boolean()
}).refine(
  (data) => {
    if (data.type === 'percentage' && data.value > 100) {
      return false;
    }
    return true;
  },
  {
    message: 'El porcentaje no puede ser mayor a 100',
    path: ['value']
  }
).refine(
  (data) => {
    if (data.type === 'plan_assignment' && !data.planCode) {
      return false;
    }
    return true;
  },
  {
    message: 'Debe seleccionar un plan para asignación',
    path: ['planCode']
  }
).refine(
  (data) => {
    if (data.type === 'plan_assignment' && !data.variantDays) {
      return false;
    }
    return true;
  },
  {
    message: 'Debe seleccionar una variante de días para asignación',
    path: ['variantDays']
  }
).refine(
  (data) => {
    if ((data.type === 'percentage' || data.type === 'fixed_amount') &&
      (!data.validPlanIds || data.validPlanIds.length === 0)) {
      return false;
    }
    return true;
  },
  {
    message: 'Debe seleccionar al menos un plan válido',
    path: ['validPlanIds']
  }
).refine(
  (data) => {
    if (data.type === 'plan_specific' &&
      (!data.validPlanIds?.length && !data.validUpgradeIds?.length)) {
      return false;
    }
    return true;
  },
  {
    message: 'Debe seleccionar al menos un plan o upgrade válido',
    path: ['validPlanIds']
  }
).refine(
  (data) => {
    if (data.maxUses !== -1 && data.maxUses <= 0) {
      return false;
    }
    return true;
  },
  {
    message: 'Los usos máximos deben ser mayor a 0 o -1 para ilimitado',
    path: ['maxUses']
  }
).refine(
  (data) => {
    return new Date(data.validFrom) < new Date(data.validUntil);
  },
  {
    message: 'La fecha de vencimiento debe ser posterior a la fecha de inicio',
    path: ['validUntil']
  }
);

type CreateCouponFormData = z.infer<typeof createCouponSchema>;

interface CreateCouponState {
  loading: boolean;
  plans: IPlanDefinition[];
  upgrades: any[];
}

export default function CreateCouponPage() {
  const router = useRouter();
  const [state, setState] = useState<CreateCouponState>({
    loading: false,
    plans: [],
    upgrades: []
  });

  // Configurar React Hook Form con Zod
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors }
  } = useForm<CreateCouponFormData>({
    resolver: zodResolver(createCouponSchema),
    defaultValues: {
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
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      isActive: true
    }
  });

  const watchType = watch('type');
  const watchPlanCode = watch('planCode');
  const watchValidPlanIds = watch('validPlanIds');
  const watchValidUpgradeIds = watch('validUpgradeIds');

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

  const onSubmit = async (data: CreateCouponFormData) => {
    setState(prev => ({ ...prev, loading: true }));

    try {
      await couponService.createCoupon(data as CreateCouponInput);
      toast.success('Cupón creado exitosamente');
      router.push('/adminboard');
    } catch (error: any) {
      console.error('Error creating coupon:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Error al crear cupón';
      toast.error(errorMessage);
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
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

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                  {...register('code', {
                    setValueAs: (v) => v.toUpperCase()
                  })}
                  placeholder="DESCUENTO20"
                  className={errors.code ? 'border-red-500' : ''}
                />
                {errors.code && (
                  <p className="text-sm text-red-500">{errors.code.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  {...register('name')}
                  placeholder="Descuento 20%"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name.message}</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                {...register('description')}
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
                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="plan_assignment">Asignación de Plan</SelectItem>
                        <SelectItem value="fixed_amount">Monto Fijo</SelectItem>
                        <SelectItem value="percentage">Porcentual</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="value">
                  {watchType === 'percentage' ? 'Porcentaje (%)' :
                    watchType === 'fixed_amount' ? 'Monto ($)' : 'Valor'} *
                </Label>
                <Input
                  id="value"
                  type="number"
                  {...register('value', { valueAsNumber: true })}
                  placeholder={watchType === 'percentage' ? '20' : '50000'}
                  min="0"
                  max={watchType === 'percentage' ? '100' : undefined}
                  className={errors.value ? 'border-red-500' : ''}
                  disabled={watchType === 'plan_assignment'}
                />
                {errors.value && (
                  <p className="text-sm text-red-500">{errors.value.message}</p>
                )}
              </div>
            </div>

            {watchType === 'plan_assignment' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="planCode">Plan a Asignar *</Label>
                  <Controller
                    name="planCode"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={(value) => {
                          field.onChange(value);
                          setValue('variantDays', undefined);
                        }}
                      >
                        <SelectTrigger className={errors.planCode ? 'border-red-500' : ''}>
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
                    )}
                  />
                  {errors.planCode && (
                    <p className="text-sm text-red-500">{errors.planCode.message}</p>
                  )}
                </div>

                {watchPlanCode && (
                  <div className="space-y-2">
                    <Label htmlFor="variantDays">Variante de Días *</Label>
                    <Controller
                      name="variantDays"
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={field.value?.toString() || ''}
                          onValueChange={(value) => field.onChange(parseInt(value))}
                        >
                          <SelectTrigger className={errors.variantDays ? 'border-red-500' : ''}>
                            <SelectValue placeholder="Seleccionar variante" />
                          </SelectTrigger>
                          <SelectContent>
                            {state.plans
                              .find(plan => plan.code === watchPlanCode)
                              ?.variants.map((variant) => (
                                <SelectItem key={variant.days} value={variant.days.toString()}>
                                  {variant.days} días - ${variant.price.toLocaleString()}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.variantDays && (
                      <p className="text-sm text-red-500">{errors.variantDays.message}</p>
                    )}
                  </div>
                )}
              </>
            )}

            {(watchType === 'percentage' || watchType === 'fixed_amount') && (
              <>
                <div className="space-y-2">
                  <Label>Planes Válidos *</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-md p-3">
                    {state.plans.flatMap(plan =>
                      plan.variants.map(variant => ({
                        id: plan._id,
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
                          checked={watchValidPlanIds?.includes(planVariant.planId) || false}
                          onChange={(e) => {
                            const currentPlans = watchValidPlanIds || [];
                            if (e.target.checked) {
                              if (!currentPlans.includes(planVariant.planId)) {
                                setValue('validPlanIds', [...currentPlans, planVariant.planId]);
                              }
                            } else {
                              setValue('validPlanIds', currentPlans.filter(id => id !== planVariant.planId));
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
                  {errors.validPlanIds && (
                    <p className="text-sm text-red-500">{errors.validPlanIds.message}</p>
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
                          checked={watchValidUpgradeIds?.includes(upgrade.code) || false}
                          onChange={(e) => {
                            const currentUpgrades = watchValidUpgradeIds || [];
                            if (e.target.checked) {
                              setValue('validUpgradeIds', [...currentUpgrades, upgrade.code]);
                            } else {
                              setValue('validUpgradeIds', currentUpgrades.filter(id => id !== upgrade.code));
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
                  {...register('maxUses', { valueAsNumber: true })}
                  placeholder="-1 para ilimitado"
                  min="-1"
                  step="1"
                  className={errors.maxUses ? 'border-red-500' : ''}
                />
                {errors.maxUses && (
                  <p className="text-sm text-red-500">{errors.maxUses.message}</p>
                )}
                <p className="text-xs text-muted-foreground">-1 para usos ilimitados</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="validFrom">Válido Desde *</Label>
                <Input
                  id="validFrom"
                  type="date"
                  {...register('validFrom')}
                  className={errors.validFrom ? 'border-red-500' : ''}
                />
                {errors.validFrom && (
                  <p className="text-sm text-red-500">{errors.validFrom.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="validUntil">Válido Hasta *</Label>
                <Input
                  id="validUntil"
                  type="date"
                  {...register('validUntil')}
                  className={errors.validUntil ? 'border-red-500' : ''}
                />
                {errors.validUntil && (
                  <p className="text-sm text-red-500">{errors.validUntil.message}</p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Controller
                name="isActive"
                control={control}
                render={({ field }) => (
                  <Switch
                    id="isActive"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
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
