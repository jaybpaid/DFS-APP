// MCP Server Configuration
interface MCPServerConfig {
  name: string;
  capabilities: string[];
  refreshInterval: number;
  priority: number;
  enabled: boolean;
}

interface LiveDataFeed {
  type:
    | 'news'
    | 'weather'
    | 'injuries'
    | 'ownership'
    | 'vegas'
    | 'research'
    | 'analysis';
  source: string;
  data: any;
  timestamp: number;
  reliability: number;
  stale: boolean;
}

interface DFSMarketData {
  playerNews: any[];
  weatherUpdates: any[];
  injuryReports: any[];
  ownershipProjections: any[];
  vegasLines: any[];
  researchInsights: any[];
  correlationUpdates: any[];
  lastUpdated: number;
}

class LiveMCPIntegration {
  private mcpClient: MCPClient;
  private dataFeeds: Map<string, LiveDataFeed> = new Map();
  private refreshIntervals: Map<string, NodeJS.Timeout> = new Map();
  private subscribers: Map<string, ((data: any) => void)[]> = new Map();
  private isActive: boolean = true;

  constructor() {
    this.mcpClient = new MCPClient();
    this.initializeMCPServers();
  }

  private mcpServers: MCPServerConfig[] = [
    {
      name: 'brave-search-mcp',
      capabilities: ['news', 'player_search', 'injury_updates'],
      refreshInterval: 300000, // 5 minutes
      priority: 1,
      enabled: true,
    },
    {
      name: 'docker-gateway',
      capabilities: ['dfs_research', 'market_analysis', 'optimization_insights'],
      refreshInterval: 180000, // 3 minutes
      priority: 1,
      enabled: true,
    },
    {
      name: 'memory-mcp-server',
      capabilities: ['knowledge_graph', 'context_storage', 'pattern_recognition'],
      refreshInterval: 600000, // 10 minutes
      priority: 2,
      enabled: true,
    },
    {
      name: 'aws-kb-retrieval-mcp',
      capabilities: ['knowledge_base', 'expert_insights', 'strategy_recommendations'],
      refreshInterval: 900000, // 15 minutes
      priority: 2,
      enabled: true,
    },
    {
      name: 'context7-mcp',
      capabilities: ['documentation', 'library_updates', 'best_practices'],
      refreshInterval: 1800000, // 30 minutes
      priority: 3,
      enabled: true,
    },
  ];

  private async initializeMCPServers(): Promise<void> {
    for (const server of this.mcpServers) {
      if (server.enabled) {
        await this.startDataFeed(server);
      }
    }
  }

  private async startDataFeed(server: MCPServerConfig): Promise<void> {
    // Start periodic data refresh for each server
    const interval = setInterval(async () => {
      if (!this.isActive) return;

      try {
        await this.refreshServerData(server);
      } catch (error) {
        console.error(`Error refreshing data from ${server.name}:`, error);
      }
    }, server.refreshInterval);

    this.refreshIntervals.set(server.name, interval);

    // Initial data fetch
    await this.refreshServerData(server);
  }

  private async refreshServerData(server: MCPServerConfig): Promise<void> {
    switch (server.name) {
      case 'brave-search-mcp':
        await this.fetchNewsAndInjuries();
        break;
      case 'docker-gateway':
        await this.fetchDFSResearchData();
        break;
      case 'memory-mcp-server':
        await this.updateKnowledgeGraph();
        break;
      case 'aws-kb-retrieval-mcp':
        await this.fetchExpertInsights();
        break;
      case 'context7-mcp':
        await this.fetchStrategyUpdates();
        break;
    }
  }

