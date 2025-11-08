/**
 * Utilidad para manejar el almacenamiento temporal de datos de redirección a WhatsApp
 * Estos datos se almacenan cuando un usuario crea un perfil con plan de pago
 * y se utilizan después de completar la verificación del perfil
 */

interface WhatsAppRedirectData {
  companyNumber: string;
  message: string;
  profileId: string;
}

const STORAGE_KEY = 'pendingWhatsAppRedirect';

/**
 * Guarda los datos de redirección a WhatsApp en localStorage
 */
export function saveWhatsAppRedirectData(data: WhatsAppRedirectData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error al guardar datos de redirección a WhatsApp:', error);
  }
}

/**
 * Recupera los datos de redirección a WhatsApp desde localStorage
 */
export function getWhatsAppRedirectData(): WhatsAppRedirectData | null {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return null;

    return JSON.parse(data) as WhatsAppRedirectData;
  } catch (error) {
    console.error('Error al recuperar datos de redirección a WhatsApp:', error);
    return null;
  }
}

/**
 * Elimina los datos de redirección a WhatsApp de localStorage
 */
export function clearWhatsAppRedirectData(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error al eliminar datos de redirección a WhatsApp:', error);
  }
}

/**
 * Verifica si existen datos de redirección pendientes
 */
export function hasWhatsAppRedirectData(): boolean {
  return !!getWhatsAppRedirectData();
}

/**
 * Verifica si los datos de redirección corresponden a un perfil específico
 */
export function isWhatsAppRedirectForProfile(profileId: string): boolean {
  const data = getWhatsAppRedirectData();
  return data?.profileId === profileId;
}
