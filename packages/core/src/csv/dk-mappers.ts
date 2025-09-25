import { z } from 'zod';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';

// ============================================================================
// ZSCHEMA VALIDATION SCHEMAS
// ============================================================================

export const DkContestCsvSchema = z.object({
  'Contest Name': z.string(),
  'Contest ID': z.string(),
  'Entry Fee': z.string(),
  'Total Prize Pool': z.string(),
  'Max Entries': z.string(),
  Entries: z.string(),
  'Places Paid': z.string(),
  'Entry Deadline': z.string(),
  'Contest Type': z.string(),
  Sport: z.string(),
});

export const DkLineupCsvSchema = z.object({
  'Entry ID': z.string(),
  'Contest Name': z.string(),
  'Contest ID': z.string(),
  'Entry Fee': z.string(),
  QB: z.string(),
  RB1: z.string(),
  RB2: z.string(),
  WR1: z.string(),
  WR2: z.string(),
  WR3: z.string(),
  TE: z.string(),
  FLEX: z.string(),
  DST: z.string(),
  Points: z.string().optional(),
  Lineup: z.string().optional(),
});

export const DkSalaryCsvSchema = z.object({
  Name: z.string(),
  'Name + ID': z.string(),
  ID: z.string(),
  Position: z.string(),
  Salary: z.string(),
  'Game Info': z.string(),
  TeamAbbrev: z.string(),
  AvgPointsPerGame: z.string().optional(),
});

export const DkPlayerExportSchema = z.object({
  QB: z.string(),
  RB1: z.string(),
  RB2: z.string(),
  WR1: z.string(),
  WR2: z.string(),
  WR3: z.string(),
  TE: z.string(),
  FLEX: z.string(),
  DST: z.string(),
});

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type DkContestCsv = z.infer<typeof DkContestCsvSchema>;
export type DkLineupCsv = z.infer<typeof DkLineupCsvSchema>;
export type DkSalaryCsv = z.infer<typeof DkSalaryCsvSchema>;
export type DkPlayerExport = z.infer<typeof DkPlayerExportSchema>;

export interface ParsedContest {
  id: string;
  name: string;
  entryFee: number; // in cents
  totalPrize: number; // in cents
  maxEntries: number;
  entries: number;
  placesPaid: number;
  entryDeadline: Date;
  contestType: string;
  sport: string;
}

export interface ParsedLineup {
  entryId: string;
  contestName: string;
  contestId: string;
  entryFee: number; // in cents
  players: {
    QB: string;
    RB1: string;
    RB2: string;
    WR1: string;
    WR2: string;
    WR3: string;
    TE: string;
    FLEX: string;
    DST: string;
  };
  points?: number;
  lineup?: string;
}

export interface ParsedPlayer {
  id: string;
  name: string;
  nameWithId: string;
  position: string;
  salary: number;
  gameInfo: string;
  teamAbbrev: string;
  avgPointsPerGame?: number;
}

export interface LineupExport {
  players: {
    QB: string;
    RB1: string;
    RB2: string;
    WR1: string;
    WR2: string;
    WR3: string;
    TE: string;
    FLEX: string;
    DST: string;
  };
  totalSalary?: number;
  projectedPoints?: number;
}

// ============================================================================
// CSV PARSING FUNCTIONS
// ============================================================================

/**
 * Parse DraftKings contest CSV data
 * @param csvContent Raw CSV content as string
 * @returns Array of parsed contest objects
 */