  private async fetchNewsAndInjuries(): Promise<void> {
    try {
      // Search for NFL injury news
      const injuryNews = await this.mcpClient.useTool(
        'brave-search-mcp',
        'brave_web_search',
        {
          query: 'NFL injury report latest updates today',
          count: 10,
        }
      );

      // Search for player news
      const playerNews = await this.mcpClient.useTool(
        'brave-search-mcp',
        'brave_web_search',
        {
          query: 'NFL player news fantasy football updates',
          count: 15,
        }
      );

      // Search for weather updates
      const weatherNews = await this.mcpClient.useTool(
        'brave-search-mcp',
        'brave_web_search',
        {
          query: 'NFL weather forecast Sunday games wind rain',
          count: 8,
        }
      );

      // Update data feeds
      this.updateDataFeed('injury_reports', {
        type: 'injuries',
        source: 'brave-search',
        data: injuryNews,
        timestamp: Date.now(),
        reliability: 0.85,
        stale: false,
      });

      this.updateDataFeed('player_news', {
        type: 'news',
        source: 'brave-search',
        data: playerNews,
        timestamp: Date.now(),
        reliability: 0.8,
        stale: false,
      });

      this.updateDataFeed('weather_updates', {
        type: 'weather',
        source: 'brave-search',
        data: weatherNews,
        timestamp: Date.now(),
        reliability: 0.75,
        stale: false,
      });
    } catch (error) {
      console.error('Error fetching news and injuries:', error);
    }
  }

  private async fetchDFSResearchData(): Promise<void> {
    try {
      // Use GPT Researcher for comprehensive DFS market analysis
      const marketResearch = await this.mcpClient.useTool(
        'docker-gateway',
        'gpt_researcher',
        {
          query: 'NFL DFS Week 3 player analysis ownership projections',
          research_type: 'comprehensive',
        }
      );

      // Use Serena code analysis for optimization insights
      const optimizationInsights = await this.mcpClient.useTool(
        'docker-gateway',
        'serena_code_analysis',
        {
          code_path: '/dfs-analysis',
          analysis_type: 'performance',
        }
      );

      // Use Google GenAI for enhanced insights
      const aiInsights = await this.mcpClient.useTool(
        'docker-gateway',
        'google_genai_toolbox',
        {
          task: 'DFS lineup optimization recommendations',
          context: 'NFL Week 3 main slate analysis',
        }
      );

      this.updateDataFeed('market_research', {
        type: 'research',
        source: 'gpt-researcher',
        data: marketResearch,
        timestamp: Date.now(),
        reliability: 0.9,
        stale: false,
      });

      this.updateDataFeed('optimization_insights', {
        type: 'analysis',
        source: 'serena-analysis',
        data: optimizationInsights,
        timestamp: Date.now(),
        reliability: 0.88,
        stale: false,
      });

      this.updateDataFeed('ai_insights', {
        type: 'research',
        source: 'google-genai',
        data: aiInsights,
        timestamp: Date.now(),
        reliability: 0.85,
        stale: false,
      });
    } catch (error) {
      console.error('Error fetching DFS research data:', error);
    }
  }

  private async updateKnowledgeGraph(): Promise<void> {
    try {
      // Create entities for current slate players and trends
      const currentPlayers = await this.getCurrentSlateData();

      if (currentPlayers.length > 0) {
        const entities = currentPlayers.map((player: any) => ({
          name: player.name,
          entityType: 'NFLPlayer',
          observations: [
            `Position: ${player.position}`,
            `Team: ${player.team}`,
            `Salary: $${player.salary}`,
            `Projection: ${player.projection} pts`,
            `Ownership: ${player.ownership}%`,
          ],
        }));

        await this.mcpClient.useTool('memory-mcp-server', 'create_entities', {
          entities: entities.slice(0, 10), // Limit to prevent overwhelming the knowledge graph
        });

        // Update data feed
        this.updateDataFeed('knowledge_graph', {
          type: 'analysis',
          source: 'memory-server',
          data: { players: entities.length },
          timestamp: Date.now(),
          reliability: 0.95,
          stale: false,
        });
      }
    } catch (error) {
      console.error('Error updating knowledge graph:', error);
    }
  }

  private async fetchExpertInsights(): Promise<void> {
    try {
      // Retrieve expert DFS strategies from knowledge base
      const expertInsights = await this.mcpClient.useTool(
        'aws-kb-retrieval-mcp',
        'retrieve_from_aws_kb',
        {
          query: 'NFL DFS strategy optimal lineup construction',
          knowledgeBaseId: 'dfs-strategies-kb',
          n: 5,
        }
      );

      this.updateDataFeed('expert_insights', {
        type: 'research',
        source: 'aws-knowledge-base',
        data: expertInsights,
        timestamp: Date.now(),
        reliability: 0.92,
        stale: false,
      });
    } catch (error) {
      console.error('Error fetching expert insights:', error);
    }
  }

