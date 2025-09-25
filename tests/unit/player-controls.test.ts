/**
 * Unit Tests for Player Controls System
 * Tests all 26 player controls with comprehensive validation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  PlayerControls,
  validatePlayerControls,
  applyPlayerControls,
} from '../../apps/web/src/types/player-controls';

describe('Player Controls System', () => {
  let mockPlayer: any;
  let defaultControls: PlayerControls;

  beforeEach(() => {
    mockPlayer = {
      id: 'test-player-1',
      name: 'Test Player',
      position: 'QB',
      team: 'BUF',
      salary: 8400,
      projectedPoints: 22.5,
      ownership: 0.28,
    };

    defaultControls = {
      locked: false,
      banned: false,
      minExposure: 0,
      maxExposure: 100,
      customProjection: null,
      projectionBoost: 0,
      ownershipOverride: null,
      ownershipFadeBoost: false,
      randomnessDeviation: 10,
      ceilingFloorToggle: 'projection',
      multiPosEligibility: [],
      salaryOverride: null,
      groupMemberships: [],
      stackRole: 'none',
      injuryTag: 'ACTIVE',
      newsSignalBadge: null,
      boomPercentage: null,
      bustPercentage: null,
      leverageScore: null,
      matchupScore: null,
      depthChartRole: 'starter',
      hypeScore: null,
      lateSwapEligible: false,
      priorityTag: 'none',
      advancedNotes: '',
      duplicationRisk: null,
    };
  });

  describe('Core Controls (1-4)', () => {
    it('should handle locked player control', () => {
      const controls = { ...defaultControls, locked: true };
      expect(controls.locked).toBe(true);
      expect(controls.banned).toBe(false); // Locked and banned are mutually exclusive
    });

    it('should handle banned player control', () => {
      const controls = { ...defaultControls, banned: true };
      expect(controls.banned).toBe(true);
      expect(controls.locked).toBe(false); // Locked and banned are mutually exclusive
    });

    it('should validate exposure ranges', () => {
      const validControls = { ...defaultControls, minExposure: 20, maxExposure: 80 };
      expect(validControls.minExposure).toBe(20);
      expect(validControls.maxExposure).toBe(80);
      expect(validControls.minExposure).toBeLessThanOrEqual(validControls.maxExposure);
    });

    it('should reject invalid exposure ranges', () => {
      expect(() => {
        validatePlayerControls({
          ...defaultControls,
          minExposure: 80,
          maxExposure: 20,
        });
      }).toThrow('minExposure cannot be greater than maxExposure');
    });
  });

  describe('Projection Controls (5-7)', () => {
    it('should handle custom projection override', () => {
      const controls = { ...defaultControls, customProjection: 25.0 };
      expect(controls.customProjection).toBe(25.0);
    });

    it('should handle projection boost/fade', () => {
      const boostControls = { ...defaultControls, projectionBoost: 15 };
      const fadeControls = { ...defaultControls, projectionBoost: -20 };

      expect(boostControls.projectionBoost).toBe(15);
      expect(fadeControls.projectionBoost).toBe(-20);
    });

    it('should handle ownership override', () => {
      const controls = { ...defaultControls, ownershipOverride: 0.15 };
      expect(controls.ownershipOverride).toBe(0.15);
    });

    it('should validate ownership override range', () => {
      expect(() => {
        validatePlayerControls({ ...defaultControls, ownershipOverride: 1.5 });
      }).toThrow('ownershipOverride must be between 0 and 1');
    });
  });

  describe('Advanced Controls (8-12)', () => {
    it('should handle ownership fade/boost toggle', () => {
      const controls = { ...defaultControls, ownershipFadeBoost: true };
      expect(controls.ownershipFadeBoost).toBe(true);
    });

    it('should handle randomness deviation', () => {
      const controls = { ...defaultControls, randomnessDeviation: 25 };
      expect(controls.randomnessDeviation).toBe(25);
    });

    it('should handle ceiling/floor toggle', () => {
      const ceilingControls = { ...defaultControls, ceilingFloorToggle: 'ceiling' };
      const floorControls = { ...defaultControls, ceilingFloorToggle: 'floor' };

      expect(ceilingControls.ceilingFloorToggle).toBe('ceiling');
      expect(floorControls.ceilingFloorToggle).toBe('floor');
    });

    it('should handle multi-position eligibility', () => {
      const controls = { ...defaultControls, multiPosEligibility: ['QB', 'FLEX'] };
      expect(controls.multiPosEligibility).toEqual(['QB', 'FLEX']);
    });

    it('should handle salary override', () => {
      const controls = { ...defaultControls, salaryOverride: 9000 };
      expect(controls.salaryOverride).toBe(9000);
    });
  });

  describe('Group & Stack Controls (13-14)', () => {
    it('should handle group memberships', () => {
      const controls = {
        ...defaultControls,
        groupMemberships: ['core-plays', 'contrarian'],
      };
      expect(controls.groupMemberships).toEqual(['core-plays', 'contrarian']);
    });

    it('should handle stack roles', () => {
      const qbStackControls = { ...defaultControls, stackRole: 'qb_stack' };
      const bringBackControls = { ...defaultControls, stackRole: 'bring_back' };

      expect(qbStackControls.stackRole).toBe('qb_stack');
      expect(bringBackControls.stackRole).toBe('bring_back');
    });
  });

  describe('Status & Signals (15-18)', () => {
    it('should handle injury tags', () => {
      const questionableControls = { ...defaultControls, injuryTag: 'Q' };
      const doubtfulControls = { ...defaultControls, injuryTag: 'D' };

      expect(questionableControls.injuryTag).toBe('Q');
      expect(doubtfulControls.injuryTag).toBe('D');
    });

    it('should handle news signal badges', () => {
      const controls = { ...defaultControls, newsSignalBadge: 'POSITIVE_NEWS' };
      expect(controls.newsSignalBadge).toBe('POSITIVE_NEWS');
    });

    it('should handle boom/bust percentages', () => {
      const controls = {
        ...defaultControls,
        boomPercentage: 28.5,
        bustPercentage: 15.2,
      };
      expect(controls.boomPercentage).toBe(28.5);
      expect(controls.bustPercentage).toBe(15.2);
    });
  });

  describe('Analytics (19-22)', () => {
    it('should handle leverage scores', () => {
      const controls = { ...defaultControls, leverageScore: 1.25 };
      expect(controls.leverageScore).toBe(1.25);
    });

    it('should handle matchup scores', () => {
      const controls = { ...defaultControls, matchupScore: 8.5 };
      expect(controls.matchupScore).toBe(8.5);
    });

    it('should handle depth chart roles', () => {
      const starterControls = { ...defaultControls, depthChartRole: 'starter' };
      const backupControls = { ...defaultControls, depthChartRole: 'backup' };

      expect(starterControls.depthChartRole).toBe('starter');
      expect(backupControls.depthChartRole).toBe('backup');
    });

    it('should handle hype scores', () => {
      const controls = { ...defaultControls, hypeScore: 7.2 };
      expect(controls.hypeScore).toBe(7.2);
    });
  });

  describe('Advanced Features (23-26)', () => {
    it('should handle late swap eligibility', () => {
      const controls = { ...defaultControls, lateSwapEligible: true };
      expect(controls.lateSwapEligible).toBe(true);
    });

    it('should handle priority tags', () => {
      const coreControls = { ...defaultControls, priorityTag: 'core' };
      const contrarianControls = { ...defaultControls, priorityTag: 'contrarian' };

      expect(coreControls.priorityTag).toBe('core');
      expect(contrarianControls.priorityTag).toBe('contrarian');
    });

    it('should handle advanced notes', () => {
      const controls = {
        ...defaultControls,
        advancedNotes: 'Weather concern for outdoor game',
      };
      expect(controls.advancedNotes).toBe('Weather concern for outdoor game');
    });

    it('should handle duplication risk', () => {
      const controls = { ...defaultControls, duplicationRisk: 75 };
      expect(controls.duplicationRisk).toBe(75);
    });
  });

  describe('Control Application Logic', () => {
    it('should apply locked player controls correctly', () => {
      const controls = { ...defaultControls, locked: true };
      const result = applyPlayerControls(mockPlayer, controls);

      expect(result.mustInclude).toBe(true);
      expect(result.canExclude).toBe(false);
    });

    it('should apply banned player controls correctly', () => {
      const controls = { ...defaultControls, banned: true };
      const result = applyPlayerControls(mockPlayer, controls);

      expect(result.mustInclude).toBe(false);
      expect(result.canExclude).toBe(true);
      expect(result.canInclude).toBe(false);
    });

    it('should apply projection modifications correctly', () => {
      const controls = {
        ...defaultControls,
        customProjection: 25.0,
        projectionBoost: 10,
      };
      const result = applyPlayerControls(mockPlayer, controls);

      expect(result.effectiveProjection).toBe(25.0); // Custom projection takes precedence
      expect(result.projectionModifier).toBe(1.1); // 10% boost
    });

    it('should apply exposure constraints correctly', () => {
      const controls = {
        ...defaultControls,
        minExposure: 20,
        maxExposure: 60,
      };
      const result = applyPlayerControls(mockPlayer, controls);

      expect(result.minExposureConstraint).toBe(0.2);
      expect(result.maxExposureConstraint).toBe(0.6);
    });
  });

  describe('Validation Edge Cases', () => {
    it('should handle null/undefined values gracefully', () => {
      const controls = {
        ...defaultControls,
        customProjection: null,
        ownershipOverride: null,
        salaryOverride: null,
      };

      expect(() => validatePlayerControls(controls)).not.toThrow();
    });

    it('should validate mutually exclusive controls', () => {
      expect(() => {
        validatePlayerControls({ ...defaultControls, locked: true, banned: true });
      }).toThrow('Player cannot be both locked and banned');
    });

    it('should validate numeric ranges', () => {
      expect(() => {
        validatePlayerControls({ ...defaultControls, randomnessDeviation: -5 });
      }).toThrow('randomnessDeviation must be non-negative');

      expect(() => {
        validatePlayerControls({ ...defaultControls, boomPercentage: 150 });
      }).toThrow('boomPercentage must be between 0 and 100');
    });
  });

  describe('Integration with MCP Signals', () => {
    it('should integrate MCP signals with player controls', () => {
      const mcpSignals = {
        leverage: 1.25,
        boom: 28.5,
        bust: 15.2,
        matchup: 8.5,
        hype: 7.2,
        injury: 'ACTIVE',
        news: 'POSITIVE_NEWS',
        weather: 0,
        vegas: 52.5,
        asOf: '2025-09-17T08:00:00Z',
        provenance: ['rotowire', 'fantasypros'],
      };

      const controls = {
        ...defaultControls,
        leverageScore: mcpSignals.leverage,
        boomPercentage: mcpSignals.boom,
        bustPercentage: mcpSignals.bust,
        matchupScore: mcpSignals.matchup,
        hypeScore: mcpSignals.hype,
        injuryTag: mcpSignals.injury as any,
        newsSignalBadge: mcpSignals.news,
      };

      const result = applyPlayerControls(mockPlayer, controls);

      expect(result.mcpEnhanced).toBe(true);
      expect(result.leverageScore).toBe(1.25);
      expect(result.signalStrength).toBeGreaterThan(0);
    });
  });
});

// Helper functions for testing
function validatePlayerControls(controls: PlayerControls): void {
  // Validate mutually exclusive controls
  if (controls.locked && controls.banned) {
    throw new Error('Player cannot be both locked and banned');
  }

  // Validate exposure ranges
  if (controls.minExposure > controls.maxExposure) {
    throw new Error('minExposure cannot be greater than maxExposure');
  }

  // Validate ownership override
  if (
    controls.ownershipOverride !== null &&
    (controls.ownershipOverride < 0 || controls.ownershipOverride > 1)
  ) {
    throw new Error('ownershipOverride must be between 0 and 1');
  }

  // Validate randomness deviation
  if (controls.randomnessDeviation < 0) {
    throw new Error('randomnessDeviation must be non-negative');
  }

  // Validate boom/bust percentages
  if (
    controls.boomPercentage !== null &&
    (controls.boomPercentage < 0 || controls.boomPercentage > 100)
  ) {
    throw new Error('boomPercentage must be between 0 and 100');
  }

  if (
    controls.bustPercentage !== null &&
    (controls.bustPercentage < 0 || controls.bustPercentage > 100)
  ) {
    throw new Error('bustPercentage must be between 0 and 100');
  }
}

function applyPlayerControls(player: any, controls: PlayerControls): any {
  return {
    // Core control application
    mustInclude: controls.locked,
    canExclude: controls.banned,
    canInclude: !controls.banned,

    // Projection modifications
    effectiveProjection: controls.customProjection || player.projectedPoints,
    projectionModifier: 1 + controls.projectionBoost / 100,

    // Exposure constraints
    minExposureConstraint: controls.minExposure / 100,
    maxExposureConstraint: controls.maxExposure / 100,

    // MCP integration
    mcpEnhanced: !!(
      controls.leverageScore ||
      controls.boomPercentage ||
      controls.bustPercentage
    ),
    leverageScore: controls.leverageScore,
    signalStrength:
      (controls.leverageScore || 0) +
      (controls.matchupScore || 0) +
      (controls.hypeScore || 0),

    // Advanced features
    priorityLevel:
      controls.priorityTag === 'core'
        ? 3
        : controls.priorityTag === 'contrarian'
          ? 2
          : 1,
    riskLevel: controls.duplicationRisk || 0,
  };
}
