export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
  agent?: string;
  model?: string;
}

export class Logger {
  private level: LogLevel;
  private logs: LogEntry[] = [];
  private maxLogs: number = 1000;

  constructor(level: LogLevel = LogLevel.INFO) {
    this.level = level;
  }

  debug(message: string, data?: any, agent?: string, model?: string): void {
    this.log(LogLevel.DEBUG, message, data, agent, model);
  }

  info(message: string, data?: any, agent?: string, model?: string): void {
    this.log(LogLevel.INFO, message, data, agent, model);
  }

  warn(message: string, data?: any, agent?: string, model?: string): void {
    this.log(LogLevel.WARN, message, data, agent, model);
  }

  error(message: string, data?: any, agent?: string, model?: string): void {
    this.log(LogLevel.ERROR, message, data, agent, model);
  }

  private log(
    level: LogLevel,
    message: string,
    data?: any,
    agent?: string,
    model?: string
  ): void {
    if (level < this.level) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      agent,
      model,
    };

    this.logs.push(entry);

    // Keep only the last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Console output with formatting
    const levelName = LogLevel[level];
    const prefix = agent ? `[${agent}]` : '';
    const modelInfo = model ? ` (${model})` : '';

    console.log(`[${entry.timestamp}] ${levelName}${prefix}${modelInfo}: ${message}`);

    if (data && level >= LogLevel.WARN) {
      console.log('Data:', JSON.stringify(data, null, 2));
    }
  }

  getLogs(level?: LogLevel, agent?: string, limit?: number): LogEntry[] {
    let filtered = this.logs;

    if (level !== undefined) {
      filtered = filtered.filter(log => log.level >= level);
    }

    if (agent) {
      filtered = filtered.filter(log => log.agent === agent);
    }

    if (limit) {
      filtered = filtered.slice(-limit);
    }

    return filtered;
  }

  clearLogs(): void {
    this.logs = [];
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  setMaxLogs(maxLogs: number): void {
    this.maxLogs = maxLogs;
    if (this.logs.length > maxLogs) {
      this.logs = this.logs.slice(-maxLogs);
    }
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

// Global logger instance
export const logger = new Logger();