export function parseContestCsv(csvContent: string): ParsedContest[] {
  try {
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    return records.map((record: any) => {
      // Validate the record structure
      const validatedRecord = DkContestCsvSchema.parse(record);

      return {
        id: validatedRecord['Contest ID'],
        name: validatedRecord['Contest Name'],
        entryFee: parseMoneyString(validatedRecord['Entry Fee']),
        totalPrize: parseMoneyString(validatedRecord['Total Prize Pool']),
        maxEntries: parseInt(validatedRecord['Max Entries'], 10),
        entries: parseInt(validatedRecord['Entries'], 10),
        placesPaid: parseInt(validatedRecord['Places Paid'], 10),
        entryDeadline: new Date(validatedRecord['Entry Deadline']),
        contestType: validatedRecord['Contest Type'],
        sport: validatedRecord['Sport'],
      };
    });
  } catch (error) {
    throw new Error(
      `Failed to parse contest CSV: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Parse DraftKings lineup CSV data
 * @param csvContent Raw CSV content as string
 * @returns Array of parsed lineup objects
 */
export function parseLineupsCsv(csvContent: string): ParsedLineup[] {
  try {
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    return records.map((record: any) => {
      // Validate the record structure
      const validatedRecord = DkLineupCsvSchema.parse(record);

      return {
        entryId: validatedRecord['Entry ID'],
        contestName: validatedRecord['Contest Name'],
        contestId: validatedRecord['Contest ID'],
        entryFee: parseMoneyString(validatedRecord['Entry Fee']),
        players: {
          QB: validatedRecord['QB'],
          RB1: validatedRecord['RB1'],
          RB2: validatedRecord['RB2'],
          WR1: validatedRecord['WR1'],
          WR2: validatedRecord['WR2'],
          WR3: validatedRecord['WR3'],
          TE: validatedRecord['TE'],
          FLEX: validatedRecord['FLEX'],
          DST: validatedRecord['DST'],
        },
        points: validatedRecord['Points']
          ? parseFloat(validatedRecord['Points'])
          : undefined,
        lineup: validatedRecord['Lineup'],
      };
    });
  } catch (error) {
    throw new Error(
      `Failed to parse lineups CSV: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Parse DraftKings salary CSV data (player pool)
 * @param csvContent Raw CSV content as string
 * @returns Array of parsed player objects
 */
export function parseSalaryCsv(csvContent: string): ParsedPlayer[] {
  try {
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    return records.map((record: any) => {
      // Validate the record structure
      const validatedRecord = DkSalaryCsvSchema.parse(record);

      return {
        id: validatedRecord['ID'],
        name: validatedRecord['Name'],
        nameWithId: validatedRecord['Name + ID'],
        position: validatedRecord['Position'],
        salary: parseInt(validatedRecord['Salary'].replace(/[$,]/g, ''), 10),
        gameInfo: validatedRecord['Game Info'],
        teamAbbrev: validatedRecord['TeamAbbrev'],
        avgPointsPerGame: validatedRecord['AvgPointsPerGame']
          ? parseFloat(validatedRecord['AvgPointsPerGame'])
          : undefined,
      };
    });
  } catch (error) {
    throw new Error(
      `Failed to parse salary CSV: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

// ============================================================================
// CSV EXPORT FUNCTIONS
// ============================================================================

/**
 * Build DraftKings-compatible lineup export CSV
 * @param lineups Array of lineup export objects
 * @returns CSV content as string
 */
export function buildDkExportCsv(lineups: LineupExport[]): string {
  try {
    const records = lineups.map(lineup => ({
      QB: lineup.players.QB,
      RB1: lineup.players.RB1,
      RB2: lineup.players.RB2,
      WR1: lineup.players.WR1,
      WR2: lineup.players.WR2,
      WR3: lineup.players.WR3,
      TE: lineup.players.TE,
      FLEX: lineup.players.FLEX,
      DST: lineup.players.DST,
    }));

    return stringify(records, {
      header: true,
      columns: ['QB', 'RB1', 'RB2', 'WR1', 'WR2', 'WR3', 'TE', 'FLEX', 'DST'],
    });
  } catch (error) {
    throw new Error(
      `Failed to build export CSV: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Build detailed lineup export with additional metadata
 * @param lineups Array of lineup export objects with metadata
 * @returns CSV content as string
 */
export function buildDetailedExportCsv(lineups: LineupExport[]): string {
  try {
    const records = lineups.map((lineup, index) => ({
      Lineup: `Lineup ${index + 1}`,
      QB: lineup.players.QB,
      RB1: lineup.players.RB1,
      RB2: lineup.players.RB2,
      WR1: lineup.players.WR1,
      WR2: lineup.players.WR2,
      WR3: lineup.players.WR3,
      TE: lineup.players.TE,
      FLEX: lineup.players.FLEX,
      DST: lineup.players.DST,
      'Total Salary': lineup.totalSalary
        ? `$${lineup.totalSalary.toLocaleString()}`
        : '',
      'Projected Points': lineup.projectedPoints
        ? lineup.projectedPoints.toFixed(2)
        : '',
    }));

    return stringify(records, {
      header: true,
      columns: [
        'Lineup',
        'QB',
        'RB1',
        'RB2',
        'WR1',
        'WR2',
        'WR3',
        'TE',
        'FLEX',
        'DST',
        'Total Salary',
        'Projected Points',
      ],
    });
  } catch (error) {
    throw new Error(
      `Failed to build detailed export CSV: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Parse money string to cents (e.g., "$20.00" -> 2000)
 * @param moneyString String representation of money
 * @returns Amount in cents
 */
function parseMoneyString(moneyString: string): number {
  const cleaned = moneyString.replace(/[$,]/g, '');
  const dollars = parseFloat(cleaned);
  return Math.round(dollars * 100);
}

/**
 * Format cents to money string (e.g., 2000 -> "$20.00")
 * @param cents Amount in cents
 * @returns Formatted money string
 */
export function formatMoney(cents: number): string {
  const dollars = cents / 100;
  return `$${dollars.toFixed(2)}`;
}

/**
 * Validate lineup structure for DraftKings NFL
 * @param lineup Lineup object to validate
 * @returns Validation result with errors if any
 */
export function validateNflLineup(lineup: LineupExport): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const { players } = lineup;

  // Check required positions
  const requiredPositions = [
    'QB',
    'RB1',
    'RB2',
    'WR1',
    'WR2',
    'WR3',
    'TE',
    'FLEX',
    'DST',
  ];

  for (const position of requiredPositions) {
    if (
      !players[position as keyof typeof players] ||
      players[position as keyof typeof players].trim() === ''
    ) {
      errors.push(`Missing player for position: ${position}`);
    }
  }

  // Check salary cap if provided
  if (lineup.totalSalary && lineup.totalSalary > 50000) {
    errors.push(`Total salary $${lineup.totalSalary} exceeds $50,000 cap`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Extract player ID from DraftKings "Name + ID" format
 * @param nameWithId String in format "Player Name (12345678)"
 * @returns Player ID or null if not found
 */
export function extractPlayerId(nameWithId: string): string | null {
  const match = nameWithId.match(/\((\d+)\)$/);
  return match ? match[1] : null;
}

/**
 * Extract player name from DraftKings "Name + ID" format
 * @param nameWithId String in format "Player Name (12345678)"
 * @returns Clean player name
 */
export function extractPlayerName(nameWithId: string): string {
  return nameWithId.replace(/\s*\(\d+\)$/, '').trim();
}

/**
 * Build player name with ID in DraftKings format
 * @param name Player name
 * @param id Player ID
 * @returns Formatted string "Player Name (12345678)"
 */
export function buildPlayerNameWithId(name: string, id: string): string {
  return `${name} (${id})`;
}

// ============================================================================
// BATCH PROCESSING UTILITIES
// ============================================================================

/**
 * Process large CSV files in batches to avoid memory issues
 * @param csvContent Raw CSV content
 * @param batchSize Number of records per batch
 * @param processor Function to process each batch
 */
export async function processCsvInBatches<T>(
  csvContent: string,
  batchSize: number,
  processor: (batch: T[]) => Promise<void>
): Promise<void> {
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    await processor(batch);
  }
}

/**
 * Merge multiple CSV files with the same structure
 * @param csvContents Array of CSV content strings
 * @returns Merged CSV content
 */
export function mergeCsvFiles(csvContents: string[]): string {
  if (csvContents.length === 0) return '';
  if (csvContents.length === 1) return csvContents[0];

  const allRecords: any[] = [];
  let headers: string[] = [];

  for (const csvContent of csvContents) {
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    if (headers.length === 0) {
      headers = Object.keys(records[0] || {});
    }

    allRecords.push(...records);
  }

  return stringify(allRecords, {
    header: true,
    columns: headers,
  });
}

// ============================================================================
// ERROR HANDLING & VALIDATION
// ============================================================================

export class CsvParsingError extends Error {
  constructor(
    message: string,
    public readonly csvType: string,
    public readonly lineNumber?: number,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'CsvParsingError';
  }
}

export class CsvValidationError extends Error {
  constructor(
    message: string,
    public readonly errors: string[],
    public readonly csvType: string
  ) {
    super(message);
    this.name = 'CsvValidationError';
  }
}

/**
 * Validate CSV structure before parsing
 * @param csvContent Raw CSV content
 * @param expectedHeaders Array of expected header names
 * @returns Validation result
 */
export function validateCsvStructure(
  csvContent: string,
  expectedHeaders: string[]
): { isValid: boolean; errors: string[]; headers: string[] } {
  const errors: string[] = [];

  try {
    const lines = csvContent.split('\n');
    if (lines.length === 0) {
      errors.push('CSV file is empty');
      return { isValid: false, errors, headers: [] };
    }

    const headerLine = lines[0].trim();
    const headers = headerLine.split(',').map(h => h.replace(/"/g, '').trim());

    // Check for missing headers
    for (const expectedHeader of expectedHeaders) {
      if (!headers.includes(expectedHeader)) {
        errors.push(`Missing required header: ${expectedHeader}`);
      }
    }

    // Check for extra headers (warning, not error)
    const extraHeaders = headers.filter(h => !expectedHeaders.includes(h));
    if (extraHeaders.length > 0) {
      console.warn(`Extra headers found: ${extraHeaders.join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      headers,
    };
  } catch (error) {
    errors.push(
      `Failed to validate CSV structure: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    return { isValid: false, errors, headers: [] };
  }
}
