export class Artifacts {
  private artifacts: Map<string, any>;

  constructor() {
    this.artifacts = new Map();
  }

  addArtifact(name: string, content: any): void {
    this.artifacts.set(name, content);
  }

  getArtifact(name: string): any {
    return this.artifacts.get(name);
  }

  hasArtifact(name: string): boolean {
    return this.artifacts.has(name);
  }

  deleteArtifact(name: string): boolean {
    return this.artifacts.delete(name);
  }

  clearArtifacts(): void {
    this.artifacts.clear();
  }

  getArtifactNames(): IterableIterator<string> {
    return this.artifacts.keys();
  }

  getArtifactValues(): IterableIterator<any> {
    return this.artifacts.values();
  }

  getArtifactEntries(): IterableIterator<[string, any]> {
    return this.artifacts.entries();
  }
}
