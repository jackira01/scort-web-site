'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useFormContext } from '../context/FormContext';

import { usePlans } from '@/hooks/usePlans';
import { useConfigValue } from '@/hooks/use-config-parameters';
import { Loader, CheckCircle, AlertCircle, Image, Video, Music, Users, Star, Crown, Gem, Shield, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

interface Plan {
  _id: string;
  name: string;
  code: string;
  level: number;
  variants: PlanVariant[];
  isActive: boolean;
  features?: {
    showInHome: boolean;
    showInFilters: boolean;
    showInSponsored: boolean;
  };
  contentLimits?: {
    photos: { min: number; max: number };
    videos: { min: number; max: number };
    audios: { min: number; max: number };
    storiesPerDayMax: number;
  };
  includedUpgrades?: string[];
}

interface PlanVariant {
  price: number;
  days: number;
  durationRank: number;
}

interface DefaultPlanConfig {
  enabled: boolean;
  planId: string | null;
  planCode: string | null;
}

export function Step4Plan() {
  const { watch, setValue, formState: { errors } } = useFormContext();
  const { data: session } = useSession();
  const formData = watch();
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [selectedVariantIndex, setSelectedVariantIndex] = useState<number>(0);
  const [generateInvoice, setGenerateInvoice] = useState<boolean>(true); // Checkbox para administradores
  const [hasShownDefaultPlanToast, setHasShownDefaultPlanToast] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('defaultPlanToastShown') === 'true';
    }
    return false;
  });

  // Verificar si el usuario es administrador
  const isAdmin = session?.user?.role === 'admin';

  // Obtener planes disponibles
  const { data: plansResponse, isLoading: plansLoading } = usePlans({
    limit: 50,
    page: 1,
    isActive: true
  });
  const plans = plansResponse?.plans || [];

  // Obtener configuración del plan por defecto
  const { value: defaultConfig, loading: configLoading } = useConfigValue<DefaultPlanConfig>(
    'system.default_plan',
    {
      enabled: true,
      defaultValue: { enabled: false, planId: null, planCode: null }
    }
  );

  // Obtener el plan seleccionado
  const selectedPlan = plans.find(plan => plan._id === selectedPlanId);
  const selectedVariant = selectedPlan?.variants?.[selectedVariantIndex];



  // Inicializar estado local basado en valores del formulario al montar
  useEffect(() => {
    const currentSelectedPlan = formData.selectedPlan;
    const currentSelectedVariant = formData.selectedVariant;
    
    if (currentSelectedPlan && plans.length > 0) {
      // Si ya hay un plan seleccionado en el formulario, usar ese
      setSelectedPlanId(currentSelectedPlan._id);
      
      // Encontrar el índice de la variante seleccionada
      const plan = plans.find(p => p._id === currentSelectedPlan._id);
      if (plan && currentSelectedVariant) {
        const variantIndex = plan.variants.findIndex(v => 
          v.days === currentSelectedVariant.days && v.price === currentSelectedVariant.price
        );
        if (variantIndex !== -1) {
          setSelectedVariantIndex(variantIndex);
        }
      }
    }
  }, [formData.selectedPlan, formData.selectedVariant, plans]);

  // Cargar plan por defecto al montar el componente (solo si no hay plan seleccionado)
  useEffect(() => {
    if (defaultConfig?.enabled && defaultConfig.planId && plans.length > 0 && 
        !hasShownDefaultPlanToast && !formData.selectedPlan) {
      const defaultPlan = plans.find(plan => plan._id === defaultConfig.planId);
      if (defaultPlan) {
        setSelectedPlanId(defaultPlan._id);
        setSelectedVariantIndex(0);

        // Actualizar el formulario con el plan por defecto
        setValue('selectedPlan', {
          _id: defaultPlan._id,
          name: defaultPlan.name,
          code: defaultPlan.code,
          variants: defaultPlan.variants,
          contentLimits: {
            photos: { min: 0, max: defaultPlan.contentLimits?.photos?.max || 10 },
            videos: { min: 0, max: defaultPlan.contentLimits?.videos?.max || 5 },
            audios: { min: 0, max: defaultPlan.contentLimits?.audios?.max || 3 },
            storiesPerDayMax: defaultPlan.contentLimits?.storiesPerDayMax || 5
          }
        });

        setValue('selectedVariant', defaultPlan.variants[0]);

        toast.success(`Plan por defecto "${defaultPlan.name}" seleccionado automáticamente`);
        setHasShownDefaultPlanToast(true);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('defaultPlanToastShown', 'true');
        }
      }
    }
  }, [defaultConfig, plans, setValue, hasShownDefaultPlanToast, formData.selectedPlan]);

  // Validar límites de archivos cuando cambie el plan
  useEffect(() => {
    if (selectedPlan && selectedPlan.contentLimits) {
      const { photos, videos, audios } = selectedPlan.contentLimits;

      // Validar fotos
      if (formData.photos && formData.photos.length > photos.max) {
        toast.error(`El plan seleccionado permite máximo ${photos.max} fotos. Tienes ${formData.photos.length} fotos.`);
      }

      // Validar videos
      if (formData.videos && formData.videos.length > videos.max) {
        toast.error(`El plan seleccionado permite máximo ${videos.max} videos. Tienes ${formData.videos.length} videos.`);
      }

      // Validar audios
      if (formData.audios && formData.audios.length > audios.max) {
        toast.error(`El plan seleccionado permite máximo ${audios.max} audios. Tienes ${formData.audios.length} audios.`);
      }
    }
  }, [selectedPlan, formData.photos, formData.videos, formData.audios]);

  const handlePlanChange = (planId: string) => {
    setSelectedPlanId(planId);
    setSelectedVariantIndex(0);

    const plan = plans.find(p => p._id === planId);
    if (plan) {
      setValue('selectedPlan', {
        _id: plan._id,
        name: plan.name,
        code: plan.code,
        variants: plan.variants,
        contentLimits: {
          photos: { min: 0, max: plan.contentLimits?.photos?.max || 10 },
          videos: { min: 0, max: plan.contentLimits?.videos?.max || 5 },
          audios: { min: 0, max: plan.contentLimits?.audios?.max || 3 },
          storiesPerDayMax: plan.contentLimits?.storiesPerDayMax || 5
        }
      });

      setValue('selectedVariant', plan.variants[0]);
      
      // Actualizar el estado de generar factura en el formulario para administradores
      if (isAdmin) {
        setValue('generateInvoice', generateInvoice);
      }
    }
  };

  const handleVariantChange = (variantIndex: number) => {
    setSelectedVariantIndex(variantIndex);
    if (selectedPlan) {
      setValue('selectedVariant', selectedPlan.variants[variantIndex]);
      
      // Actualizar el estado de generar factura en el formulario para administradores
      if (isAdmin) {
        setValue('generateInvoice', generateInvoice);
      }
    }
  };

  if (plansLoading || configLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader className="h-6 w-6 animate-spin" />
        <span className="ml-2">Cargando planes...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in-50 slide-in-from-right-4 duration-500">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
          05
        </div>
        <h2 className="text-2xl font-bold text-foreground">Finalizar</h2>
      </div>

      <div className="space-y-6">


        {/* Selección de Plan */}
        <div>
          <Label className="text-foreground text-lg font-semibold mb-4 block">
            Plan de Membresía <span className="text-red-500">*</span>
          </Label>
          <Select 
            key={`plan-${selectedPlanId}`}
            value={selectedPlanId} 
            onValueChange={handlePlanChange}
          >
            <SelectTrigger className={`w-full ${errors.selectedPlan ? 'border-red-500' : ''}`}>
              <SelectValue 
                placeholder="Selecciona un plan"
                className={selectedPlanId ? 'text-foreground' : 'text-muted-foreground'}
              />
            </SelectTrigger>
            <SelectContent>
              {plans.map((plan) => (
                <SelectItem key={plan._id} value={plan._id}>
                  <div className="flex items-center justify-between w-full">
                    <span>{plan.name}</span>
                    {plan.variants.length > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        Desde ${plan.variants[0].price.toLocaleString()}
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.selectedPlan && (
            <p className="text-red-500 text-sm mt-1">
              {errors.selectedPlan.message}
            </p>
          )}
        </div>

        {/* Selector de Variante */}
        {selectedPlan && selectedPlan.variants.length > 1 && (
          <div>
            <Label className="text-foreground text-lg font-semibold mb-4 block">
              Duración del Plan
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {selectedPlan.variants.map((variant, index) => (
                <Card
                  key={index}
                  className={`cursor-pointer transition-all duration-200 ${selectedVariantIndex === index
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/20'
                    : 'hover:border-purple-300'
                    }`}
                  onClick={() => handleVariantChange(index)}
                >
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-foreground">
                        ${variant.price.toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {variant.days} días
                      </div>
                      {selectedVariantIndex === index && (
                        <CheckCircle className="h-5 w-5 text-purple-500 mx-auto mt-2" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Detalles del Plan Seleccionado */}
        {selectedPlan && (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                Plan Seleccionado: {selectedPlan.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Información del Plan */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Código</span>
                    <p className="text-foreground font-medium">{selectedPlan.code}</p>
                  </div>
                  {selectedVariant && (
                    <>
                      <div>
                        <span className="text-muted-foreground">Precio</span>
                        <p className="text-foreground font-medium">
                          ${selectedVariant.price.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Duración</span>
                        <p className="text-foreground font-medium">
                          {selectedVariant.days} días
                        </p>
                      </div>
                    </>
                  )}
                </div>
                {/* Jerarquía del Plan */}
                {/* <Separator />

                
                <div>
                  <h4 className="font-semibold text-foreground mb-3 flex items-center">
                    {selectedPlan.level === 1 && <Crown className="h-5 w-5 text-purple-500 mr-2" />}
                    {selectedPlan.level === 2 && <Gem className="h-5 w-5 text-blue-500 mr-2" />}
                    {selectedPlan.level === 3 && <Shield className="h-5 w-5 text-green-500 mr-2" />}
                    {selectedPlan.level === 4 && <Star className="h-5 w-5 text-orange-500 mr-2" />}
                    {selectedPlan.level === 5 && <Zap className="h-5 w-5 text-yellow-500 mr-2" />}
                    {selectedPlan.name}
                  </h4>
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">
                      {selectedPlan.level === 1 && "👑 AMATISTA - Máxima visibilidad y todas las características premium"}
                      {selectedPlan.level === 2 && "💎 ZAFIRO - Excelente visibilidad con características avanzadas"}
                      {selectedPlan.level === 3 && "💚 ESMERALDA - Buena visibilidad con características estándar"}
                      {selectedPlan.level === 4 && "🥇 ORO - Visibilidad estándar con características básicas"}
                      {selectedPlan.level === 5 && "💎 DIAMANTE - Plan básico para comenzar"}
                    </p>

                  </div>
                </div> */}

                <Separator />

                {/* Beneficios de Visibilidad */}
                {selectedPlan.features && (
                  <div>
                    <h4 className="font-semibold text-foreground mb-3">Beneficios de Visibilidad</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className={`p-3 rounded-lg border-2 ${selectedPlan.features.showInHome
                        ? 'border-green-200 bg-green-50 dark:bg-green-950/20'
                        : 'border-gray-200 bg-gray-50 dark:bg-gray-950/20'
                        }`}>
                        <div className="flex items-center space-x-2">
                          {selectedPlan.features.showInHome ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-gray-400" />
                          )}
                          <span className={`text-sm font-medium ${selectedPlan.features.showInHome ? 'text-green-700 dark:text-green-300' : 'text-gray-500'
                            }`}>
                            Mostrar en Home
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {selectedPlan.features.showInHome
                            ? 'Tu perfil aparecerá en la página principal'
                            : 'No aparecerás en la página principal'}
                        </p>
                      </div>
                      <div className={`p-3 rounded-lg border-2 ${selectedPlan.features.showInFilters
                        ? 'border-green-200 bg-green-50 dark:bg-green-950/20'
                        : 'border-gray-200 bg-gray-50 dark:bg-gray-950/20'
                        }`}>
                        <div className="flex items-center space-x-2">
                          {selectedPlan.features.showInFilters ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-gray-400" />
                          )}
                          <span className={`text-sm font-medium ${selectedPlan.features.showInFilters ? 'text-green-700 dark:text-green-300' : 'text-gray-500'
                            }`}>
                            Mostrar en Filtros
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {selectedPlan.features.showInFilters
                            ? 'Aparecerás en resultados de búsqueda'
                            : 'No aparecerás en búsquedas filtradas'}
                        </p>
                      </div>
                      <div className={`p-3 rounded-lg border-2 ${selectedPlan.features.showInSponsored
                        ? 'border-green-200 bg-green-50 dark:bg-green-950/20'
                        : 'border-gray-200 bg-gray-50 dark:bg-gray-950/20'
                        }`}>
                        <div className="flex items-center space-x-2">
                          {selectedPlan.features.showInSponsored ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-gray-400" />
                          )}
                          <span className={`text-sm font-medium ${selectedPlan.features.showInSponsored ? 'text-green-700 dark:text-green-300' : 'text-gray-500'
                            }`}>
                            Contenido Patrocinado
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {selectedPlan.features.showInSponsored
                            ? 'Acceso a posiciones destacadas'
                            : 'Sin acceso a posiciones patrocinadas'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <Separator />

                {/* Límites de Contenido */}
                {selectedPlan.contentLimits && (
                  <div>
                    <h4 className="font-semibold text-foreground mb-3">Límites de Contenido</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="flex items-center space-x-2">
                        <Image className="h-4 w-4 text-blue-500" />
                        <div>
                          <p className="text-sm font-medium">{selectedPlan.contentLimits.photos.max}</p>
                          <p className="text-xs text-muted-foreground">Fotos máx.</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Video className="h-4 w-4 text-red-500" />
                        <div>
                          <p className="text-sm font-medium">{selectedPlan.contentLimits.videos.max}</p>
                          <p className="text-xs text-muted-foreground">Videos máx.</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Music className="h-4 w-4 text-green-500" />
                        <div>
                          <p className="text-sm font-medium">{selectedPlan.contentLimits.audios.max}</p>
                          <p className="text-xs text-muted-foreground">Audios máx.</p>
                        </div>
                      </div>

                      {selectedPlan.contentLimits.storiesPerDayMax && (
                        <div className="flex items-center space-x-2">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <div>
                            <p className="text-sm font-medium">{selectedPlan.contentLimits.storiesPerDayMax}</p>
                            <p className="text-xs text-muted-foreground">Stories/día</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Upgrades Incluidos */}
                {selectedPlan.includedUpgrades && selectedPlan.includedUpgrades.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-foreground mb-3">Upgrades Incluidos</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedPlan.includedUpgrades.map((upgrade, index) => (
                        <Badge key={index} variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                          <Zap className="h-3 w-3 mr-1" />
                          {upgrade}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Estos upgrades están incluidos automáticamente en tu plan
                    </p>
                  </div>
                )}

                {/* Validación de Archivos Actuales */}
                {selectedPlan.contentLimits && (
                  <div>
                    <h4 className="font-semibold text-foreground mb-3">Estado Actual de tus Archivos</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Fotos subidas:</span>
                        <div className="flex items-center space-x-2">
                          <span className={`text-sm font-medium ${(formData.photos?.length || 0) <= selectedPlan.contentLimits.photos.max
                            ? 'text-green-600'
                            : 'text-red-600'
                            }`}>
                            {formData.photos?.length || 0} / {selectedPlan.contentLimits.photos.max}
                          </span>
                          {(formData.photos?.length || 0) <= selectedPlan.contentLimits.photos.max ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Videos subidos:</span>
                        <div className="flex items-center space-x-2">
                          <span className={`text-sm font-medium ${(formData.videos?.length || 0) <= selectedPlan.contentLimits.videos.max
                            ? 'text-green-600'
                            : 'text-red-600'
                            }`}>
                            {formData.videos?.length || 0} / {selectedPlan.contentLimits.videos.max}
                          </span>
                          {(formData.videos?.length || 0) <= selectedPlan.contentLimits.videos.max ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Audios subidos:</span>
                        <div className="flex items-center space-x-2">
                          <span className={`text-sm font-medium ${(formData.audios?.length || 0) <= selectedPlan.contentLimits.audios.max
                            ? 'text-green-600'
                            : 'text-red-600'
                            }`}>
                            {formData.audios?.length || 0} / {selectedPlan.contentLimits.audios.max}
                          </span>
                          {(formData.audios?.length || 0) <= selectedPlan.contentLimits.audios.max ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Checkbox para generar factura (solo para administradores) */}
        {isAdmin && selectedPlan && selectedVariant && selectedVariant.price > 0 && (
          <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="generateInvoice"
                  checked={generateInvoice}
                  onCheckedChange={(checked) => {
                    setGenerateInvoice(checked as boolean);
                    setValue('generateInvoice', checked as boolean);
                  }}
                />
                <div className="flex-1">
                  <Label 
                    htmlFor="generateInvoice" 
                    className="text-sm font-medium text-blue-900 dark:text-blue-100 cursor-pointer"
                  >
                    Generar factura para este plan
                  </Label>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                    {generateInvoice 
                      ? 'Se generará una factura y el perfil estará inactivo hasta el pago'
                      : 'Se asignará el plan directamente sin generar factura (solo administradores)'
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
}
