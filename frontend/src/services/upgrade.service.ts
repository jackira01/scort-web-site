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
  invoice?: any;
  whatsAppMessage?: {
    companyNumber: string;
    message: string;
  } | null;
  paymentRequired?: boolean;
  status?: string;
}

/**
 * Compra un upgrade para un perfil específico
 * @param profileId - ID del perfil
 * @param upgradeCode - Código del upgrade (DESTACADO o IMPULSO)
 * @param generateInvoice - Si es true, genera factura; si es false, activa inmediatamente (solo admin)
 * @returns Promise con la respuesta de la compra
 */
export const purchaseUpgrade = async (
  profileId: string,
  upgradeCode: string,
  generateInvoice: boolean = true
): Promise<PurchaseUpgradeResponse> => {
  try {
    const response = await axios.post(`${API_URL}/api/profile/${profileId}/purchase-upgrade`, {
      code: upgradeCode,
      generateInvoice
    });

    // Si la respuesta incluye datos de WhatsApp, los retornamos
    return {
      success: true,
      message: response.data.message || 'Upgrade procesado exitosamente',
      ...response.data
    };
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { data?: { message?: string, error?: string } } };
      const errorMessage = axiosError.response?.data?.message || axiosError.response?.data?.error || 'Error al procesar la compra';
      throw new Error(errorMessage);
    }
    throw new Error('Error al procesar la compra del upgrade');
  }
};

export const getAvailableUpgrades = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/plans/upgrades`);
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