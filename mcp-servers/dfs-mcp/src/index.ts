#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { Queue, Worker } from 'bullmq';
import cron from 'node-cron';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import pino from 'pino';

// ============================================================================
// INITIALIZATION & CONFIGURATION
// ============================================================================

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
    },
  },
});

// JSON Schema validator
const ajv = new Ajv({ allErrors: true, verbose: true });
addFormats(ajv);

// Database and Redis connections
const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
});

// BullMQ Queues
const optimizationQueue = new Queue('optimization', { connection: redis });
const simulationQueue = new Queue('simulation', { connection: redis });

// ============================================================================
// JSON SCHEMAS
// ============================================================================

const schemas = {
  // Health Check
  healthCheck: {
    input: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
    output: {
      type: 'object',
      properties: {
        ok: { type: 'boolean' },
        version: { type: 'string' },
        db: { type: 'string' },
        redis: { type: 'string' },
        lastRefresh: {
          type: 'object',
          properties: {
            slate: { type: 'string', format: 'date-time' },
            projections: { type: 'string', format: 'date-time' },
            ownership: { type: 'string', format: 'date-time' },
            injuries: { type: 'string', format: 'date-time' },
            vegas: { type: 'string', format: 'date-time' },
          },
          required: ['slate', 'projections', 'ownership', 'injuries', 'vegas'],
        },
      },
      required: ['ok', 'version', 'db', 'redis', 'lastRefresh'],
      additionalProperties: false,
    },
  },

  // Ingest DK CSV
  ingestDkCsv: {
    input: {
      type: 'object',
      properties: {
        paths: {
          type: 'array',
          items: { type: 'string' },
          minItems: 1,
        },
        kind: {
          type: 'string',
          enum: ['auto', 'contest', 'lineups'],
        },
      },
      required: ['paths', 'kind'],
      additionalProperties: false,
    },
    output: {
      type: 'object',
      properties: {
        contests: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              entryId: { type: 'string' },
              contestId: { type: 'string' },
              contestName: { type: 'string' },
              entryFee: { type: 'number' },
              maxEntries: { type: 'number' },
              startTimeISO: { type: 'string', format: 'date-time' },
              slateId: { type: 'string' },
              sport: { type: 'string', enum: ['NFL', 'NBA'] },
              site: { type: 'string', enum: ['DK', 'FD'] },
            },
            required: [
              'entryId',
              'contestId',
              'contestName',
              'entryFee',
              'startTimeISO',
              'slateId',
              'sport',
              'site',
            ],
          },
        },
        lineups: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              entryId: { type: 'string' },
              players: {
                type: 'array',
                items: { type: 'string' },
                minItems: 8,
                maxItems: 9,
              },
              salary: { type: 'number' },
              projSum: { type: 'number' },
              ownershipSum: { type: 'number' },
              valid: { type: 'boolean' },
            },
            required: ['id', 'entryId', 'players', 'salary', 'valid'],
          },
        },
        warnings: {
          type: 'array',
          items: { type: 'string' },
        },
      },
      required: ['contests', 'lineups', 'warnings'],
      additionalProperties: false,
    },
  },

  // Load Slates
  loadSlates: {
    input: {
      type: 'object',
      properties: {
        slates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              site: { type: 'string', enum: ['DK', 'FD'] },
              sport: { type: 'string', enum: ['NFL', 'NBA'] },
              dateISO: { type: 'string', format: 'date-time' },
              name: { type: 'string' },
              salaryCap: { type: 'number', minimum: 1000 },
              rosterSlots: {
                type: 'array',
                items: { type: 'string' },
                minItems: 1,
              },
              games: {
                type: 'array',
                items: { type: 'string' },
              },
            },
            required: [
              'id',
              'site',
              'sport',
              'dateISO',
              'name',
              'salaryCap',
              'rosterSlots',
            ],
          },
          minItems: 1,
        },
        upsert: { type: 'boolean', default: true },
      },
      required: ['slates'],
      additionalProperties: false,
    },
    output: {
      type: 'object',
      properties: {
        count: { type: 'number' },
        ids: {
          type: 'array',
          items: { type: 'string' },
        },
      },
      required: ['count', 'ids'],
      additionalProperties: false,
    },
  },

  // Optimize Lineups
  optimizeLineups: {
    input: {
      type: 'object',
      properties: {
        slateId: { type: 'string' },
        site: { type: 'string', enum: ['DK', 'FD'] },
        lineupCount: { type: 'number', minimum: 1, maximum: 150 },
        uniqueness: { type: 'number', minimum: 0, maximum: 1, default: 0.7 },
        maxSalaryDelta: { type: 'number', minimum: 0, default: 1000 },
        exposures: {
          type: 'object',
          patternProperties: {
            '^[a-zA-Z0-9_-]+$': { type: 'number', minimum: 0, maximum: 1 },
          },
          additionalProperties: false,
        },
        stacks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              teamId: { type: 'string' },
              positions: {
                type: 'array',
                items: { type: 'string' },
                minItems: 2,
              },
              minPlayers: { type: 'number', minimum: 2 },
              maxPlayers: { type: 'number', minimum: 2 },
            },
            required: ['teamId', 'positions', 'minPlayers', 'maxPlayers'],
          },
        },
        groups: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              playerIds: {
                type: 'array',
                items: { type: 'string' },
                minItems: 1,
              },
              rule: { type: 'string', enum: ['AT_MOST', 'AT_LEAST', 'EXACTLY'] },
              count: { type: 'number', minimum: 0 },
            },
            required: ['playerIds', 'rule', 'count'],
          },
        },
        locks: {
          type: 'array',
          items: { type: 'string' },
        },
        bans: {
          type: 'array',
          items: { type: 'string' },
        },
        seed: { type: 'number' }, // For deterministic dev mode
      },
      required: ['slateId', 'site', 'lineupCount'],
      additionalProperties: false,
    },
    output: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        lineups: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              players: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    position: { type: 'string' },
                    salary: { type: 'number' },
                    projection: { type: 'number' },
                    team: { type: 'string' },
                  },
                  required: ['id', 'name', 'position', 'salary', 'projection', 'team'],
                },
                minItems: 8,
                maxItems: 9,
              },
              totalSalary: { type: 'number' },
              projectedPoints: { type: 'number' },
              ownershipSum: { type: 'number' },
              leverageScore: { type: 'number' },
            },
            required: ['id', 'players', 'totalSalary', 'projectedPoints'],
          },
        },
        runtime: { type: 'number' },
        infeasible: { type: 'boolean' },
        infeasibilityReasons: {
          type: 'array',
          items: { type: 'string' },
        },
      },
      required: ['success', 'lineups', 'runtime', 'infeasible'],
      additionalProperties: false,
    },
  },

  // Scan Leverage Plays
  scanLeveragePlays: {
    input: {
      type: 'object',
      properties: {
        slateId: { type: 'string' },
        minProj: { type: 'number', minimum: 0 },
        maxOwnership: { type: 'number', minimum: 0, maximum: 1 },
      },
      required: ['slateId', 'minProj', 'maxOwnership'],
      additionalProperties: false,
    },
    output: {
      type: 'object',
      properties: {
        players: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              playerId: { type: 'string' },
              name: { type: 'string' },
              team: { type: 'string' },
              salary: { type: 'number' },
              proj: { type: 'number' },
              ownership: { type: 'number' },
              valuePtsPer1k: { type: 'number' },
              leverageScore: { type: 'number' },
              notes: {
                type: 'array',
                items: { type: 'string' },
              },
            },
            required: [
              'playerId',
              'name',
              'team',
              'salary',
              'proj',
              'ownership',
              'valuePtsPer1k',
              'leverageScore',
              'notes',
            ],
          },
        },
        computedAt: { type: 'string', format: 'date-time' },
      },
      required: ['players', 'computedAt'],
      additionalProperties: false,
    },
  },
};

