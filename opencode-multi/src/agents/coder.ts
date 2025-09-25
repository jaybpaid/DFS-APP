import { Bus } from '../core/bus';
import { Memory } from '../core/memory';
import { Prompts } from '../core/prompts';

export class Coder {
  private bus: Bus;
  private memory: Memory;
  private prompts: Prompts;

  constructor(bus: Bus, memory: Memory, prompts: Prompts) {
    this.bus = bus;
    this.memory = memory;
    this.prompts = prompts;
  }

  initialize(): void {
    this.bus.onEvent('researcher.task', this.onResearcherTask.bind(this));
  }

  private onResearcherTask(task: string): void {
    const prompt = this.prompts.getPrompt('coder');
    if (prompt) {
      this.memory.set('currentTask', task);
      this.bus.emitEvent('coder.task', task);
    }
  }
}
