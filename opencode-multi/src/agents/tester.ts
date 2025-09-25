import { Bus } from '../core/bus';
import { Memory } from '../core/memory';
import { Prompts } from '../core/prompts';

export class Tester {
  private bus: Bus;
  private memory: Memory;
  private prompts: Prompts;

  constructor(bus: Bus, memory: Memory, prompts: Prompts) {
    this.bus = bus;
    this.memory = memory;
    this.prompts = prompts;
  }

  initialize(): void {
    this.bus.onEvent('coder.task', this.onCoderTask.bind(this));
  }

  private onCoderTask(task: string): void {
    const prompt = this.prompts.getPrompt('tester');
    if (prompt) {
      this.memory.set('currentTask', task);
      this.bus.emitEvent('tester.task', task);
    }
  }
}
