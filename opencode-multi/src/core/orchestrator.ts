import { Bus } from './bus';
import { Memory } from './memory';

export class Orchestrator {
  private static instance: Orchestrator;
  private bus: Bus;
  private memory: Memory;

  private constructor() {
    this.bus = Bus.getInstance();
    this.memory = new Memory();
  }

  public static getInstance(): Orchestrator {
    if (!Orchestrator.instance) {
      Orchestrator.instance = new Orchestrator();
    }
    return Orchestrator.instance;
  }

  public initializeAgents(agents: any[]): void {
    agents.forEach(agent => {
      agent.initialize(this.bus, this.memory);
    });
  }

  public startWorkflow(): void {
    this.bus.emitEvent('workflow.start');
  }

  public handleEvent(event: string, handler: (...args: any[]) => void): void {
    this.bus.onEvent(event, handler);
  }
}
