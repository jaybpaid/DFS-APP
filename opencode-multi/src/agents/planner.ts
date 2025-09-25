import { Bus } from '../core/bus';
import { Memory } from '../core/memory';
import { Prompts } from '../core/prompts';

export class Planner {
  private bus: Bus;
  private memory: Memory;
  private prompts: Prompts;

  constructor(bus: Bus, memory: Memory, prompts: Prompts) {
    this.bus = bus;
    this.memory = memory;
    this.prompts = prompts;
  }

  initialize(): void {
    this.bus.onEvent('workflow.start', this.onWorkflowStart.bind(this));
  }

  private onWorkflowStart(): void {
    const prompt = this.prompts.getPrompt('planner');
    if (prompt) {
      this.memory.set('currentTask', prompt);
      this.bus.emitEvent('planner.task', prompt);
    }
  }
}
