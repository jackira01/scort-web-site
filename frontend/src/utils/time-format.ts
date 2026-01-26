
/**
 * Utility functions for formatting and parsing duration strings (HH:MM).
 * Used for rate management to converting between backend "total time" format
 * and frontend "Days, Hours, Minutes" display.
 */

export const parseDuration = (timeStr: string) => {
    if (!timeStr) return { days: '', hours: '', minutes: '' };

    const [totalHoursStr, minutesStr] = timeStr.split(':');
    const totalHours = parseInt(totalHoursStr) || 0;
    const minutes = parseInt(minutesStr) || 0;

    const totalMinutes = totalHours * 60 + minutes;

    const days = Math.floor(totalMinutes / (24 * 60));
    const remainingMinutesAfterDays = totalMinutes % (24 * 60);
    const hours = Math.floor(remainingMinutesAfterDays / 60);
    const finalMinutes = remainingMinutesAfterDays % 60;

    return {
        days: days > 0 ? days.toString() : '',
        hours: hours > 0 ? hours.toString() : '',
        minutes: finalMinutes > 0 ? finalMinutes.toString() : '',
    };
};

export const formatDurationForBackend = (
    days: string,
    hours: string,
    minutes: string,
): string => {
    const totalMinutes =
        (parseInt(days) || 0) * 24 * 60 +
        (parseInt(hours) || 0) * 60 +
        (parseInt(minutes) || 0);

    const finalHours = Math.floor(totalMinutes / 60);
    const finalMinutes = totalMinutes % 60;

    return `${finalHours.toString().padStart(2, '0')}:${finalMinutes.toString().padStart(2, '0')}`;
};

export const getDisplayDuration = (timeStr: string): string => {
    const { days, hours, minutes } = parseDuration(timeStr);
    const parts = [];

    if (days) parts.push(`${days} día${parseInt(days) > 1 ? 's' : ''}`);
    if (hours) parts.push(`${hours} hora${parseInt(hours) > 1 ? 's' : ''}`);
    if (minutes) parts.push(`${minutes} minuto${parseInt(minutes) > 1 ? 's' : ''}`);

    if (parts.length === 0) return 'Tiempo no especificado';

    return parts.join(', ');
};
