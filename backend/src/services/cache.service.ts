import Redis from 'ioredis';
import { logger } from '../utils/logger';

class CacheService {
  private redis: Redis | null = null;
  private isConnected = false;
  private lastErrorTime = 0;
  private errorLogThrottle = 30000; // 30 segundos entre logs de error
  private connectionAttempts = 0;
  private maxConnectionAttempts = 3;
  private reconnectTimeout: NodeJS.Timeout | null = null;

  constructor() {
    // Redis desactivado temporalmente - NO INICIALIZAR
    // this.initializeRedis();
    logger.info('⚠️ Redis desactivado - Modo sin caché');
    this.redis = null;
    this.isConnected = false;
  }

  /**
   * Inicializar conexión a Redis con configuración mejorada
   */
  private async initializeRedis(): Promise<void> {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

      this.redis = new Redis(redisUrl, {
        maxRetriesPerRequest: null,
        lazyConnect: true,
        keepAlive: 30000,
        connectTimeout: 10000, // 10 segundos
        commandTimeout: 5000,  // 5 segundos para comandos
      });

      this.redis.on('connect', () => {
        this.isConnected = true;
        this.connectionAttempts = 0;
        logger.info('✅ Redis conectado exitosamente');
      });

      this.redis.on('error', (error) => {
        this.isConnected = false;
        this.handleConnectionError(error);
      });

      this.redis.on('close', () => {
        this.isConnected = false;
        this.scheduleReconnect();
      });

      await this.redis.connect();
    } catch (error) {
      this.handleInitializationError(error);
    }
  }

  private handleConnectionError(error: any) {
    const now = Date.now();
    this.connectionAttempts++;

    // Si hemos excedido el máximo de intentos, desconectar completamente
    if (this.connectionAttempts > this.maxConnectionAttempts) {
      if (now - this.lastErrorTime > this.errorLogThrottle) {
        logger.warn('⚠️ Redis no disponible después de múltiples intentos - Deshabilitando reconexión automática');
        this.lastErrorTime = now;
      }
      this.disableRedis();
      return;
    }

    // Solo loggear errores cada 30 segundos para evitar spam
    if (now - this.lastErrorTime > this.errorLogThrottle) {
      if (this.connectionAttempts === 1) {
        logger.warn('⚠️ Redis no disponible - La aplicación funcionará sin caché');
      } else {
        logger.error(`❌ Error de conexión Redis (intento ${this.connectionAttempts}/${this.maxConnectionAttempts}):`, error.message);
      }
      this.lastErrorTime = now;
    }
  }

  private handleInitializationError(error: any) {
    logger.warn('⚠️ Redis no disponible - La aplicación funcionará sin caché');
    this.redis = null;
    this.isConnected = false;
  }

  private scheduleReconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    // Solo intentar reconectar si no hemos excedido el máximo de intentos
    if (this.connectionAttempts < this.maxConnectionAttempts) {
      const delay = Math.min(1000 * Math.pow(2, this.connectionAttempts), 30000); // Backoff exponencial

      this.reconnectTimeout = setTimeout(() => {
        if (!this.isConnected && this.redis) {
          this.redis.connect().catch(() => {
            // Error manejado por el event handler
          });
        }
      }, delay);
    } else {
      // Después del máximo de intentos, deshabilitar Redis completamente
      this.disableRedis();
    }
  }

  private disableRedis() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.redis) {
      // Remover todos los event listeners para evitar más errores
      this.redis.removeAllListeners();
      this.redis.disconnect();
      this.redis = null;
    }

    this.isConnected = false;
  }

  /**
   * Obtiene un valor del caché
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.isConnected || !this.redis) {
      return null;
    }

    try {
      const value = await this.redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error(`Error obteniendo caché para key ${key}:`, error);
      return null;
    }
  }

  /**
   * Establece un valor en el caché
   */
  async set(key: string, value: any, ttlSeconds: number = 300): Promise<boolean> {
    if (!this.isConnected || !this.redis) {
      return false;
    }

    try {
      await this.redis.setex(key, ttlSeconds, JSON.stringify(value));
      return true;
    } catch (error) {
      logger.error(`Error estableciendo caché para key ${key}:`, error);
      return false;
    }
  }

  /**
   * Elimina una clave del caché
   */
  async del(key: string): Promise<boolean> {
    if (!this.isConnected || !this.redis) {
      return false;
    }

    try {
      await this.redis.del(key);
      return true;
    } catch (error) {
      logger.error(`Error eliminando caché para key ${key}:`, error);
      return false;
    }
  }

  /**
   * Elimina múltiples claves que coincidan con un patrón
   */
  async delPattern(pattern: string): Promise<boolean> {
    if (!this.isConnected || !this.redis) {
      return false;
    }

    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
      return true;
    } catch (error) {
      logger.error(`Error eliminando patrón ${pattern}:`, error);
      return false;
    }
  }

  /**
   * Verifica si una clave existe
   */
  async exists(key: string): Promise<boolean> {
    if (!this.isConnected || !this.redis) {
      return false;
    }

    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      logger.error(`Error verificando existencia de key ${key}:`, error);
      return false;
    }
  }

  /**
   * Incrementa un contador
   */
  async incr(key: string, ttlSeconds?: number): Promise<number> {
    if (!this.isConnected || !this.redis) {
      return 0;
    }

    try {
      const result = await this.redis.incr(key);
      if (ttlSeconds && result === 1) {
        await this.redis.expire(key, ttlSeconds);
      }
      return result;
    } catch (error) {
      logger.error(`Error incrementando key ${key}:`, error);
      return 0;
    }
  }

  /**
   * Obtiene información del servidor Redis
   */
  async getInfo(): Promise<any> {
    if (!this.isConnected || !this.redis) {
      return null;
    }

    try {
      const info = await this.redis.info();
      return info;
    } catch (error) {
      logger.error('Error obteniendo info de Redis:', error);
      return null;
    }
  }

  /**
   * Cierra la conexión Redis
   */
  async disconnect(): Promise<void> {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.redis) {
      await this.redis.quit();
      this.isConnected = false;
    }
  }

  /**
   * Genera claves de caché consistentes
   */
  generateKey(prefix: string, ...parts: (string | number)[]): string {
    return `${prefix}:${parts.join(':')}`;
  }
}

// Instancia singleton
export const cacheService = new CacheService();

// Constantes para TTL
export const CACHE_TTL = {
  SHORT: 60,        // 1 minuto
  MEDIUM: 300,      // 5 minutos
  LONG: 1800,       // 30 minutos
  VERY_LONG: 3600,  // 1 hora
  DAY: 86400,       // 24 horas
} as const;

// Prefijos para organizar las claves
export const CACHE_KEYS = {
  PROFILES: 'profiles',
  FILTERS: 'filters',
  USERS: 'users',
  ATTRIBUTE_GROUPS: 'attr_groups',
  CONFIG: 'config',
  STATS: 'stats',
} as const;