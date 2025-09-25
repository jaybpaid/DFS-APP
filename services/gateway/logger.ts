export interface LogLevel {
  level: number;
  name: string;
}

export const LOG_LEVELS: Record<string, LogLevel> = {
  ERROR: { level: 0, name: 'ERROR' },
  WARN: { level: 1, name: 'WARN' },
  INFO: { level: 2, name: 'INFO' },
  DEBUG: { level: 3, name: 'DEBUG' },
};

export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  context?: Record<string, any>;
}

export class Logger {
  private level: LogLevel = LOG_LEVELS.INFO;

  constructor(level: LogLevel = LOG_LEVELS.INFO) {
    this.level = level;
  }

  error(message: string, context?: Record<string, any>): void {
    this.log(LOG_LEVELS.ERROR.level, 'ERROR', message, context);
  }

  warn(message: string, context?: Record<string, any>): void {
    this.log(LOG_LEVELS.WARN.level, 'WARN', message, context);
  }

  info(message: string, context?: Record<string, any>): void {
    this.log(LOG_LEVELS.INFO.level, 'INFO', message, context);
  }

  debug(message: string, context?: Record<string, any>): void {
    this.log(LOG_LEVELS.DEBUG.level, 'DEBUG', message, context);
  }

  private log(
    level: number,
    levelName: string,
    message: string,
    context?: Record<string, any>
  ): void {
    if (level > this.level.level) {
      return; // Skip if below current log level
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: levelName,
      message,
      context,
    };

    const output = JSON.stringify(entry);

    // Output to appropriate stream
    switch (levelName) {
      case 'ERROR':
        console.error(output);
        break;
      case 'WARN':
        console.warn(output);
        break;
      default:
        console.log(output);
    }
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }
}

// Global logger instance
export const logger = new Logger();
