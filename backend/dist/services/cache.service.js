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
        this.initializeRedis();
    }
    async initializeRedis() {
        try {
            const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
            this.redis = new ioredis_1.default(redisUrl, {
                retryDelayOnFailover: 100,
                maxRetriesPerRequest: 3,
                lazyConnect: true,
                keepAlive: 30000,
                connectTimeout: 10000,
                commandTimeout: 5000,
            });
            this.redis.on('connect', () => {
                this.isConnected = true;
                logger_1.logger.info('✅ Redis conectado exitosamente');
            });
            this.redis.on('error', (error) => {
                this.isConnected = false;
                logger_1.logger.error('❌ Error de conexión Redis:', error);
            });
            this.redis.on('close', () => {
                this.isConnected = false;
                logger_1.logger.warn('⚠️ Redis desconectado');
            });
            await this.redis.connect();
        }
        catch (error) {
            logger_1.logger.error('Error inicializando Redis:', error);
            this.redis = null;
        }
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
