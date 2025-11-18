import { runCleanupTasks } from './cleanup.service';

/**
 * Cron job para limpieza automática de perfiles y upgrades expirados
 * Se ejecuta cada 5 minutos usando setTimeout
 */

let cleanupInterval: NodeJS.Timeout | null = null;
let isRunning = false;

/**
 * Función recursiva que ejecuta la limpieza cada 5 minutos
 */
const scheduleNextCleanup = (): void => {
  cleanupInterval = setTimeout(async () => {
    try {
      await runCleanupTasks();
    } catch (error) {
      console.error('[Cleanup Cron] Error during scheduled cleanup:', error);
    }

    // Programar la siguiente ejecución si el cron sigue activo
    if (isRunning) {
      scheduleNextCleanup();
    }
  }, 5 * 60 * 1000); // 5 minutos en milisegundos
};

/**
 * Inicia el cron job de limpieza automática
 */
export const startCleanupCron = (): void => {
  if (isRunning) {
    console.log('[Cleanup Cron] Job already running, skipping start');
    return;
  }

  isRunning = true;
  console.log('[Cleanup Cron] Started - running every 5 minutes');

  // Ejecutar limpieza inmediatamente al iniciar
  console.log('[Cleanup Cron] Running initial cleanup...');
  runCleanupTasks()
    .then(() => {
      console.log('[Cleanup Cron] Initial cleanup completed');
      // Programar la siguiente ejecución
      scheduleNextCleanup();
    })
    .catch((error) => {
      console.error('[Cleanup Cron] Error in initial cleanup:', error);
      // Aún así, programar la siguiente ejecución
      scheduleNextCleanup();
    });
};

/**
 * Detiene el cron job de limpieza automática
 */
export const stopCleanupCron = (): void => {
  if (cleanupInterval) {
    clearTimeout(cleanupInterval);
    cleanupInterval = null;
  }

  isRunning = false;
  console.log('[Cleanup Cron] Stopped');
};

/**
 * Ejecuta una limpieza manual inmediata
 */
export const runManualCleanup = async (): Promise<void> => {
  console.log('[Cleanup Cron] Running manual cleanup...');
  try {
    const result = await runCleanupTasks();
    console.log('[Cleanup Cron] Manual cleanup completed:', result);
  } catch (error) {
    console.error('[Cleanup Cron] Error during manual cleanup:', error);
    throw error;
  }
};

/**
 * Obtiene el estado del cron job
 */
export const getCleanupCronStatus = (): {
  isRunning: boolean;
  nextRun: string | null;
} => {
  return {
    isRunning: isRunning,
    nextRun: isRunning ? 'Every 5 minutes' : null
  };
};