import { Bus } from '../core/bus';
import { Memory } from '../core/memory';
import { Prompts } from '../core/prompts';

export class Researcher {
  private bus: Bus;
  private memory: Memory;
  private prompts: Prompts;

  constructor(bus: Bus, memory: Memory, prompts: Prompts) {
    this.bus = bus;
    this.memory = memory;
    this.prompts = prompts;
  }

  initialize(): void {
    this.bus.onEvent('planner.task', this.onPlannerTask.bind(this));
  }

  private onPlannerTask(task: string): void {
    const prompt = this.prompts.getPrompt('researcher');
    if (prompt) {
      this.memory.set('currentTask', task);
      this.bus.emitEvent('researcher.task', task);
    }
  }
}