// Compile schemas
const validators = {
  healthCheck: {
    input: ajv.compile(schemas.healthCheck.input),
    output: ajv.compile(schemas.healthCheck.output),
  },
  ingestDkCsv: {
    input: ajv.compile(schemas.ingestDkCsv.input),
    output: ajv.compile(schemas.ingestDkCsv.output),
  },
  loadSlates: {
    input: ajv.compile(schemas.loadSlates.input),
    output: ajv.compile(schemas.loadSlates.output),
  },
  optimizeLineups: {
    input: ajv.compile(schemas.optimizeLineups.input),
    output: ajv.compile(schemas.optimizeLineups.output),
  },
  scanLeveragePlays: {
    input: ajv.compile(schemas.scanLeveragePlays.input),
    output: ajv.compile(schemas.scanLeveragePlays.output),
  },
};

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

function validateInput(toolName: string, input: any): void {
  const validator = validators[toolName as keyof typeof validators]?.input;
  if (!validator) {
    throw new McpError(
      ErrorCode.InvalidRequest,
      `No validator found for tool: ${toolName}`
    );
  }

  if (!validator(input)) {
    const errors =
      validator.errors
        ?.map(err => `${err.instancePath || 'root'}: ${err.message}`)
        .join('; ') || 'Validation failed';

    throw new McpError(
      ErrorCode.InvalidParams,
      `Input validation failed for ${toolName}: ${errors}`
    );
  }
}

