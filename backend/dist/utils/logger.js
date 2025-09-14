"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class ProductionLogger {
    constructor() {
        this.logLevel = process.env.LOG_LEVEL || 'info';
        this.logToFile = process.env.NODE_ENV === 'production';
        this.logDir = process.env.LOG_DIR || '/tmp/logs';
        if (this.logToFile) {
            this.ensureLogDirectory();
        }
    }
    ensureLogDirectory() {
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }
    formatMessage(level, message) {
        const timestamp = new Date().toISOString();
        const pid = process.pid;
        return `[${timestamp}] [${pid}] ${level.toUpperCase()}: ${message}`;
    }
    shouldLog(level) {
        const levels = { error: 0, warn: 1, info: 2, debug: 3 };
        const currentLevel = levels[this.logLevel] ?? 2;
        const messageLevel = levels[level] ?? 0;
        return messageLevel <= currentLevel;
    }
    writeToFile(level, message, ...args) {
        if (!this.logToFile)
            return;
        try {
            const logFile = path.join(this.logDir, `${level}.log`);
            const formattedMessage = this.formatMessage(level, message);
            const logEntry = args.length > 0
                ? `${formattedMessage} ${JSON.stringify(args)}\n`
                : `${formattedMessage}\n`;
            fs.appendFileSync(logFile, logEntry);
        }
        catch (error) {
            console.error('Failed to write to log file:', error);
        }
    }
    info(message, ...args) {
        if (!this.shouldLog('info'))
            return;
        const formattedMessage = this.formatMessage('info', message);
        if (process.env.NODE_ENV === 'production') {
            this.writeToFile('info', message, ...args);
        }
        else {
            console.log(formattedMessage, ...args);
        }
    }
    error(message, ...args) {
        if (!this.shouldLog('error'))
            return;
        const formattedMessage = this.formatMessage('error', message);
        if (process.env.NODE_ENV === 'production') {
            this.writeToFile('error', message, ...args);
            console.error(formattedMessage);
        }
        else {
            console.error(formattedMessage, ...args);
        }
    }
    warn(message, ...args) {
        if (!this.shouldLog('warn'))
            return;
        const formattedMessage = this.formatMessage('warn', message);
        if (process.env.NODE_ENV === 'production') {
            this.writeToFile('warn', message, ...args);
        }
        else {
            console.warn(formattedMessage, ...args);
        }
    }
    debug(message, ...args) {
        if (process.env.NODE_ENV !== 'development' || !this.shouldLog('debug')) {
            return;
        }
        const formattedMessage = this.formatMessage('debug', message);
        console.debug(formattedMessage, ...args);
    }
}
exports.logger = new ProductionLogger();
exports.default = exports.logger;
