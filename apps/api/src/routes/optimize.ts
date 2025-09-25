/**
 * /optimize endpoint - validates against optimizer_request.json/optimizer_response.json
 */

import { Router } from 'express';
import { z } from 'zod';
import { readFileSync } from 'fs';
import { resolve } from 'path';

export const optimizeRouter: Router = Router();

// Create Zod schemas from JSON schemas
const OptimizerRequestSchema = z.object({
  slateId: z.string().regex(/^[0-9]+$/),
  lineupCount: z.number().int().min(1).max(300).default(20),
  salaryCap: z.number().int().min(40000).max(60000).default(50000),
  contestType: z.enum(['gpp', 'cash', 'showdown', 'tiers']).default('gpp'),
  locks: z
    .array(
      z.object({
        playerId: z.string(),
        position: z.string().optional(),
      })
    )
    .optional(),
  exposureCaps: z.record(z.number().min(0).max(1)).optional(),
  stacks: z
    .object({
      qbStack: z.boolean().default(false),
      gameStack: z.boolean().default(false),
      teamStack: z
        .object({
          enabled: z.boolean(),
          minPlayers: z.number().int().min(2).max(4),
        })
        .optional(),
    })
    .optional(),
  randomness: z.number().min(0).max(1).default(0.1),
  uniques: z.number().int().min(1).max(9).default(1),
  lateSwapCutoff: z.string().datetime().optional(),
  maxSalary: z.boolean().default(false),
});

const OptimizerResponseSchema = z.object({
  success: z.boolean(),
  lineups: z.array(
    z.object({
      id: z.string(),
      players: z
        .array(
          z.object({
            playerId: z.string(),
            name: z.string(),
            position: z.enum(['QB', 'RB', 'WR', 'TE', 'FLEX', 'DST']),
            team: z.string().optional(),
            salary: z.number().int().min(0),
            projection: z.number().min(0),
            ownership: z.number().min(0).max(1).optional(),
            ceiling: z.number().min(0).optional(),
            floor: z.number().min(0).optional(),
          })
        )
        .min(9)
        .max(9),
      totalSalary: z.number().int().min(0),
      totalProjection: z.number().min(0),
      duplicateScore: z.number().min(0).max(1).optional(),
      stackInfo: z
        .object({
          qbStack: z.boolean().optional(),
          gameStack: z.boolean().optional(),
          teamStack: z.string().optional(),
        })
        .optional(),
    })
  ),
  metadata: z.object({
    timestamp: z.string().datetime(),
    slateId: z.string(),
    totalLineups: z.number().int().min(0),
    optimization: z
      .object({
        algorithm: z.string().optional(),
        executionTime: z.number().optional(),
        iterationCount: z.number().int().optional(),
        convergence: z.boolean().optional(),
      })
      .optional(),
    exposures: z
      .record(
        z.object({
          playerId: z.string(),
          name: z.string(),
          exposureRate: z.number().min(0).max(1),
          lineupCount: z.number().int().min(0),
        })
      )
      .optional(),
  }),
  error: z
    .object({
      code: z.string(),
      message: z.string(),
      details: z.object({}).optional(),
    })
    .optional(),
});

export type OptimizerRequest = z.infer<typeof OptimizerRequestSchema>;
export type OptimizerResponse = z.infer<typeof OptimizerResponseSchema>;

// POST /optimize - contracts pinned
optimizeRouter.post('/', async (req, res) => {
  try {
    // Validate request against optimizer_request.json schema
    const validatedRequest = OptimizerRequestSchema.parse(req.body);

    // Load live player data from migration
    const liveDataPath = resolve('../../../../data/monorepo_player_pool.json');
    const liveData = JSON.parse(readFileSync(liveDataPath, 'utf-8'));

    // STUB: Call buildModel/solve with real player data
    const availablePlayers = liveData.players.filter(
      (p: { salary: number }) => p.salary > 0
    );
    console.log(`🔄 Optimizing with ${availablePlayers.length} live players`);

    const mockLineups = [
      {
        id: 'lineup-1',
        players: [
          {
            playerId: '0',
            name: 'Derrick Henry',
            position: 'RB' as const,
            team: 'BAL',
            salary: 8200,
            projection: 17.8,
          },
          {
            playerId: '14',
            name: 'Josh Allen',
            position: 'QB' as const,
            team: 'BUF',
            salary: 7100,
            projection: 26.8,
          },
          {
            playerId: '2',
            name: "Ja'Marr Chase",
            position: 'WR' as const,
            team: 'CIN',
            salary: 8100,
            projection: 22.1,
          },
          {
            playerId: '152',
            name: 'Travis Kelce',
            position: 'TE' as const,
            team: 'KC',
            salary: 5000,
            projection: 11.4,
          },
          {
            playerId: '501',
            name: 'Ravens',
            position: 'DST' as const,
            team: 'BAL',
            salary: 3700,
            projection: 6.0,
          },
          {
            playerId: '4',
            name: 'Saquon Barkley',
            position: 'RB' as const,
            team: 'PHI',
            salary: 8000,
            projection: 17.9,
          },
          {
            playerId: '6',
            name: 'CeeDee Lamb',
            position: 'WR' as const,
            team: 'DAL',
            salary: 7800,
            projection: 22.1,
          },
          {
            playerId: '8',
            name: 'Puka Nacua',
            position: 'WR' as const,
            team: 'LAR',
            salary: 7600,
            projection: 26.9,
          },
          {
            playerId: '12',
            name: 'Jahmyr Gibbs',
            position: 'FLEX' as const,
            team: 'DET',
            salary: 7400,
            projection: 17.2,
          },
        ],
        totalSalary: 49800,
        totalProjection: 168.2,
      },
    ];

    const response: OptimizerResponse = {
      success: true,
      lineups: mockLineups,
      metadata: {
        timestamp: new Date().toISOString(),
        slateId: validatedRequest.slateId,
        totalLineups: mockLineups.length,
        optimization: {
          algorithm: 'STUB_OPTIMIZER',
          executionTime: 0.1,
          iterationCount: 1,
          convergence: true,
        },
      },
    };

    // Validate response against optimizer_response.json schema
    const validatedResponse = OptimizerResponseSchema.parse(response);

    res.json(validatedResponse);
  } catch (error) {
    console.error('Optimize endpoint error:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: error.errors,
        },
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'OPTIMIZATION_ERROR',
        message: 'Optimization failed',
        details: {},
      },
    });
  }
});
