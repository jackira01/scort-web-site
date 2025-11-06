'use client';

import { useState } from 'react';
import { Star, Zap, X, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { useUpgradePurchase, useUpgradeValidation } from '@/hooks/use-upgrade-purchase';
import { useUser } from '@/hooks/use-user';
import toast from 'react-hot-toast';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  profileId: string;
  profile: any;
  upgradeCode: 'DESTACADO' | 'IMPULSO';
}

const upgradeInfo = {
  DESTACADO: {
    name: 'Destacado',
    icon: Star,
    color: 'from-yellow-500 to-orange-500',
    hoverColor: 'from-yellow-600 to-orange-600',
    description: 'Además de aparecer con un recuadro alrededor de tu perfil, este upgrade hará que subas un nivel para poder aparecer en los primeros lugares de resultados según el paquete que hayas adquirido.',
    benefits: [
      'Rotarás dentro de ese nuevo nivel',
      'Incrementa significativamente las visitas a tu perfil',
      'Duración de 24 horas'
    ],
    price: 15000
  },
  IMPULSO: {
    name: 'Impulso',
    icon: Zap,
    color: 'from-purple-500 to-pink-500',
    hoverColor: 'from-purple-600 to-pink-600',
    description: 'Tu perfil se posicionará en los primeros lugares de los resultados de búsqueda',
    benefits: [
      'Posicionamiento prioritario en búsquedas',
      'Aparece en los primeros resultados',
      'Mayor probabilidad de ser contactado',
      'Duración de 24 horas'
    ],
    price: 25000
  }
};

export default function UpgradeModal({
  isOpen,
  onClose,
  profileId,
  profile,
  upgradeCode
}: UpgradeModalProps) {
  const [adminOverride, setAdminOverride] = useState(false);
  const [generateInvoice, setGenerateInvoice] = useState(true);
  const { mutate: purchaseUpgrade, isPending: isPurchasing } = useUpgradePurchase();
  const { validateUpgrade } = useUpgradeValidation();
  const { data: user } = useUser();

  const upgrade = upgradeInfo[upgradeCode];
  const IconComponent = upgrade.icon;

  const validation = validateUpgrade(profile, upgradeCode);
  const isAdmin = user?.role === 'admin';
  const canPurchase = validation.canPurchase || (isAdmin && adminOverride);

  const handlePurchase = () => {
    if (!canPurchase && !adminOverride) {
      toast.error(validation.reason || 'No se puede comprar este upgrade');
      return;
    }

    // Si es admin y NO genera factura, activar directamente
    const shouldGenerateInvoice = isAdmin ? generateInvoice : true;

    purchaseUpgrade(
      { profileId, upgradeCode, generateInvoice: shouldGenerateInvoice },
      {
        onSuccess: (data) => {
          // Si requiere pago y hay datos de WhatsApp, redirigir
          if (data.paymentRequired && data.whatsAppMessage) {
            toast.success('Factura generada. Serás redirigido a WhatsApp para completar el pago.');

            // Abrir WhatsApp
            const whatsappUrl = `https://wa.me/${data.whatsAppMessage.companyNumber}?text=${encodeURIComponent(data.whatsAppMessage.message)}`;
            window.open(whatsappUrl, '_blank');

            onClose();
          } else {
            // Admin sin factura o activación directa
            toast.success(`${upgrade.name} activado correctamente`);
            onClose();
          }
        },
        onError: (error: any) => {
          toast.error(error.response?.data?.message || error.response?.data?.error || `Error al activar ${upgrade.name}`);
        }
      }
    );
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className={`p-2 rounded-lg bg-gradient-to-r ${upgrade.color}`}>
              <IconComponent className="h-5 w-5 text-white" />
            </div>
            Activar {upgrade.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Precio */}
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-gray-600" />
              <span className="font-medium">Precio:</span>
            </div>
            <Badge variant="secondary" className="text-lg font-bold">
              {formatPrice(upgrade.price)}
            </Badge>
          </div>

          {/* Descripción */}
          <div>
            <h4 className="font-semibold mb-2">¿Qué incluye?</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              {upgrade.description}
            </p>
          </div>

          {/* Beneficios */}
          <div>
            <h4 className="font-semibold mb-2">Beneficios:</h4>
            <ul className="space-y-1">
              {upgrade.benefits.map((benefit, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                  {benefit}
                </li>
              ))}
            </ul>
          </div>

          {/* Estado actual */}
          {!validation.canPurchase && (
            <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-400">
                <strong>No disponible:</strong> {validation.reason}
              </p>
            </div>
          )}

          {/* Checkbox para administradores - omitir validaciones */}
          {isAdmin && !validation.canPurchase && (
            <>
              <Separator />
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="admin-override"
                  checked={adminOverride}
                  onCheckedChange={(checked) => setAdminOverride(checked === true)}
                />
                <label
                  htmlFor="admin-override"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Activar como administrador (omitir validaciones)
                </label>
              </div>
            </>
          )}

          {/* Checkbox para administradores - generar factura */}
          {isAdmin && (
            <>
              <Separator />
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="generate-invoice"
                  checked={generateInvoice}
                  onCheckedChange={(checked) => setGenerateInvoice(checked === true)}
                />
                <label
                  htmlFor="generate-invoice"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Generar factura (si está deshabilitado, activa el upgrade inmediatamente)
                </label>
              </div>
            </>
          )}

          {/* Botones */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isPurchasing}
            >
              Cancelar
            </Button>
            <Button
              onClick={handlePurchase}
              disabled={!canPurchase || isPurchasing}
              className={`flex-1 bg-gradient-to-r ${upgrade.color} hover:${upgrade.hoverColor} text-white`}
            >
              {isPurchasing ? 'Activando...' : `Activar ${upgrade.name}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}