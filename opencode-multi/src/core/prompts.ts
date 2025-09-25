export class Prompts {
  private prompts: Map<string, string>;

  constructor() {
    this.prompts = new Map();
  }

  addPrompt(name: string, content: string): void {
    this.prompts.set(name, content);
  }

  getPrompt(name: string): string | undefined {
    return this.prompts.get(name);
  }

  hasPrompt(name: string): boolean {
    return this.prompts.has(name);
  }

  deletePrompt(name: string): boolean {
    return this.prompts.delete(name);
  }

  clearPrompts(): void {
    this.prompts.clear();
  }

  getPromptNames(): IterableIterator<string> {
    return this.prompts.keys();
  }

  getPromptValues(): IterableIterator<string> {
    return this.prompts.values();
  }

  getPromptEntries(): IterableIterator<[string, string]> {
    return this.prompts.entries();
  }
}
