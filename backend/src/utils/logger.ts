import * as fs from 'fs';
import * as path from 'path';

interface Logger {
  info: (message: string, ...args: any[]) => void;
  error: (message: string, ...args: any[]) => void;
  warn: (message: string, ...args: any[]) => void;
  debug: (message: string, ...args: any[]) => void;
}

class ProductionLogger implements Logger {
  private logLevel: string;
  private logToFile: boolean;
  private logDir: string;

  constructor() {
    this.logLevel = process.env.LOG_LEVEL || 'info';
    this.logToFile = process.env.NODE_ENV === 'production';
    this.logDir = process.env.LOG_DIR || '/tmp/logs';
    
    if (this.logToFile) {
      this.ensureLogDirectory();
    }
  }

  private ensureLogDirectory(): void {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private formatMessage(level: string, message: string): string {
    const timestamp = new Date().toISOString();
    const pid = process.pid;
    return `[${timestamp}] [${pid}] ${level.toUpperCase()}: ${message}`;
  }

  private shouldLog(level: string): boolean {
    const levels = { error: 0, warn: 1, info: 2, debug: 3 };
    const currentLevel = levels[this.logLevel as keyof typeof levels] ?? 2;
    const messageLevel = levels[level as keyof typeof levels] ?? 0;
    return messageLevel <= currentLevel;
  }

  private writeToFile(level: string, message: string, ...args: any[]): void {
    if (!this.logToFile) return;

    try {
      const logFile = path.join(this.logDir, `${level}.log`);
      const formattedMessage = this.formatMessage(level, message);
      const logEntry = args.length > 0 
        ? `${formattedMessage} ${JSON.stringify(args)}\n`
        : `${formattedMessage}\n`;
      
      fs.appendFileSync(logFile, logEntry);
    } catch (error) {
      // Fallback to console if file writing fails
      console.error('Failed to write to log file:', error);
    }
  }

  info(message: string, ...args: any[]): void {
    if (!this.shouldLog('info')) return;
    
    const formattedMessage = this.formatMessage('info', message);
    
    if (process.env.NODE_ENV === 'production') {
      this.writeToFile('info', message, ...args);
    } else {
      console.log(formattedMessage, ...args);
    }
  }

  error(message: string, ...args: any[]): void {
    if (!this.shouldLog('error')) return;
    
    const formattedMessage = this.formatMessage('error', message);
    
    if (process.env.NODE_ENV === 'production') {
      this.writeToFile('error', message, ...args);
      // Always log errors to console in production for monitoring
      console.error(formattedMessage);
    } else {
      console.error(formattedMessage, ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (!this.shouldLog('warn')) return;
    
    const formattedMessage = this.formatMessage('warn', message);
    
    if (process.env.NODE_ENV === 'production') {
      this.writeToFile('warn', message, ...args);
    } else {
      console.warn(formattedMessage, ...args);
    }
  }

  debug(message: string, ...args: any[]): void {
    // Only log debug messages in development
    if (process.env.NODE_ENV !== 'development' || !this.shouldLog('debug')) {
      return;
    }
    
    const formattedMessage = this.formatMessage('debug', message);
    console.debug(formattedMessage, ...args);
  }
}

export const logger = new ProductionLogger();
export default logger;