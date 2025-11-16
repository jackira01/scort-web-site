import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

/**
 * VALIDACIÓN A: Verifica si el usuario puede crear un nuevo perfil (límite total)
 * Se ejecuta ANTES de entrar al wizard de creación
 */
export const validateMaxProfiles = async (userId: string): Promise<{
  ok: boolean;
  message?: string;
  currentCount?: number;
  maxAllowed?: number;
}> => {
  console.log('🔍 [VALIDACIÓN A] Iniciando validateMaxProfiles...');

  try {
    console.log('🔍 [VALIDACIÓN A] User ID recibido:', userId ? '✅ ID válido' : '❌ No hay ID');

    if (!userId) {
      console.error('❌ [VALIDACIÓN A] No se encontró ID de usuario');
      return {
        ok: false,
        message: 'No autenticado',
      };
    }

    console.log('🔍 [VALIDACIÓN A] Enviando request a:', `${API_URL}/api/profile/validate-max`);
    const response = await axios.get(`${API_URL}/api/profile/validate-max`, {
      headers: {
        'X-User-ID': userId,
      },
    });
    console.log('✅ [VALIDACIÓN A] Response recibida:', response.data);

    return response.data;

    return response.data;
  } catch (error: any) {
    console.error('❌ [VALIDACIÓN A] Error en validateMaxProfiles:', error);
    console.error('❌ [VALIDACIÓN A] Error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });

    if (error.response?.data) {
      return error.response.data;
    }

    return {
      ok: false,
      message: 'Error al validar límite de perfiles',
    };
  }
};

/**
 * VALIDACIÓN B: Verifica si el usuario puede seleccionar un plan gratuito
 * Se ejecuta en el PASO 4 del wizard cuando el usuario selecciona un plan
 */
export const validatePlanSelection = async (userId: string, planCode: string): Promise<{
  ok: boolean;
  message?: string;
  isPaid?: boolean;
  currentFreeCount?: number;
  maxFree?: number;
}> => {
  try {
    if (!userId) {
      return {
        ok: false,
        message: 'No autenticado',
      };
    }

    const response = await axios.post(
      `${API_URL}/api/profile/validate-plan-selection`,
      { planCode },
      {
        headers: {
          'X-User-ID': userId,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error('Error en validatePlanSelection:', error);

    if (error.response?.data) {
      return error.response.data;
    }

    return {
      ok: false,
      message: 'Error al validar selección de plan',
    };
  }
};
