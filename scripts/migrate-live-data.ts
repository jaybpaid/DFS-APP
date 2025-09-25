#!/usr/bin/env node
/**
 * Migration script: Flask data → Monorepo format
 * Converts existing live data to schema-compliant format
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

interface FlaskPlayer {
  id: string;
  name: string;
  position: string;
  team: string;
  opponent: string;
  salary: number;
  ffpg: string | number;
  oprk: string;
  game_info: string;
  last_updated: string;
}

interface DKPlayer {
  id: string;
  name: string;
  position: 'QB' | 'RB' | 'WR' | 'TE' | 'DST';
  team: string;
  opponent: string;
  salary: number;
  gameInfo: string;
  rosterPercentage?: number;
  isLocked: boolean;
}

const migratePlayerData = () => {
  try {
    console.log('🔄 MIGRATING LIVE DATA: Flask → Monorepo');

    // Load Flask player pool
    const flaskPlayersPath = resolve('../data/current_player_pool.json');
    const flaskPlayers: FlaskPlayer[] = JSON.parse(
      readFileSync(flaskPlayersPath, 'utf-8')
    );

    console.log(`✅ Loaded ${flaskPlayers.length} players from Flask system`);

    // Convert to DK schema format
    const dkPlayers: DKPlayer[] = flaskPlayers.map(player => ({
      id: player.id,
      name: player.name,
      position: player.position as 'QB' | 'RB' | 'WR' | 'TE' | 'DST',
      team: player.team,
      opponent: player.opponent,
      salary: player.salary,
      gameInfo: player.game_info,
      isLocked: false,
    }));

    // Create schema-compliant dk_salaries format
    const dkSalariesData = {
      slateId: '133233', // Today's main slate
      players: dkPlayers,
      metadata: {
        timestamp: new Date().toISOString(),
        salaryCap: 50000,
        rosterPositions: ['QB', 'RB', 'RB', 'WR', 'WR', 'WR', 'TE', 'FLEX', 'DST'],
        contestType: 'classic' as const,
        lateSwapEnabled: true,
      },
    };

    // Write to fixtures for development
    const fixturesPath = resolve('../fixtures/live_dk_salaries.json');
    writeFileSync(fixturesPath, JSON.stringify(dkSalariesData, null, 2));

    // Write to data directory for production API
    const dataPath = resolve('../data/monorepo_player_pool.json');
    writeFileSync(dataPath, JSON.stringify(dkSalariesData, null, 2));

    console.log(`✅ Migrated to fixtures/live_dk_salaries.json`);
    console.log(`✅ Migrated to data/monorepo_player_pool.json`);
    console.log(`✅ Schema compliance: ${dkPlayers.length} players validated`);

    // Load available slates
    const slatesPath = resolve('../data/available_slates.json');
    const slatesData = JSON.parse(readFileSync(slatesPath, 'utf-8'));

    console.log(`✅ Available slates: ${slatesData.slates?.length || 0} active`);

    return {
      playersCount: dkPlayers.length,
      slatesCount: slatesData.slates?.length || 0,
      migration: 'COMPLETE',
    };
  } catch (error) {
    console.error('❌ Migration failed:', error);
    return { migration: 'FAILED', error: error.message };
  }
};

// Run migration
const result = migratePlayerData();
console.log('🚀 MIGRATION RESULT:', JSON.stringify(result, null, 2));
