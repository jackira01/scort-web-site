'use client';

import { useState, useEffect } from 'react';
import { Calendar, Crown, Star, Zap, CheckCircle, X, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import toast from 'react-hot-toast';
import { useSession } from 'next-auth/react';
import { useQueryClient } from '@tanstack/react-query';
import {
  purchasePlan,
  renewPlan,
  upgradePlan,
  getActiveProfilesCount,
  validatePlanBusinessRules,
  type PlanPurchaseRequest,
  type PlanRenewalRequest,
  type PlanUpgradeRequest,
} from '@/services/plans.service';
import { invoiceService, type CreateInvoiceData } from '@/services/invoice.service';
import { Plan } from '@/types/plans';
import { useAvailablePlans } from '@/hooks/use-available-plans';
import { useProfilePlan } from '@/hooks/use-profile-plan';

interface ProfilePlan {
  planCode: string;
  variantDays: number;
  startAt: string | Date;
  expiresAt: string | Date;
}

interface ManagePlansModalProps {
  isOpen: boolean;
  onClose: () => void;
  profileId: string;
  profileName: string;
  currentPlan?: ProfilePlan;
  onPlanChange?: () => void;
}

// Función para obtener el color y icono basado en el código del plan
const getPlanDisplayInfo = (code: string) => {
  const planStyles: Record<string, { color: string; icon: React.ReactNode; popular?: boolean }> = {
    'AMATISTA': {
      color: 'bg-purple-100 text-purple-800 border-purple-200',
      icon: <Star className="h-4 w-4" />,
    },
    'ESMERALDA': {
      color: 'bg-green-100 text-green-800 border-green-200',
      icon: <Zap className="h-4 w-4" />,
    },
    'ORO': {
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      icon: <Crown className="h-4 w-4" />,
    },
    'DIAMANTE': {
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: <Crown className="h-4 w-4" />,
      popular: true,
    },
  };

  return planStyles[code] || {
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: <Star className="h-4 w-4" />,
  };
};

// Función para obtener el precio más bajo de las variantes del plan
const getLowestPrice = (variants: { price: number }[]) => {
  if (!variants || variants.length === 0) return 0;
  return Math.min(...variants.map(v => v.price));
};

// Función para obtener la duración más corta de las variantes del plan
const getShortestDuration = (variants: { days: number }[]) => {
  if (!variants || variants.length === 0) return 0;
  return Math.min(...variants.map(v => v.days));
};

// Función para formatear la duración en texto legible
const formatDuration = (days: number) => {
  if (days === 7) return '1 semana';
  if (days === 15) return '15 días';
  if (days === 30) return '1 mes';
  if (days === 60) return '2 meses';
  if (days === 90) return '3 meses';
  return `${days} días`;
};

// Función para generar features descriptivas basadas en el plan
const getPlanFeatures = (plan: Plan): string[] => {
  const features: string[] = [];

  // Features basadas en contentLimits
  if (plan.contentLimits) {
    if (plan.contentLimits.photos && plan.contentLimits.photos.max > 0) {
      features.push(`Hasta ${plan.contentLimits.photos.max} fotos`);
    }
    if (plan.contentLimits.videos && plan.contentLimits.videos.max > 0) {
      features.push(`Hasta ${plan.contentLimits.videos.max} videos`);
    }
    if (plan.contentLimits.audios && plan.contentLimits.audios.max > 0) {
      features.push(`Hasta ${plan.contentLimits.audios.max} audios`);
    }
    if (plan.contentLimits.storiesPerDayMax && plan.contentLimits.storiesPerDayMax > 0) {
      features.push(`${plan.contentLimits.storiesPerDayMax} historias por día`);
    }
  }

  // Features basadas en las propiedades del plan
  if (plan.features && plan.features.showInHome) {
    features.push('Aparece en página principal');
  }
  if (plan.features && plan.features.showInFilters) {
    features.push('Visible en filtros');
  }
  if (plan.features && plan.features.showInSponsored) {
    features.push('Contenido patrocinado');
  }

  // Features basadas en upgrades incluidos
  if (plan.includedUpgrades && plan.includedUpgrades.length > 0) {
    features.push(`${plan.includedUpgrades.length} upgrades incluidos`);
  }

  // Features basadas en el nivel del plan
  const levelFeatures: Record<number, string[]> = {
    1: ['Máxima visibilidad', 'Prioridad premium'],
    2: ['Alta visibilidad', 'Destacado en búsquedas'],
    3: ['Buena visibilidad', 'Perfil mejorado'],
    4: ['Visibilidad estándar', 'Funciones básicas'],
    5: ['Plan gratuito', 'Funciones limitadas']
  };

  const levelSpecificFeatures = levelFeatures[plan.level] || [];
  features.push(...levelSpecificFeatures);

  return features;
};

export default function ManagePlansModal({
  isOpen,
  onClose,
  profileId,
  profileName,
  currentPlan,
  onPlanChange,
}: ManagePlansModalProps) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeProfilesCount, setActiveProfilesCount] = useState(0);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, number>>({});
  const [generateInvoice, setGenerateInvoice] = useState(true);

  // Verificar si el usuario es administrador
  const isAdmin = session?.user?.role === 'admin';

  // Usar React Query hooks para obtener datos
  const {
    data: availablePlans = [],
    isLoading: isLoadingPlans,
    error: plansError
  } = useAvailablePlans();

  const {
    data: profilePlanInfo,
    isLoading: isLoadingProfilePlan,
    error: profilePlanError,
    refetch: refetchProfilePlan
  } = useProfilePlan(profileId);

  // Procesar planes disponibles con información de display
  const processedPlans = availablePlans.map((plan: Plan) => {
    const displayInfo = getPlanDisplayInfo(plan.code);
    return {
      ...plan,
      color: displayInfo.color,
      icon: displayInfo.icon,
      popular: displayInfo.popular,
    };
  });

  // Manejar errores de carga de planes
  useEffect(() => {
    if (plansError) {
      // Error handled by query
      const errorMessage = plansError.message || 'Error desconocido al cargar planes';
      toast.error(`Error al obtener planes disponibles: ${errorMessage}`);
    }
  }, [plansError]);

  // Manejar errores de carga de información del plan del perfil
  useEffect(() => {
    if (profilePlanError) {
      // Error handled by query
      // No mostrar error si es 404 (perfil sin plan)
      if (profilePlanError.message && !profilePlanError.message.includes('404')) {
        toast.error('Error al obtener información del plan del perfil');
      }
    }
  }, [profilePlanError]);

  // Obtener el plan actual
  const getCurrentPlan = (): Plan => {
    // Si no hay planes disponibles aún, devolver un plan por defecto
    if (processedPlans.length === 0) {
      return {
        _id: 'default',
        code: 'AMATISTA',
        name: 'Amatista',
        level: 5,
        variants: [{ days: 30, price: 0, durationRank: 1 }],
        features: { showInHome: false, showInFilters: false, showInSponsored: false },
        contentLimits: {
          photos: { min: 1, max: 5 },
          videos: { min: 0, max: 1 },
          audios: { min: 0, max: 1 },
          storiesPerDayMax: 1
        },
        includedUpgrades: [],
        active: true,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        __v: 0,
        id: 'default'
      };
    }

    // Usar profilePlanInfo si está disponible, sino usar currentPlan como fallback
    const planToUse = profilePlanInfo || currentPlan;
    if (!planToUse) return processedPlans[0]; // Amatista por defecto
    return processedPlans.find((plan: Plan) => plan.code === planToUse.planCode) || processedPlans[0];
  };

  const currentPlanData = getCurrentPlan();

  // Verificar si el plan actual está activo
  const isPlanActive = () => {
    const planToUse = profilePlanInfo || currentPlan;
    if (!planToUse || !planToUse.expiresAt) return false;

    const expiresAt = new Date(planToUse.expiresAt);
    const tempDate = new Date('1970-01-01');

    // Si la fecha de expiración es la fecha temporal, considerar como pendiente de pago
    if (expiresAt.getTime() === tempDate.getTime()) {
      return false; // Plan pendiente de pago
    }

    return expiresAt > new Date();
  };

  // Verificar si el plan está pendiente de pago
  const isPlanPending = () => {
    const planToUse = profilePlanInfo || currentPlan;
    if (!planToUse || !planToUse.expiresAt) return false;

    const expiresAt = new Date(planToUse.expiresAt);
    const tempDate = new Date('1970-01-01');

    return expiresAt.getTime() === tempDate.getTime();
  };

  // Verificar si no tiene plan asignado
  const hasNoPlanAssigned = () => {
    console.log('🔍 [PLAN DEBUG] Verificando si tiene plan asignado:', {
      profilePlanInfo,
      currentPlan,
      hasNoPlan: profilePlanInfo?.hasNoPlan
    });

    // Si profilePlanInfo tiene hasNoPlan: true, entonces no tiene plan
    if (profilePlanInfo?.hasNoPlan) {
      return true;
    }

    return !profilePlanInfo && !currentPlan;
  };

  // Calcular días restantes
  const getDaysRemaining = () => {
    const planToUse = profilePlanInfo || currentPlan;
    if (!planToUse || !isPlanActive() || !planToUse.expiresAt) return 0;
    const expiresAt = new Date(planToUse.expiresAt);
    const now = new Date();
    const diffTime = expiresAt.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Verificar si se puede hacer upgrade usando las reglas de negocio
  const canUpgradeTo = (planCode: string) => {
    const planToUse = profilePlanInfo || currentPlan;
    if (!planToUse || !planToUse.expiresAt || !validatePlanBusinessRules.isPlanActive(planToUse.expiresAt)) {
      return false;
    }

    // RESTRICCIÓN ELIMINADA: Ahora se permite cambiar a cualquier plan
    // Ya no validamos jerarquía de planes, permitiendo tanto upgrades como downgrades
    return true; // Permitir cambio a cualquier plan
  };

  // Obtener la variante seleccionada para un plan
  const getSelectedVariant = (planCode: string, plan: Plan) => {
    const selectedDays = selectedVariants[planCode];
    if (!selectedDays) {
      // Si no hay variante seleccionada, usar la variante actual del usuario si existe
      if (currentPlan && currentPlan.variantDays && planCode === currentPlan.planCode) {
        const currentVariant = plan.variants.find(v => v.days === currentPlan.variantDays);
        if (currentVariant) {
          return currentVariant;
        }
      }
      // Si no hay variante actual o no coincide, usar la más corta por defecto
      return plan.variants.reduce((shortest, current) =>
        current.days < shortest.days ? current : shortest
      );
    }
    return plan.variants.find(v => v.days === selectedDays) || plan.variants[0];
  };

  // Refrescar datos del plan después de una operación exitosa
  const refreshPlanData = async () => {
    try {
      await refetchProfilePlan();
      // Forzar una nueva consulta para asegurar datos actualizados
      await queryClient.invalidateQueries({
        queryKey: ['profilePlan']
      });
    } catch (error) {
      console.error('Error al refrescar datos del plan:', error);
    }
  };

  // Manejar compra/renovación/upgrade con validaciones de negocio
  const handlePlanAction = async (action: 'purchase' | 'renew' | 'upgrade', planCode: string) => {
    // Validar límite de perfiles con planes pagos
    if (!validatePlanBusinessRules.validateProfileLimit(activeProfilesCount, 10) && planCode !== 'AMATISTA') {
      toast.error('No puedes tener más de 10 perfiles con plan pago activos');
      return;
    }

    // Validar restricciones específicas
    if (action === 'upgrade' && !validatePlanBusinessRules.canEditActivePlan()) {
      // RESTRICCIÓN ELIMINADA: Ahora se permite cambiar a cualquier plan
      // Ya no validamos jerarquía de planes, permitiendo tanto upgrades como downgrades
    }

    setIsProcessing(true);

    // Variable para rastrear si el plan actual es gratuito
    let isPlanFree = false;

    try {
      // Iniciando acción de plan

      let result;
      let message = '';

      switch (action) {
        case 'purchase':
          const selectedPlan = processedPlans.find((p: Plan) => p.code === planCode);
          const selectedVariant = selectedPlan ? getSelectedVariant(planCode, selectedPlan) : null;

          // Verificar si el plan es gratuito (price === 0)
          const isFreePlan = selectedVariant?.price === 0;
          isPlanFree = isFreePlan;

          console.log('🔍 DEBUG COMPRA:', {
            action: 'purchase',
            planCode,
            selectedVariant,
            isFreePlan,
            isAdmin,
            generateInvoice
          });

          // LÓGICA CORREGIDA:
          // 1. Admin sin checkbox → asignación directa
          // 2. Admin con checkbox (incluso si es gratis) → generar factura
          // 3. Usuario normal + plan gratis → asignación directa
          // 4. Usuario normal + plan pago → generar factura

          if (isAdmin && !generateInvoice) {
            // Admin con asignación directa: compra directa sin factura
            console.log('✅ DEBUG: Admin sin factura - asignación directa');
            const purchaseRequest: PlanPurchaseRequest = {
              profileId,
              planCode,
              variantDays: selectedVariant?.days || 30,
              generateInvoice: false,
            };
            result = await purchasePlan(purchaseRequest);
            message = `Plan ${processedPlans.find((p: Plan) => p.code === planCode)?.name} comprado exitosamente (asignación directa)`;
          } else if (isAdmin && generateInvoice) {
            // Admin con checkbox marcado: SIEMPRE generar factura (incluso si es gratis)
            console.log('✅ DEBUG: Admin con factura - generando factura para plan', isFreePlan ? 'GRATUITO' : 'PAGO');

            if (!session?.user?._id) {
              throw new Error('Usuario no autenticado');
            }

            const invoiceData: CreateInvoiceData = {
              profileId,
              userId: session.user._id,
              planCode: planCode,
              planDays: selectedVariant?.days || 30,
              notes: `Compra de plan ${processedPlans.find((p: Plan) => p.code === planCode)?.name} para perfil ${profileName}`
            };

            // Crear factura
            console.log('📄 DEBUG: Creando factura...', { isFreePlan, invoiceData });
            const invoice = await invoiceService.createInvoice(invoiceData);
            console.log('✅ DEBUG: Factura creada:', invoice._id);

            // Si es plan gratuito, marcar la factura como pagada inmediatamente
            if (isFreePlan) {
              console.log('💰 DEBUG: Plan gratuito detectado, marcando factura como pagada...');
              await invoiceService.markAsPaid(invoice._id, {
                paymentMethod: 'free_plan',
                paymentReference: 'Plan gratuito asignado por administrador'
              });
              console.log('✅ DEBUG: Factura marcada como pagada y plan asignado');

              message = 'Plan gratuito asignado con factura generada exitosamente';
              toast.success(message, { duration: 4000 });

              // Refrescar datos
              await refreshPlanData();
              queryClient.invalidateQueries({ queryKey: ['userProfiles'] });
              queryClient.invalidateQueries({ queryKey: ['profilePlan', profileId] });
              onPlanChange?.();

              onClose();
              return;
            }

            // Plan de pago: obtener datos de WhatsApp
            const whatsappData = await invoiceService.getWhatsAppData(invoice._id);

            message = 'Factura generada. Completa el pago para activar tu plan.';
            toast.success('Factura creada. El plan se activará después del pago confirmado.', {
              duration: 4000,
            });

            // Abrir WhatsApp para plan de pago
            window.open(whatsappData.whatsappUrl, '_blank');

            result = {
              invoice,
              whatsappData,
              requiresPayment: true,
              totalAmount: selectedVariant?.price || 0
            };

            onClose();
            return;
          } else if (isFreePlan && !isAdmin) {
            // Plan gratuito para usuario normal: asignar directamente sin generar factura
            console.log('✅ DEBUG: Usuario normal + Plan gratuito - asignación directa sin factura');
            const purchaseRequest: PlanPurchaseRequest = {
              profileId,
              planCode,
              variantDays: selectedVariant?.days || 30,
              generateInvoice: false,
            };
            result = await purchasePlan(purchaseRequest);
            message = `Plan ${processedPlans.find((p: Plan) => p.code === planCode)?.name} asignado exitosamente`;
          } else {
            // Flujo normal con facturación para usuarios normales con planes pagos
            console.log('✅ DEBUG: Usuario normal + Plan pago - generando factura');
            const purchaseRequest: PlanPurchaseRequest = {
              profileId,
              planCode,
              variantDays: selectedVariant?.days || 30,
              generateInvoice: true,
            };
            result = await purchasePlan(purchaseRequest);
            message = `Plan ${processedPlans.find((p: Plan) => p.code === planCode)?.name} comprado exitosamente`;
          }
          break;

        case 'renew':
          // Debug: Verificar estado del plan antes de renovar
          const planToUse = profilePlanInfo || currentPlan;
          console.log('🔍 DEBUG RENOVACIÓN - Estado inicial:', {
            isAdmin,
            generateInvoice,
            profileId,
            currentPlanData: currentPlanData?.code,
            planToUse
          });

          // Intentando renovar plan

          const renewSelectedVariant = getSelectedVariant(planCode, currentPlanData);
          console.log('🔍 DEBUG RENOVACIÓN - Variante seleccionada:', renewSelectedVariant);

          // Verificar si el plan es gratuito (price === 0)
          const isFreePlanRenew = renewSelectedVariant.price === 0;
          isPlanFree = isFreePlanRenew;

          // LÓGICA CORREGIDA para renovación:
          // 1. Admin sin checkbox → renovación directa
          // 2. Admin con checkbox (incluso si es gratis) → generar factura
          // 3. Usuario normal + plan gratis → renovación directa
          // 4. Usuario normal + plan pago → generar factura

          if (isAdmin && !generateInvoice) {
            console.log('✅ DEBUG RENOVACIÓN: Admin sin factura - renovación directa');
            // Admin con asignación directa: renovación directa sin factura
            const renewRequest: PlanRenewalRequest = {
              profileId,
              extensionDays: renewSelectedVariant.days,
            };
            result = await renewPlan(renewRequest);
            message = `Plan ${currentPlanData.name} renovado exitosamente (asignación directa)`;
          } else if (isAdmin && generateInvoice) {
            console.log('✅ DEBUG RENOVACIÓN: Admin con factura - generando factura para plan', isFreePlanRenew ? 'GRATUITO' : 'PAGO');
            // Admin con checkbox marcado: SIEMPRE generar factura (incluso si es gratis)
            if (!session?.user?._id) {
              throw new Error('Usuario no autenticado');
            }

            const invoiceData: CreateInvoiceData = {
              profileId,
              userId: session.user._id,
              planCode: currentPlanData.code,
              planDays: renewSelectedVariant.days,
              notes: `Renovación de plan ${currentPlanData.name} para perfil ${profileName}`
            };

            // Crear factura
            console.log('📄 DEBUG RENOVACIÓN: Creando factura...', { isFreePlanRenew, invoiceData });
            const invoice = await invoiceService.createInvoice(invoiceData);
            console.log('✅ DEBUG RENOVACIÓN: Factura creada:', invoice._id);

            // Si es plan gratuito, marcar la factura como pagada inmediatamente
            if (isFreePlanRenew) {
              console.log('💰 DEBUG RENOVACIÓN: Plan gratuito detectado, marcando factura como pagada...');
              await invoiceService.markAsPaid(invoice._id, {
                paymentMethod: 'free_plan',
                paymentReference: 'Renovación de plan gratuito por administrador'
              });
              console.log('✅ DEBUG RENOVACIÓN: Factura marcada como pagada y plan renovado');

              message = 'Plan gratuito renovado con factura generada exitosamente';
              toast.success(message, { duration: 4000 });

              // Refrescar datos
              await refreshPlanData();
              queryClient.invalidateQueries({ queryKey: ['userProfiles'] });
              queryClient.invalidateQueries({ queryKey: ['profilePlan', profileId] });
              onPlanChange?.();

              onClose();
              return;
            }

            // Plan de pago: obtener datos de WhatsApp
            const whatsappData = await invoiceService.getWhatsAppData(invoice._id);

            message = 'Factura de renovación generada. Completa el pago para renovar tu plan.';
            toast.success('Factura creada. El plan se renovará después del pago confirmado.', {
              duration: 4000,
            });

            // Abrir WhatsApp para plan de pago
            window.open(whatsappData.whatsappUrl, '_blank');

            result = {
              invoice,
              whatsappData,
              requiresPayment: true,
              totalAmount: renewSelectedVariant.price
            };

            onClose();
            return;
          } else if (isFreePlanRenew && !isAdmin) {
            console.log('✅ DEBUG RENOVACIÓN: Usuario normal + Plan gratuito - renovación directa sin factura');
            // Plan gratuito para usuario normal: renovar directamente sin factura
            const renewRequest: PlanRenewalRequest = {
              profileId,
              extensionDays: renewSelectedVariant.days,
            };
            result = await renewPlan(renewRequest);
            message = `Plan ${currentPlanData.name} renovado exitosamente`;
          } else {
            console.log('✅ DEBUG RENOVACIÓN: Usuario normal + Plan pago - generando factura');
            // Usuario normal con plan pago: generar factura
            if (!session?.user?._id) {
              throw new Error('Usuario no autenticado');
            }

            const invoiceData: CreateInvoiceData = {
              profileId,
              userId: session.user._id,
              planCode: currentPlanData.code,
              planDays: renewSelectedVariant.days,
              notes: `Renovación de plan ${currentPlanData.name} para perfil ${profileName}`
            };

            // Crear SOLO la factura (el plan se renovará cuando se confirme el pago)
            const invoice = await invoiceService.createInvoice(invoiceData);

            // Generar mensaje de WhatsApp para el pago
            const whatsappData = await invoiceService.getWhatsAppData(invoice._id);

            // Mensaje específico para renovación con factura
            message = `Factura de renovación generada. Completa el pago para renovar tu plan.`;

            // Mostrar toast con información adicional
            toast.success('Factura creada. El plan se renovará después del pago confirmado.', {
              duration: 4000,
            });

            // Abrir WhatsApp inmediatamente
            window.open(whatsappData.whatsappUrl, '_blank');

            result = {
              invoice,
              whatsappData,
              requiresPayment: true,
              totalAmount: renewSelectedVariant.price
            };

            // NO mostrar el toast de éxito general para usuarios normales
            // porque el plan no se ha renovado aún
            return;
          }
          break;

        case 'upgrade':

          const targetUpgradePlan = processedPlans.find((p: Plan) => p.code === planCode);
          const upgradeSelectedVariant = targetUpgradePlan ? getSelectedVariant(planCode, targetUpgradePlan) : null;

          // Verificar si el plan es gratuito (price === 0)
          const isFreePlanUpgrade = upgradeSelectedVariant?.price === 0;
          isPlanFree = isFreePlanUpgrade;

          console.log('🔍 DEBUG UPGRADE:', {
            action: 'upgrade',
            planCode,
            upgradeSelectedVariant,
            isFreePlanUpgrade,
            isAdmin,
            generateInvoice
          });

          // LÓGICA CORREGIDA para upgrade:
          // 1. Admin sin checkbox → upgrade directo
          // 2. Admin con checkbox (incluso si es gratis) → generar factura
          // 3. Usuario normal + plan gratis → upgrade directo
          // 4. Usuario normal + plan pago → generar factura

          if (isAdmin && !generateInvoice) {
            console.log('✅ DEBUG UPGRADE: Admin sin factura - upgrade directo');
            // Admin con asignación directa: upgrade directo sin factura
            const upgradeRequest: PlanUpgradeRequest = {
              profileId,
              newPlanCode: planCode,
              variantDays: upgradeSelectedVariant?.days
            };
            result = await upgradePlan(upgradeRequest);
            message = `Actualización directa del plan a ${targetUpgradePlan?.name} realizada exitosamente (asignación directa)`;
          } else if (isAdmin && generateInvoice) {
            console.log('✅ DEBUG UPGRADE: Admin con factura - generando factura para plan', isFreePlanUpgrade ? 'GRATUITO' : 'PAGO');
            // Admin con checkbox marcado: SIEMPRE generar factura (incluso si es gratis)
            if (!session?.user?._id) {
              throw new Error('Usuario no autenticado');
            }

            const currentPlanDetails = currentPlan
              ? `Plan actual: ${currentPlanData?.name || currentPlan.planCode} (${currentPlan.variantDays} días)`
              : 'Sin plan activo';
            const newPlanDetails = `Nuevo plan: ${targetUpgradePlan?.name || planCode} (${upgradeSelectedVariant?.days || 30} días) - $${upgradeSelectedVariant?.price || 0}`;

            const invoiceData: CreateInvoiceData = {
              profileId,
              userId: session.user._id,
              planCode: planCode,
              planDays: upgradeSelectedVariant?.days || 30,
              notes: `Cambio de plan para perfil ${profileName}\n${currentPlanDetails}\n${newPlanDetails}`
            };

            // Crear factura
            console.log('📄 DEBUG UPGRADE: Creando factura...', { isFreePlanUpgrade, invoiceData });
            const invoice = await invoiceService.createInvoice(invoiceData);
            console.log('✅ DEBUG UPGRADE: Factura creada:', invoice._id);

            // Si es plan gratuito, marcar la factura como pagada inmediatamente
            if (isFreePlanUpgrade) {
              console.log('💰 DEBUG UPGRADE: Plan gratuito detectado, marcando factura como pagada...');
              await invoiceService.markAsPaid(invoice._id, {
                paymentMethod: 'free_plan',
                paymentReference: 'Cambio a plan gratuito por administrador'
              });
              console.log('✅ DEBUG UPGRADE: Factura marcada como pagada y plan actualizado');

              message = 'Plan gratuito actualizado con factura generada exitosamente';
              toast.success(message, { duration: 4000 });

              // Refrescar datos
              await refreshPlanData();
              queryClient.invalidateQueries({ queryKey: ['userProfiles'] });
              queryClient.invalidateQueries({ queryKey: ['profilePlan', profileId] });
              onPlanChange?.();

              onClose();
              return;
            }

            // Plan de pago: obtener datos de WhatsApp
            const whatsappData = await invoiceService.getWhatsAppData(invoice._id);

            message = 'Factura generada para cambio de plan. Completa el pago para activar tu nuevo plan.';
            toast.success('Factura creada. El plan se actualizará después del pago confirmado.', {
              duration: 10000,
            });

            // Abrir WhatsApp para plan de pago
            window.open(whatsappData.whatsappUrl, '_blank');

            result = {
              invoice,
              whatsappData,
              requiresPayment: true,
              totalAmount: upgradeSelectedVariant?.price || 0
            };

            onClose();
            return;
          } else if (isFreePlanUpgrade && !isAdmin) {
            console.log('✅ DEBUG UPGRADE: Usuario normal + Plan gratuito - upgrade directo sin factura');
            // Plan gratuito para usuario normal: actualizar directamente sin factura
            const upgradeRequest: PlanUpgradeRequest = {
              profileId,
              newPlanCode: planCode,
              variantDays: upgradeSelectedVariant?.days
            };
            result = await upgradePlan(upgradeRequest);
            message = `Plan actualizado a ${targetUpgradePlan?.name} exitosamente`;
          } else {
            console.log('✅ DEBUG UPGRADE: Usuario normal + Plan pago - generando factura');
            // Usuario normal con plan pago: generar factura
            if (!session?.user?._id) {
              throw new Error('Usuario no autenticado');
            }

            const currentPlanDetails = currentPlan
              ? `Plan actual: ${currentPlanData?.name || currentPlan.planCode} (${currentPlan.variantDays} días)`
              : 'Sin plan activo';
            const newPlanDetails = `Nuevo plan: ${targetUpgradePlan?.name || planCode} (${upgradeSelectedVariant?.days || 30} días) - $${upgradeSelectedVariant?.price || 0}`;

            const invoiceData: CreateInvoiceData = {
              profileId,
              userId: session.user._id,
              planCode: planCode,
              planDays: upgradeSelectedVariant?.days || 30,
              notes: `Cambio de plan para perfil ${profileName}\n${currentPlanDetails}\n${newPlanDetails}`
            };

            const invoice = await invoiceService.createInvoice(invoiceData);
            const whatsappData = await invoiceService.getWhatsAppData(invoice._id);

            // Mensaje específico para cambio de plan con factura
            message = `Factura generada para cambio de plan. Completa el pago para activar tu nuevo plan ${targetUpgradePlan?.name}.`;

            // Mostrar toast con información adicional
            toast.success('Factura creada. El plan se actualizará después del pago confirmado.', {
              duration: 10000,
            });

            // Abrir WhatsApp inmediatamente
            window.open(whatsappData.whatsappUrl, '_blank');

            result = {
              invoice,
              whatsappData,
              requiresPayment: true,
              totalAmount: upgradeSelectedVariant?.price || 0
            };

            onClose();
            return;
          }
          break;
      }

      toast.success(message);

      console.log('🔍 DEBUG FLUJO FINAL:', {
        isAdmin,
        generateInvoice,
        isPlanFree,
        action
      });

      // Verificar si es admin SIN checkbox O si es usuario normal con plan gratuito
      // IMPORTANTE: Si es admin CON checkbox, ya se manejó arriba con return, así que no llega aquí
      const isDirectAssignment = (isAdmin && !generateInvoice) || (isPlanFree && !isAdmin);

      console.log('✅ DEBUG: isDirectAssignment =', isDirectAssignment);

      if (isDirectAssignment) {
        console.log('✅ DEBUG: Flujo de asignación directa - refrescando datos inmediatamente');
        // Para admins con asignación directa o usuarios con planes gratuitos: cambio instantáneo, refrescar datos inmediatamente
        await refreshPlanData();

        // Invalidar queries adicionales para asegurar actualización
        queryClient.invalidateQueries({ queryKey: ['userProfiles'] });
        queryClient.invalidateQueries({ queryKey: ['profilePlan', profileId] });

        // Llamar onPlanChange para actualizar el componente padre
        onPlanChange?.();
      } else if (isAdmin && generateInvoice) {
        // Para admins que generan factura: no refrescar datos hasta que se confirme el pago
        // El flujo es igual al de usuarios normales
        if (result?.paymentUrl) {
          // Redirigir a WhatsApp para el pago
          window.open(result.paymentUrl, '_blank');

          toast.success('Se ha abierto WhatsApp para completar el pago. El plan se activará una vez confirmado el pago.', {
            duration: 4000,
          });
        }
      } else {
        // Para usuarios regulares: verificar si hay URL de pago
        if (result?.paymentUrl) {
          // Redirigir a WhatsApp para el pago
          window.open(result.paymentUrl, '_blank');

          toast.success('Se ha abierto WhatsApp para completar el pago. El plan se activará una vez confirmado el pago.', {
            duration: 4000,
          });
        } else {
          // Si no hay URL de pago pero el resultado es exitoso, refrescar datos
          await refreshPlanData();

          // Invalidar queries adicionales para asegurar actualización
          queryClient.invalidateQueries({ queryKey: ['userProfiles'] });
          queryClient.invalidateQueries({ queryKey: ['profilePlan', profileId] });

          // Llamar onPlanChange para actualizar el componente padre
          onPlanChange?.();
        }
      }
      onClose();
    } catch (error: any) {
      const errorMessage = error.message || 'Error al procesar la solicitud';
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-purple-600" />
            Administrar Planes - {profileName}
          </DialogTitle>
          <DialogDescription>
            Gestiona el plan de tu perfil: compra, renueva o mejora tu suscripción.
          </DialogDescription>
        </DialogHeader>

        {/* Plan actual */}
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">Plan Actual</h3>
            <Card className={`border-2 ${getPlanDisplayInfo(currentPlanData.code).color}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getPlanDisplayInfo(currentPlanData.code).icon}
                    <CardTitle className="text-lg">{currentPlanData.name}</CardTitle>
                    {currentPlanData.code === 'AMATISTA' && (
                      <Badge variant="secondary">Gratuito</Badge>
                    )}
                  </div>
                  {hasNoPlanAssigned() ? (
                    <Badge className="bg-orange-100 text-orange-800">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Sin Plan Asignado
                    </Badge>
                  ) : isPlanActive() ? (
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Activo
                    </Badge>
                  ) : isPlanPending() ? (
                    <Badge className="bg-yellow-100 text-yellow-800">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Pendiente de Pago
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <X className="h-3 w-3 mr-1" />
                      Expirado
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {hasNoPlanAssigned() ? (
                  <div className="space-y-4">
                    <Alert className="border-orange-200 bg-orange-50">
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                      <AlertDescription className="text-sm text-orange-800">
                        <strong>Aún no tienes un plan asignado.</strong>
                        <br />
                        Paga las facturas que tengas pendientes o compra un nuevo plan para activar tu perfil.
                      </AlertDescription>
                    </Alert>
                  </div>
                ) : currentPlan && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Fecha de inicio</p>
                      <p className="font-medium">{formatDate(currentPlan.startAt)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Fecha de vencimiento</p>
                      <p className="font-medium">{formatDate(currentPlan.expiresAt)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Días restantes</p>
                      <p className={`font-medium ${isPlanPending()
                        ? 'text-yellow-600'
                        : getDaysRemaining() <= 7
                          ? 'text-red-600'
                          : 'text-green-600'
                        }`}>
                        {isPlanPending() ? 'Pendiente de pago' : `${getDaysRemaining()} días`}
                      </p>
                    </div>
                  </div>
                )}

                {isPlanActive() && currentPlanData.code !== 'AMATISTA' && (
                  <div className="mt-4">
                    <div className="space-y-3">
                      {/* Selector de variantes para renovación */}
                      {currentPlanData.variants.length > 1 && (
                        <div>
                          <p className="text-sm font-medium mb-2">Duración de renovación:</p>
                          <div className="grid grid-cols-1 gap-2">
                            {currentPlanData.variants
                              .sort((a, b) => a.days - b.days)
                              .map((variant) => {
                                const isSelected = getSelectedVariant(currentPlanData.code, currentPlanData).days === variant.days;
                                return (
                                  <button
                                    key={variant.days}
                                    onClick={() => setSelectedVariants(prev => ({
                                      ...prev,
                                      [currentPlanData.code]: variant.days
                                    }))}
                                    className={`p-2 text-xs rounded border transition-colors ${isSelected
                                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                                      : 'border-gray-200 hover:border-gray-300'
                                      }`}
                                  >
                                    <div className="flex justify-between items-center">
                                      <span>{formatDuration(variant.days)}</span>
                                      <span className="font-medium">
                                        {formatPrice(variant.price)}
                                      </span>
                                    </div>
                                  </button>
                                );
                              })}
                          </div>
                        </div>
                      )}

                      <Button
                        onClick={() => handlePlanAction('renew', currentPlanData.code)}
                        disabled={isProcessing}
                        className="w-full sm:w-auto"
                      >
                        {isAdmin
                          ? `Renovar Plan (${formatPrice(getSelectedVariant(currentPlanData.code, currentPlanData).price)})`
                          : `Renovar Plan (${formatPrice(getSelectedVariant(currentPlanData.code, currentPlanData).price)})`
                        }
                      </Button>
                    </div>
                  </div>
                )}

                {/* Botón de renovación para planes expirados no gratuitos */}
                {!isPlanActive() && currentPlanData.code !== 'AMATISTA' && (
                  <div className="mt-4">
                    <div className="space-y-3">
                      {hasNoPlanAssigned() ? (
                        <p className="text-sm font-medium mb-2 text-orange-600">Sin plan asignado - Comprar:</p>
                      ) : (
                        <p className="text-sm font-medium mb-2 text-orange-600">Plan Expirado - Renovar:</p>
                      )}
                      {/* Selector de variantes para renovación */}
                      {currentPlanData.variants.length > 1 && (
                        <div>
                          <div className="grid grid-cols-1 gap-2">
                            {currentPlanData.variants
                              .sort((a, b) => a.days - b.days)
                              .map((variant) => {
                                const isSelected = getSelectedVariant(currentPlanData.code, currentPlanData).days === variant.days;
                                return (
                                  <button
                                    key={variant.days}
                                    onClick={() => setSelectedVariants(prev => ({
                                      ...prev,
                                      [currentPlanData.code]: variant.days
                                    }))}
                                    className={`p-2 text-xs rounded border transition-colors ${isSelected
                                      ? 'border-orange-500 bg-orange-50 text-orange-700'
                                      : 'border-gray-200 hover:border-gray-300'
                                      }`}
                                  >
                                    <div className="flex justify-between items-center">
                                      <span>{formatDuration(variant.days)}</span>
                                      <span className="font-medium">
                                        {formatPrice(variant.price)}
                                      </span>
                                    </div>
                                  </button>
                                );
                              })}
                          </div>
                        </div>
                      )}

                      <Button
                        onClick={() => handlePlanAction(
                          hasNoPlanAssigned() ? 'purchase' : 'renew',
                          currentPlanData.code
                        )}
                        disabled={isProcessing}
                        className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700"
                      >
                        {isProcessing ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Procesando...
                          </>
                        ) : (
                          hasNoPlanAssigned()
                            ? `Comprar ${currentPlanData.name} (${formatPrice(getSelectedVariant(currentPlanData.code, currentPlanData).price)})`
                            : `Renovar ${currentPlanData.name} (${formatPrice(getSelectedVariant(currentPlanData.code, currentPlanData).price)})`
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Restricciones */}
          {activeProfilesCount >= 10 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Has alcanzado el límite de 10 perfiles con plan pago activos.
                No puedes comprar más planes hasta que expire alguno de los existentes.
              </AlertDescription>
            </Alert>
          )}

          <Separator />

          {/* Aviso importante sobre reemplazo de planes */}
          <Alert className="border-amber-200 bg-amber-50">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              <strong>Importante:</strong> Al realizar una compra, renovacion, mejora de plan, etc. El nuevo plan reemplazará inmediatamente el plan activo actual, independientemente de los días restantes de vigencia.
            </AlertDescription>
          </Alert>

          {/* Checkbox para generar factura - Solo visible para administradores */}
          {isAdmin && (
            <div className="flex items-center space-x-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <Checkbox
                id="generate-invoice"
                checked={generateInvoice}
                onCheckedChange={(checked) => setGenerateInvoice(checked as boolean)}
              />
              <label
                htmlFor="generate-invoice"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Generar factura
              </label>
              <span className="text-xs text-muted-foreground">
                (Desmarcar para asignar el plan directamente sin proceso de facturación)
              </span>
            </div>
          )}

          {/* Planes disponibles */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Planes Disponibles</h3>
            {isLoadingPlans ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                <span className="ml-2 text-muted-foreground">Cargando planes...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availablePlans.map((plan: Plan) => {
                  const planDisplayInfo = getPlanDisplayInfo(plan.code);
                  const isCurrentPlan = plan.code === currentPlanData.code;
                  const canUpgrade = canUpgradeTo(plan.code);
                  const canPurchase = !isPlanActive() && plan.code !== 'AMATISTA';
                  const lowestPrice = getLowestPrice(plan.variants);
                  const shortestDuration = getShortestDuration(plan.variants);
                  const selectedVariant = getSelectedVariant(plan.code, plan);

                  return (
                    <Card
                      key={plan.code}
                      className={`relative transition-all duration-200 ${isCurrentPlan ? 'ring-2 ring-purple-500' : 'hover:shadow-md'
                        } ${planDisplayInfo.popular ? 'border-purple-300' : ''}`}
                    >
                      {planDisplayInfo.popular && (
                        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                          <Badge className="bg-purple-600 text-white">
                            Más Popular
                          </Badge>
                        </div>
                      )}

                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                          {planDisplayInfo.icon}
                          <CardTitle className="text-base">{plan.name}</CardTitle>
                        </div>
                        <div className="text-2xl font-bold">
                          {selectedVariant.price === 0 ? 'Gratis' : formatPrice(selectedVariant.price)}
                          <span className="text-sm font-normal text-muted-foreground">
                            /{formatDuration(selectedVariant.days)}
                          </span>
                        </div>
                      </CardHeader>

                      <CardContent>
                        {/* Selector de variantes */}
                        {plan.variants.length > 1 && (
                          <div className="mb-4">
                            <p className="text-sm font-medium mb-2">Duración:</p>
                            <div className="grid grid-cols-1 gap-2">
                              {plan.variants
                                .sort((a, b) => a.days - b.days)
                                .map((variant) => (
                                  <button
                                    key={variant.days}
                                    onClick={() => setSelectedVariants(prev => ({
                                      ...prev,
                                      [plan.code]: variant.days
                                    }))}
                                    className={`p-2 text-xs rounded border transition-colors ${selectedVariant.days === variant.days
                                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                                      : 'border-gray-200 hover:border-gray-300'
                                      }`}
                                  >
                                    <div className="flex justify-between items-center">
                                      <span>{formatDuration(variant.days)}</span>
                                      <span className="font-medium">
                                        {variant.price === 0 ? 'Gratis' : formatPrice(variant.price)}
                                      </span>
                                    </div>
                                  </button>
                                ))}
                            </div>
                          </div>
                        )}

                        <ul className="space-y-1 text-sm mb-4">
                          {getPlanFeatures(plan).map((feature, index) => (
                            <li key={index} className="flex items-center gap-2">
                              <CheckCircle className="h-3 w-3 text-green-500" />
                              {feature}
                            </li>
                          ))}
                        </ul>

                        {isCurrentPlan ? (
                          <Badge className="w-full justify-center bg-gray-100 text-gray-600">
                            Plan Actual
                          </Badge>
                        ) : canUpgrade && isPlanActive() ? (
                          <Button
                            onClick={() => {
                              handlePlanAction('upgrade', plan.code);
                            }}
                            disabled={isProcessing || (activeProfilesCount >= 10 && plan.code !== 'AMATISTA')}
                            className="w-full bg-purple-600 hover:bg-purple-700"
                            size="sm"
                          >
                            {isAdmin ? `Actualizar a ${plan.name}` : `Comprar ${plan.name}`}
                          </Button>
                        ) : canPurchase ? (
                          <Button
                            onClick={() => handlePlanAction('purchase', plan.code)}
                            disabled={isProcessing || (activeProfilesCount >= 10 && plan.code !== 'AMATISTA')}
                            variant={planDisplayInfo.popular ? 'default' : 'outline'}
                            className="w-full"
                            size="sm"
                          >
                            Comprar
                          </Button>
                        ) : (
                          <Button
                            disabled
                            variant="outline"
                            className="w-full"
                            size="sm"
                          >
                            {plan.code === 'AMATISTA' ? 'Plan Gratuito' : 'No Disponible'}
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}            </div>)}          </div>        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}