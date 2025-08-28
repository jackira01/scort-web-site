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
import toast from 'react-hot-toast';
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

interface Plan {
  code: string;
  name: string;
  price: number;
  duration: number; // días
  features: string[];
  color: string;
  icon: React.ReactNode;
  popular?: boolean;
}

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

const AVAILABLE_PLANS: Plan[] = [
  {
    code: 'AMATISTA',
    name: 'Amatista',
    price: 0,
    duration: 30,
    features: ['Perfil básico', 'Hasta 5 fotos', 'Búsqueda básica'],
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: <Star className="h-4 w-4" />,
  },
  {
    code: 'ESMERALDA',
    name: 'Esmeralda',
    price: 15000,
    duration: 30,
    features: ['Hasta 10 fotos', 'Prioridad en búsquedas', 'Chat ilimitado'],
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: <Zap className="h-4 w-4" />,
  },
  {
    code: 'ORO',
    name: 'Oro',
    price: 25000,
    duration: 30,
    features: ['Hasta 15 fotos', 'Destacado en búsquedas', 'Videos', 'Estadísticas'],
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: <Crown className="h-4 w-4" />,
  },
  {
    code: 'DIAMANTE',
    name: 'Diamante',
    price: 50000,
    duration: 30,
    features: ['Fotos ilimitadas', 'Máxima visibilidad', 'Soporte prioritario', 'Todas las funciones'],
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: <Crown className="h-4 w-4" />,
    popular: true,
  },
];

export default function ManagePlansModal({
  isOpen,
  onClose,
  profileId,
  profileName,
  currentPlan,
  onPlanChange,
}: ManagePlansModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeProfilesCount, setActiveProfilesCount] = useState(0);

  // Cargar conteo de perfiles activos al abrir el modal
  useEffect(() => {
    if (isOpen) {
      loadActiveProfilesCount();
    }
  }, [isOpen]);

  const loadActiveProfilesCount = async () => {
    try {
      const count = await getActiveProfilesCount();
      setActiveProfilesCount(count);
    } catch (error) {
      console.error('Error loading active profiles count:', error);
    }
  };

  // Obtener el plan actual
  const getCurrentPlan = () => {
    if (!currentPlan) return AVAILABLE_PLANS[0]; // Amatista por defecto
    return AVAILABLE_PLANS.find(plan => plan.code === currentPlan.planCode) || AVAILABLE_PLANS[0];
  };

  const currentPlanData = getCurrentPlan();

  // Verificar si el plan actual está activo
  const isPlanActive = () => {
    if (!currentPlan) return false;
    const expiresAt = new Date(currentPlan.expiresAt);
    return expiresAt > new Date();
  };

  // Calcular días restantes
  const getDaysRemaining = () => {
    if (!currentPlan || !isPlanActive()) return 0;
    const expiresAt = new Date(currentPlan.expiresAt);
    const now = new Date();
    const diffTime = expiresAt.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Verificar si se puede hacer upgrade usando las reglas de negocio
  const canUpgradeTo = (planCode: string) => {
    if (!currentPlan || !validatePlanBusinessRules.isPlanActive(currentPlan.expiresAt)) {
      return false;
    }

    const planHierarchy = ['AMATISTA', 'ESMERALDA', 'ORO', 'DIAMANTE'];
    const currentIndex = planHierarchy.indexOf(currentPlan.planCode);
    const targetIndex = planHierarchy.indexOf(planCode);

    return targetIndex > currentIndex; // Solo upgrades, no downgrades
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
      // Los upgrades son la única excepción permitida para "editar" un plan activo
      if (!canUpgradeTo(planCode)) {
        toast.error('Solo se permiten upgrades a planes superiores');
        return;
      }
    }

    setIsProcessing(true);

    try {
      let result;
      let message = '';

      switch (action) {
        case 'purchase':
          const purchaseRequest: PlanPurchaseRequest = {
            profileId,
            planCode,
            variantDays: 30, // Por defecto 30 días
          };
          result = await purchasePlan(purchaseRequest);
          message = `Plan ${AVAILABLE_PLANS.find(p => p.code === planCode)?.name} comprado exitosamente`;
          break;

        case 'renew':
          const renewRequest: PlanRenewalRequest = {
            profileId,
            extensionDays: 30, // Renovar por 30 días más
          };
          result = await renewPlan(renewRequest);
          message = `Plan ${currentPlanData.name} renovado exitosamente`;
          break;

        case 'upgrade':
          const upgradeRequest: PlanUpgradeRequest = {
            profileId,
            newPlanCode: planCode,
          };
          result = await upgradePlan(upgradeRequest);
          message = `Upgrade a ${AVAILABLE_PLANS.find(p => p.code === planCode)?.name} realizado exitosamente`;
          break;
      }

      toast.success(message);
      onPlanChange?.();
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Error al procesar la solicitud');
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
            <Card className={`border-2 ${currentPlanData.color}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {currentPlanData.icon}
                    <CardTitle className="text-lg">{currentPlanData.name}</CardTitle>
                    {currentPlanData.code === 'AMATISTA' && (
                      <Badge variant="secondary">Gratuito</Badge>
                    )}
                  </div>
                  {isPlanActive() ? (
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Activo
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
                {currentPlan && (
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
                      <p className={`font-medium ${getDaysRemaining() <= 7 ? 'text-red-600' : 'text-green-600'
                        }`}>
                        {getDaysRemaining()} días
                      </p>
                    </div>
                  </div>
                )}

                {isPlanActive() && currentPlanData.code !== 'AMATISTA' && (
                  <div className="mt-4">
                    <Button
                      onClick={() => handlePlanAction('renew', currentPlanData.code)}
                      disabled={isProcessing}
                      className="w-full sm:w-auto"
                    >
                      Renovar Plan ({formatPrice(currentPlanData.price)})
                    </Button>
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

          {/* Planes disponibles */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Planes Disponibles</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {AVAILABLE_PLANS.map((plan) => {
                const isCurrentPlan = plan.code === currentPlanData.code;
                const canUpgrade = canUpgradeTo(plan.code);
                const canPurchase = !isPlanActive() && plan.code !== 'AMATISTA';

                return (
                  <Card
                    key={plan.code}
                    className={`relative transition-all duration-200 ${isCurrentPlan ? 'ring-2 ring-purple-500' : 'hover:shadow-md'
                      } ${plan.popular ? 'border-purple-300' : ''}`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                        <Badge className="bg-purple-600 text-white">
                          Más Popular
                        </Badge>
                      </div>
                    )}

                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        {plan.icon}
                        <CardTitle className="text-base">{plan.name}</CardTitle>
                      </div>
                      <div className="text-2xl font-bold">
                        {plan.price === 0 ? 'Gratis' : formatPrice(plan.price)}
                        <span className="text-sm font-normal text-muted-foreground">
                          /{plan.duration} días
                        </span>
                      </div>
                    </CardHeader>

                    <CardContent>
                      <ul className="space-y-1 text-sm mb-4">
                        {plan.features.map((feature, index) => (
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
                          onClick={() => handlePlanAction('upgrade', plan.code)}
                          disabled={isProcessing || (activeProfilesCount >= 10 && plan.code !== 'AMATISTA')}
                          className="w-full bg-purple-600 hover:bg-purple-700"
                          size="sm"
                        >
                          Upgrade
                        </Button>
                      ) : canPurchase ? (
                        <Button
                          onClick={() => handlePlanAction('purchase', plan.code)}
                          disabled={isProcessing || (activeProfilesCount >= 10 && plan.code !== 'AMATISTA')}
                          variant={plan.popular ? 'default' : 'outline'}
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
              })}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}