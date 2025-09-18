'use client';

import { AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import Loader from '@/components/Loader';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useUser } from '@/hooks/use-user';
import { useUserProfiles } from '@/hooks/use-user-profiles';
import AccountContent from '@/modules/account/components/AccountContent';
import AccountProgressBar from '@/modules/account/components/AccountProgressBar';
import AccountSidebar from '@/modules/account/components/AccountSidebar';
import { useAccountSection } from '@/modules/account/hooks/useAccountSection';
import CouponModal from '@/components/modals/CouponModal';
import CouponConfirmationModal from '@/components/modals/CouponConfirmationModal';
import PlanSelectorModal from '@/components/modals/PlanSelectorModal';
import { couponService } from '@/services/coupon.service';
import { ICoupon } from '@/types/coupon.types';

export default function AccountLayout() {
    const { activeSection, setActiveSection } = useAccountSection();
    const { data: user, isLoading } = useUser();
    const { data: userProfiles } = useUserProfiles(user?._id);
    const accountCompleteness = 65;

    // Estados para los modales de cupón
    const [couponModalOpen, setCouponModalOpen] = useState(false);
    const [confirmationModalOpen, setConfirmationModalOpen] = useState(false);
    const [planSelectorModalOpen, setPlanSelectorModalOpen] = useState(false);
    const [validatedCoupon, setValidatedCoupon] = useState<ICoupon | null>(null);
    const [selectedProfileId, setSelectedProfileId] = useState<string>('');
    const [selectedPlanCode, setSelectedPlanCode] = useState<string>('');
    const [selectedPlanPrice, setSelectedPlanPrice] = useState<number>(0);
    const [selectedVariantDays, setSelectedVariantDays] = useState<number>(30);
    const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

    const handleCouponRedeem = async (couponCode: string) => {
        try {
            const result = await couponService.validateCouponForFrontend(couponCode);
            
            if (result.success && result.data) {
                setValidatedCoupon(result.data);
                setCouponModalOpen(true);
                toast.success(result.message);
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            toast.error('Error al validar el cupón. Inténtalo de nuevo.');
        }
    };

    const handleApplyCoupon = (profileId: string) => {
        setSelectedProfileId(profileId);
        setCouponModalOpen(false);
        
        // Si el cupón es de tipo porcentual o monto fijo, mostrar selector de planes
        if (validatedCoupon && (validatedCoupon.type === 'percentage' || validatedCoupon.type === 'fixed_amount')) {
            setPlanSelectorModalOpen(true);
        } else {
            // Para cupones de asignación de plan, ir directamente a confirmación
            setConfirmationModalOpen(true);
        }
    };

    const handleSelectPlan = (planCode: string, originalPrice: number, variantDays?: number) => {
        setSelectedPlanCode(planCode);
        setSelectedPlanPrice(originalPrice);
        setSelectedVariantDays(variantDays || 30); // Usar variantDays proporcionado o 30 por defecto
        setPlanSelectorModalOpen(false);
        setConfirmationModalOpen(true);
    };

    const handleConfirmApplication = async () => {
        if (!validatedCoupon || !selectedProfileId) return;

        setIsApplyingCoupon(true);
        try {
            const selectedProfile = userProfiles?.find(p => p._id === selectedProfileId);
            if (!selectedProfile) {
                toast.error('Perfil no encontrado');
                return;
            }

            // Obtener el plan actual del perfil para calcular el precio original
            let currentPlan: string;
            let planDays: number;
            let originalPrice: number;

            if (validatedCoupon.type === 'percentage' || validatedCoupon.type === 'fixed_amount') {
                // Para cupones porcentuales o de monto fijo, usar el plan seleccionado
                currentPlan = selectedPlanCode;
                planDays = selectedVariantDays; // Usar los días de variante seleccionados
                originalPrice = selectedPlanPrice;
            } else {
                // Para cupones de asignación de plan, usar el plan actual del perfil
                currentPlan = selectedProfile.planAssignment?.planCode || 'AMATISTA';
                planDays = selectedProfile.planAssignment?.variantDays || 30;
                
                // Buscar el precio del plan actual (esto debería venir de una API de planes)
                // Por ahora usamos valores por defecto basados en el plan
                const planPrices: { [key: string]: number } = {
                    'AMATISTA': 0,
                    'ESMERALDA': 50000,
                    'DIAMANTE': 100000,
                    'PLATINO': 150000
                };
                originalPrice = planPrices[currentPlan] || 0;
            }

            // Aplicar cupón y calcular descuento usando el servicio del backend
            console.log('🎯 [ACCOUNT LAYOUT] Aplicando cupón:', {
                couponCode: validatedCoupon.code,
                currentPlan: currentPlan,
                originalPrice: originalPrice,
                couponApplicablePlans: validatedCoupon.applicablePlans,
                profileId: selectedProfileId,
                timestamp: new Date().toISOString()
            });

            const requestBody = {
                code: validatedCoupon.code,
                originalPrice: originalPrice,
                planCode: currentPlan,
                variantDays: planDays // Incluir variantDays en la petición
            };

            console.log('📤 [ACCOUNT LAYOUT] Enviando petición a backend:', {
                url: `${process.env.NEXT_PUBLIC_API_URL}/api/coupons/apply`,
                method: 'POST',
                body: requestBody,
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const couponApplicationResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/coupons/apply`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            console.log('📥 [ACCOUNT LAYOUT] Respuesta del backend:', {
                status: couponApplicationResponse.status,
                statusText: couponApplicationResponse.statusText,
                ok: couponApplicationResponse.ok,
                headers: Object.fromEntries(couponApplicationResponse.headers.entries())
            });

            if (!couponApplicationResponse.ok) {
                const errorData = await couponApplicationResponse.json();
                console.error('❌ [ACCOUNT LAYOUT] Error al aplicar cupón:', {
                    error: errorData,
                    couponCode: validatedCoupon.code,
                    planCode: currentPlan,
                    applicablePlans: validatedCoupon.applicablePlans,
                    status: couponApplicationResponse.status,
                    statusText: couponApplicationResponse.statusText
                });
                
                // Mostrar mensaje de error genérico ya que se eliminó la restricción de planes
                throw new Error(errorData.message || 'Error al aplicar el cupón');
            }

            const couponResult = await couponApplicationResponse.json();
            console.log('✅ [ACCOUNT LAYOUT] Cupón aplicado exitosamente:', {
                couponResult,
                savings: couponResult.data?.originalPrice - couponResult.data?.finalPrice,
                discountPercentage: couponResult.data?.discountPercentage
            });

            const { originalPrice: calculatedOriginalPrice, finalPrice, discount, discountPercentage } = couponResult.data;

            // Crear factura con el cupón aplicado y el precio final calculado
            const invoiceResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/invoices`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    profileId: selectedProfileId,
                    userId: selectedProfile.user,
                    planCode: currentPlan,
                    planDays: planDays,
                    couponCode: validatedCoupon.code,
                    notes: `Factura con cupón ${validatedCoupon.code} aplicado al perfil ${selectedProfile.name}. Precio original: $${calculatedOriginalPrice.toLocaleString()}, Descuento: $${discount.toLocaleString()}, Precio final: $${finalPrice.toLocaleString()}`
                })
            });

            if (!invoiceResponse.ok) {
                const errorData = await invoiceResponse.json();
                throw new Error(errorData.message || 'Error al crear la factura');
            }

            const invoiceData = await invoiceResponse.json();
            const invoice = invoiceData.data;

            // Generar datos de WhatsApp para la factura
            const whatsappResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/invoices/${invoice._id}/whatsapp-data`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!whatsappResponse.ok) {
                const errorData = await whatsappResponse.json();
                throw new Error(errorData.message || 'Error al generar mensaje de WhatsApp');
            }

            const whatsappData = await whatsappResponse.json();
            
            // Redirigir a WhatsApp con el mensaje generado
            if (whatsappData.success && whatsappData.data.whatsappUrl) {
                window.open(whatsappData.data.whatsappUrl, '_blank');
                
                // Mostrar mensaje de éxito con detalles del descuento
                const discountTypeText = validatedCoupon.discountType === 'percentage' 
                    ? `${validatedCoupon.discountValue}% de descuento`
                    : validatedCoupon.discountType === 'fixed_amount'
                    ? `Precio final: $${finalPrice.toLocaleString()}`
                    : 'Asignación de plan gratuito';
                
                toast.success(
                    `Factura creada exitosamente. Cupón ${validatedCoupon.code} aplicado (${discountTypeText}). Precio original: $${calculatedOriginalPrice.toLocaleString()}, Precio final: $${finalPrice.toLocaleString()}. Redirigiendo a WhatsApp...`
                );
            } else {
                throw new Error('No se pudo generar el enlace de WhatsApp');
            }
            
            // Cerrar modales y limpiar estados
            setConfirmationModalOpen(false);
            setValidatedCoupon(null);
            setSelectedProfileId('');
            setSelectedPlanCode('');
            setSelectedPlanPrice(0);
            
        } catch (error: any) {
            console.error('Error al procesar aplicación del cupón:', error);
            toast.error(error.message || 'Error al procesar la aplicación del cupón');
        } finally {
            setIsApplyingCoupon(false);
        }
    };

    const handleCloseCouponModal = () => {
        setCouponModalOpen(false);
        setValidatedCoupon(null);
    };

    const handleClosePlanSelectorModal = () => {
        setPlanSelectorModalOpen(false);
        setSelectedPlanCode('');
        setSelectedPlanPrice(0);
    };

    const handleCloseConfirmationModal = () => {
        setConfirmationModalOpen(false);
        setSelectedProfileId('');
        setSelectedPlanCode('');
        setSelectedPlanPrice(0);
    };

    if (isLoading || !user) {
        return <Loader />;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 transition-all duration-500">
            <AccountProgressBar percentage={accountCompleteness} />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Alertas de verificación */}
                <div className="mb-6 space-y-4">
                    {/* Alerta cuando el usuario está verificado pero los perfiles no son públicos */}
                    {!user.isVerified && (
                        <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
                            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                            <AlertDescription className="text-amber-800 dark:text-amber-200">
                                Tus perfiles no estarán públicos hasta que verifiques tu
                                identidad.
                            </AlertDescription>
                        </Alert>
                    )}
                </div>

                <div className="flex gap-8">
                    <AccountSidebar
                        activeSection={activeSection}
                        setActiveSection={setActiveSection}
                        onCouponRedeem={handleCouponRedeem}
                    />
                    <div className="flex-1">
                        <AccountContent activeSection={activeSection} />
                    </div>
                </div>
            </div>

            {/* Modal de selección de perfil para cupón */}
            <CouponModal
                isOpen={couponModalOpen}
                onClose={handleCloseCouponModal}
                coupon={validatedCoupon}
                userProfiles={userProfiles || []}
                onApplyCoupon={handleApplyCoupon}
            />

            {/* Modal de selección de plan */}
            <PlanSelectorModal
                isOpen={planSelectorModalOpen}
                onClose={handleClosePlanSelectorModal}
                onSelectPlan={handleSelectPlan}
                coupon={validatedCoupon}
                isProcessing={isApplyingCoupon}
            />

            {/* Modal de confirmación */}
            <CouponConfirmationModal
                isOpen={confirmationModalOpen}
                onClose={handleCloseConfirmationModal}
                onConfirm={handleConfirmApplication}
                isProcessing={isApplyingCoupon}
                profileName={userProfiles?.find(p => p._id === selectedProfileId)?.name || ''}
                couponCode={validatedCoupon?.code || ''}
                couponType={validatedCoupon?.discountType}
                couponValue={validatedCoupon?.discountValue}
            />
        </div>
    );
}