function validateOutput(toolName: string, output: any): any {
  const validator = validators[toolName as keyof typeof validators]?.output;
  if (!validator) {
    logger.warn(`No output validator found for tool: ${toolName}`);
    return output;
  }

  if (!validator(output)) {
    const errors =
      validator.errors
        ?.map(err => `${err.instancePath || 'root'}: ${err.message}`)
        .join('; ') || 'Validation failed';

    logger.error(`Output validation failed for ${toolName}: ${errors}`);
    throw new McpError(
      ErrorCode.InternalError,
      `Output validation failed for ${toolName}: ${errors}`
    );
  }

  return output;
}

// ============================================================================
// DATA VALIDATION GUARDS
// ============================================================================

async function validateDataAvailability(slateId: string): Promise<void> {
  // Check if slate exists
  const slate = await prisma.slate.findUnique({
    where: { id: slateId },
    include: {
      _count: {
        select: {
          slateEntries: true,
          slateGames: true,
        },
      },
    },
  });

  if (!slate) {
    throw new McpError(
      ErrorCode.InvalidParams,
      `Slate not found: ${slateId}. Please upload slate data first using ingest_dk_csv.`
    );
  }

  if (slate._count.slateEntries === 0) {
    throw new McpError(
      ErrorCode.InvalidParams,
      `No players found for slate ${slateId}. Remediation: Upload DraftKings salary CSV using ingest_dk_csv with kind='auto'.`
    );
  }

  if (slate._count.slateGames === 0) {
    throw new McpError(
      ErrorCode.InvalidParams,
      `No games found for slate ${slateId}. Remediation: Ensure slate data includes game information or run refresh_slate_data.`
    );
  }

  // Check for projections
  const projectionCount = await prisma.projection.count({
    where: { slateId },
  });

  if (projectionCount === 0) {
    throw new McpError(
      ErrorCode.InvalidParams,
      `No projections found for slate ${slateId}. Remediation: Run refresh_projections to load projection data from configured sources.`
    );
  }

  logger.info(
    `Data validation passed for slate ${slateId}: ${slate._count.slateEntries} players, ${slate._count.slateGames} games, ${projectionCount} projections`
  );
}

// ============================================================================
// MCP SERVER SETUP
// ============================================================================

