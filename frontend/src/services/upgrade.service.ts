import axios from '@/lib/axios';
import type { Profile } from '@/types/user.types';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface PurchaseUpgradeRequest {
  profileId: string;
  upgradeCode: string;
}

export interface PurchaseUpgradeResponse {
  success: boolean;
  message: string;
  profile?: Profile;
}

/**
 * Compra un upgrade para un perfil específico
 * @param profileId - ID del perfil
 * @param upgradeCode - Código del upgrade (DESTACADO o IMPULSO)
 * @returns Promise con la respuesta de la compra
 */
export const purchaseUpgrade = async (profileId: string, upgradeCode: string): Promise<PurchaseUpgradeResponse> => {
  try {
    const response = await axios.post(`${API_URL}/api/profile/${profileId}/purchase-upgrade`, {
      code: upgradeCode
    });
    return {
      success: true,
      message: 'Upgrade comprado exitosamente',
      profile: response.data
    };
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      if (axiosError.response?.data?.message) {
        return {
          success: false,
          message: axiosError.response.data.message
        };
      }
    }

    return {
      success: false,
      message: 'Error al procesar la compra del upgrade'
    };
  }
};

/**
 * Obtiene los upgrades disponibles
 * @returns Promise con la lista de upgrades disponibles
 */
export const getAvailableUpgrades = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/upgrades`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Verifica si un perfil puede comprar un upgrade específico
 * @param profileId - ID del perfil
 * @param upgradeCode - Código del upgrade
 * @returns Promise con la validación
 */
export const validateUpgradePurchase = async (profileId: string, upgradeCode: string) => {
  try {
    const response = await axios.get(`${API_URL}/api/profile/${profileId}/validate-upgrade/${upgradeCode}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};