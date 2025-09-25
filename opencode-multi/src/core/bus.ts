import { EventEmitter } from 'events';

export class Bus extends EventEmitter {
  private static instance: Bus;

  private constructor() {
    super();
  }

  public static getInstance(): Bus {
    if (!Bus.instance) {
      Bus.instance = new Bus();
    }
    return Bus.instance;
  }

  public emitEvent(event: string, ...args: any[]): boolean {
    return this.emit(event, ...args);
  }

  public onEvent(event: string, listener: (...args: any[]) => void): this {
    return this.on(event, listener);
  }

  public offEvent(event: string, listener: (...args: any[]) => void): this {
    return this.off(event, listener);
  }
}
