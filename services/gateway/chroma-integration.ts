// Chroma MCP Gateway Integration
export class ChromaGatewayIntegration {
  private chromaContainerName = 'serene_hoover';

  async listCollections(): Promise<string[]> {
    return this.executeDockerCommand([
      'docker',
      'exec',
      this.chromaContainerName,
      'python3',
      'main.py',
      '--list',
    ]);
  }

  async createCollection(name: string): Promise<void> {
    return this.executeDockerCommand([
      'docker',
      'exec',
      this.chromaContainerName,
      'python3',
      'main.py',
      '--create',
      name,
    ]);
  }

  async queryCollection(
    collectionName: string,
    queryTexts: string[],
    nResults: number = 5
  ) {
    const query = JSON.stringify({
      collection: collectionName,
      query_texts: queryTexts,
      n_results: nResults,
    });
    return this.executeDockerCommand([
      'docker',
      'exec',
      this.chromaContainerName,
      'python3',
      'main.py',
      '--query',
      query,
    ]);
  }

  private async executeDockerCommand(args: string[]): Promise<any> {
    const { exec } = require('child_process');
    return new Promise((resolve, reject) => {
      exec(args.join(' '), (error: any, stdout: string, stderr: string) => {
        if (error) {
          reject(error);
          return;
        }
        try {
          resolve(JSON.parse(stdout));
        } catch {
          resolve(stdout);
        }
      });
    });
  }
}
