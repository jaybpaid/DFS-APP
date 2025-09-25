export interface Tool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties?: Record<string, any>;
    required?: string[];
  };
}

export interface CallToolRequest {
  method: string;
  params: {
    name: string;
    arguments?: Record<string, any>;
  };
}

export interface ToolRegistration {
  name: string;
  namespace: 'app' | 'ext';
  tool: Tool;
  serverId: string;
  healthCheck: () => Promise<boolean>;
  priority: number; // Higher number = higher priority
}

export interface ServerRegistration {
  id: string;
  name: string;
  command: string;
  args: string[];
  env: Record<string, string>;
  namespace: 'app' | 'ext';
  tools: Tool[];
  process?: any; // ChildProcess
  healthEndpoint?: string;
}

export type PolicyAction = 'allow' | 'deny' | 'fallback';

export interface PolicyRule {
  namespace: 'app' | 'ext' | '*';
  toolPattern: string;
  action: PolicyAction;
  priority: number;
  conditions?: {
    userId?: string;
    timeRange?: { start: string; end: string };
    rateLimit?: number;
  };
}

export class ToolRegistry {
  private tools = new Map<string, ToolRegistration>();
  private servers = new Map<string, ServerRegistration>();
  private policies: PolicyRule[] = [];
  private updateHandlers: Array<() => void> = [];

  constructor() {
    this.initializeDefaultPolicies();
  }

  private initializeDefaultPolicies(): void {
    // Default policies: app takes precedence over ext
    this.policies = [
      {
        namespace: 'app',
        toolPattern: '*',
        action: 'allow',
        priority: 1000,
      },
      {
        namespace: 'ext',
        toolPattern: '*',
        action: 'fallback',
        priority: 500,
      },
    ];
  }

  registerServer(registration: ServerRegistration): void {
    this.servers.set(registration.id, registration);

    // Register all tools from this server
    registration.tools.forEach(tool => {
      this.registerTool({
        name: tool.name,
        namespace: registration.namespace,
        tool,
        serverId: registration.id,
        healthCheck: async () => {
          // TODO: Implement actual health check
          return true;
        },
        priority: registration.namespace === 'app' ? 1000 : 0,
      });
    });

    this.notifyUpdate();
  }

  registerTool(registration: ToolRegistration): void {
    const key = `${registration.namespace}.${registration.name}`;
    this.tools.set(key, registration);
    this.notifyUpdate();
  }

  unregisterServer(serverId: string): void {
    const server = this.servers.get(serverId);
    if (server) {
      server.tools.forEach(tool => {
        const key = `${server.namespace}.${tool.name}`;
        this.tools.delete(key);
      });
      this.servers.delete(serverId);
      this.notifyUpdate();
    }
  }

  getTool(namespace: string, toolName: string): ToolRegistration | undefined {
    const key = `${namespace}.${toolName}`;
    return this.tools.get(key);
  }

  getAvailableTools(): Map<string, ToolRegistration> {
    return new Map(this.tools);
  }

  getServersByNamespace(namespace: 'app' | 'ext'): ServerRegistration[] {
    return Array.from(this.servers.values()).filter(
      server => server.namespace === namespace
    );
  }

  // Policy-based routing
  resolveTool(request: CallToolRequest): {
    registration: ToolRegistration | null;
    action: PolicyAction;
    fallbackOptions: ToolRegistration[];
  } {
    const toolKey = `${request.params.name}`;
    let appTool: ToolRegistration | undefined;
    let extTools: ToolRegistration[] = [];

    // Find tools across namespaces
    for (const [key, registration] of this.tools) {
      if (key.endsWith(`.${request.params.name}`)) {
        if (registration.namespace === 'app') {
          appTool = registration;
        } else if (registration.namespace === 'ext') {
          extTools.push(registration);
        }
      }
    }

    // Apply policy resolution
    const policy = this.findApplicablePolicy(request.params.name);

    switch (policy.action) {
      case 'allow':
        if (policy.namespace === 'app' && appTool) {
          return {
            registration: appTool,
            action: 'allow',
            fallbackOptions: extTools,
          };
        } else if (policy.namespace === 'ext' && extTools.length > 0) {
          const fallbackOptions = [appTool, ...extTools.slice(1)].filter(
            (tool): tool is ToolRegistration => tool !== undefined
          );
          return {
            registration: extTools[0],
            action: 'allow',
            fallbackOptions,
          };
        }
        break;

      case 'deny':
        const fallbackForDeny = [appTool, ...extTools].filter(
          (tool): tool is ToolRegistration => tool !== undefined
        );
        return {
          registration: null,
          action: 'deny',
          fallbackOptions: fallbackForDeny,
        };

      case 'fallback':
        // Try app first, then ext
        const primary = appTool || extTools[0];
        const fallback = primary === appTool ? extTools : [];
        return {
          registration: primary || null,
          action: 'fallback',
          fallbackOptions: fallback,
        };
    }

    const fallbackForDefault = [appTool, ...extTools].filter(
      (tool): tool is ToolRegistration => tool !== undefined
    );
    return {
      registration: null,
      action: 'deny',
      fallbackOptions: fallbackForDefault,
    };
  }

  private findApplicablePolicy(toolName: string): PolicyRule {
    // Find highest priority matching policy
    const matching = this.policies
      .filter(policy => this.matchesToolPattern(toolName, policy.toolPattern))
      .sort((a, b) => b.priority - a.priority);

    return (
      matching[0] ||
      this.policies.find(p => p.namespace === '*' && p.toolPattern === '*') || {
        namespace: '*',
        toolPattern: '*',
        action: 'deny',
        priority: 0,
      }
    );
  }

  private matchesToolPattern(toolName: string, pattern: string): boolean {
    if (pattern === '*') return true;
    return toolName === pattern || toolName.startsWith(pattern.replace('*', ''));
  }

  addPolicy(policy: PolicyRule): void {
    this.policies.push(policy);
    this.policies.sort((a, b) => b.priority - a.priority);
  }

  onUpdate(handler: () => void): void {
    this.updateHandlers.push(handler);
  }

  private notifyUpdate(): void {
    this.updateHandlers.forEach(handler => handler());
  }
}

export const toolRegistry = new ToolRegistry();
