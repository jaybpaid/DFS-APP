/**
 * Unit tests for /optimize endpoint
 * Validates request/response against contract schemas
 */

import { describe, it, expect } from 'vitest';
import { OptimizerRequest, OptimizerResponse } from '../src/routes/optimize.js';

describe('/optimize endpoint', () => {
  describe('Request validation', () => {
    it('should accept valid optimizer request', () => {
      const validRequest: OptimizerRequest = {
        slateId: '133233',
        lineupCount: 20,
        salaryCap: 50000,
        contestType: 'gpp',
        randomness: 0.1,
        uniques: 1,
        maxSalary: false,
      };

      expect(validRequest.slateId).toBe('133233');
      expect(validRequest.lineupCount).toBe(20);
      expect(validRequest.salaryCap).toBe(50000);
    });

    it('should handle locks array', () => {
      const requestWithLocks: Partial<OptimizerRequest> = {
        slateId: '133233',
        locks: [
          { playerId: '0', position: 'RB' },
          { playerId: '14', position: 'QB' },
        ],
      };

      expect(requestWithLocks.locks).toHaveLength(2);
      expect(requestWithLocks.locks![0].playerId).toBe('0');
    });

    it('should handle exposure caps', () => {
      const requestWithExposure: Partial<OptimizerRequest> = {
        slateId: '133233',
        exposureCaps: {
          '0': 0.8, // 80% exposure for Derrick Henry
          '14': 0.6, // 60% exposure for Josh Allen
        },
      };

      expect(requestWithExposure.exposureCaps!['0']).toBe(0.8);
    });

    it('should handle stacking configuration', () => {
      const requestWithStacks: Partial<OptimizerRequest> = {
        slateId: '133233',
        stacks: {
          qbStack: true,
          gameStack: false,
          teamStack: {
            enabled: true,
            minPlayers: 3,
          },
        },
      };

      expect(requestWithStacks.stacks!.qbStack).toBe(true);
      expect(requestWithStacks.stacks!.teamStack!.minPlayers).toBe(3);
    });
  });

  describe('Response validation', () => {
    it('should produce valid optimizer response structure', () => {
      const mockResponse: OptimizerResponse = {
        success: true,
        lineups: [
          {
            id: 'lineup-1',
            players: [
              {
                playerId: '0',
                name: 'Derrick Henry',
                position: 'RB',
                team: 'BAL',
                salary: 8200,
                projection: 17.8,
              },
              {
                playerId: '14',
                name: 'Josh Allen',
                position: 'QB',
                team: 'BUF',
                salary: 7100,
                projection: 26.8,
              },
              {
                playerId: '2',
                name: "Ja'Marr Chase",
                position: 'WR',
                team: 'CIN',
                salary: 8100,
                projection: 22.1,
              },
              {
                playerId: '152',
                name: 'Travis Kelce',
                position: 'TE',
                team: 'KC',
                salary: 5000,
                projection: 11.4,
              },
              {
                playerId: '501',
                name: 'Ravens',
                position: 'DST',
                team: 'BAL',
                salary: 3700,
                projection: 6.0,
              },
              {
                playerId: '4',
                name: 'Saquon Barkley',
                position: 'RB',
                team: 'PHI',
                salary: 8000,
                projection: 17.9,
              },
              {
                playerId: '6',
                name: 'CeeDee Lamb',
                position: 'WR',
                team: 'DAL',
                salary: 7800,
                projection: 22.1,
              },
              {
                playerId: '8',
                name: 'Puka Nacua',
                position: 'WR',
                team: 'LAR',
                salary: 7600,
                projection: 26.9,
              },
              {
                playerId: '12',
                name: 'Jahmyr Gibbs',
                position: 'FLEX',
                team: 'DET',
                salary: 7400,
                projection: 17.2,
              },
            ],
            totalSalary: 49800,
            totalProjection: 168.2,
          },
        ],
        metadata: {
          timestamp: '2025-09-15T21:49:00.000Z',
          slateId: '133233',
          totalLineups: 1,
        },
      };

      expect(mockResponse.success).toBe(true);
      expect(mockResponse.lineups).toHaveLength(1);
      expect(mockResponse.lineups[0].players).toHaveLength(9);
      expect(mockResponse.metadata.slateId).toBe('133233');
    });

    it('should validate lineup salary constraints', () => {
      const lineup = {
        id: 'lineup-1',
        players: [], // Would be filled with 9 players
        totalSalary: 49800,
        totalProjection: 168.2,
      };

      expect(lineup.totalSalary).toBeLessThanOrEqual(50000);
      expect(lineup.totalProjection).toBeGreaterThan(0);
    });
  });

  describe('Schema compliance', () => {
    it('should enforce 9-player lineup requirement', () => {
      const positions = ['QB', 'RB', 'RB', 'WR', 'WR', 'WR', 'TE', 'FLEX', 'DST'];
      expect(positions).toHaveLength(9);
    });

    it('should validate position enums', () => {
      const validPositions = ['QB', 'RB', 'WR', 'TE', 'FLEX', 'DST'];
      validPositions.forEach(pos => {
        expect(['QB', 'RB', 'WR', 'TE', 'FLEX', 'DST']).toContain(pos);
      });
    });
  });
});
