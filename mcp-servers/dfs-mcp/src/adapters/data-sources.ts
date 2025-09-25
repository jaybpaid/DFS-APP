import axios from 'axios';
import { readFileSync } from 'fs';
import { join } from 'path';

// ============================================================================
// DATA SOURCE CONFIGURATION
// ============================================================================

export interface DataSource {
  id: string;
  name: string;
  type: 'projections' | 'ownership' | 'news' | 'injuries' | 'vegas' | 'slates';
  url: string;
  apiKey?: string;
  weight: number;
  enabled: boolean;
  refreshInterval: number; // minutes
  lastUpdated?: Date;
  format: 'json' | 'csv' | 'xml' | 'rss';
  parser: string;
}

export const DATA_SOURCES: Record<string, DataSource> = {
  // DFS Blog Feeds (Feedly-style integration)
  'rotogrinders-blog': {
    id: 'rotogrinders-blog',
    name: 'RotoGrinders Blog',
    type: 'news',
    url: 'https://rotogrinders.com/feeds/articles',
    weight: 0.8,
    enabled: true,
    refreshInterval: 30,
    format: 'rss',
    parser: 'rss-parser',
  },
  'fantasylabs-blog': {
    id: 'fantasylabs-blog',
    name: 'FantasyLabs Blog',
    type: 'news',
    url: 'https://www.fantasylabs.com/api/articles/dfs',
    weight: 0.9,
    enabled: true,
    refreshInterval: 30,
    format: 'json',
    parser: 'json-parser',
  },
  'awesemo-blog': {
    id: 'awesemo-blog',
    name: 'Awesemo DFS Blog',
    type: 'news',
    url: 'https://www.awesemo.com/feed/',
    weight: 0.7,
    enabled: true,
    refreshInterval: 30,
    format: 'rss',
    parser: 'rss-parser',
  },
  'dfsgoldmine-blog': {
    id: 'dfsgoldmine-blog',
    name: 'DFS Goldmine',
    type: 'news',
    url: 'https://dfsgoldmine.com/feed/',
    weight: 0.6,
    enabled: true,
    refreshInterval: 30,
    format: 'rss',
    parser: 'rss-parser',
  },

  // Projection Sources
  'rotowire-projections': {
    id: 'rotowire-projections',
    name: 'RotoWire Projections',
    type: 'projections',
    url: 'https://www.rotowire.com/daily/nfl/optimizer.php',
    apiKey: process.env.ROTOWIRE_API_KEY,
    weight: 0.25,
    enabled: true,
    refreshInterval: 10,
    format: 'json',
    parser: 'rotowire-parser',
  },
  'fantasypros-projections': {
    id: 'fantasypros-projections',
    name: 'FantasyPros Consensus',
    type: 'projections',
    url: 'https://www.fantasypros.com/nfl/projections/consensus-cheatsheets.php',
    apiKey: process.env.FANTASYPROS_API_KEY,
    weight: 0.25,
    enabled: true,
    refreshInterval: 15,
    format: 'json',
    parser: 'fantasypros-parser',
  },
  'sabersim-projections': {
    id: 'sabersim-projections',
    name: 'SaberSim Projections',
    type: 'projections',
    url: 'https://sabersim.com/api/projections',
    apiKey: process.env.SABERSIM_API_KEY,
    weight: 0.25,
    enabled: false, // Premium source
    refreshInterval: 10,
    format: 'json',
    parser: 'sabersim-parser',
  },
  'stokastic-projections': {
    id: 'stokastic-projections',
    name: 'Stokastic Projections',
    type: 'projections',
    url: 'https://stokastic.com/api/projections',
    apiKey: process.env.STOKASTIC_API_KEY,
    weight: 0.25,
    enabled: false, // Premium source
    refreshInterval: 10,
    format: 'json',
    parser: 'stokastic-parser',
  },

  // Ownership Sources
  'sabersim-ownership': {
    id: 'sabersim-ownership',
    name: 'SaberSim Ownership',
    type: 'ownership',
    url: 'https://sabersim.com/api/ownership',
    apiKey: process.env.SABERSIM_API_KEY,
    weight: 0.4,
    enabled: false, // Premium source
    refreshInterval: 20,
    format: 'json',
    parser: 'sabersim-ownership-parser',
  },
  'stokastic-ownership': {
    id: 'stokastic-ownership',
    name: 'Stokastic Ownership',
    type: 'ownership',
    url: 'https://stokastic.com/api/ownership',
    apiKey: process.env.STOKASTIC_API_KEY,
    weight: 0.3,
    enabled: false, // Premium source
    refreshInterval: 20,
    format: 'json',
    parser: 'stokastic-ownership-parser',
  },
  'fantasylabs-ownership': {
    id: 'fantasylabs-ownership',
    name: 'FantasyLabs Ownership',
    type: 'ownership',
    url: 'https://www.fantasylabs.com/api/ownership',
    apiKey: process.env.FANTASYLABS_API_KEY,
    weight: 0.3,
    enabled: false, // Premium source
    refreshInterval: 20,
    format: 'json',
    parser: 'fantasylabs-ownership-parser',
  },

  // Injury Sources
  'nfl-injury-report': {
    id: 'nfl-injury-report',
    name: 'NFL Official Injury Report',
    type: 'injuries',
    url: 'https://www.nfl.com/injuries/',
    weight: 1.0,
    enabled: true,
    refreshInterval: 60,
    format: 'json',
    parser: 'nfl-injury-parser',
  },
  'espn-injury-report': {
    id: 'espn-injury-report',
    name: 'ESPN Injury Report',
    type: 'injuries',
    url: 'https://www.espn.com/nfl/injuries',
    weight: 0.8,
    enabled: true,
    refreshInterval: 60,
    format: 'json',
    parser: 'espn-injury-parser',
  },

  // Vegas/Odds Sources
  'odds-api': {
    id: 'odds-api',
    name: 'The Odds API',
    type: 'vegas',
    url: 'https://api.the-odds-api.com/v4/sports/americanfootball_nfl/odds',
    apiKey: process.env.ODDS_API_KEY,
    weight: 1.0,
    enabled: true,
    refreshInterval: 30,
    format: 'json',
    parser: 'odds-api-parser',
  },
  'draftkings-odds': {
    id: 'draftkings-odds',
    name: 'DraftKings Sportsbook',
    type: 'vegas',
    url: 'https://sportsbook-us-nh.draftkings.com/sites/US-NH-SB/api/v5/eventgroups/88808/categories/492/subcategories/4511/events',
    weight: 0.9,
    enabled: true,
    refreshInterval: 15,
    format: 'json',
    parser: 'draftkings-odds-parser',
  },

  // Slate Sources
  'draftkings-slates': {
    id: 'draftkings-slates',
    name: 'DraftKings Slates',
    type: 'slates',
    url: 'https://www.draftkings.com/lobby/getcontests',
    weight: 1.0,
    enabled: true,
    refreshInterval: 15,
    format: 'json',
    parser: 'draftkings-slate-parser',
  },
  'fanduel-slates': {
    id: 'fanduel-slates',
    name: 'FanDuel Slates',
    type: 'slates',
    url: 'https://api.fanduel.com/contests',
    weight: 1.0,
    enabled: true,
    refreshInterval: 15,
    format: 'json',
    parser: 'fanduel-slate-parser',
  },
};

