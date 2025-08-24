'use client';



import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2, Save, X } from 'lucide-react';
import { useCreatePlan, useUpdatePlan } from '@/hooks/usePlans';
import { Plan, PlanVariant, CreatePlanRequest, UpdatePlanRequest, PLAN_LEVELS, PlanFeatures } from '@/types/plans';
import toast from 'react-hot-toast';

interface PlanFormProps {
  isOpen: boolean;
  onClose: () => void;
  plan?: Plan;
  mode: 'create' | 'edit';
}

interface FormData {
  code: string;
  name: string;
  description: string;
  level: number;
  isActive: boolean;
  features: PlanFeatures;
  variants: PlanVariant[];
}

const defaultVariant: PlanVariant = {
  price: 0,
  days: 30,
  features: [],
  contentLimits: {
    maxPhotos: 10,
    maxVideos: 5,
    maxAudios: 3,
    storiesPerDayMax: 5,
  },
  includedUpgrades: [],
};

const defaultFormData: FormData = {
  code: '',
  name: '',
  description: '',
  level: 1,
  isActive: true,
  features: {
    showInHome: false,
    showInFilters: false,
    showInSponsored: false
  },
  variants: [{ ...defaultVariant }],
};

export const PlanForm: React.FC<PlanFormProps> = ({ isOpen, onClose, plan, mode }) => {
  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const [originalFormData, setOriginalFormData] = useState<FormData>(defaultFormData);
  const [newUpgrade, setNewUpgrade] = useState('');
  const [activeVariantIndex, setActiveVariantIndex] = useState(0);

  const createPlanMutation = useCreatePlan();
  const updatePlanMutation = useUpdatePlan();

  useEffect(() => {
    if (plan && mode === 'edit') {
      // Asegurar que cada variante tenga la estructura correcta de contentLimits
      const normalizedVariants = plan.variants.length > 0 
        ? plan.variants.map(variant => ({
            price: variant.price || 0,
            days: variant.days || 30,
            contentLimits: {
              maxPhotos: variant.contentLimits?.maxPhotos ?? defaultVariant.contentLimits.maxPhotos,
              maxVideos: variant.contentLimits?.maxVideos ?? defaultVariant.contentLimits.maxVideos,
              maxAudios: variant.contentLimits?.maxAudios ?? defaultVariant.contentLimits.maxAudios,
              storiesPerDayMax: variant.contentLimits?.storiesPerDayMax ?? defaultVariant.contentLimits.storiesPerDayMax,
            },
            features: variant.features || [],
            includedUpgrades: variant.includedUpgrades || [],
          }))
        : [{ ...defaultVariant }];

      const initialData = {
        code: plan.code,
        name: plan.name,
        description: plan.description,
        level: plan.level,
        isActive: plan.isActive,
        features: plan.features || {
          showInHome: false,
          showInFilters: false,
          showInSponsored: false
        },
        variants: normalizedVariants,
      };
      
      setFormData(initialData);
      setOriginalFormData(JSON.parse(JSON.stringify(initialData))); // Deep copy
    } else {
      setFormData(defaultFormData);
      setOriginalFormData(JSON.parse(JSON.stringify(defaultFormData)));
    }
    setActiveVariantIndex(0);
  }, [plan, mode, isOpen]);

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleVariantChange = (index: number, field: keyof PlanVariant, value: any) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.map((variant, i) => 
        i === index ? { ...variant, [field]: value } : variant
      ),
    }));
  };

  const handleContentLimitChange = (index: number, field: keyof PlanVariant['contentLimits'], value: number) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.map((variant, i) => 
        i === index ? {
          ...variant,
          contentLimits: { ...variant.contentLimits, [field]: value }
        } : variant
      ),
    }));
  };

  const handleFeatureChange = (field: keyof PlanFeatures, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      features: { ...prev.features, [field]: value }
    }));
  };

  const addVariant = () => {
    setFormData(prev => ({
      ...prev,
      variants: [...prev.variants, { ...defaultVariant }],
    }));
    setActiveVariantIndex(formData.variants.length);
  };

  const removeVariant = (index: number) => {
    if (formData.variants.length <= 1) {
      toast.error('Debe haber al menos una variante');
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index),
    }));
    
    if (activeVariantIndex >= formData.variants.length - 1) {
      setActiveVariantIndex(Math.max(0, formData.variants.length - 2));
    }
  };



  const addUpgrade = (variantIndex: number) => {
    if (!newUpgrade.trim()) return;
    
    handleVariantChange(variantIndex, 'includedUpgrades', [
      ...formData.variants[variantIndex].includedUpgrades,
      newUpgrade.trim()
    ]);
    setNewUpgrade('');
  };

  const removeUpgrade = (variantIndex: number, upgradeIndex: number) => {
    handleVariantChange(variantIndex, 'includedUpgrades', 
      formData.variants[variantIndex].includedUpgrades.filter((_, i) => i !== upgradeIndex)
    );
  };

  // Función para detectar si hay cambios en el formulario
  const hasFormChanges = (): boolean => {
    // Función auxiliar para comparación profunda
    const deepEqual = (obj1: any, obj2: any): boolean => {
      if (obj1 === obj2) return true;
      
      if (obj1 == null || obj2 == null) return obj1 === obj2;
      
      if (typeof obj1 !== typeof obj2) return false;
      
      if (typeof obj1 !== 'object') return obj1 === obj2;
      
      if (Array.isArray(obj1) !== Array.isArray(obj2)) return false;
      
      if (Array.isArray(obj1)) {
        if (obj1.length !== obj2.length) return false;
        for (let i = 0; i < obj1.length; i++) {
          if (!deepEqual(obj1[i], obj2[i])) return false;
        }
        return true;
      }
      
      const keys1 = Object.keys(obj1);
      const keys2 = Object.keys(obj2);
      
      if (keys1.length !== keys2.length) return false;
      
      for (const key of keys1) {
        if (!keys2.includes(key)) return false;
        if (!deepEqual(obj1[key], obj2[key])) return false;
      }
      
      return true;
    };
    
    return !deepEqual(formData, originalFormData);
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
    // La descripción es opcional, no se valida
    if (formData.variants.length === 0) {
      toast.error('Debe haber al menos una variante');
      return false;
    }
    
    for (let i = 0; i < formData.variants.length; i++) {
      const variant = formData.variants[i];
      if (variant.price < 0) {
        toast.error(`El precio de la variante ${i + 1} no puede ser negativo`);
        return false;
      }
      if (variant.days <= 0) {
        toast.error(`Los días de la variante ${i + 1} deben ser mayor a 0`);
        return false;
      }
    }
    
    // Validación específica para modo edición: verificar si hay cambios
    if (mode === 'edit' && !hasFormChanges()) {
      toast.error('No se han realizado cambios en el plan');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    
    const loadingToastId = toast.loading(
      mode === 'create' ? 'Creando plan...' : 'Actualizando plan...'
    );
    
    try {
      if (mode === 'create') {
        const createData: CreatePlanRequest = {
          code: formData.code,
          name: formData.name,
          description: formData.description,
          level: formData.level,
          isActive: formData.isActive,
          features: formData.features,
          variants: formData.variants,
        };
        await createPlanMutation.mutateAsync(createData);
      } else if (plan?._id) {
        const updateData: UpdatePlanRequest = {
          _id: plan._id,
          code: formData.code,
          name: formData.name,
          description: formData.description,
          level: formData.level,
          isActive: formData.isActive,
          features: formData.features,
          variants: formData.variants,
        };
        await updatePlanMutation.mutateAsync(updateData);
      }
      
      toast.dismiss(loadingToastId);
      toast.success(
        mode === 'create' ? 'Plan creado correctamente' : 'Plan actualizado correctamente'
      );
      
      setTimeout(() => onClose(), 1000);
      
    } catch (error) {
      toast.dismiss(loadingToastId);
      
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast.error(`Error al guardar: ${errorMessage}`);
    }
  };

  const isLoading = createPlanMutation.isPending || updatePlanMutation.isPending;
  const isUpdateDisabled = mode === 'edit' && !hasFormChanges();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Crear Nuevo Plan' : 'Editar Plan'}
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
                    placeholder="DIAMANTE"
                    disabled={mode === 'edit'}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Plan Diamante"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Descripción *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Descripción del plan..."
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="level">Nivel de Visibilidad</Label>
                  <Select
                    value={formData.level.toString()}
                    onValueChange={(value) => handleInputChange('level', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PLAN_LEVELS).map(([name, level]) => (
                        <SelectItem key={level} value={level.toString()}>
                          {name} (Nivel {level})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    El nivel determina la prioridad de visibilidad en los resultados de búsqueda. 
                    Nivel 1 (DIAMANTE) = máxima visibilidad, Nivel 5 (AMATISTA) = mínima visibilidad.
                    Los upgrades como IMPULSO pueden mejorar temporalmente la posición.
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => handleInputChange('isActive', checked)}
                  />
                  <Label htmlFor="isActive">Plan Activo</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Features del Plan */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Características del Plan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="showInHome">Mostrar en Página Principal</Label>
                    <p className="text-sm text-muted-foreground">
                      Los perfiles con este plan aparecerán en la página principal
                    </p>
                  </div>
                  <Switch
                    id="showInHome"
                    checked={formData.features.showInHome}
                    onCheckedChange={(checked) => handleFeatureChange('showInHome', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="showInFilters">Mostrar en Filtros</Label>
                    <p className="text-sm text-muted-foreground">
                      Los perfiles con este plan aparecerán en los resultados de filtros
                    </p>
                  </div>
                  <Switch
                    id="showInFilters"
                    checked={formData.features.showInFilters}
                    onCheckedChange={(checked) => handleFeatureChange('showInFilters', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="showInSponsored">Mostrar en Patrocinados</Label>
                    <p className="text-sm text-muted-foreground">
                      Los perfiles con este plan aparecerán en la sección de patrocinados
                    </p>
                  </div>
                  <Switch
                    id="showInSponsored"
                    checked={formData.features.showInSponsored}
                    onCheckedChange={(checked) => handleFeatureChange('showInSponsored', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Variantes */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Variantes del Plan</CardTitle>
                <Button onClick={addVariant} size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Variante
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Tabs de variantes */}
              <div className="flex flex-wrap gap-2 mb-4">
                {formData.variants.map((_, index) => (
                  <Button
                    key={index}
                    variant={activeVariantIndex === index ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveVariantIndex(index)}
                    className="relative"
                  >
                    Variante {index + 1}
                    {formData.variants.length > 1 && (
                      <span
                        className="ml-2 h-4 w-4 p-0 inline-flex items-center justify-center rounded hover:bg-black/10 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeVariant(index);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </span>
                    )}
                  </Button>
                ))}
              </div>

              {/* Contenido de la variante activa */}
              {formData.variants[activeVariantIndex] && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Precio *</Label>
                      <Input
                        type="number"
                        value={formData.variants[activeVariantIndex]?.price || 0}
                        onChange={(e) => handleVariantChange(activeVariantIndex, 'price', parseFloat(e.target.value) || 0)}
                        placeholder="50000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Días *</Label>
                      <Input
                        type="number"
                        value={formData.variants[activeVariantIndex]?.days || 0}
                        onChange={(e) => handleVariantChange(activeVariantIndex, 'days', parseInt(e.target.value) || 0)}
                        placeholder="30"
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Límites de contenido */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Límites de Contenido</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs">Máx. Fotos</Label>
                        <Input
                          type="number"
                          value={formData.variants[activeVariantIndex]?.contentLimits?.maxPhotos || 0}
                          onChange={(e) => handleContentLimitChange(activeVariantIndex, 'maxPhotos', parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Máx. Videos</Label>
                        <Input
                          type="number"
                          value={formData.variants[activeVariantIndex]?.contentLimits?.maxVideos || 0}
                          onChange={(e) => handleContentLimitChange(activeVariantIndex, 'maxVideos', parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Máx. Audios</Label>
                        <Input
                          type="number"
                          value={formData.variants[activeVariantIndex]?.contentLimits?.maxAudios || 0}
                          onChange={(e) => handleContentLimitChange(activeVariantIndex, 'maxAudios', parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Máx. Historias por Día</Label>
                        <Input
                          type="number"
                          value={formData.variants[activeVariantIndex]?.contentLimits?.storiesPerDayMax || 0}
                          onChange={(e) => handleContentLimitChange(activeVariantIndex, 'storiesPerDayMax', parseInt(e.target.value) || 0)}
                        />
                      </div>
                    </div>
                  </div>



                  <Separator />

                  {/* Upgrades incluidos */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Upgrades Incluidos</Label>
                    <div className="flex gap-2">
                      <Input
                        value={newUpgrade}
                        onChange={(e) => setNewUpgrade(e.target.value)}
                        placeholder="Código del upgrade..."
                        onKeyPress={(e) => e.key === 'Enter' && addUpgrade(activeVariantIndex)}
                      />
                      <Button onClick={() => addUpgrade(activeVariantIndex)} size="sm">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(formData.variants[activeVariantIndex]?.includedUpgrades || []).map((upgrade, index) => (
                        <Badge key={index} variant="outline" className="flex items-center gap-1 font-mono">
                          {upgrade}
                          <span
                            className="h-4 w-4 p-0 inline-flex items-center justify-center rounded hover:bg-black/10 cursor-pointer"
                            onClick={() => removeUpgrade(activeVariantIndex, index)}
                          >
                            <X className="h-3 w-3" />
                          </span>
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || isUpdateDisabled}>
            {isLoading ? (
              'Guardando...'
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {mode === 'create' ? 'Crear Plan' : 'Actualizar Plan'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PlanForm;