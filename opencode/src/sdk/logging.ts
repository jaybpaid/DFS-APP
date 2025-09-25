/**
 * Minimal structured logger for OpenCode
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  module: string;
  message: string;
  data?: any;
}

class Logger {
  private minLevel: LogLevel = LogLevel.INFO;

  constructor(minLevel?: LogLevel) {
    if (minLevel !== undefined) {
      this.minLevel = minLevel;
    }
  }

  private formatMessage(
    level: LogLevel,
    module: string,
    message: string,
    data?: any
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      module,
      message,
      data,
    };
  }

  private log(entry: LogEntry): void {
    if (entry.level >= this.minLevel) {
      const levelName = LogLevel[entry.level];
      const formatted = `[${entry.timestamp}] ${levelName} [${entry.module}] ${entry.message}`;

      switch (entry.level) {
        case LogLevel.DEBUG:
          console.debug(formatted, entry.data || '');
          break;
        case LogLevel.INFO:
          console.log(formatted, entry.data || '');
          break;
        case LogLevel.WARN:
          console.warn(formatted, entry.data || '');
          break;
        case LogLevel.ERROR:
          console.error(formatted, entry.data || '');
          break;
      }
    }
  }

  debug(module: string, message: string, data?: any): void {
    this.log(this.formatMessage(LogLevel.DEBUG, module, message, data));
  }

  info(module: string, message: string, data?: any): void {
    this.log(this.formatMessage(LogLevel.INFO, module, message, data));
  }

  warn(module: string, message: string, data?: any): void {
    this.log(this.formatMessage(LogLevel.WARN, module, message, data));
  }

  error(module: string, message: string, data?: any): void {
    this.log(this.formatMessage(LogLevel.ERROR, module, message, data));
  }
}

// Global logger instance
export const logger = new Logger();

// Module-specific loggers
export const createLogger = (module: string): Logger => {
  return new Logger();
};
