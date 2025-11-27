import { ConfigParameterService } from '../config-parameter/config-parameter.service';
import type { IProfile } from '../profile/profile.types';

/**
 * Calcula si el perfil tiene un cambio de teléfono reciente
 * @param profile - Perfil a evaluar
 * @returns true si hay cambio reciente (falla verificación), false si es estable
 */
export const calculatePhoneChangeStatus = async (profile: IProfile): Promise<boolean> => {
    try {
        // Si no hay información de contacto, considerar como no verificado
        if (!profile.contact) {
            return true; // phoneChangeDetected = true (falla)
        }

        // Si nunca ha cambiado el teléfono, está verificado
        if (!profile.contact.hasChanged) {
            return false; // phoneChangeDetected = false (pasa)
        }

        // Si ha cambiado pero no hay fecha registrada, considerar como no verificado
        if (!profile.contact.lastChangeDate) {
            return true; // phoneChangeDetected = true (falla)
        }

        // Obtener umbral de configuración (en meses)
        const thresholdMonths = await ConfigParameterService.getValue(
            'profile.phone.stability.threshold.months'
        ) as number;

        // Usar 3 meses por defecto si no está configurado
        const months = thresholdMonths && thresholdMonths > 0 ? thresholdMonths : 3;

        // Calcular diferencia en milisegundos
        const now = new Date();
        const lastChange = new Date(profile.contact.lastChangeDate);
        const diffMs = now.getTime() - lastChange.getTime();

        // Convertir meses a milisegundos (aproximado: 30 días por mes)
        const thresholdMs = months * 30 * 24 * 60 * 60 * 1000;

        // Si el cambio fue hace menos del umbral → falla verificación
        if (diffMs < thresholdMs) {
            return true; // phoneChangeDetected = true (cambio reciente)
        }

        // Si pasó suficiente tiempo → pasa verificación
        return false; // phoneChangeDetected = false (estable)

    } catch (error) {
        console.error('Error al calcular estado de cambio de teléfono:', error);
        // En caso de error, ser conservador y marcar como no verificado
        return true;
    }
};
