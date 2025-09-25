import { Router } from 'express';
import { draftKingsProxy } from '../services/draftkings-proxy.js';

const router: Router = Router();

/**
 * GET /slates?date=YYYY-MM-DD
 * Returns live DraftKings slates for the specified date
 * Validates against contracts/schemas/slates.json
 */
router.get('/', async (req, res) => {
  try {
    const { date } = req.query;

    if (!date || typeof date !== 'string') {
      return res.status(400).json({
        error: 'Date parameter required in format YYYY-MM-DD',
      });
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({
        error: 'Invalid date format. Use YYYY-MM-DD',
      });
    }

    console.log(`[API] Fetching slates for date: ${date}`);
    const slates = (await draftKingsProxy.getSlatesForDate(date)) as any[];

    // Transform to contract schema format
    const response = {
      date,
      slates: slates.map(slate => ({
        slate_id: slate.slate_id,
        name: slate.name,
        start_time: slate.start_time,
        sport: slate.sport,
        site: slate.site,
        draft_group_id: slate.draft_group_id,
        entry_fee: slate.entry_fee,
        total_payouts: slate.total_payouts,
      })),
      generated_at: new Date().toISOString(),
    };

    console.log(`[API] Returning ${response.slates.length} slates for ${date}`);
    res.json(response);
  } catch (error) {
    console.error('[API] Slates endpoint error:', error);
    res.status(503).json({
      error: 'Failed to fetch live slate data',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /slates/future
 * Returns all future DraftKings slates (comprehensive coverage)
 * No date filtering - shows all upcoming slates
 */
router.get('/future', async (req, res) => {
  try {
    console.log(`[API] Fetching all future slates comprehensively`);
    const futureSlates = (await draftKingsProxy.getAllFutureSlates()) as any[];

    // Transform to contract schema format
    const response = {
      source: 'draftkings_comprehensive_api',
      total_slates: futureSlates.length,
      last_updated: new Date().toISOString(),
      slates: futureSlates.map(slate => ({
        slate_id: slate.slate_id,
        name: slate.name,
        start_time: slate.start_time,
        sport: slate.sport,
        site: slate.site,
        draft_group_id: slate.draft_group_id,
        entry_fee: slate.entry_fee,
        total_payouts: slate.total_payouts,
        contest_count: slate.contest_count,
        max_entry_fee: slate.max_entry_fee,
        total_entries: slate.total_entries,
        game_type: slate.game_type,
      })),
      generated_at: new Date().toISOString(),
    };

    console.log(
      `[API] Returning ${response.slates.length} comprehensive future slates`
    );
    res.json(response);
  } catch (error) {
    console.error('[API] Future slates endpoint error:', error);
    res.status(503).json({
      error: 'Failed to fetch comprehensive future slate data',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /slates/:slateId/info
 * Get detailed information about a specific slate
 */
router.get('/:slateId/info', async (req, res) => {
  try {
    const { slateId } = req.params;
    const playerPool = (await draftKingsProxy.getPlayerPool(slateId)) as any;

    const slateInfo = {
      slate_id: playerPool.slate_id,
      name: playerPool.name,
      sport: playerPool.sport,
      site: playerPool.site,
      start_time: playerPool.start_time,
      salary_cap: playerPool.salary_cap,
      roster_positions: playerPool.roster_positions,
      player_count: playerPool.players.length,
      generated_at: playerPool.generated_at,
    };

    res.json(slateInfo);
  } catch (error) {
    console.error('[API] Slate info endpoint error:', error);
    res.status(503).json({
      error: 'Failed to fetch slate information',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /slates/refresh
 * Clear cache and force refresh of slate data
 */
router.post('/refresh', async (req, res) => {
  try {
    draftKingsProxy.clearCache();
    const cacheStats = draftKingsProxy.getCacheStats();

    res.json({
      message: 'Slate cache cleared successfully',
      cache_stats: cacheStats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API] Slate refresh error:', error);
    res.status(500).json({
      error: 'Failed to refresh slate cache',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
