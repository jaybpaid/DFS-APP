import { Bus } from '../core/bus';
import { Memory } from '../core/memory';
import { Prompts } from '../core/prompts';

export class Refactorer {
  private bus: Bus;
  private memory: Memory;
  private prompts: Prompts;

  constructor(bus: Bus, memory: Memory, prompts: Prompts) {
    this.bus = bus;
    this.memory = memory;
    this.prompts = prompts;
  }

  initialize(): void {
    this.bus.onEvent('tester.task', this.onTesterTask.bind(this));
  }

  private onTesterTask(task: string): void {
    const prompt = this.prompts.getPrompt('refactorer');
    if (prompt) {
      this.memory.set('currentTask', task);
      this.bus.emitEvent('refactorer.task', task);
    }
  }
}
