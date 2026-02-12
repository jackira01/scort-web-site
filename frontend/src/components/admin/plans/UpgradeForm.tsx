'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useUpgrades } from '@/hooks/use-upgrades';
import { useCreateUpgrade, useUpdateUpgrade } from '@/hooks/usePlans';
import {
  CreateUpgradeRequest,
  UpdateUpgradeRequest,
  Upgrade,
  UpgradeEffect
} from '@/types/plans';
import { Plus, Save, X, Zap } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

interface UpgradeFormProps {
  isOpen: boolean;
  onClose: () => void;
  upgrade?: Upgrade;
  mode: 'create' | 'edit';
}

interface FormData {
  code: string;
  name: string;
  description: string;
  price: number;
  durationHours: number;
  active: boolean;
  effect: UpgradeEffect;
  requires: string[];
  stackingPolicy: 'extend' | 'replace' | 'reject';
}

const defaultEffect: UpgradeEffect = {
  levelDelta: undefined,
  setLevelTo: undefined,
  priorityBonus: 0,
  positionRule: 'BY_SCORE',
};

const defaultFormData: FormData = {
  code: '',
  name: '',
  description: '',
  price: 0,
  durationHours: 24,
  active: true,
  effect: { ...defaultEffect },
  requires: [],
  stackingPolicy: 'extend',
};

