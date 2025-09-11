'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { purchaseUpgrade } from '@/services/upgrade.service';
import toast from 'react-hot-toast';

export const useUpgradePurchase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ profileId, upgradeCode }: { profileId: string; upgradeCode: string }) => 
      purchaseUpgrade(profileId, upgradeCode),
    onSuccess: (data, variables) => {
      if (data.success) {
        toast.success(data.message || 'Upgrade activado exitosamente');
        
        // Invalidar las queries relacionadas para refrescar los datos
        queryClient.invalidateQueries({ queryKey: ['userProfiles'] });
        queryClient.invalidateQueries({ queryKey: ['profile', variables.profileId] });
      } else {
        toast.error(data.message || 'Error al activar el upgrade');
      }
    },
    onError: (error: any) => {
      console.error('Error en compra de upgrade:', error);
      toast.error('Error al procesar la compra del upgrade');
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
    
    // Verificar si el perfil tiene un plan activo
    const now = new Date();
    const hasActivePlan = profile.planAssignment && 
      new Date(profile.planAssignment.expiresAt) > now;
    
    if (!hasActivePlan) {
      return { 
        canPurchase: false, 
        reason: 'Necesitas un plan activo para comprar upgrades' 
      };
    }
    
    // Si no se especifica upgradeCode, solo validar plan activo
    if (!upgradeCode) {
      return { canPurchase: true };
    }
    
    // Verificar reglas específicas por tipo de upgrade
    if (upgradeCode === 'IMPULSO') {
      // IMPULSO requiere DESTACADO activo
      if (!profile.hasDestacadoUpgrade) {
        return { 
          canPurchase: false, 
          reason: 'Necesitas tener "Destacado" activo para comprar "Impulso"' 
        };
      }
    }
    
    // Verificar si es plan DIAMANTE y el upgrade es DESTACADO
    if (upgradeCode === 'DESTACADO' && profile.planAssignment?.planCode === 'DIAMANTE') {
      return { 
        canPurchase: false, 
        reason: 'El plan Diamante ya incluye "Destacado" permanente' 
      };
    }
    
    return { canPurchase: true };
  };
  
  return { validateUpgrade };
};