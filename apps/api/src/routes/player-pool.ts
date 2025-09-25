import { Router, Request, Response } from 'express';
import { draftKingsProxy } from '../services/draftkings-proxy.js';

const router: Router = Router();

/**
 * GET /player-pool?slateId=dk_12345
 * Returns live DraftKings player pool for the specified slate
 * Validates against contracts/schemas/dk_salaries.json
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { slateId } = req.query;

    if (!slateId || typeof slateId !== 'string') {
      return res.status(400).json({
        error: 'slateId parameter required (format: dk_12345)',
      });
    }

    // Validate slate ID format
    if (!slateId.startsWith('dk_')) {
      return res.status(400).json({
        error: 'Invalid slateId format. Must start with dk_',
      });
    }

    console.log(`[API] Fetching player pool for slate: ${slateId}`);
    const playerPool = (await draftKingsProxy.getPlayerPool(slateId)) as any;

    // Add validation summary
    const validationSummary = {
      total_players: playerPool.players.length,
      positions: [...new Set(playerPool.players.map((p: any) => p.position))],
      teams: [...new Set(playerPool.players.map((p: any) => p.team_abbreviation))],
      salary_range: {
        min: Math.min(...playerPool.players.map((p: any) => p.salary)),
        max: Math.max(...playerPool.players.map((p: any) => p.salary)),
        avg: Math.round(
          playerPool.players.reduce((sum: number, p: any) => sum + p.salary, 0) /
            playerPool.players.length
        ),
      },
      active_players: playerPool.players.filter((p: any) => p.status === 'ACTIVE')
        .length,
      questionable_players: playerPool.players.filter(
        (p: any) => p.status === 'QUESTIONABLE'
      ).length,
      out_players: playerPool.players.filter((p: any) =>
        ['OUT', 'DOUBTFUL', 'IR'].includes(p.status)
      ).length,
    };

    const response = {
      ...playerPool,
      validation_summary: validationSummary,
    };

    console.log(`[API] Returning ${playerPool.players.length} players for ${slateId}`);
    res.json(response);
  } catch (error) {
    console.error('[API] Player pool endpoint error:', error);
    res.status(503).json({
      error: 'Failed to fetch live player pool data',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /player-pool/:slateId/summary
 * Get summary statistics for a player pool
 */
router.get('/:slateId/summary', async (req: Request, res: Response) => {
  try {
    const { slateId } = req.params;
    if (!slateId) {
      return res.status(400).json({ error: 'slateId parameter is required' });
    }
    const playerPool = (await draftKingsProxy.getPlayerPool(slateId)) as any;

    const summary = {
      slate_id: slateId,
      total_players: playerPool.players.length,
      salary_cap: playerPool.salary_cap,
      roster_positions: playerPool.roster_positions,
      positions: [...new Set(playerPool.players.map((p: any) => p.position))],
      teams: [...new Set(playerPool.players.map((p: any) => p.team_abbreviation))],
      salary_stats: {
        min: Math.min(...playerPool.players.map((p: any) => p.salary)),
        max: Math.max(...playerPool.players.map((p: any) => p.salary)),
        avg: Math.round(
          playerPool.players.reduce((sum: number, p: any) => sum + p.salary, 0) /
            playerPool.players.length
        ),
      },
      status_breakdown: {
        active: playerPool.players.filter((p: any) => p.status === 'ACTIVE').length,
        questionable: playerPool.players.filter((p: any) => p.status === 'QUESTIONABLE')
          .length,
        doubtful: playerPool.players.filter((p: any) => p.status === 'DOUBTFUL').length,
        out: playerPool.players.filter((p: any) => ['OUT', 'IR'].includes(p.status))
          .length,
      },
      generated_at: playerPool.generated_at,
    };

    res.json(summary);
  } catch (error) {
    console.error('[API] Player pool summary error:', error);
    res.status(503).json({
      error: 'Failed to fetch player pool summary',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
