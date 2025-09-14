'use client';

import { useState, useEffect } from 'react';
import { X, Zap, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useCreateUpgrade, useUpdateUpgrade } from '@/hooks/usePlans';
import { Upgrade, CreateUpgradeRequest, UpdateUpgradeRequest } from '@/types/plans';

interface UpgradeFormProps {
  isOpen: boolean;
  onClose: () => void;
  upgrade: Upgrade | null;
  mode: 'create' | 'edit';
}

interface FormData {
  name: string;
  description: string;
  price: number;
  durationHours: number;
  active: boolean;
}

const initialFormData: FormData = {
  name: '',
  description: '',
  price: 0,
  durationHours: 24,
  active: true,
};

export default function UpgradeForm({ isOpen, onClose, upgrade, mode }: UpgradeFormProps) {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createUpgradeMutation = useCreateUpgrade();
  const updateUpgradeMutation = useUpdateUpgrade();

  useEffect(() => {
    if (upgrade && mode === 'edit') {
      setFormData({
        name: upgrade.name,
        description: upgrade.description || '',
        price: upgrade.price || 0,
        durationHours: upgrade.durationHours,
        active: upgrade.active,
      });
    } else {
      setFormData(initialFormData);
    }
    setErrors({});
  }, [upgrade, mode, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'La descripción es requerida';
    }

    if (formData.price <= 0) {
      newErrors.price = 'El precio debe ser mayor a 0';
    }

    if (formData.durationHours <= 0) {
      newErrors.durationHours = 'La duración debe ser mayor a 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const upgradeData: CreateUpgradeRequest = {
      code: formData.name.toLowerCase().replace(/\s+/g, '_'),
      name: formData.name,
      description: formData.description,
      price: formData.price,
      durationHours: formData.durationHours,
      requires: [],
      stackingPolicy: 'extend',
      effect: {},
      active: formData.active,
    };

    try {
      if (mode === 'create') {
        await createUpgradeMutation.mutateAsync(upgradeData);
      } else if (upgrade && upgrade._id) {
        const updateData: UpdateUpgradeRequest = {
          _id: upgrade._id,
          ...upgradeData,
        };
        await updateUpgradeMutation.mutateAsync(updateData);
      }
      onClose();
    } catch (error) {
      console.error('Error saving upgrade:', error);
    }
  };

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const isLoading = createUpgradeMutation.isPending || updateUpgradeMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            {mode === 'create' ? 'Crear Nuevo Upgrade' : 'Editar Upgrade'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Información Básica</CardTitle>
              <CardDescription>
                Configura los datos principales del upgrade
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre del Upgrade *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Ej: Boost Premium"
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-600">{errors.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">Precio (COP) *</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className={errors.price ? 'border-red-500' : ''}
                  />
                  {errors.price && (
                    <p className="text-sm text-red-600">{errors.price}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe las características y beneficios del upgrade..."
                  rows={3}
                  className={errors.description ? 'border-red-500' : ''}
                />
                {errors.description && (
                  <p className="text-sm text-red-600">{errors.description}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Duration and Boost */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Configuración del Upgrade</CardTitle>
              <CardDescription>
                Define la duración y efectos del upgrade
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="durationHours">Duración (horas) *</Label>
                  <Input
                    id="durationHours"
                    type="number"
                    min="1"
                    value={formData.durationHours}
                    onChange={(e) => handleInputChange('durationHours', parseInt(e.target.value) || 1)}
                    className={errors.durationHours ? 'border-red-500' : ''}
                  />
                  {errors.durationHours && (
                    <p className="text-sm text-red-600">{errors.durationHours}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Estado */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Estado</CardTitle>
              <CardDescription>
                Configuración del estado del upgrade
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Switch
                  id="active"
                  checked={formData.active}
                  onCheckedChange={(checked) => handleInputChange('active', checked)}
                />
                <Label htmlFor="active">
                  {formData.active ? 'Upgrade activo' : 'Upgrade inactivo'}
                </Label>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Los upgrades inactivos no estarán disponibles para los usuarios
              </p>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              <Save className="h-4 w-4 mr-2" />
              {isLoading
                ? 'Guardando...'
                : mode === 'create'
                ? 'Crear Upgrade'
                : 'Actualizar Upgrade'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}