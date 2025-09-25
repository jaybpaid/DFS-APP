import { describe, it, expect, beforeEach } from 'vitest';
import {
  parseContestCsv,
  parseLineupsCsv,
  parseSalaryCsv,
  buildDkExportCsv,
  buildDetailedExportCsv,
  validateNflLineup,
  extractPlayerId,
  extractPlayerName,
  buildPlayerNameWithId,
  formatMoney,
  validateCsvStructure,
  mergeCsvFiles,
  CsvParsingError,
  CsvValidationError,
  type ParsedContest,
  type ParsedLineup,
  type ParsedPlayer,
  type LineupExport,
} from '../dk-mappers.js';

describe('DK CSV Mappers', () => {
  describe('parseContestCsv', () => {
    const validContestCsv = `Contest Name,Contest ID,Entry Fee,Total Prize Pool,Max Entries,Entries,Places Paid,Entry Deadline,Contest Type,Sport
NFL $100K Fantasy Football Millionaire [$1M to 1st],123456789,$20.00,$100000.00,5000,4523,1000,2024-09-15 13:00:00,GPP,NFL
NFL $25K Sunday Million [$1M to 1st],987654321,$25.00,$25000.00,1000,856,200,2024-09-15 13:00:00,GPP,NFL`;

    it('should parse valid contest CSV correctly', () => {
      const result = parseContestCsv(validContestCsv);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: '123456789',
        name: 'NFL $100K Fantasy Football Millionaire [$1M to 1st]',
        entryFee: 2000, // $20.00 in cents
        totalPrize: 10000000, // $100,000.00 in cents
        maxEntries: 5000,
        entries: 4523,
        placesPaid: 1000,
        entryDeadline: new Date('2024-09-15 13:00:00'),
        contestType: 'GPP',
        sport: 'NFL',
      });
    });

    it('should handle empty CSV', () => {
      expect(() => parseContestCsv('')).toThrow('Failed to parse contest CSV');
    });

    it('should handle malformed CSV', () => {
      const malformedCsv = 'Contest Name,Contest ID\nTest Contest';
      expect(() => parseContestCsv(malformedCsv)).toThrow(
        'Failed to parse contest CSV'
      );
    });

    it('should handle missing required fields', () => {
      const incompleteCsv = `Contest Name,Contest ID,Entry Fee
Test Contest,123,$20.00`;
      expect(() => parseContestCsv(incompleteCsv)).toThrow(
        'Failed to parse contest CSV'
      );
    });
  });

  describe('parseLineupsCsv', () => {
    const validLineupCsv = `Entry ID,Contest Name,Contest ID,Entry Fee,QB,RB1,RB2,WR1,WR2,WR3,TE,FLEX,DST,Points,Lineup
12345,Test Contest,98765,$20.00,Josh Allen (11191),Saquon Barkley (11192),Josh Jacobs (11193),Tyreek Hill (11194),Stefon Diggs (11195),Amari Cooper (11196),Travis Kelce (11197),Christian McCaffrey (11198),Buffalo Bills (11199),156.5,Lineup 1
67890,Test Contest,98765,$20.00,Lamar Jackson (11200),Derrick Henry (11201),Nick Chubb (11202),DeAndre Hopkins (11203),Mike Evans (11204),DK Metcalf (11205),Mark Andrews (11206),Alvin Kamara (11207),San Francisco 49ers (11208),142.3,Lineup 2`;

    it('should parse valid lineup CSV correctly', () => {
      const result = parseLineupsCsv(validLineupCsv);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        entryId: '12345',
        contestName: 'Test Contest',
        contestId: '98765',
        entryFee: 2000,
        players: {
          QB: 'Josh Allen (11191)',
          RB1: 'Saquon Barkley (11192)',
          RB2: 'Josh Jacobs (11193)',
          WR1: 'Tyreek Hill (11194)',
          WR2: 'Stefon Diggs (11195)',
          WR3: 'Amari Cooper (11196)',
          TE: 'Travis Kelce (11197)',
          FLEX: 'Christian McCaffrey (11198)',
          DST: 'Buffalo Bills (11199)',
        },
        points: 156.5,
        lineup: 'Lineup 1',
      });
    });

    it('should handle lineups without points', () => {
      const csvWithoutPoints = `Entry ID,Contest Name,Contest ID,Entry Fee,QB,RB1,RB2,WR1,WR2,WR3,TE,FLEX,DST
12345,Test Contest,98765,$20.00,Josh Allen (11191),Saquon Barkley (11192),Josh Jacobs (11193),Tyreek Hill (11194),Stefon Diggs (11195),Amari Cooper (11196),Travis Kelce (11197),Christian McCaffrey (11198),Buffalo Bills (11199)`;

      const result = parseLineupsCsv(csvWithoutPoints);
      expect(result[0].points).toBeUndefined();
    });
  });

  describe('parseSalaryCsv', () => {
    const validSalaryCsv = `Name,Name + ID,ID,Position,Salary,Game Info,TeamAbbrev,AvgPointsPerGame
Josh Allen,Josh Allen (11191),11191,QB,$8500,BUF@MIA 01:00PM ET,BUF,22.5
Saquon Barkley,Saquon Barkley (11192),11192,RB,$8000,NYG@WAS 01:00PM ET,NYG,18.3
Travis Kelce,Travis Kelce (11197),11197,TE,$6500,KC@LV 04:25PM ET,KC,12.8`;

    it('should parse valid salary CSV correctly', () => {
      const result = parseSalaryCsv(validSalaryCsv);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({
        id: '11191',
        name: 'Josh Allen',
        nameWithId: 'Josh Allen (11191)',
        position: 'QB',
        salary: 8500,
        gameInfo: 'BUF@MIA 01:00PM ET',
        teamAbbrev: 'BUF',
        avgPointsPerGame: 22.5,
      });
    });

    it('should handle players without average points', () => {
      const csvWithoutAvg = `Name,Name + ID,ID,Position,Salary,Game Info,TeamAbbrev
Josh Allen,Josh Allen (11191),11191,QB,$8500,BUF@MIA 01:00PM ET,BUF`;

      const result = parseSalaryCsv(csvWithoutAvg);
      expect(result[0].avgPointsPerGame).toBeUndefined();
    });

    it('should parse salary with commas correctly', () => {
      const csvWithCommas = `Name,Name + ID,ID,Position,Salary,Game Info,TeamAbbrev
Josh Allen,Josh Allen (11191),11191,QB,"$8,500",BUF@MIA 01:00PM ET,BUF`;

      const result = parseSalaryCsv(csvWithCommas);
      expect(result[0].salary).toBe(8500);
    });
  });

  describe('buildDkExportCsv', () => {
    const sampleLineups: LineupExport[] = [
      {
        players: {
          QB: 'Josh Allen (11191)',
          RB1: 'Saquon Barkley (11192)',
          RB2: 'Josh Jacobs (11193)',
          WR1: 'Tyreek Hill (11194)',
          WR2: 'Stefon Diggs (11195)',
          WR3: 'Amari Cooper (11196)',
          TE: 'Travis Kelce (11197)',
          FLEX: 'Christian McCaffrey (11198)',
          DST: 'Buffalo Bills (11199)',
        },
        totalSalary: 49800,
        projectedPoints: 156.5,
      },
    ];

    it('should build valid DK export CSV', () => {
      const result = buildDkExportCsv(sampleLineups);

      expect(result).toContain('QB,RB1,RB2,WR1,WR2,WR3,TE,FLEX,DST');
      expect(result).toContain('Josh Allen (11191)');
      expect(result).toContain('Buffalo Bills (11199)');
    });

    it('should handle empty lineups array', () => {
      const result = buildDkExportCsv([]);
      expect(result).toBe('QB,RB1,RB2,WR1,WR2,WR3,TE,FLEX,DST\n');
    });
  });

  describe('buildDetailedExportCsv', () => {
    const sampleLineups: LineupExport[] = [
      {
        players: {
          QB: 'Josh Allen (11191)',
          RB1: 'Saquon Barkley (11192)',
          RB2: 'Josh Jacobs (11193)',
          WR1: 'Tyreek Hill (11194)',
          WR2: 'Stefon Diggs (11195)',
          WR3: 'Amari Cooper (11196)',
          TE: 'Travis Kelce (11197)',
          FLEX: 'Christian McCaffrey (11198)',
          DST: 'Buffalo Bills (11199)',
        },
        totalSalary: 49800,
        projectedPoints: 156.5,
      },
    ];

    it('should build detailed export CSV with metadata', () => {
      const result = buildDetailedExportCsv(sampleLineups);

      expect(result).toContain(
        'Lineup,QB,RB1,RB2,WR1,WR2,WR3,TE,FLEX,DST,Total Salary,Projected Points'
      );
      expect(result).toContain('Lineup 1');
      expect(result).toContain('$49,800');
      expect(result).toContain('156.50');
    });
  });

  describe('validateNflLineup', () => {
    const validLineup: LineupExport = {
      players: {
        QB: 'Josh Allen (11191)',
        RB1: 'Saquon Barkley (11192)',
        RB2: 'Josh Jacobs (11193)',
        WR1: 'Tyreek Hill (11194)',
        WR2: 'Stefon Diggs (11195)',
        WR3: 'Amari Cooper (11196)',
        TE: 'Travis Kelce (11197)',
        FLEX: 'Christian McCaffrey (11198)',
        DST: 'Buffalo Bills (11199)',
      },
      totalSalary: 49800,
    };

    it('should validate complete lineup as valid', () => {
      const result = validateNflLineup(validLineup);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing players', () => {
      const incompleteLineup: LineupExport = {
        ...validLineup,
        players: {
          ...validLineup.players,
          QB: '',
          TE: '',
        },
      };

      const result = validateNflLineup(incompleteLineup);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Missing player for position: QB');
      expect(result.errors).toContain('Missing player for position: TE');
    });

    it('should detect salary cap violations', () => {
      const overCapLineup: LineupExport = {
        ...validLineup,
        totalSalary: 55000,
      };

      const result = validateNflLineup(overCapLineup);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Total salary $55000 exceeds $50,000 cap');
    });
  });

  describe('Player name utilities', () => {
    describe('extractPlayerId', () => {
      it('should extract player ID from name with ID format', () => {
        expect(extractPlayerId('Josh Allen (11191)')).toBe('11191');
        expect(extractPlayerId('Christian McCaffrey (12345678)')).toBe('12345678');
      });

      it('should return null for invalid format', () => {
        expect(extractPlayerId('Josh Allen')).toBeNull();
        expect(extractPlayerId('Josh Allen ()')).toBeNull();
        expect(extractPlayerId('Josh Allen (abc)')).toBeNull();
      });
    });

    describe('extractPlayerName', () => {
      it('should extract clean player name', () => {
        expect(extractPlayerName('Josh Allen (11191)')).toBe('Josh Allen');
        expect(extractPlayerName('Christian McCaffrey (12345678)')).toBe(
          'Christian McCaffrey'
        );
      });

      it('should handle names without ID', () => {
        expect(extractPlayerName('Josh Allen')).toBe('Josh Allen');
      });
    });

    describe('buildPlayerNameWithId', () => {
      it('should build properly formatted name with ID', () => {
        expect(buildPlayerNameWithId('Josh Allen', '11191')).toBe('Josh Allen (11191)');
        expect(buildPlayerNameWithId('Christian McCaffrey', '12345678')).toBe(
          'Christian McCaffrey (12345678)'
        );
      });
    });
  });

  describe('formatMoney', () => {
    it('should format cents to dollar string', () => {
      expect(formatMoney(2000)).toBe('$20.00');
      expect(formatMoney(12345)).toBe('$123.45');
      expect(formatMoney(0)).toBe('$0.00');
      expect(formatMoney(1)).toBe('$0.01');
    });
  });

  describe('validateCsvStructure', () => {
    it('should validate correct CSV structure', () => {
      const csvContent = 'Name,ID,Position\nJosh Allen,11191,QB';
      const expectedHeaders = ['Name', 'ID', 'Position'];

      const result = validateCsvStructure(csvContent, expectedHeaders);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.headers).toEqual(['Name', 'ID', 'Position']);
    });

    it('should detect missing headers', () => {
      const csvContent = 'Name,ID\nJosh Allen,11191';
      const expectedHeaders = ['Name', 'ID', 'Position'];

      const result = validateCsvStructure(csvContent, expectedHeaders);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Missing required header: Position');
    });

    it('should handle empty CSV', () => {
      const result = validateCsvStructure('', ['Name']);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('CSV file is empty');
    });
  });

  describe('mergeCsvFiles', () => {
    it('should merge multiple CSV files', () => {
      const csv1 = 'Name,Position\nJosh Allen,QB';
      const csv2 = 'Name,Position\nSaquon Barkley,RB';

      const result = mergeCsvFiles([csv1, csv2]);
      expect(result).toContain('Josh Allen');
      expect(result).toContain('Saquon Barkley');
      expect(result).toContain('Name,Position');
    });

    it('should handle empty array', () => {
      expect(mergeCsvFiles([])).toBe('');
    });

    it('should handle single file', () => {
      const csv = 'Name,Position\nJosh Allen,QB';
      expect(mergeCsvFiles([csv])).toBe(csv);
    });
  });

  describe('Error classes', () => {
    it('should create CsvParsingError with correct properties', () => {
      const error = new CsvParsingError('Test error', 'contest', 5);
      expect(error.name).toBe('CsvParsingError');
      expect(error.message).toBe('Test error');
      expect(error.csvType).toBe('contest');
      expect(error.lineNumber).toBe(5);
    });

    it('should create CsvValidationError with correct properties', () => {
      const errors = ['Error 1', 'Error 2'];
      const error = new CsvValidationError('Validation failed', errors, 'lineup');
      expect(error.name).toBe('CsvValidationError');
      expect(error.message).toBe('Validation failed');
      expect(error.errors).toEqual(errors);
      expect(error.csvType).toBe('lineup');
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle CSV with quoted fields containing commas', () => {
      const csvWithQuotes = `Name,Description
"Allen, Josh","Quarterback for Buffalo"`;

      // This should not throw an error when parsing
      expect(() => {
        const result =
          parseSalaryCsv(`Name,Name + ID,ID,Position,Salary,Game Info,TeamAbbrev
"Allen, Josh","Allen, Josh (11191)",11191,QB,$8500,"BUF@MIA, 01:00PM ET",BUF`);
        expect(result[0].name).toBe('Allen, Josh');
      }).not.toThrow();
    });

    it('should handle CSV with different line endings', () => {
      const csvWithCRLF = 'Name,ID\r\nJosh Allen,11191\r\n';
      const csvWithLF = 'Name,ID\nJosh Allen,11191\n';

      // Both should parse successfully
      expect(() => validateCsvStructure(csvWithCRLF, ['Name', 'ID'])).not.toThrow();
      expect(() => validateCsvStructure(csvWithLF, ['Name', 'ID'])).not.toThrow();
    });

    it('should handle very large salary values', () => {
      const csvWithLargeSalary = `Name,Name + ID,ID,Position,Salary,Game Info,TeamAbbrev
Josh Allen,Josh Allen (11191),11191,QB,$999999,BUF@MIA 01:00PM ET,BUF`;

      const result = parseSalaryCsv(csvWithLargeSalary);
      expect(result[0].salary).toBe(999999);
    });

    it('should handle decimal entry fees', () => {
      const csvWithDecimalFee = `Contest Name,Contest ID,Entry Fee,Total Prize Pool,Max Entries,Entries,Places Paid,Entry Deadline,Contest Type,Sport
Test Contest,123,$0.25,$100.00,1000,500,100,2024-09-15 13:00:00,GPP,NFL`;

      const result = parseContestCsv(csvWithDecimalFee);
      expect(result[0].entryFee).toBe(25); // $0.25 in cents
    });
  });

  describe('Performance and memory tests', () => {
    it('should handle reasonably large CSV files', () => {
      // Generate a CSV with 1000 players
      const headers = 'Name,Name + ID,ID,Position,Salary,Game Info,TeamAbbrev';
      const rows = Array.from(
        { length: 1000 },
        (_, i) =>
          `Player ${i},Player ${i} (${i}),${i},QB,$8500,TEST@TEST 01:00PM ET,TEST`
      );
      const largeCsv = [headers, ...rows].join('\n');

      const startTime = Date.now();
      const result = parseSalaryCsv(largeCsv);
      const endTime = Date.now();

      expect(result).toHaveLength(1000);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });
});