// ============================================================================
// DFS BLOG FEEDS (Feedly-style integration)
// ============================================================================

export const DFS_BLOG_FEEDS = [
  {
    name: 'RotoGrinders',
    url: 'https://rotogrinders.com/feeds/articles',
    category: 'strategy',
    priority: 'high',
  },
  {
    name: 'FantasyLabs',
    url: 'https://www.fantasylabs.com/feed/',
    category: 'analytics',
    priority: 'high',
  },
  {
    name: 'Awesemo',
    url: 'https://www.awesemo.com/feed/',
    category: 'strategy',
    priority: 'medium',
  },
  {
    name: 'DFS Goldmine',
    url: 'https://dfsgoldmine.com/feed/',
    category: 'strategy',
    priority: 'medium',
  },
  {
    name: 'DFS Army',
    url: 'https://www.dfsarmy.com/feed/',
    category: 'news',
    priority: 'medium',
  },
  {
    name: 'FantasyPros DFS',
    url: 'https://www.fantasypros.com/daily-fantasy/feed/',
    category: 'consensus',
    priority: 'high',
  },
  {
    name: 'DFS Edge',
    url: 'https://dfsedge.com/feed/',
    category: 'strategy',
    priority: 'low',
  },
  {
    name: 'LineStar',
    url: 'https://linestarapp.com/blog/feed/',
    category: 'tools',
    priority: 'medium',
  },
];

// ============================================================================
// DATA SOURCE ADAPTERS
// ============================================================================

export class DataSourceAdapter {
  private source: DataSource;

  constructor(source: DataSource) {
    this.source = source;
  }