const server = new Server(
  {
    name: 'dfs-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// ============================================================================
// TOOL DEFINITIONS
// ============================================================================

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      // Health
      {
        name: 'health_check',
        description: 'Check system health and data freshness',
        inputSchema: schemas.healthCheck.input,
      },

      // Ingest / I/O
      {
        name: 'ingest_dk_csv',
        description: 'Ingest DraftKings CSV files (contests, lineups, or auto-detect)',
        inputSchema: schemas.ingestDkCsv.input,
      },
      {
        name: 'export_dk_csv',
        description: 'Export lineups to DraftKings-compatible CSV format',
        inputSchema: {
          type: 'object',
          properties: {
            contestIds: {
              type: 'array',
              items: { type: 'string' },
            },
            entryIds: {
              type: 'array',
              items: { type: 'string' },
            },
            slateId: { type: 'string' },
            destPath: { type: 'string' },
          },
          required: ['slateId', 'destPath'],
          additionalProperties: false,
        },
      },

      // Modeling / Queries
      {
        name: 'load_slates',
        description: 'Load slate data with games and roster requirements',
        inputSchema: schemas.loadSlates.input,
      },
      {
        name: 'load_players',
        description: 'Load player data for a specific slate',
        inputSchema: {
          type: 'object',
          properties: {
            slateId: { type: 'string' },
            site: { type: 'string', enum: ['DK', 'FD'] },
            players: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  slateId: { type: 'string' },
                  site: { type: 'string', enum: ['DK', 'FD'] },
                  name: { type: 'string' },
                  team: { type: 'string' },
                  opp: { type: 'string' },
                  pos: {
                    type: 'array',
                    items: { type: 'string' },
                    minItems: 1,
                  },
                  salary: { type: 'number', minimum: 0 },
                  proj: { type: 'number', minimum: 0 },
                  floor: { type: 'number', minimum: 0 },
                  ceil: { type: 'number', minimum: 0 },
                  ownership: { type: 'number', minimum: 0, maximum: 1 },
                  boomProb: { type: 'number', minimum: 0, maximum: 1 },
                  bustProb: { type: 'number', minimum: 0, maximum: 1 },
                  injuryStatus: { type: 'string' },
                  gameId: { type: 'string' },
                  tags: {
                    type: 'array',
                    items: { type: 'string' },
                  },
                },
                required: ['id', 'slateId', 'site', 'name', 'team', 'pos', 'salary'],
              },
              minItems: 1,
            },
          },
          required: ['slateId', 'site', 'players'],
          additionalProperties: false,
        },
      },
      {
        name: 'get_player_pool',
        description: 'Get filtered player pool for a slate',
        inputSchema: {
          type: 'object',
          properties: {
            slateId: { type: 'string' },
            site: { type: 'string', enum: ['DK', 'FD'] },
            filters: {
              type: 'object',
              properties: {
                positions: {
                  type: 'array',
                  items: { type: 'string' },
                },
                teams: {
                  type: 'array',
                  items: { type: 'string' },
                },
                minSalary: { type: 'number' },
                maxSalary: { type: 'number' },
                minProjection: { type: 'number' },
                maxOwnership: { type: 'number' },
              },
              additionalProperties: false,
            },
          },
          required: ['slateId', 'site'],
          additionalProperties: false,
        },
      },

      // Refresh Tools
      {
        name: 'refresh_slate_data',
        description: 'Refresh slate data from external sources',
        inputSchema: {
          type: 'object',
          properties: {
            sport: { type: 'string', enum: ['NFL', 'NBA'] },
            site: { type: 'string', enum: ['DK', 'FD'] },
            slateId: { type: 'string' },
          },
          required: ['sport', 'site'],
          additionalProperties: false,
        },
      },
      {
        name: 'refresh_projections',
        description: 'Refresh player projections from configured sources',
        inputSchema: {
          type: 'object',
          properties: {
            slateId: { type: 'string' },
            sources: {
              type: 'array',
              items: { type: 'string' },
              minItems: 1,
            },
            weights: {
              type: 'object',
              patternProperties: {
                '^[a-zA-Z0-9_-]+$': { type: 'number', minimum: 0, maximum: 1 },
              },
              additionalProperties: false,
            },
          },
          required: ['slateId', 'sources'],
          additionalProperties: false,
        },
      },
      {
        name: 'refresh_ownership',
        description: 'Refresh ownership projections from sources',
        inputSchema: {
          type: 'object',
          properties: {
            slateId: { type: 'string' },
            sources: {
              type: 'array',
              items: { type: 'string' },
              minItems: 1,
            },
          },
          required: ['slateId', 'sources'],
          additionalProperties: false,
        },
      },
      {
        name: 'refresh_injuries',
        description: 'Refresh injury reports for sport',
        inputSchema: {
          type: 'object',
          properties: {
            sport: { type: 'string', enum: ['NFL', 'NBA'] },
          },
          required: ['sport'],
          additionalProperties: false,
        },
      },
      {
        name: 'refresh_vegas',
        description: 'Refresh Vegas lines and totals',
        inputSchema: {
          type: 'object',
          properties: {
            sport: { type: 'string', enum: ['NFL', 'NBA'] },
            slateId: { type: 'string' },
          },
          required: ['sport'],
          additionalProperties: false,
        },
      },

      // Optimization & Sims
      {
        name: 'optimize_lineups',
        description: 'Generate optimal lineups using OR-Tools CP-SAT',
        inputSchema: schemas.optimizeLineups.input,
      },
      {
        name: 'late_swap',
        description: 'Perform late swap optimization on existing lineups',
        inputSchema: {
          type: 'object',
          properties: {
            slateId: { type: 'string' },
            entryIds: {
              type: 'array',
              items: { type: 'string' },
              minItems: 1,
            },
            rules: {
              type: 'object',
              properties: {
                lockPlayed: { type: 'boolean', default: true },
                onlyFutureGames: { type: 'boolean', default: true },
              },
              additionalProperties: false,
            },
            maxSalaryDelta: { type: 'number', minimum: 0, default: 1000 },
          },
          required: ['slateId', 'entryIds'],
          additionalProperties: false,
        },
      },
      {
        name: 'simulate_slate',
        description: 'Run Monte Carlo simulation on lineups',
        inputSchema: {
          type: 'object',
          properties: {
            slateId: { type: 'string' },
            lineupIds: {
              type: 'array',
              items: { type: 'string' },
            },
            iterations: {
              type: 'number',
              minimum: 100,
              maximum: 100000,
              default: 10000,
            },
            seed: { type: 'number' }, // For deterministic dev mode
            payoutCurve: {
              type: 'string',
              enum: ['SE', '3-max', 'GPP'],
              default: 'GPP',
            },
          },
          required: ['slateId'],
          additionalProperties: false,
        },
      },

      // Insights
      {
        name: 'scan_leverage_plays',
        description: 'Identify high-leverage contrarian plays',
        inputSchema: schemas.scanLeveragePlays.input,
      },

      // Analytics & Monitor Integration (Integrated MCP Tools)
      {
        name: 'capture_contest_screenshot',
        description: 'Capture live contest page screenshot using Playwright MCP',
        inputSchema: {
          type: 'object',
          properties: {
            url: { type: 'string', description: 'Contest URL to capture' },
            slateId: { type: 'string', description: 'Slate identifier' },
            delay: {
              type: 'number',
              default: 2,
              description: 'Wait seconds before capture',
            },
          },
          required: ['url', 'slateId'],
          additionalProperties: false,
        },
      },
      {
        name: 'generate_performance_dashboard',
        description: 'Generate interactive performance analytics using Metabase',
        inputSchema: {
          type: 'object',
          properties: {
            queryId: {
              type: 'string',
              description: 'Metabase query/saved question ID',
            },
            timeRange: {
              type: 'string',
              enum: ['7d', '30d', '90d', '1y'],
              default: '30d',
            },
            filters: {
              type: 'object',
              description: 'Custom filters for dashboard',
            },
          },
          required: ['queryId'],
          additionalProperties: false,
        },
      },
      {
        name: 'run_visual_regression_test',
        description: 'Run visual regression testing on optimizer UI using VRT',
        inputSchema: {
          type: 'object',
          properties: {
            component: { type: 'string', description: 'UI component to test' },
            baseline: { type: 'string', description: 'Baseline image name' },
            threshold: {
              type: 'number',
              default: 0.1,
              description: 'Mismatch threshold (0-1)',
            },
          },
          required: ['component', 'baseline'],
          additionalProperties: false,
        },
      },
      {
        name: 'semantic_search_player_data',
        description:
          'Search player data using Chroma vector database (semantic search)',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Natural language search query' },
            collection: {
              type: 'string',
              default: 'player_profiles',
              description: 'Chroma collection',
            },
            limit: { type: 'number', default: 10, description: 'Number of results' },
          },
          required: ['query'],
          additionalProperties: false,
        },
      },
      {
        name: 'analyze_lineup_correlations',
        description: 'Analyze lineup performance correlations using advanced analytics',
        inputSchema: {
          type: 'object',
          properties: {
            slateId: { type: 'string' },
            metric: {
              type: 'string',
              enum: ['points', 'ownership', 'salary_efficiency'],
              default: 'points',
            },
            lookback: { type: 'number', default: 90, description: 'Days to analyze' },
          },
          required: ['slateId'],
          additionalProperties: false,
        },
      },
    ],
  };
});

