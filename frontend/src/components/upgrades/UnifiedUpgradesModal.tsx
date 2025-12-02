'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Zap, Calendar, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { useUpgradePurchase } from '@/hooks/use-upgrade-purchase';
import { useUpgrades } from '@/hooks/use-upgrades';

interface UnifiedUpgradesModalProps {
    isOpen: boolean;
    onClose: () => void;
    profile: {
        _id: string;
        name: string;
        activeUpgrades?: Array<{
            code: string;
            startAt: string | Date;
            endAt: string | Date;
            purchaseAt?: string | Date;
        }>;
        upgrades?: Array<{
            code: string;
            startAt: string | Date;
            endAt: string | Date;
            purchaseAt?: string | Date;
        }>;
        planAssignment?: {
            planCode: string;
        };
    };
}

export default function UnifiedUpgradesModal({
    isOpen,
    onClose,
    profile,
}: UnifiedUpgradesModalProps) {
    const [activeTab, setActiveTab] = useState<'destacado' | 'impulso'>('destacado');
    const { mutate: purchaseUpgrade, isPending } = useUpgradePurchase();
    const { data: upgradesData } = useUpgrades();

    // Obtener definiciones de upgrades
    const destacadoDefinition = upgradesData?.upgrades?.find(u => u.code === 'DESTACADO');
    const impulsoDefinition = upgradesData?.upgrades?.find(u => u.code === 'IMPULSO');

    // Usar activeUpgrades si existe, sino usar upgrades (para compatibilidad con adminboard)
    const profileUpgrades = profile.activeUpgrades || profile.upgrades || [];

    // Filtrar solo upgrades activos (que no hayan expirado)
    const now = new Date();
    const activeUpgrades = profileUpgrades.filter(u => {
        const endDate = new Date(u.endAt);
        return endDate > now;
    });
    // Obtener upgrade activo de DESTACADO
    const destacadoUpgrade = activeUpgrades.find(
        u => u.code === 'DESTACADO' || u.code === 'HIGHLIGHT'
    );

    // Obtener upgrade activo de IMPULSO
    const impulsoUpgrade = activeUpgrades.find(
        u => u.code === 'IMPULSO' || u.code === 'BOOST'
    );

    // Verificar si el plan DIAMANTE incluye DESTACADO automáticamente
    const isDiamondPlan = profile.planAssignment?.planCode === 'DIAMANTE';
    const hasDestacado = !!destacadoUpgrade || isDiamondPlan;
    const hasImpulso = !!impulsoUpgrade;

    const handlePurchaseUpgrade = (upgradeCode: 'DESTACADO' | 'IMPULSO') => {
        purchaseUpgrade(
            {
                profileId: profile._id,
                upgradeCode,
                generateInvoice: true,
            },
            {
                onSuccess: (data) => {
                    if (data.paymentRequired && data.whatsAppMessage) {
                        // Abrir WhatsApp con el mensaje de pago
                        const whatsappUrl = `https://wa.me/${data.whatsAppMessage.companyNumber}?text=${encodeURIComponent(data.whatsAppMessage.message)}`;
                        window.open(whatsappUrl, '_blank');
                        toast.success('Redirigiendo a WhatsApp para completar el pago...');
                    } else {
                        toast.success(data.message || 'Upgrade activado exitosamente');
                    }
                    onClose();
                },
                onError: (error: any) => {
                    toast.error(error.message || 'Error al procesar la compra del upgrade');
                },
            }
        );
    };

    const formatDate = (date: string | Date) => {
        try {
            const d = new Date(date);

            if (isNaN(d.getTime())) {
                console.error('❌ Fecha inválida:', date);
                return 'Fecha no disponible';
            }

            // Usar el formato del navegador local (simple y directo)
            return d.toLocaleDateString('es-CO', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });
        } catch (error) {
            console.error('❌ Error al formatear fecha:', error);
            return 'Fecha no disponible';
        }
    };

    // Función para calcular la duración en horas y minutos
    const calculateDuration = (startAt: string | Date, endAt: string | Date) => {
        try {
            const start = new Date(startAt);
            const end = new Date(endAt);
            const diffMs = end.getTime() - start.getTime();
            const diffMinutes = Math.floor(diffMs / (1000 * 60));
            const hours = Math.floor(diffMinutes / 60);
            const minutes = diffMinutes % 60;

            if (hours >= 24) {
                const days = Math.floor(hours / 24);
                const remainingHours = hours % 24;
                let result = `${days} día${days > 1 ? 's' : ''}`;
                if (remainingHours > 0) {
                    result += ` y ${remainingHours} hora${remainingHours > 1 ? 's' : ''}`;
                }
                return result;
            }

            if (hours > 0 && minutes > 0) {
                return `${hours} hora${hours > 1 ? 's' : ''} y ${minutes} minuto${minutes > 1 ? 's' : ''}`;
            } else if (hours > 0) {
                return `${hours} hora${hours > 1 ? 's' : ''}`;
            } else {
                return `${minutes} minuto${minutes > 1 ? 's' : ''}`;
            }
        } catch {
            return 'N/A';
        }
    };

    // Función para formatear duración en horas a texto legible (días y horas)
    const formatDurationFromHours = (hours: number) => {
        if (!hours) return '1 hora';

        if (hours >= 24) {
            const days = Math.floor(hours / 24);
            const remainingHours = hours % 24;

            if (remainingHours > 0) {
                return `${days} ${days === 1 ? 'día' : 'días'} y ${remainingHours} ${remainingHours === 1 ? 'hora' : 'horas'}`;
            }
            return `${days} ${days === 1 ? 'día' : 'días'}`;
        }

        return `${hours} ${hours === 1 ? 'hora' : 'horas'}`;
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>🚀 Mejoras del Perfil: {profile.name}</DialogTitle>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'destacado' | 'impulso')}>
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="destacado" className="flex items-center gap-2">
                            <Star className="h-4 w-4" />
                            Destacado
                        </TabsTrigger>
                        <TabsTrigger value="impulso" className="flex items-center gap-2">
                            <Zap className="h-4 w-4" />
                            Impulso
                        </TabsTrigger>
                    </TabsList>

                    {/* Tab de Destacado */}
                    <TabsContent value="destacado" className="space-y-4 mt-4">
                        <div className="space-y-4">
                            {/* Estado del upgrade */}
                            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <Star className="h-5 w-5 text-yellow-600" />
                                    <span className="font-semibold">Estado:</span>
                                </div>
                                {hasDestacado ? (
                                    <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
                                        Activo
                                    </Badge>
                                ) : (
                                    <Badge variant="outline">Inactivo</Badge>
                                )}
                            </div>

                            {/* Información del upgrade */}
                            <div className="space-y-3 p-4 border rounded-lg">
                                <h4 className="font-semibold text-lg flex items-center gap-2">
                                    <Star className="h-5 w-5 text-yellow-600" />
                                    Upgrade Destacado
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                    Destaca tu perfil y aparece primero en los resultados de búsqueda durante {formatDurationFromHours(destacadoDefinition?.durationHours || 1)}.
                                </p>

                                {/* Fechas si está activo */}
                                {destacadoUpgrade && (
                                    <div className="space-y-2 mt-4 p-3 bg-muted rounded-lg">
                                        <div className="flex items-center gap-2 mb-3 p-2 bg-blue-50 dark:bg-blue-950/20 rounded">
                                            <Clock className="h-4 w-4 text-blue-600" />
                                            <div>
                                                <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                                                    Duración: {calculateDuration(destacadoUpgrade.startAt, destacadoUpgrade.endAt)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <Calendar className="h-4 w-4 mt-0.5 text-green-600" />
                                            <div>
                                                <p className="text-sm font-medium">Fecha de inicio:</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {formatDate(destacadoUpgrade.startAt)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <Clock className="h-4 w-4 mt-0.5 text-red-600" />
                                            <div>
                                                <p className="text-sm font-medium">Fecha de fin:</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {formatDate(destacadoUpgrade.endAt)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {isDiamondPlan && (
                                    <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                                        <p className="text-sm text-blue-800 dark:text-blue-200">
                                            ✨ Este upgrade está incluido en tu plan Diamante
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Botón de compra */}
                            <Button
                                onClick={() => handlePurchaseUpgrade('DESTACADO')}
                                disabled={hasDestacado || isPending || isDiamondPlan}
                                className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white"
                            >
                                {hasDestacado
                                    ? isDiamondPlan
                                        ? 'Incluido en tu plan'
                                        : 'Ya está activo'
                                    : 'Activar Destacado'}
                            </Button>
                        </div>
                    </TabsContent>

                    {/* Tab de Impulso */}
                    <TabsContent value="impulso" className="space-y-4 mt-4">
                        <div className="space-y-4">
                            {/* Estado del upgrade */}
                            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <Zap className="h-5 w-5 text-purple-600" />
                                    <span className="font-semibold">Estado:</span>
                                </div>
                                {hasImpulso ? (
                                    <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                                        Activo
                                    </Badge>
                                ) : (
                                    <Badge variant="outline">Inactivo</Badge>
                                )}
                            </div>

                            {/* Información del upgrade */}
                            <div className="space-y-3 p-4 border rounded-lg">
                                <h4 className="font-semibold text-lg flex items-center gap-2">
                                    <Zap className="h-5 w-5 text-purple-600" />
                                    Upgrade Impulso
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                    Potencia tu perfil destacado durante {formatDurationFromHours(impulsoDefinition?.durationHours || 1)}. Requiere tener el upgrade "Destacado"
                                    activo. Tu perfil aparecerá en las primeras posiciones con máxima prioridad.
                                </p>

                                {/* Fechas si está activo */}
                                {impulsoUpgrade && (
                                    <div className="space-y-2 mt-4 p-3 bg-muted rounded-lg">
                                        <div className="flex items-center gap-2 mb-3 p-2 bg-blue-50 dark:bg-blue-950/20 rounded">
                                            <Clock className="h-4 w-4 text-blue-600" />
                                            <div>
                                                <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                                                    Duración: {calculateDuration(impulsoUpgrade.startAt, impulsoUpgrade.endAt)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <Calendar className="h-4 w-4 mt-0.5 text-green-600" />
                                            <div>
                                                <p className="text-sm font-medium">Fecha de inicio:</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {formatDate(impulsoUpgrade.startAt)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <Clock className="h-4 w-4 mt-0.5 text-red-600" />
                                            <div>
                                                <p className="text-sm font-medium">Fecha de fin:</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {formatDate(impulsoUpgrade.endAt)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {!hasDestacado && (
                                    <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                                        <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                            ⚠️ Necesitas tener el upgrade "Destacado" activo para usar Impulso
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Botón de compra */}
                            <Button
                                onClick={() => handlePurchaseUpgrade('IMPULSO')}
                                disabled={hasImpulso || isPending || !hasDestacado}
                                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                            >
                                {hasImpulso
                                    ? 'Ya está activo'
                                    : !hasDestacado
                                        ? 'Requiere Destacado activo'
                                        : 'Activar Impulso'}
                            </Button>
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
