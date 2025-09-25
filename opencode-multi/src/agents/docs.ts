import { Bus } from '../core/bus';
import { Memory } from '../core/memory';
import { Prompts } from '../core/prompts';

export class Docs {
  private bus: Bus;
  private memory: Memory;
  private prompts: Prompts;

  constructor(bus: Bus, memory: Memory, prompts: Prompts) {
    this.bus = bus;
    this.memory = memory;
    this.prompts = prompts;
  }

  initialize(): void {
    this.bus.onEvent('refactorer.task', this.onRefactorerTask.bind(this));
  }

  private onRefactorerTask(task: string): void {
    const prompt = this.prompts.getPrompt('docs');
    if (prompt) {
      this.memory.set('currentTask', task);
      this.bus.emitEvent('docs.task', task);
    }
  }
}