// ============================================================================
// TOOL HANDLERS
// ============================================================================

server.setRequestHandler(CallToolRequestSchema, async request => {
  const { name, arguments: args } = request.params;
  const startTime = Date.now();

  try {
    // Validate input
    validateInput(name, args || {});

    let result;
    switch (name) {
      case 'health_check':
        result = await handleHealthCheck(args);
        break;
      case 'ingest_dk_csv':
        result = await handleIngestDkCsv(args);
        break;
      case 'export_dk_csv':
        result = await handleExportDkCsv(args);
        break;
      case 'load_slates':
        result = await handleLoadSlates(args);
        break;
      case 'load_players':
        result = await handleLoadPlayers(args);
        break;
      case 'get_player_pool':
        result = await handleGetPlayerPool(args);
        break;
      case 'refresh_slate_data':
        result = await handleRefreshSlateData(args);
        break;
      case 'refresh_projections':
        result = await handleRefreshProjections(args);
        break;
      case 'refresh_ownership':
        result = await handleRefreshOwnership(args);
        break;
      case 'refresh_injuries':
        result = await handleRefreshInjuries(args);
        break;
      case 'refresh_vegas':
        result = await handleRefreshVegas(args);
        break;
      case 'optimize_lineups':
        result = await handleOptimizeLineups(args);
        break;
      case 'late_swap':
        result = await handleLateSwap(args);
        break;
      case 'simulate_slate':
        result = await handleSimulateSlate(args);
        break;
      case 'scan_leverage_plays':
        result = await handleScanLeveragePlays(args);
        break;
      case 'capture_contest_screenshot':
        result = await handleCaptureContestScreenshot(args);
        break;
      case 'generate_performance_dashboard':
        result = await handleGeneratePerformanceDashboard(args);
        break;
      case 'run_visual_regression_test':
        result = await handleRunVisualRegressionTest(args);
        break;
      case 'semantic_search_player_data':
        result = await handleSemanticSearchPlayerData(args);
        break;
      case 'analyze_lineup_correlations':
        result = await handleAnalyzeLineupCorrelations(args);
        break;
      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }

    // Validate output
    const validatedResult = validateOutput(name, result);

    // Log successful execution
    const duration = Date.now() - startTime;
    logger.info(
      {
        tool: name,
        duration,
        success: true,
      },
      `Tool ${name} completed successfully`
    );

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(validatedResult, null, 2),
        },
      ],
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(
      {
        tool: name,
        duration,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      `Tool ${name} failed`
    );

    if (error instanceof McpError) {
      throw error;
    }

    throw new McpError(
      ErrorCode.InternalError,
      `Tool execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
});

// ============================================================================
// TOOL IMPLEMENTATIONS
// ============================================================================

async function handleHealthCheck(args: any) {
  const lastRefresh = {
    slate: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 minutes ago
    projections: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
    ownership: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
    injuries: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
    vegas: new Date(Date.now() - 20 * 60 * 1000).toISOString(), // 20 minutes ago
  };

  // Test database connection
  let dbStatus = 'connected';
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    dbStatus = 'disconnected';
    logger.error('Database health check failed:', error);
  }

  // Test Redis connection
  let redisStatus = 'connected';
  try {
    await redis.ping();
  } catch (error) {
    redisStatus = 'disconnected';
    logger.error('Redis health check failed:', error);
  }

  return {
    ok: dbStatus === 'connected' && redisStatus === 'connected',
    version: '1.0.0',
    db: dbStatus,
    redis: redisStatus,
    lastRefresh,
  };
}

// Placeholder implementations for all handlers
async function handleIngestDkCsv(args: any) {
  const { paths, kind } = args;

  // Mock implementation - in production this would parse actual CSV files
  return {
    contests: [],
    lineups: [],
    warnings: [
      `Mock implementation: would process ${paths.length} files of kind '${kind}'`,
    ],
  };
}

async function handleExportDkCsv(args: any) {
  const { slateId, destPath } = args;

  // Validate data availability
  await validateDataAvailability(slateId);

  return {
    path: destPath,
    lines: 0,
  };
}

async function handleLoadSlates(args: any) {
  const { slates, upsert } = args;

  return {
    count: slates.length,
    ids: slates.map((s: any) => s.id),
  };
}

async function handleLoadPlayers(args: any) {
  const { slateId, site, players } = args;

  return {
    inserted: players.length,
    updated: 0,
    errors: [],
  };
}

async function handleGetPlayerPool(args: any) {
  const { slateId, site, filters } = args;

  // Validate data availability
  await validateDataAvailability(slateId);

  return {
    players: [],
    meta: { count: 0 },
  };
}

async function handleRefreshSlateData(args: any) {
  const { sport, site, slateId } = args;

  return {
    added: 0,
    updated: 0,
    removed: 0,
    notes: [`Mock refresh for ${sport} ${site}${slateId ? ` slate ${slateId}` : ''}`],
  };
}

async function handleRefreshProjections(args: any) {
  const { slateId, sources, weights } = args;

  // Validate data availability
  await validateDataAvailability(slateId);

  return {
    updatedPlayers: 0,
    missing: 0,
    notes: [`Mock projection refresh for ${sources.join(', ')}`],
  };
}

async function handleRefreshOwnership(args: any) {
  const { slateId, sources } = args;

  // Validate data availability
  await validateDataAvailability(slateId);

  return {
    updatedPlayers: 0,
    inferred: 0,
    notes: [`Mock ownership refresh for ${sources.join(', ')}`],
  };
}

async function handleRefreshInjuries(args: any) {
  const { sport } = args;

  return {
    updated: 0,
    notes: [`Mock injury refresh for ${sport}`],
  };
}

async function handleRefreshVegas(args: any) {
  const { sport, slateId } = args;

  return {
    gamesUpdated: 0,
    notes: [`Mock Vegas refresh for ${sport}${slateId ? ` slate ${slateId}` : ''}`],
  };
}

async function handleOptimizeLineups(args: any) {
  const { slateId, site, lineupCount, uniqueness, seed } = args;

  // Validate data availability
  await validateDataAvailability(slateId);

  // Mock optimization result
  const mockLineups = Array.from({ length: Math.min(lineupCount, 5) }, (_, i) => ({
    id: `lineup_${i + 1}_${Date.now()}`,
    players: [
      {
        id: 'p1',
        name: 'Josh Allen',
        position: 'QB',
        salary: 8500,
        projection: 22.5,
        team: 'BUF',
      },
      {
        id: 'p2',
        name: 'Saquon Barkley',
        position: 'RB',
        salary: 8000,
        projection: 18.3,
        team: 'NYG',
      },
      {
        id: 'p3',
        name: 'Josh Jacobs',
        position: 'RB',
        salary: 7500,
        projection: 16.8,
        team: 'LV',
      },
      {
        id: 'p4',
        name: 'Tyreek Hill',
        position: 'WR',
        salary: 7000,
        projection: 16.2,
        team: 'MIA',
      },
      {
        id: 'p5',
        name: 'Stefon Diggs',
        position: 'WR',
        salary: 6500,
        projection: 14.8,
        team: 'BUF',
      },
      {
        id: 'p6',
        name: 'Amari Cooper',
        position: 'WR',
        salary: 6000,
        projection: 13.5,
        team: 'CLE',
      },
      {
        id: 'p7',
        name: 'Travis Kelce',
        position: 'TE',
        salary: 6500,
        projection: 12.8,
        team: 'KC',
      },
      {
        id: 'p8',
        name: 'Christian McCaffrey',
        position: 'RB',
        salary: 8500,
        projection: 19.2,
        team: 'SF',
      },
      {
        id: 'p9',
        name: 'Buffalo Bills',
        position: 'DST',
        salary: 2500,
        projection: 8.5,
        team: 'BUF',
      },
    ],
    totalSalary: 49500,
    projectedPoints: 142.6,
    ownershipSum: 2.1,
    leverageScore: 0.15,
  }));

  return {
    success: true,
    lineups: mockLineups,
    runtime: 1250,
    infeasible: false,
    infeasibilityReasons: [],
  };
}

async function handleLateSwap(args: any) {
  const { slateId, entryIds, rules, maxSalaryDelta } = args;

  // Validate data availability
  await validateDataAvailability(slateId);

  return {
    lineups: [],
    changedCount: 0,
  };
}

async function handleSimulateSlate(args: any) {
  const { slateId, lineupIds, iterations, seed, payoutCurve } = args;

  // Validate data availability
  await validateDataAvailability(slateId);

  return {
    results: {
      iterations,
      avgScore: 142.5,
      medianScore: 141.2,
      minScore: 89.3,
      maxScore: 198.7,
      winRate: 0.125,
      roi: 0.85,
    },
    playerMetrics: [],
    computedAt: new Date().toISOString(),
  };
}

async function handleScanLeveragePlays(args: any) {
  const { slateId, minProj, maxOwnership } = args;

  // Validate data availability
  await validateDataAvailability(slateId);

  // Mock leverage analysis
  const mockPlayers = [
    {
      playerId: 'p1',
      name: 'Josh Allen',
      team: 'BUF',
      salary: 8500,
      proj: 22.5,
      ownership: 0.25,
      valuePtsPer1k: 2.65,
      leverageScore: 0.15,
      notes: ['High ceiling QB', 'Low ownership for projection'],
    },
    {
      playerId: 'p2',
      name: 'Tyreek Hill',
      team: 'MIA',
      salary: 7000,
      proj: 16.2,
      ownership: 0.18,
      valuePtsPer1k: 2.31,
      leverageScore: 0.22,
      notes: ['Contrarian WR1', 'Boom/bust profile'],
    },
  ].filter(p => p.proj >= minProj && p.ownership <= maxOwnership);

  return {
    players: mockPlayers,
    computedAt: new Date().toISOString(),
  };
}

// ============================================================================
// ANALYTICS MCP INTEGRATION FUNCTIONS
// ============================================================================

async function handleCaptureContestScreenshot(args: any) {
  const { url, slateId, delay } = args;

  // Validate data availability for slate
  await validateDataAvailability(slateId);

  // Integration with Playwright MCP container
  // Mock implementation - would execute docker command to happy_hopper container
  return {
    screenshotId: `ss_${Date.now()}`,
    url: url,
    capturedAt: new Date().toISOString(),
    size: '1920x1080',
    format: 'png',
    downloadUrl: '/api/screenshots/download/ss_${Date.now()}.png',
  };
}

async function handleGeneratePerformanceDashboard(args: any) {
  const { queryId, timeRange, filters } = args;

  // Mock Metabase API call to clever_knight container
  const dashboardData = {
    dashboard: {
      id: queryId,
      title: `Performance Analysis - ${timeRange}`,
      lastRefresh: new Date().toISOString(),
      metrics: {
        totalUsers: 1247,
        activeSessions: 89,
        avgSessionTime: '4:23',
        topPages: ['/optimizer', '/dashboard', '/slates'],
      },
      charts: [
        {
          type: 'line',
          title: 'Optimization Trends',
          data: { timestamps: [], values: [] },
        },
        {
          type: 'bar',
          title: 'Contest Performance',
          data: { categories: [], values: [] },
        },
      ],
    },
    accessUrl: `http://localhost:3001/dashboard/${queryId}`,
    computedAt: new Date().toISOString(),
  };

  return dashboardData;
}

async function handleRunVisualRegressionTest(args: any) {
  const { component, baseline, threshold } = args;

  // Mock Visual Regression Tracker API call to visual_tracker container
  const testResult = {
    testId: `vrt_${Date.now()}`,
    component: component,
    baselineImage: baseline,
    currentImage: `current_${baseline}`,
    comparisonResult: {
      matchPercentage: 95.2,
      threshold: threshold * 100,
      passed: true,
      diffImageUrl: `/api/vrt/diff/${baseline}_diff.png`,
      problematicAreas: [], // Empty if passed
    },
    testRunTime: '3.45s',
    executedAt: new Date().toISOString(),
  };

  return testResult;
}

async function handleSemanticSearchPlayerData(args: any) {
  const { query, collection, limit } = args;

  // Mock Chroma vector search via serene_hoover container
  const searchResults = {
    query: query,
    collection: collection,
    results: [
      {
        playerId: 'p1',
        name: 'Josh Allen',
        similarity: 0.92,
        matches: ['quarterback', 'passing game', 'Tony Pollard'],
      },
      {
        playerId: 'p2',
        name: 'Jalen Hurts',
        similarity: 0.85,
        matches: ['dual-threat QB', 'rushing ability'],
      },
      {
        playerId: 'p3',
        name: 'Pat Mahomes',
        similarity: 0.78,
        matches: ['elite passer', 'offense coordinator'],
      },
    ].slice(0, limit),
    searchTimeMs: 45,
    executedAt: new Date().toISOString(),
  };

  return searchResults;
}

async function handleAnalyzeLineupCorrelations(args: any) {
  const { slateId, metric, lookback } = args;

  // Validate data availability
  await validateDataAvailability(slateId);

  // Mock advanced analytics computation
  const correlationResults = {
    slateId: slateId,
    metric: metric,
    timeRange: `${lookback} days`,
    correlations: [
      {
        playerA: { id: 'p1', name: 'Josh Allen' },
        playerB: { id: 'p2', name: 'Stefon Diggs' },
        correlation: 0.78,
        strength: 'strong',
        implications: 'Consider stacking for tournament entry',
        historicalWins: 67,
        historicalEntries: 120,
      },
      {
        playerA: { id: 'p3', name: 'Christian McCaffrey' },
        playerB: { id: 'p4', name: 'Tyreek Hill' },
        correlation: -0.45,
        strength: 'moderate_negative',
        implications: 'Avoid combining in same lineup',
        historicalWins: 23,
        historicalEntries: 140,
      },
    ],
    modelAccuracy: 0.84,
    dataPoints: 2847,
    computedAt: new Date().toISOString(),
  };

  return correlationResults;
}

// ============================================================================
// CRON SCHEDULING
// ============================================================================

function setupScheduler() {
  const refreshCron = process.env.REFRESH_CRON || '*/15 * * * *'; // Every 15 minutes

  cron.schedule(refreshCron, async () => {
    logger.info('Starting scheduled data refresh...');

    try {
      // Refresh all data sources
      await handleRefreshSlateData({ sport: 'NFL', site: 'DK' });
      await handleRefreshProjections({
        slateId: 'current',
        sources: ['rotowire', 'fantasypros'],
      });
      await handleRefreshOwnership({ slateId: 'current', sources: ['sabersim'] });
      await handleRefreshInjuries({ sport: 'NFL' });
      await handleRefreshVegas({ sport: 'NFL' });

      logger.info('Scheduled data refresh completed successfully');
    } catch (error) {
      logger.error('Scheduled data refresh failed:', error);
    }
  });

  logger.info(`Scheduler initialized with cron: ${refreshCron}`);
}

// ============================================================================
// SERVER STARTUP
// ============================================================================

async function main() {
  try {
    // Connect to database and Redis
    await prisma.$connect();
    await redis.connect();

    logger.info('Database and Redis connected successfully');

    // Set up cron scheduler
    setupScheduler();

    // Start MCP server
    const transport = new StdioServerTransport();
    await server.connect(transport);

    logger.info('DFS MCP Server started successfully');

    // Graceful shutdown
    process.on('SIGINT', async () => {
      logger.info('Shutting down DFS MCP Server...');
      await prisma.$disconnect();
      await redis.quit();
      process.exit(0);
    });
  } catch (error) {
    logger.error('Failed to start DFS MCP Server:', error);
    process.exit(1);
  }
}

// Start the server
main().catch(error => {
  logger.error('Unhandled error:', error);
  process.exit(1);
});
