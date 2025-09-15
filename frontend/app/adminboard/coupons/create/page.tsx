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
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { couponService } from '@/services/coupon.service';
import { plansService } from '@/services/plans.service';
import type { CreateCouponInput } from '@/types/coupon.types';
import type { IPlanDefinition } from '@/types/plans.types';

interface CreateCouponState {
  loading: boolean;
  plans: IPlanDefinition[];
  formData: CreateCouponInput;
  errors: Record<string, string>;
}

export default function CreateCouponPage() {
  const router = useRouter();
  const [state, setState] = useState<CreateCouponState>({
    loading: false,
    plans: [],
    formData: {
      code: '',
      name: '',
      description: '',
      type: 'percentage',
      value: 0,
      planCode: '',
      applicablePlans: [],
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
      toast.error(error.message || 'Error al crear cupón');
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

  const addApplicablePlan = (planCode: string) => {
    if (!state.formData.applicablePlans?.includes(planCode)) {
      updateFormData('applicablePlans', [...(state.formData.applicablePlans || []), planCode]);
    }
  };

  const removeApplicablePlan = (planCode: string) => {
    updateFormData(
      'applicablePlans',
      state.formData.applicablePlans?.filter(code => code !== planCode) || []
    );
  };

  useEffect(() => {
    loadPlans();
  }, []);

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" onClick={() => router.back()}>
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
                    <SelectItem value="percentage">Porcentual</SelectItem>
                    <SelectItem value="fixed_amount">Monto Fijo</SelectItem>
                    <SelectItem value="plan_assignment">Asignación de Plan</SelectItem>
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
              <div className="space-y-2">
                <Label htmlFor="planCode">Plan a Asignar *</Label>
                <Select
                  value={state.formData.planCode}
                  onValueChange={(value) => updateFormData('planCode', value)}
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
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Planes Aplicables</CardTitle>
            <CardDescription>Selecciona los planes donde se puede usar este cupón (opcional)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Agregar Plan</Label>
              <Select onValueChange={addApplicablePlan}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar plan para agregar" />
                </SelectTrigger>
                <SelectContent>
                  {state.plans
                    .filter(plan => !state.formData.applicablePlans?.includes(plan.code))
                    .map((plan) => (
                      <SelectItem key={plan.code} value={plan.code}>
                        {plan.name} ({plan.code})
                      </SelectItem>
                    ))
                  }
                </SelectContent>
              </Select>
            </div>
            {state.formData.applicablePlans && state.formData.applicablePlans.length > 0 && (
              <div className="space-y-2">
                <Label>Planes Seleccionados</Label>
                <div className="flex flex-wrap gap-2">
                  {state.formData.applicablePlans.map((planCode) => {
                    const plan = state.plans.find(p => p.code === planCode);
                    return (
                      <Badge key={planCode} variant="secondary" className="flex items-center gap-1">
                        {plan?.name || planCode}
                        <X
                          className="w-3 h-3 cursor-pointer"
                          onClick={() => removeApplicablePlan(planCode)}
                        />
                      </Badge>
                    );
                  })}
                </div>
              </div>
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
                  onChange={(e) => updateFormData('maxUses', parseInt(e.target.value) || -1)}
                  placeholder="-1 para ilimitado"
                  className={state.errors.maxUses ? 'border-red-500' : ''}
                />
                {state.errors.maxUses && (
                  <p className="text-sm text-red-500">{state.errors.maxUses}</p>
                )}
                <p className="text-xs text-muted-foreground">-1 para usos ilimitados</p>
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