export const UpgradeForm: React.FC<UpgradeFormProps> = ({ isOpen, onClose, upgrade, mode }) => {
  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const [newDependency, setNewDependency] = useState('');
  const [isDependent, setIsDependent] = useState(false);

  const createUpgradeMutation = useCreateUpgrade();
  const updateUpgradeMutation = useUpdateUpgrade();

  // CAMBIO: Usar hook de upgrades en lugar de planes
  const { data: upgradesData } = useUpgrades();

  useEffect(() => {
    if (upgrade && mode === 'edit') {
      const hasDependencies = (upgrade.requires && upgrade.requires.length > 0);
      setIsDependent(hasDependencies);

      setFormData({
        code: upgrade.code,
        name: upgrade.name,
        description: upgrade.description || '',
        price: upgrade.price || 0,
        durationHours: upgrade.durationHours,
        active: upgrade.active,
        effect: upgrade.effect || { ...defaultEffect },
        requires: upgrade.requires || [],
        stackingPolicy: upgrade.stackingPolicy || 'extend',
      });
    } else {
      setFormData(defaultFormData);
      setIsDependent(false);
    }
  }, [upgrade, mode, isOpen]);

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleEffectChange = (field: keyof UpgradeEffect, value: any) => {
    setFormData(prev => ({
      ...prev,
      effect: { ...prev.effect, [field]: value },
    }));
  };

  const addDependency = () => {
    if (!newDependency.trim()) return;

    if (formData.requires.includes(newDependency.trim())) {
      toast.error('Esta dependencia ya existe');
      return;
    }

    setFormData(prev => ({
      ...prev,
      requires: [...prev.requires, newDependency.trim()],
    }));
    setNewDependency('');
  };

  const removeDependency = (index: number) => {
    setFormData(prev => ({
      ...prev,
      requires: prev.requires.filter((_, i) => i !== index),
    }));
  };

  // Limpiar dependencias si se desmarca el checkbox
  const handleDependencyCheckChange = (checked: boolean) => {
    setIsDependent(checked);
    if (!checked) {
      setFormData(prev => ({ ...prev, requires: [] }));
    }
  };

  const getEffectTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      'HIGHLIGHT': 'Destacado',
      'BOOST': 'Impulso',
      'FEATURE_ACCESS': 'Acceso a Función',
      'CONTENT_LIMIT': 'Límite de Contenido'
    };
    return labels[type] || type;
  };

  const formatDuration = (days: number): string => {
    if (days === 1) return '1 día';
    if (days < 30) return `${days} días`;
    if (days === 30) return '1 mes';
    if (days < 365) {
      const months = Math.floor(days / 30);
      return `${months} mes${months > 1 ? 'es' : ''}`;
    }
    const years = Math.floor(days / 365);
    return `${years} año${years > 1 ? 's' : ''}`;
  };

  const validateForm = (): boolean => {
    if (!formData.code.trim()) {
      toast.error('El código es requerido');
      return false;
    }
    if (!formData.name.trim()) {
      toast.error('El nombre es requerido');
      return false;
    }
    if (formData.durationHours <= 0) {
      toast.error('La duración debe ser mayor a 0');
      return false;
    }
    // Validar que al menos uno de los efectos esté definido
    if (!formData.effect.levelDelta && !formData.effect.setLevelTo && !formData.effect.priorityBonus) {
      toast.error('Debe definir al menos un efecto (levelDelta, setLevelTo o priorityBonus)');
      return false;
    }

    // Validar dependencia si está marcada
    if (isDependent && formData.requires.length === 0) {
      toast.error('Si marca "Es dependiente", debe seleccionar al menos un upgrade requerido');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      if (mode === 'create') {
        const createData: CreateUpgradeRequest = {
          code: formData.code,
          name: formData.name,
          description: formData.description,
          price: formData.price,
          durationHours: formData.durationHours,
          active: formData.active,
          effect: formData.effect,
          requires: formData.requires,
          stackingPolicy: formData.stackingPolicy,
        };
        await createUpgradeMutation.mutateAsync(createData);
      } else if (upgrade?._id) {
        const updateData: UpdateUpgradeRequest = {
          _id: upgrade._id,
          code: formData.code,
          name: formData.name,
          description: formData.description,
          price: formData.price,
          durationHours: formData.durationHours,
          active: formData.active,
          effect: formData.effect,
          requires: formData.requires,
          stackingPolicy: formData.stackingPolicy,
        };
        await updateUpgradeMutation.mutateAsync(updateData);
      }
      onClose();
    } catch (error) {

    }
  };

  const isLoading = createUpgradeMutation.isPending || updateUpgradeMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            {mode === 'create' ? 'Crear Nuevo Upgrade' : 'Editar Upgrade'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información básica */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Información Básica</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Código *</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => handleInputChange('code', e.target.value.toUpperCase())}
                    placeholder="DESTACADO"
                    disabled={mode === 'edit'}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Perfil Destacado"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Descripción del upgrade..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Precio *</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                    placeholder="15000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="durationHours">Duración (horas) *</Label>
                  <Input
                    id="durationHours"
                    type="number"
                    value={formData.durationHours}
                    onChange={(e) => handleInputChange('durationHours', parseInt(e.target.value) || 0)}
                    placeholder="720"
                  />
                  <p className="text-xs text-muted-foreground">
                    {Math.floor(formData.durationHours / 24)} días
                  </p>
                </div>
                <div className="flex items-center space-x-2 pt-6">
                  <Switch
                    id="active"
                    checked={formData.active}
                    onCheckedChange={(checked) => handleInputChange('active', checked)}
                  />
                  <Label htmlFor="active">Upgrade activo</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Efectos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Efectos del Upgrade</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Level Delta</Label>
                  <Input
                    type="number"
                    value={formData.effect.levelDelta || ''}
                    onChange={(e) => handleEffectChange('levelDelta', e.target.value ? parseInt(e.target.value) : undefined)}
                    placeholder="1"
                  />
                  <p className="text-xs text-muted-foreground">
                    Incremento de nivel
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Set Level To</Label>
                  <Input
                    type="number"
                    value={formData.effect.setLevelTo || ''}
                    onChange={(e) => handleEffectChange('setLevelTo', e.target.value ? parseInt(e.target.value) : undefined)}
                    placeholder="5"
                  />
                  <p className="text-xs text-muted-foreground">
                    Establecer nivel específico
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Priority Bonus</Label>
                  <Input
                    type="number"
                    value={formData.effect.priorityBonus || 0}
                    onChange={(e) => handleEffectChange('priorityBonus', parseInt(e.target.value) || 0)}
                    placeholder="10"
                  />
                  <p className="text-xs text-muted-foreground">
                    Bonus de prioridad
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Position Rule</Label>
                <Select
                  value={formData.effect.positionRule}
                  onValueChange={(value) => handleEffectChange('positionRule', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar regla de posición" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BY_SCORE">Por Puntuación</SelectItem>
                    <SelectItem value="BY_PRIORITY">Por Prioridad</SelectItem>
                    <SelectItem value="BY_LEVEL">Por Nivel</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Stacking Policy</Label>
                <Select
                  value={formData.stackingPolicy}
                  onValueChange={(value) => handleInputChange('stackingPolicy', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar política de apilamiento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="extend">Extender</SelectItem>
                    <SelectItem value="replace">Reemplazar</SelectItem>
                    <SelectItem value="reject">Rechazar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Dependencias - AHORA DINÁMICO */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">Dependencias de Upgrades</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Definir si este upgrade requiere tener otro activo previamente
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isDependent"
                    checked={isDependent}
                    onCheckedChange={handleDependencyCheckChange}
                  />
                  <Label htmlFor="isDependent">Es dependiente</Label>
                </div>
              </div>
            </CardHeader>

            {isDependent && (
              <CardContent className="space-y-4 animate-in fade-in slide-in-from-top-4">
                <div className="flex gap-2">
                  <Select
                    value={newDependency}
                    onValueChange={setNewDependency}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Seleccionar upgrade requerido..." />
                    </SelectTrigger>
                    <SelectContent>
                      {(upgradesData?.upgrades || [])
                        // Filtrar para no mostrarse a sí mismo ni dependencias ya agregadas
                        .filter(u => u.code !== formData.code && !formData.requires.includes(u.code))
                        .map((u) => (
                          <SelectItem key={u.code} value={u.code}>
                            {u.code} - {u.name}
                          </SelectItem>
                        ))
                      }
                    </SelectContent>
                  </Select>
                  <Button onClick={addDependency} size="sm" disabled={!newDependency}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {formData.requires.map((dependency, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1 font-mono pl-2 pr-1 py-1">
                      {dependency}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 rounded-full ml-1 hover:bg-destructive/20 hover:text-destructive"
                        onClick={() => removeDependency(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>

                {formData.requires.length === 0 && (
                  <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-3 rounded-md text-sm">
                    <Zap className="h-4 w-4" />
                    <span>Selecciona al menos un upgrade de la lista si marcaste "Es dependiente"</span>
                  </div>
                )}
              </CardContent>
            )}

            {!isDependent && (
              <CardContent>
                <p className="text-sm text-muted-foreground italic">
                  Sin dependencias - Disponible para todos los perfiles independientemente de sus otros upgrades.
                </p>
              </CardContent>
            )}
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? (
              'Guardando...'
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {mode === 'create' ? 'Crear Upgrade' : 'Actualizar Upgrade'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UpgradeForm;