import { Bus } from '../core/bus';
import { Memory } from '../core/memory';
import { Prompts } from '../core/prompts';

export class N8n {
  private bus: Bus;
  private memory: Memory;
  private prompts: Prompts;

  constructor(bus: Bus, memory: Memory, prompts: Prompts) {
    this.bus = bus;
    this.memory = memory;
    this.prompts = prompts;
  }

  initialize(): void {
    this.bus.onEvent('docs.task', this.onDocsTask.bind(this));
  }

  private onDocsTask(task: string): void {
    const prompt = this.prompts.getPrompt('n8n');
    if (prompt) {
      this.memory.set('currentTask', task);
      this.bus.emitEvent('n8n.task', task);
    }
  }
}