  async fetch(): Promise<any> {
    try {
      const headers: Record<string, string> = {
        'User-Agent': 'DFS-Optimizer-Pro/1.0.0',
        Accept: 'application/json, text/xml, text/csv, */*',
      };

      if (this.source.apiKey) {
        headers['Authorization'] = `Bearer ${this.source.apiKey}`;
        // Or API-specific header formats
        headers['X-API-Key'] = this.source.apiKey;
      }

      const response = await axios.get(this.source.url, {
        headers,
        timeout: 30000,
        validateStatus: status => status < 500, // Don't throw on 4xx
      });

      if (response.status >= 400) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Update last updated timestamp
      this.source.lastUpdated = new Date();

      return this.parseResponse(response.data);
    } catch (error) {
      console.error(`Failed to fetch from ${this.source.name}:`, error);
      throw new Error(
        `Data source ${this.source.name} failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private parseResponse(data: any): any {
    switch (this.source.parser) {
      case 'json-parser':
        return this.parseJson(data);
      case 'csv-parser':
        return this.parseCsv(data);
      case 'rss-parser':
        return this.parseRss(data);
      case 'rotowire-parser':
        return this.parseRotowire(data);
      case 'fantasypros-parser':
        return this.parseFantasyPros(data);
      case 'sabersim-parser':
        return this.parseSaberSim(data);
      case 'stokastic-parser':
        return this.parseStokastic(data);
      default:
        return data;
    }
  }

  private parseJson(data: any): any {
    return data;
  }

  private parseCsv(data: string): any[] {
    // Basic CSV parsing - in production use csv-parse
    const lines = data.split('\n');
    const headers = lines[0].split(',');
    return lines.slice(1).map(line => {
      const values = line.split(',');
      const obj: any = {};
      headers.forEach((header, index) => {
        obj[header.trim()] = values[index]?.trim();
      });
      return obj;
    });
  }

  private parseRss(data: string): any[] {
    // Basic RSS parsing - in production use xml2js or rss-parser
    const items: any[] = [];
    const itemMatches = data.match(/<item>(.*?)<\/item>/gs);

    if (itemMatches) {
      itemMatches.forEach(item => {
        const title = item.match(/<title>(.*?)<\/title>/s)?.[1];
        const link = item.match(/<link>(.*?)<\/link>/s)?.[1];
        const description = item.match(/<description>(.*?)<\/description>/s)?.[1];
        const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/s)?.[1];

        if (title && link) {
          items.push({
            title: title.trim(),
            link: link.trim(),
            description: description?.trim(),
            publishedAt: pubDate ? new Date(pubDate.trim()) : new Date(),
            source: this.source.name,
          });
        }
      });
    }

    return items;
  }

  private parseRotowire(data: any): any {
    // RotoWire-specific parsing logic
    return {
      players: data.players || [],
      projections: data.projections || [],
      lastUpdated: new Date(),
      source: 'rotowire',
    };
  }

  private parseFantasyPros(data: any): any {
    // FantasyPros-specific parsing logic
    return {
      consensus: data.consensus || [],
      experts: data.experts || [],
      lastUpdated: new Date(),
      source: 'fantasypros',
    };
  }

  private parseSaberSim(data: any): any {
    // SaberSim-specific parsing logic
    return {
      projections: data.projections || [],
      ownership: data.ownership || [],
      simulations: data.simulations || [],
      lastUpdated: new Date(),
      source: 'sabersim',
    };
  }

  private parseStokastic(data: any): any {
    // Stokastic-specific parsing logic
    return {
      projections: data.projections || [],
      ownership: data.ownership || [],
      leverage: data.leverage || [],
      lastUpdated: new Date(),
      source: 'stokastic',
    };
  }
}

// ============================================================================
// DATA SOURCE MANAGER
// ============================================================================

export class DataSourceManager {
  private adapters: Map<string, DataSourceAdapter> = new Map();

  constructor() {
    // Initialize adapters for all enabled sources
    Object.values(DATA_SOURCES).forEach(source => {
      if (source.enabled) {
        this.adapters.set(source.id, new DataSourceAdapter(source));
      }
    });
  }

  async fetchFromSource(sourceId: string): Promise<any> {
    const adapter = this.adapters.get(sourceId);
    if (!adapter) {
      throw new Error(`Data source not found: ${sourceId}`);
    }

    return adapter.fetch();
  }

  async fetchFromSources(sourceIds: string[]): Promise<Record<string, any>> {
    const results: Record<string, any> = {};
    const promises = sourceIds.map(async sourceId => {
      try {
        const data = await this.fetchFromSource(sourceId);
        results[sourceId] = { success: true, data };
      } catch (error) {
        results[sourceId] = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    });

    await Promise.allSettled(promises);
    return results;
  }

  getEnabledSources(type?: string): DataSource[] {
    return Object.values(DATA_SOURCES).filter(
      source => source.enabled && (!type || source.type === type)
    );
  }

  async refreshAllSources(): Promise<Record<string, any>> {
    const enabledSourceIds = this.getEnabledSources().map(s => s.id);
    return this.fetchFromSources(enabledSourceIds);
  }

  // Projection blending with weights
  blendProjections(projectionData: Record<string, any>): any[] {
    const blendedProjections: Record<string, any> = {};
    let totalWeight = 0;

    // Calculate weighted averages
    Object.entries(projectionData).forEach(([sourceId, sourceData]) => {
      if (!sourceData.success) return;

      const source = DATA_SOURCES[sourceId];
      if (!source || source.type !== 'projections') return;

      const weight = source.weight;
      totalWeight += weight;

      sourceData.data.projections?.forEach((player: any) => {
        const playerId = player.id || player.playerId;
        if (!blendedProjections[playerId]) {
          blendedProjections[playerId] = {
            id: playerId,
            name: player.name,
            position: player.position,
            team: player.team,
            projection: 0,
            floor: 0,
            ceiling: 0,
            totalWeight: 0,
            sources: [],
          };
        }

        const playerBlend = blendedProjections[playerId];
        playerBlend.projection += (player.projection || 0) * weight;
        playerBlend.floor += (player.floor || player.projection * 0.7) * weight;
        playerBlend.ceiling += (player.ceiling || player.projection * 1.4) * weight;
        playerBlend.totalWeight += weight;
        playerBlend.sources.push(source.name);
      });
    });

    // Normalize by total weight
    return Object.values(blendedProjections).map((player: any) => ({
      ...player,
      projection: player.projection / player.totalWeight,
      floor: player.floor / player.totalWeight,
      ceiling: player.ceiling / player.totalWeight,
    }));
  }

  // Ownership inference when data is missing
  inferOwnership(players: any[]): any[] {
    return players.map(player => {
      if (player.ownership) return player;

      // Ownership inference based on salary and projection
      const salaryFactor = Math.log(player.salary / 3000) / Math.log(10); // 0-1 scale
      const projectionFactor = player.projection / 30; // Normalize to ~0-1
      const positionFactor = this.getPositionOwnershipFactor(player.position);

      // Basic ownership curve: higher salary + higher projection = higher ownership
      let inferredOwnership =
        salaryFactor * 0.4 + projectionFactor * 0.4 + positionFactor * 0.2;

      // Clamp to reasonable range
      inferredOwnership = Math.max(0.02, Math.min(0.6, inferredOwnership));

      return {
        ...player,
        ownership: inferredOwnership,
        ownershipInferred: true,
      };
    });
  }

  private getPositionOwnershipFactor(position: string): number {
    // Position-based ownership modifiers
    const factors: Record<string, number> = {
      QB: 0.3, // QBs tend to have higher ownership
      RB: 0.25,
      WR: 0.2,
      TE: 0.15,
      DST: 0.1, // DSTs tend to have lower ownership
    };
    return factors[position] || 0.2;
  }
}

// ============================================================================
// MOCK DATA PROVIDER (for offline development)
// ============================================================================

export class MockDataProvider {
  static generateMockProjections(playerCount: number = 50): any[] {
    const positions = ['QB', 'RB', 'WR', 'TE', 'DST'];
    const teams = ['BUF', 'MIA', 'NYJ', 'NE', 'KC', 'LV', 'LAC', 'DEN'];

    return Array.from({ length: playerCount }, (_, i) => {
      const position = positions[i % positions.length];
      const team = teams[i % teams.length];
      const baseProjection = this.getBaseProjection(position);

      return {
        id: `player_${i + 1}`,
        name: `Player ${i + 1}`,
        position,
        team,
        salary: Math.floor(Math.random() * 5000) + 3000,
        projection: baseProjection + (Math.random() - 0.5) * 8,
        floor: baseProjection * 0.6,
        ceiling: baseProjection * 1.5,
        ownership: Math.random() * 0.4 + 0.05,
        lastUpdated: new Date(),
      };
    });
  }

  static generateMockNews(count: number = 20): any[] {
    const headlines = [
      'Week 1 DFS Strategy: Target These Leverage Plays',
      'Injury Report Update: Key Players Questionable',
      'Weather Alert: Wind Could Impact Passing Games',
      'Vegas Line Movement: Totals Rising in Key Games',
      'Ownership Projections: Chalk Players to Avoid',
      'Late Swap Strategy: How to Pivot After 1PM Games',
      'Stack Analysis: Best QB-WR Combinations',
      'Value Plays: Cheap Players with Upside',
      'Tournament Strategy: Building Contrarian Lineups',
      'Cash Game Approach: High Floor Players',
    ];

    return Array.from({ length: count }, (_, i) => ({
      id: `news_${i + 1}`,
      title: headlines[i % headlines.length],
      summary: `Analysis and insights for DFS optimization...`,
      url: `https://example.com/article/${i + 1}`,
      publishedAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
      source: 'Mock DFS Blog',
      category: 'strategy',
    }));
  }

  private static getBaseProjection(position: string): number {
    const baseProjections: Record<string, number> = {
      QB: 20,
      RB: 15,
      WR: 12,
      TE: 10,
      DST: 8,
    };
    return baseProjections[position] || 10;
  }
}

// ============================================================================
// EXPORT
// ============================================================================

export const dataSourceManager = new DataSourceManager();