  private async fetchStrategyUpdates(): Promise<void> {
    try {
      // Get latest DFS optimization strategies and documentation
      const strategyDocs = await this.mcpClient.useTool(
        'context7-mcp',
        'get-library-docs',
        {
          context7CompatibleLibraryID: '/dfs/optimization',
          topic: 'advanced strategies',
          tokens: 2000,
        }
      );

      this.updateDataFeed('strategy_updates', {
        type: 'research',
        source: 'context7-docs',
        data: strategyDocs,
        timestamp: Date.now(),
        reliability: 0.8,
        stale: false,
      });
    } catch (error) {
      console.error('Error fetching strategy updates:', error);
    }
  }

  private async getCurrentSlateData(): Promise<any[]> {
    // Mock implementation - in real app this would fetch from API
    return [
      {
        name: 'Josh Allen',
        position: 'QB',
        team: 'BUF',
        salary: 8000,
        projection: 23.4,
        ownership: 25.6,
      },
      {
        name: 'Christian McCaffrey',
        position: 'RB',
        team: 'SF',
        salary: 9200,
        projection: 21.8,
        ownership: 18.2,
      },
      {
        name: 'Cooper Kupp',
        position: 'WR',
        team: 'LAR',
        salary: 7800,
        projection: 18.9,
        ownership: 22.1,
      },
    ];
  }

  private updateDataFeed(key: string, feed: LiveDataFeed): void {
    this.dataFeeds.set(key, feed);

    // Notify subscribers
    const subscribers = this.subscribers.get(key) || [];
    subscribers.forEach(callback => callback(feed));

    // Store in memory server for persistence
    this.storeInMemory(key, feed);
  }

  private async storeInMemory(key: string, feed: LiveDataFeed): Promise<void> {
    try {
      await this.mcpClient.useTool('memory-mcp-server', 'add_observations', {
        observations: [
          {
            entityName: 'DFSLiveData',
            contents: [`${key}: ${JSON.stringify(feed).substring(0, 500)}...`],
          },
        ],
      });
    } catch (error) {
      console.error('Error storing in memory:', error);
    }
  }

  // Public API methods
  public subscribe(feedType: string, callback: (data: any) => void): () => void {
    const subscribers = this.subscribers.get(feedType) || [];
    subscribers.push(callback);
    this.subscribers.set(feedType, subscribers);

    // Return unsubscribe function
    return () => {
      const updatedSubscribers = this.subscribers.get(feedType) || [];
      const index = updatedSubscribers.indexOf(callback);
      if (index > -1) {
        updatedSubscribers.splice(index, 1);
        this.subscribers.set(feedType, updatedSubscribers);
      }
    };
  }

  public getDataFeed(key: string): LiveDataFeed | null {
    return this.dataFeeds.get(key) || null;
  }

  public getAllDataFeeds(): Map<string, LiveDataFeed> {
    return new Map(this.dataFeeds);
  }

  public async getMarketData(): Promise<DFSMarketData> {
    const playerNews = this.getDataFeed('player_news');
    const weatherUpdates = this.getDataFeed('weather_updates');
    const injuryReports = this.getDataFeed('injury_reports');
    const marketResearch = this.getDataFeed('market_research');
    const expertInsights = this.getDataFeed('expert_insights');

    return {
      playerNews: playerNews?.data || [],
      weatherUpdates: weatherUpdates?.data || [],
      injuryReports: injuryReports?.data || [],
      ownershipProjections: [],
      vegasLines: [],
      researchInsights: [
        ...(marketResearch?.data || []),
        ...(expertInsights?.data || []),
      ],
      correlationUpdates: [],
      lastUpdated: Math.max(
        playerNews?.timestamp || 0,
        weatherUpdates?.timestamp || 0,
        injuryReports?.timestamp || 0,
        marketResearch?.timestamp || 0,
        expertInsights?.timestamp || 0
      ),
    };
  }

