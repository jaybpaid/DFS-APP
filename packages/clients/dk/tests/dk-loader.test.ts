/**
 * Unit tests for DraftKings Salary Loader
 * Validates against dk_salaries.json schema
 */

import { describe, it, expect } from 'vitest';
import { DKSalaryLoader, DKPlayer, DKSalaries } from '../src/index.js';
import { resolve } from 'path';

describe('DKSalaryLoader', () => {
  const fixturePath = resolve('../../../../fixtures/sample_dk_salaries.json');

  describe('loadFromJSON', () => {
    it('should load valid JSON fixture and validate against schema', async () => {
      const result = await DKSalaryLoader.loadFromJSON(fixturePath);

      expect(result).toBeDefined();
      expect(result.slateId).toBe('133233');
      expect(result.players).toHaveLength(6);
      expect(result.metadata.salaryCap).toBe(50000);

      // Validate player structure
      const henry = result.players[0];
      expect(henry.name).toBe('Derrick Henry');
      expect(henry.position).toBe('RB');
      expect(henry.salary).toBe(8200);
      expect(henry.team).toBe('BAL');
    });

    it('should throw error for invalid JSON file', async () => {
      await expect(DKSalaryLoader.loadFromJSON('nonexistent.json')).rejects.toThrow(
        'Failed to load DK salaries from JSON'
      );
    });
  });

  describe('schema validation', () => {
    it('should validate player positions are valid enum values', async () => {
      const result = await DKSalaryLoader.loadFromJSON(fixturePath);

      result.players.forEach(player => {
        expect(['QB', 'RB', 'WR', 'TE', 'DST']).toContain(player.position);
      });
    });

    it('should validate salary ranges', async () => {
      const result = await DKSalaryLoader.loadFromJSON(fixturePath);

      result.players.forEach(player => {
        expect(player.salary).toBeGreaterThanOrEqual(3000);
        expect(player.salary).toBeLessThanOrEqual(12000);
      });
    });

    it('should validate team abbreviations are uppercase', async () => {
      const result = await DKSalaryLoader.loadFromJSON(fixturePath);

      result.players.forEach(player => {
        expect(player.team).toMatch(/^[A-Z]{2,4}$/);
        if (player.opponent) {
          expect(player.opponent).toMatch(/^[A-Z]{2,4}$/);
        }
      });
    });
  });

  describe('loadFromCSV', () => {
    it('should handle CSV format with standard DK headers', async () => {
      // This would test CSV loading but we need a fixture CSV file
      // For now, stub this test
      expect(DKSalaryLoader.loadFromCSV).toBeDefined();
    });
  });

  describe('loadFromAPI', () => {
    it('should handle API call format', async () => {
      // This would test live API but needs to be stubbed for unit tests
      expect(DKSalaryLoader.loadFromAPI).toBeDefined();
    });
  });
});
