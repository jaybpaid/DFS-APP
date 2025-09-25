/**
 * DraftKings API Client and Salary Loader
 * Validates against dk_salaries.json schema
 */

import { readFileSync } from 'fs';
import { createReadStream } from 'fs';
import csvParser from 'csv-parser';
import { z } from 'zod';

// Schema validation based on contracts/schemas/dk_salaries.json
const DKPlayerSchema = z.object({
  id: z.string(),
  name: z.string(),
  position: z.enum(['QB', 'RB', 'WR', 'TE', 'DST']),
  team: z.string().regex(/^[A-Z]{2,4}$/),
  opponent: z
    .string()
    .regex(/^[A-Z]{2,4}$/)
    .optional(),
  salary: z.number().int().min(3000).max(12000),
  gameInfo: z.string().optional(),
  injury: z
    .object({
      status: z.enum(['healthy', 'questionable', 'doubtful', 'out', 'ir']),
      report: z.string().optional(),
    })
    .optional(),
  rosterPercentage: z.number().min(0).max(100).optional(),
  isLocked: z.boolean().default(false).optional(),
});

const DKSalariesSchema = z.object({
  slateId: z.string(),
  players: z.array(DKPlayerSchema),
  metadata: z.object({
    timestamp: z.string().datetime(),
    salaryCap: z.number().int(),
    rosterPositions: z.array(z.string()).optional(),
    contestType: z.enum(['classic', 'showdown', 'tiers', 'arcade']).optional(),
    lateSwapEnabled: z.boolean().optional(),
  }),
});

export type DKPlayer = z.infer<typeof DKPlayerSchema>;
export type DKSalaries = z.infer<typeof DKSalariesSchema>;

export class DKSalaryLoader {
  /**
   * Load DK salaries from JSON file
   */
  static async loadFromJSON(filePath: string): Promise<DKSalaries> {
    try {
      const rawData = readFileSync(filePath, 'utf-8');
      const data = JSON.parse(rawData);

      // Validate against schema
      const validated = DKSalariesSchema.parse(data);

      return validated;
    } catch (error) {
      throw new Error(`Failed to load DK salaries from JSON: ${error}`);
    }
  }

  /**
   * Load DK salaries from CSV file
   */
  static async loadFromCSV(
    filePath: string,
    slateId: string,
    salaryCap: number = 50000
  ): Promise<DKSalaries> {
    return new Promise((resolve, reject) => {
      const players: DKPlayer[] = [];

      createReadStream(filePath)
        .pipe(csvParser())
        .on('data', row => {
          try {
            // Map CSV columns to DKPlayer schema
            const player: DKPlayer = {
              id: row.ID || row.id || row.draftable_id,
              name: row.Name || row.name || row.display_name,
              position: row.Position || row.position || row.pos,
              team: row.Team || row.team || row.team_abbreviation,
              opponent: row.Opponent || row.opponent || row.opp,
              salary: parseInt(row.Salary || row.salary || row.price),
              gameInfo: row['Game Info'] || row.game_info || row.matchup,
              rosterPercentage: row['Roster %']
                ? parseFloat(row['Roster %'])
                : undefined,
              isLocked: false,
            };

            // Validate player against schema
            DKPlayerSchema.parse(player);
            players.push(player);
          } catch (error) {
            console.warn(`Skipping invalid player row: ${error}`);
          }
        })
        .on('end', () => {
          try {
            const result: DKSalaries = {
              slateId,
              players,
              metadata: {
                timestamp: new Date().toISOString(),
                salaryCap,
                contestType: 'classic',
                lateSwapEnabled: true,
              },
            };

            // Final validation
            DKSalariesSchema.parse(result);
            resolve(result);
          } catch (error) {
            reject(new Error(`Failed to validate CSV data: ${error}`));
          }
        })
        .on('error', reject);
    });
  }

  /**
   * Load DK salaries from live DraftKings API
   */
  static async loadFromAPI(slateId: string): Promise<DKSalaries> {
    const url = `https://api.draftkings.com/draftgroups/v1/draftgroups/${slateId}/draftables`;

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`DK API returned ${response.status}: ${response.statusText}`);
      }

      const apiData = await response.json();

      // Transform API response to our schema
      const players: DKPlayer[] =
        apiData.draftables?.map((item: any) => ({
          id: item.draftableId?.toString() || '',
          name: item.displayName || '',
          position: item.position || '',
          team: item.teamAbbreviation || '',
          opponent: item.opponentAbbreviation || '',
          salary: item.salary || 0,
          gameInfo: `${item.teamAbbreviation} @ ${item.opponentAbbreviation}`,
        })) || [];

      const result: DKSalaries = {
        slateId,
        players,
        metadata: {
          timestamp: new Date().toISOString(),
          salaryCap: 50000,
          contestType: 'classic',
          lateSwapEnabled: true,
        },
      };

      // Validate against schema
      return DKSalariesSchema.parse(result);
    } catch (error) {
      throw new Error(`Failed to load from DK API: ${error}`);
    }
  }
}

export default DKSalaryLoader;