  public async triggerResearchAnalysis(query: string): Promise<any> {
    try {
      const research = await this.mcpClient.useTool(
        'docker-gateway',
        'gpt_researcher',
        {
          query,
          research_type: 'comprehensive',
        }
      );

      // Store results
      this.updateDataFeed('manual_research', {
        type: 'research',
        source: 'manual-trigger',
        data: research,
        timestamp: Date.now(),
        reliability: 0.9,
        stale: false,
      });

      return research;
    } catch (error) {
      console.error('Error triggering research analysis:', error);
      return null;
    }
  }

  public async analyzeOptimizerPerformance(codePath: string): Promise<any> {
    try {
      const analysis = await this.mcpClient.useTool(
        'docker-gateway',
        'serena_code_analysis',
        {
          code_path: codePath,
          analysis_type: 'comprehensive',
        }
      );

      this.updateDataFeed('optimizer_analysis', {
        type: 'analysis',
        source: 'serena-analysis',
        data: analysis,
        timestamp: Date.now(),
        reliability: 0.88,
        stale: false,
      });

      return analysis;
    } catch (error) {
      console.error('Error analyzing optimizer performance:', error);
      return null;
    }
  }

  public async enhanceWithAI(task: string, context?: string): Promise<any> {
    try {
      const enhancement = await this.mcpClient.useTool(
        'docker-gateway',
        'google_genai_toolbox',
        {
          task,
          context: context || 'DFS optimization context',
        }
      );

      this.updateDataFeed('ai_enhancement', {
        type: 'analysis',
        source: 'google-genai',
        data: enhancement,
        timestamp: Date.now(),
        reliability: 0.85,
        stale: false,
      });

      return enhancement;
    } catch (error) {
      console.error('Error enhancing with AI:', error);
      return null;
    }
  }

  public async searchPlayerNews(playerName: string): Promise<any> {
    try {
      const news = await this.mcpClient.useTool(
        'brave-search-mcp',
        'brave_web_search',
        {
          query: `${playerName} NFL injury news fantasy football`,
          count: 5,
        }
      );

      return news;
    } catch (error) {
      console.error('Error searching player news:', error);
      return null;
    }
  }

  public async getWeatherForGames(games: string[]): Promise<any> {
    try {
      const weatherPromises = games.map(game =>
        this.mcpClient.useTool('brave-search-mcp', 'brave_web_search', {
          query: `${game} NFL weather forecast wind rain temperature`,
          count: 3,
        })
      );

      const weatherResults = await Promise.all(weatherPromises);

      return weatherResults.map((result, index) => ({
        game: games[index],
        weather: result,
      }));
    } catch (error) {
      console.error('Error fetching weather data:', error);
      return [];
    }
  }

  public async storeCorrelationData(correlations: any[]): Promise<void> {
    try {
      // Store correlation patterns in knowledge graph
      const correlationEntities = correlations.map(corr => ({
        name: `Correlation_${corr.playerId1}_${corr.playerId2}`,
        entityType: 'PlayerCorrelation',
        observations: [
          `Player 1: ${corr.playerId1}`,
          `Player 2: ${corr.playerId2}`,
          `Correlation: ${corr.correlation}`,
          `Type: ${corr.type}`,
          `Confidence: ${corr.confidence}`,
        ],
      }));

      await this.mcpClient.useTool('memory-mcp-server', 'create_entities', {
        entities: correlationEntities.slice(0, 20), // Limit batch size
      });
    } catch (error) {
      console.error('Error storing correlation data:', error);
    }
  }

  public async queryKnowledgeGraph(query: string): Promise<any> {
    try {
      const results = await this.mcpClient.useTool(
        'memory-mcp-server',
        'search_nodes',
        {
          query,
        }
      );

      return results;
    } catch (error) {
      console.error('Error querying knowledge graph:', error);
      return null;
    }
  }

