"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CACHE_KEYS = exports.CACHE_TTL = exports.cacheService = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const logger_1 = require("../utils/logger");
class CacheService {
    constructor() {
        this.redis = null;
        this.isConnected = false;
        this.lastErrorTime = 0;
        this.errorLogThrottle = 30000;
        this.connectionAttempts = 0;
        this.maxConnectionAttempts = 3;
        this.reconnectTimeout = null;
        this.initializeRedis();
    }
    async initializeRedis() {
        try {
            const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
            this.redis = new ioredis_1.default(redisUrl, {
                maxRetriesPerRequest: null,
                lazyConnect: true,
                keepAlive: 30000,
                connectTimeout: 10000,
                commandTimeout: 5000,
            });
            this.redis.on('connect', () => {
                this.isConnected = true;
                this.connectionAttempts = 0;
                logger_1.logger.info('✅ Redis conectado exitosamente');
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
        }
        catch (error) {
            this.handleInitializationError(error);
        }
    }
    handleConnectionError(error) {
        const now = Date.now();
        this.connectionAttempts++;
        if (this.connectionAttempts > this.maxConnectionAttempts) {
            if (now - this.lastErrorTime > this.errorLogThrottle) {
                logger_1.logger.warn('⚠️ Redis no disponible después de múltiples intentos - Deshabilitando reconexión automática');
                this.lastErrorTime = now;
            }
            this.disableRedis();
            return;
        }
        if (now - this.lastErrorTime > this.errorLogThrottle) {
            if (this.connectionAttempts === 1) {
                logger_1.logger.warn('⚠️ Redis no disponible - La aplicación funcionará sin caché');
            }
            else {
                logger_1.logger.error(`❌ Error de conexión Redis (intento ${this.connectionAttempts}/${this.maxConnectionAttempts}):`, error.message);
            }
            this.lastErrorTime = now;
        }
    }
    handleInitializationError(error) {
        logger_1.logger.warn('⚠️ Redis no disponible - La aplicación funcionará sin caché');
        this.redis = null;
        this.isConnected = false;
    }
    scheduleReconnect() {
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
        }
        if (this.connectionAttempts < this.maxConnectionAttempts) {
            const delay = Math.min(1000 * Math.pow(2, this.connectionAttempts), 30000);
            this.reconnectTimeout = setTimeout(() => {
                if (!this.isConnected && this.redis) {
                    this.redis.connect().catch(() => {
                    });
                }
            }, delay);
        }
        else {
            this.disableRedis();
        }
    }
    disableRedis() {
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }
        if (this.redis) {
            this.redis.removeAllListeners();
            this.redis.disconnect();
            this.redis = null;
        }
        this.isConnected = false;
    }
    async get(key) {
        if (!this.isConnected || !this.redis) {
            return null;
        }
        try {
            const value = await this.redis.get(key);
            return value ? JSON.parse(value) : null;
        }
        catch (error) {
            logger_1.logger.error(`Error obteniendo caché para key ${key}:`, error);
            return null;
        }
    }
    async set(key, value, ttlSeconds = 300) {
        if (!this.isConnected || !this.redis) {
            return false;
        }
        try {
            await this.redis.setex(key, ttlSeconds, JSON.stringify(value));
            return true;
        }
        catch (error) {
            logger_1.logger.error(`Error estableciendo caché para key ${key}:`, error);
            return false;
        }
    }
    async del(key) {
        if (!this.isConnected || !this.redis) {
            return false;
        }
        try {
            await this.redis.del(key);
            return true;
        }
        catch (error) {
            logger_1.logger.error(`Error eliminando caché para key ${key}:`, error);
            return false;
        }
    }
    async delPattern(pattern) {
        if (!this.isConnected || !this.redis) {
            return false;
        }
        try {
            const keys = await this.redis.keys(pattern);
            if (keys.length > 0) {
                await this.redis.del(...keys);
            }
            return true;
        }
        catch (error) {
            logger_1.logger.error(`Error eliminando patrón ${pattern}:`, error);
            return false;
        }
    }
    async exists(key) {
        if (!this.isConnected || !this.redis) {
            return false;
        }
        try {
            const result = await this.redis.exists(key);
            return result === 1;
        }
        catch (error) {
            logger_1.logger.error(`Error verificando existencia de key ${key}:`, error);
            return false;
        }
    }
    async incr(key, ttlSeconds) {
        if (!this.isConnected || !this.redis) {
            return 0;
        }
        try {
            const result = await this.redis.incr(key);
            if (ttlSeconds && result === 1) {
                await this.redis.expire(key, ttlSeconds);
            }
            return result;
        }
        catch (error) {
            logger_1.logger.error(`Error incrementando key ${key}:`, error);
            return 0;
        }
    }
    async getInfo() {
        if (!this.isConnected || !this.redis) {
            return null;
        }
        try {
            const info = await this.redis.info();
            return info;
        }
        catch (error) {
            logger_1.logger.error('Error obteniendo info de Redis:', error);
            return null;
        }
    }
    async disconnect() {
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }
        if (this.redis) {
            await this.redis.quit();
            this.isConnected = false;
        }
    }
    generateKey(prefix, ...parts) {
        return `${prefix}:${parts.join(':')}`;
    }
}
exports.cacheService = new CacheService();
exports.CACHE_TTL = {
    SHORT: 60,
    MEDIUM: 300,
    LONG: 1800,
    VERY_LONG: 3600,
    DAY: 86400,
};
exports.CACHE_KEYS = {
    PROFILES: 'profiles',
    FILTERS: 'filters',
    USERS: 'users',
    ATTRIBUTE_GROUPS: 'attr_groups',
    CONFIG: 'config',
    STATS: 'stats',
};
