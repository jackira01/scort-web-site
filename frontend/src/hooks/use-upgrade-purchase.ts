'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { purchaseUpgrade } from '@/services/upgrade.service';
import toast from 'react-hot-toast';

export const useUpgradePurchase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      profileId,
      upgradeCode,
      generateInvoice = true
    }: {
      profileId: string;
      upgradeCode: string;
      generateInvoice?: boolean;
    }) => purchaseUpgrade(profileId, upgradeCode, generateInvoice),
    onSuccess: (data, variables) => {
      // No mostrar toast aquí, se maneja en el componente que llama
      // Solo invalidar las queries relacionadas para refrescar los datos
      queryClient.invalidateQueries({ queryKey: ['userProfiles'] });
      queryClient.invalidateQueries({ queryKey: ['profile', variables.profileId] });
    },
    onError: (error: any) => {
      // No mostrar toast aquí, se maneja en el componente que llama
      console.error('Error al procesar la compra del upgrade:', error);
    },
  });
};

/**
 * Hook para verificar si un perfil puede comprar un upgrade específico
 * @returns Objeto con función de validación
 */
export const useUpgradeValidation = () => {
  // Lógica de validación basada en las reglas de negocio
  const validateUpgrade = (profile: any, upgradeCode?: string) => {
    if (!profile) return { canPurchase: false, reason: 'Perfil no encontrado' };

    const now = new Date();

    // Verificar que el perfil tiene un plan asignado
    if (!profile.planAssignment) {
      return {
        canPurchase: false,
        reason: 'Necesitas un plan asignado para comprar upgrades'
      };
    }

    // Verificar que el plan no esté expirado
    const planExpiresAt = new Date(profile.planAssignment.expiresAt);
    if (planExpiresAt <= now) {
      return {
        canPurchase: false,
        reason: 'Tu plan ha expirado. Por favor renueva tu plan primero'
      };
    }

    // Obtener el código del plan - soporta tanto la nueva estructura (planId.code) como la antigua (planCode)
    const planCode = profile.planAssignment.planId?.code || profile.planAssignment.planCode;

    // Verificar que el plan exista
    if (!planCode) {
      return {
        canPurchase: false,
        reason: 'No se pudo determinar el plan asignado'
      };
    }

    // Verificar que no sea el plan gratuito (AMATISTA u otro plan por defecto)
    if (planCode === 'AMATISTA' || planCode === 'FREE') {
      return {
        canPurchase: false,
        reason: 'No puedes comprar upgrades con el plan gratuito. Por favor adquiere un plan de pago primero'
      };
    }

    // Si no se especifica upgradeCode, solo validar plan activo
    if (!upgradeCode) {
      return { canPurchase: true };
    }

    // Verificar reglas específicas por tipo de upgrade
    if (upgradeCode === 'IMPULSO') {
      // IMPULSO requiere DESTACADO activo - calcular directamente
      let hasDestacadoActive = false;

      // Si es plan DIAMANTE, incluye DESTACADO automáticamente
      if (planCode === 'DIAMANTE') {
        hasDestacadoActive = true;
      } else {
        // Verificar upgrades activos
        const activeUpgrades = profile.activeUpgrades || profile.upgrades?.filter((upgrade: any) =>
          new Date(upgrade.startAt) <= now && new Date(upgrade.endAt) > now
        ) || [];

        hasDestacadoActive = activeUpgrades.some((upgrade: any) =>
          upgrade.code === 'DESTACADO' || upgrade.code === 'HIGHLIGHT'
        );
      }

      if (!hasDestacadoActive) {
        return {
          canPurchase: false,
          reason: 'Necesitas tener "Destacado" activo para comprar "Impulso"'
        };
      }
    }

    // Verificar si es plan DIAMANTE y el upgrade es DESTACADO
    if (upgradeCode === 'DESTACADO' && planCode === 'DIAMANTE') {
      return {
        canPurchase: false,
        reason: 'El plan Diamante ya incluye "Destacado" permanente'
      };
    }

    return { canPurchase: true };
  };

  return { validateUpgrade };
};