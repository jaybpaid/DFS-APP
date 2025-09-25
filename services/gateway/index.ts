#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { toolRegistry, ServerRegistration, validateServerConfig } from './registry.js';
import { ToolRouter } from './router.js';
import { Logger } from './logger.js';
import { Cache, requestCache, resultCache } from './cache.js';
import {
  metricsRegistry,
  requestCounter,
  toolExecutionCounter,
  activeServers,
  cacheHits,
  cacheMisses,
} from './metrics.js';
import * as fs from 'fs';
import * as path from 'path';

// Types for environment configuration
interface GatewayConfig {
  port?: number;
  logLevel?: 'ERROR' | 'WARN' | 'INFO' | 'DEBUG';
  cacheSize?: number;
  requestTimeout?: number;
  enableHealth?: boolean;
  healthPort?: number;
  enableMetrics?: boolean;
  metricsPort?: number;
  enableRedis?: boolean;
  redisUrl?: string;
  externalServers?: string[]; // Paths to external server configs
  appServers?: string[]; // Paths to app server configs
}

// Load configuration from environment
const config: GatewayConfig = {
  port: parseInt(process.env.GATEWAY_PORT || '3000'),
  logLevel: (process.env.LOG_LEVEL as any) || 'INFO',
  cacheSize: parseInt(process.env.CACHE_SIZE || '1000'),
  requestTimeout: parseInt(process.env.REQUEST_TIMEOUT || '5000'),
  enableHealth: process.env.ENABLE_HEALTH !== 'false',
  healthPort: parseInt(process.env.HEALTH_PORT || '8080'),
  enableMetrics: process.env.ENABLE_METRICS !== 'false',
  metricsPort: parseInt(process.env.METRICS_PORT || '9090'),
  enableRedis: process.env.REDIS_URL !== undefined,
  redisUrl: process.env.REDIS_URL,
  externalServers: process.env.EXTERNAL_SERVERS?.split(',') || [
    './shims/brave-search.sh',
    './shims/github.sh',
    './shims/puppeteer.sh',
  ],
  appServers: process.env.APP_SERVERS?.split(',') || [
    './mcp-servers/dfs-mcp/dist/index.js',
    './apps/api-python/main.py',
  ],
};

// Initialize logger
const logger = new Logger();

// Initialize caches
const requestCache_ = new Cache(500, 60000); // 1 minute TTL
const resultCache_ = new Cache(1000, 300000); // 5 minutes TTL
const router = new ToolRouter(logger);

