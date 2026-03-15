/**
 * Production-ready logging system
 * Replaces console.log statements with proper logging that can be disabled in production
 */

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: string;
  data?: any;
}

class Logger {
  private level: LogLevel;
  private logs: LogEntry[] = [];
  private maxLogs = 1000;

  constructor() {
    // Set log level based on build mode (PROD/DEV are compile-time Vite constants, not env vars)
    this.level = import.meta.env.PROD ? LogLevel.WARN : LogLevel.DEBUG;
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.level;
  }

  private addLog(level: LogLevel, message: string, context?: string, data?: any) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      context,
      data
    };

    this.logs.push(entry);
    
    // Keep only the last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // In development, also log to console
    if (!import.meta.env.PROD) {
      const contextStr = context ? `[${context}] ` : '';
      const logMessage = `${contextStr}${message}`;
      
      switch (level) {
        case LogLevel.ERROR:
          console.error(logMessage, data);
          break;
        case LogLevel.WARN:
          console.warn(logMessage, data);
          break;
        case LogLevel.INFO:
          console.info(logMessage, data);
          break;
        case LogLevel.DEBUG:
          console.log(logMessage, data);
          break;
      }
    }
  }

  error(message: string, context?: string, data?: any) {
    if (this.shouldLog(LogLevel.ERROR)) {
      this.addLog(LogLevel.ERROR, message, context, data);
    }
  }

  warn(message: string, context?: string, data?: any) {
    if (this.shouldLog(LogLevel.WARN)) {
      this.addLog(LogLevel.WARN, message, context, data);
    }
  }

  info(message: string, context?: string, data?: any) {
    if (this.shouldLog(LogLevel.INFO)) {
      this.addLog(LogLevel.INFO, message, context, data);
    }
  }

  debug(message: string, context?: string, data?: any) {
    if (this.shouldLog(LogLevel.DEBUG)) {
      this.addLog(LogLevel.DEBUG, message, context, data);
    }
  }

  // Firebase specific logging
  firebase(message: string, data?: any) {
    this.debug(message, 'Firebase', data);
  }

  analytics(message: string, data?: any) {
    this.debug(message, 'Analytics', data);
  }

  auth(message: string, data?: any) {
    this.debug(message, 'Auth', data);
  }

  // Get logs for debugging
  getLogs(level?: LogLevel): LogEntry[] {
    if (level !== undefined) {
      return this.logs.filter(log => log.level === level);
    }
    return this.logs;
  }

  // Clear logs
  clearLogs() {
    this.logs = [];
  }

  // Set log level dynamically
  setLevel(level: LogLevel) {
    this.level = level;
  }
}

// Export singleton instance
export const logger = new Logger();

// Convenience exports
export const logError = (message: string, context?: string, data?: any) => 
  logger.error(message, context, data);

export const logWarn = (message: string, context?: string, data?: any) => 
  logger.warn(message, context, data);

export const logInfo = (message: string, context?: string, data?: any) => 
  logger.info(message, context, data);

export const logDebug = (message: string, context?: string, data?: any) => 
  logger.debug(message, context, data); 