  public getDataFreshness(): { [key: string]: { age: number; stale: boolean } } {
    const now = Date.now();
    const freshness: { [key: string]: { age: number; stale: boolean } } = {};

    this.dataFeeds.forEach((feed, key) => {
      const age = now - feed.timestamp;
      freshness[key] = {
        age: Math.round(age / 1000 / 60), // Age in minutes
        stale: age > 600000, // Stale if older than 10 minutes
      };
    });

    return freshness;
  }

  public getServerStatus(): { [key: string]: { status: string; lastUpdate: number } } {
    const status: { [key: string]: { status: string; lastUpdate: number } } = {};

    this.mcpServers.forEach(server => {
      const serverFeeds = Array.from(this.dataFeeds.values()).filter(feed =>
        feed.source.includes(server.name.split('-')[0])
      );

      const lastUpdate = Math.max(...serverFeeds.map(feed => feed.timestamp), 0);
      const isHealthy = Date.now() - lastUpdate < server.refreshInterval * 2;

      status[server.name] = {
        status: isHealthy ? 'healthy' : 'stale',
        lastUpdate,
      };
    });

    return status;
  }

  public pauseLiveFeeds(): void {
    this.isActive = false;
  }

  public resumeLiveFeeds(): void {
    this.isActive = true;
  }

  public destroy(): void {
    this.isActive = false;

    // Clear all intervals
    this.refreshIntervals.forEach(interval => {
      clearInterval(interval);
    });

    this.refreshIntervals.clear();
    this.dataFeeds.clear();
    this.subscribers.clear();
  }

  // Static methods for easy integration
  public static async createResearchWorkflow(topic: string): Promise<any> {
    const integration = new LiveMCPIntegration();

    try {
      // Use Claude Flow for workflow management
      const workflow = await integration.mcpClient.useTool(
        'docker-gateway',
        'claude_flow',
        {
          workflow_name: `DFS_Research_${topic}`,
          steps: [
            'Gather player news and updates',
            'Analyze weather conditions',
            'Research ownership projections',
            'Generate correlation insights',
            'Compile actionable recommendations',
          ],
        }
      );

      return workflow;
    } catch (error) {
      console.error('Error creating research workflow:', error);
      return null;
    }
  }

  public static async getComprehensiveSlateAnalysis(slateId: string): Promise<any> {
    const integration = new LiveMCPIntegration();

    try {
      // Multi-step analysis using various MCP servers
      const [newsData, weatherData, researchData, expertData] = await Promise.all([
        integration.mcpClient.useTool('brave-search-mcp', 'brave_web_search', {
          query: `NFL slate ${slateId} player news injuries updates`,
          count: 10,
        }),
        integration.mcpClient.useTool('brave-search-mcp', 'brave_web_search', {
          query: `NFL weather forecast games ${slateId}`,
          count: 5,
        }),
        integration.mcpClient.useTool('docker-gateway', 'gpt_researcher', {
          query: `NFL DFS slate analysis ${slateId} optimal plays`,
          research_type: 'comprehensive',
        }),
        integration.mcpClient.useTool('docker-gateway', 'google_genai_toolbox', {
          task: 'DFS slate optimization strategy',
          context: `NFL slate ${slateId} comprehensive analysis`,
        }),
      ]);

      return {
        slateId,
        news: newsData,
        weather: weatherData,
        research: researchData,
        expertInsights: expertData,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error('Error getting comprehensive slate analysis:', error);
      return null;
    }
  }
}

// MCP Client implementation
class MCPClient {
  async useTool(serverName: string, toolName: string, args: any): Promise<any> {
    try {
      // This would typically make a real MCP call
      // For now, returning mock data structure
      return {
        success: true,
        data: {
          serverName,
          toolName,
          args,
          result: `Mock result for ${toolName}`,
          timestamp: Date.now(),
        },
      };
    } catch (error) {
      console.error(`MCP tool call failed: ${serverName}.${toolName}`, error);
      throw error;
    }
  }
}

// Singleton instance
let liveMCPInstance: LiveMCPIntegration | null = null;

export const getLiveMCPIntegration = (): LiveMCPIntegration => {
  if (!liveMCPInstance) {
    liveMCPInstance = new LiveMCPIntegration();
  }
  return liveMCPInstance;
};

export { LiveMCPIntegration, type DFSMarketData, type LiveDataFeed };