// MCP Server Implementation
const server = new Server(
  {
    name: 'dfs-gateway',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Initialize gateway components
async function initializeGateway(): Promise<void> {
  logger.info('Initializing DFS Gateway...');

  try {
    // Register external (ext.*) servers
    await registerExternalServers();

    // Register app (app.*) servers
    await registerAppServers();

    // Set up health and metrics endpoints
    if (config.enableHealth) {
      setupHealthEndpoint();
    }

    if (config.enableMetrics) {
      setupMetricsEndpoint();
    }

    // Set up signal handlers
    setupSignalHandlers();

    logger.info('DFS Gateway initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize gateway', { error: error.message });
    process.exit(1);
  }
}

// Register external MCP servers (shim scripts)
async function registerExternalServers(): Promise<void> {
  logger.info('Registering external servers...', {
    count: config.externalServers?.length,
  });

  for (const serverPath of config.externalServers || []) {
    try {
      if (!fs.existsSync(serverPath)) {
        logger.warn('External server path does not exist', { path: serverPath });
        continue;
      }

      // Read server configuration from shim file
      const serverConfig = await loadServerConfig(serverPath);
      if (serverConfig) {
        toolRegistry.registerServer({
          id: path.basename(serverPath, path.extname(serverPath)),
          name: serverConfig.name || path.basename(serverPath),
          command: serverPath,
          args: [],
          env: serverConfig.env || {},
          namespace: 'ext',
          tools: serverConfig.tools || [],
        });

        logger.info('Registered external server', {
          name: serverConfig.name,
          tools: serverConfig.tools?.length,
        });
      }
    } catch (error) {
      logger.error('Failed to register external server', {
        path: serverPath,
        error: error.message,
      });
    }
  }
}

// Register application MCP servers (Node.js/TypeScript processes)
async function registerAppServers(): Promise<void> {
  logger.info('Registering application servers...', {
    count: config.appServers?.length,
  });

  for (const serverPath of config.appServers || []) {
    try {
      if (!fs.existsSync(serverPath)) {
        logger.warn('App server path does not exist', { path: serverPath });
        continue;
      }

      const serverConfig = await loadServerConfig(serverPath);
      if (serverConfig) {
        toolRegistry.registerServer({
          id: path.basename(serverPath, path.extname(serverPath)),
          name: serverConfig.name || path.basename(serverPath),
          command: serverConfig.command || serverPath,
          args: serverConfig.args || [],
          env: serverConfig.env || {},
          namespace: 'app',
          tools: serverConfig.tools || [],
        });

        logger.info('Registered app server', {
          name: serverConfig.name,
          tools: serverConfig.tools?.length,
        });
      }
    } catch (error) {
      logger.error('Failed to register app server', {
        path: serverPath,
        error: error.message,
      });
    }
  }
}

// Load server configuration from file system or environment
async function loadServerConfig(serverPath: string): Promise<any> {
  try {
    // Check if there's a config file with the same name
    const configPath = serverPath.replace(/\.[^/.]+$/, '.json');
    if (fs.existsSync(configPath)) {
      const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      return configData;
    }

    // Check for environment variables
    // This would be specific to each server type
    return {
      name: path.basename(serverPath, path.extname(serverPath)),
      command: findCommandForPath(serverPath),
      args: [],
      env: {
        NODE_ENV: 'production',
        ...process.env,
      },
      tools: [], // Will be discovered at runtime
    };
  } catch (error) {
    logger.error('Failed to load server config', {
      path: serverPath,
      error: error.message,
    });
    return null;
  }
}

// Determine command based on file extension
function findCommandForPath(serverPath: string): string {
  const ext = path.extname(serverPath);
  switch (ext) {
    case '.js':
    case '.ts':
      return 'node';
    case '.py':
      return 'python3';
    case '.sh':
      return 'bash';
    default:
      // For shim files, the path itself is the command
      return serverPath;
  }
}

// Set up health check endpoint
function setupHealthEndpoint(): void {
  const http = require('http');
  const healthServer = http.createServer(async (req, res) => {
    if (req.url === '/healthz') {
      healthCounter.increment({}, { method: 'GET', status: '200' });

      const health = await getHealthStatus();
      res.writeHead(health.overall ? 200 : 503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(health));
    } else {
      res.writeHead(404);
      res.end();
    }
  });

  healthServer.listen(config.healthPort, () => {
    logger.info('Health endpoint listening', { port: config.healthPort });
  });
}

// Get health status of all components
async function getHealthStatus(): Promise<any> {
  const servers = toolRegistry.getAvailableTools();
  const health = {
    overall: true,
    timestamp: new Date().toISOString(),
    components: {
      cache: {
        status: 'healthy',
        stats: requestCache_.getStats(),
      },
      metrics: {
        status: 'healthy',
        registry: metricsRegistry.exportMetrics(),
      },
      servers: {},
    },
  };

  // Check server health
  for (const [toolKey, registration] of servers) {
    const serverHealth = {
      status: 'unknown',
      lastCheck: new Date().toISOString(),
    };

    try {
      const isHealthy = await router.checkServerHealth(registration.serverId);
      serverHealth.status = isHealthy ? 'healthy' : 'unhealthy';
    } catch (error) {
      serverHealth.status = 'error';
    }

    health.components.servers[`${registration.namespace}.${registration.name}`] =
      serverHealth;

    if (serverHealth.status !== 'healthy') {
      health.overall = false;
    }
  }

  return health;
}

// Set up Prometheus metrics endpoint
function setupMetricsEndpoint(): void {
  const http = require('http');
  const metricsServer = http.createServer((req, res) => {
    if (req.url === '/metrics') {
      const metrics = metricsRegistry.exportMetrics();
      res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(metrics);
    } else {
      res.writeHead(404);
      res.end();
    }
  });

  metricsServer.listen(config.metricsPort, () => {
    logger.info('Metrics endpoint listening', { port: config.metricsPort });
  });
}

// Set up signal handlers for graceful shutdown
function setupSignalHandlers(): void {
  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}, shutting down gracefully...`);

    try {
      await router.shutdown();
      logger.info('Gateway shut down successfully');
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown', { error: error.message });
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Handle uncaught exceptions
  process.on('uncaughtException', error => {
    logger.error('Uncaught exception', { error: error.message, stack: error.stack });
    shutdown('uncaughtException');
  });
}

// MCP Server Handlers

// Handle tool calls
server.setRequestHandler('tools/call', async request => {
  const startTime = Date.now();

  try {
    requestCounter.increment({ method: 'tools/call', status: 'processing' });

    // Check cache first
    const cacheKey = Cache.generateRequestKey(request);
    const cachedResult = resultCache_.get(cacheKey);

    if (cachedResult) {
      cacheHits.increment({ cache_type: 'result' });
      logger.debug('Returning cached result', { tool: request.params.name });
      return { content: cachedResult };
    }

    cacheMisses.increment({ cache_type: 'result' });

    // Route to appropriate tool
    const result = await router.routeAndExecute(request);

    // Update metrics
    toolExecutionCounter.increment({
      tool: request.params.name,
      status: result.success ? 'success' : 'error',
      fallback_used: result.fallbackUsed,
    });

    activeServers.set(router.runningProcesses.size);

    requestCounter.increment({
      method: 'tools/call',
      status: result.success ? 'success' : 'error',
    });

    // Cache successful results
    if (result.success && result.result) {
      resultCache_.set(cacheKey, result.result);
    }

    // Log execution time
    const executionTime = Date.now() - startTime;
    logger.info('Tool call completed', {
      tool: request.params.name,
      executionTime,
      success: result.success,
      fallbackUsed: result.fallbackUsed,
    });

    return {
      content: result.success
        ? result.result
        : [{ type: 'text', text: result.error?.message || 'Unknown error' }],
    };
  } catch (error) {
    const executionTime = Date.now() - startTime;
    logger.error('Tool call failed', {
      tool: request.params.name,
      error: error.message,
      executionTime,
    });

    requestCounter.increment({ method: 'tools/call', status: 'error' });

    return {
      content: [{ type: 'text', text: `Error: ${error.message}` }],
      is_error: true,
    };
  }
});

// Handle tool list requests
server.setRequestHandler('tools/list', () => {
  const tools = [];

  for (const [key, registration] of toolRegistry.getAvailableTools()) {
    // Transform according to namespace convention
    const toolName = `${registration.namespace}.${registration.name}`;
    tools.push({
      name: toolName,
      description: registration.tool.description,
      inputSchema: registration.tool.inputSchema,
    });
  }

  return { tools };
});

// Start the server
async function main() {
  try {
    await initializeGateway();

    // Start MCP server on stdin/stdout
    const transport = createStdioTransport();
    await server.connect(transport);

    logger.info('DFS Gateway MCP server started successfully');
  } catch (error) {
    logger.error('Failed to start DFS Gateway', { error: error.message });
    process.exit(1);
  }
}

// Create stdio transport (MCP standard)
function createStdioTransport(): any {
  return {
    start: () => Promise.resolve(),
    stop: () => Promise.resolve(),
    send: (message: any) => {
      console.log(JSON.stringify(message));
    },
    onmessage: (handler: any) => {
      process.stdin.on('data', data => {
        try {
          const messages = data
            .toString()
            .split('\n')
            .filter(line => line.trim());
          for (const line of messages) {
            const message = JSON.parse(line);
            handler(message);
          }
        } catch (error) {
          logger.error('Failed to parse incoming message', { error: error.message });
        }
      });
    },
  };
}

// Run main if called directly
if (require.main === module) {
  main();
}

export { GatewayConfig, config };
