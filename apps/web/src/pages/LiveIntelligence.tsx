import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  Activity,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Clock,
  Zap,
  CloudRain,
  Users,
  DollarSign,
  Target,
  RefreshCw,
} from 'lucide-react';
import { DashboardStats } from '@shared/schema';

interface DataSourceStatus {
  name: string;
  status: 'active' | 'warning' | 'error';
  lastUpdate: string;
  health: number;
}

interface McpHealth {
  status: string;
  response_time: number;
  uptime: number;
}

interface McpInsight {
  title: string;
  description: string;
  confidence: number;
}

export default function LiveIntelligence() {
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [nextRefresh, setNextRefresh] = useState(30);
  const [isLive, setIsLive] = useState(true);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [dataSourceStatus, setDataSourceStatus] = useState<DataSourceStatus[]>([]);
  const [mcpInsights, setMcpInsights] = useState<McpInsight[]>([]);
  const [mcpHealth, setMcpHealth] = useState<Record<string, McpHealth>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch real dashboard stats
  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/dashboard/stats');
      if (!response.ok) throw new Error('Failed to fetch dashboard stats');
      const data = await response.json();
      setDashboardStats(data);

      // Transform API data to component format
      const transformedSources: DataSourceStatus[] = data.dataSources.map(
        (source: any) => ({
          name: getDisplayName(source.name),
          status:
            source.status === 'success'
              ? 'active'
              : source.status === 'warning'
                ? 'warning'
                : 'error',
          lastUpdate: getRelativeTime(source.last_updated),
          health:
            source.status === 'success' ? 100 : source.status === 'warning' ? 75 : 0,
        })
      );

      setDataSourceStatus(transformedSources);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch MCP live data feeds
  const fetchMcpData = async () => {
    try {
      // Fetch MCP status and insights in parallel
      const [mcpStatusRes, mcpInsightsRes, mcpHealthRes] = await Promise.all([
        fetch('http://localhost:8000/api/status'),
        fetch('http://localhost:8000/api/mcp/market-insights'),
        fetch('http://localhost:8000/api/mcp/health'),
      ]);

      if (mcpStatusRes.ok) {
        const mcpStatus = await mcpStatusRes.json();

        // Update dashboard stats with MCP data
        setDashboardStats(prev => ({
          ...prev,
          playerCount: mcpStatus.data_sources?.player_pool || prev?.playerCount || 0,
          lineupCount: prev?.lineupCount || 0,
          simulationCount: prev?.simulationCount || 0,
          lastUpdate: prev?.lastUpdate || new Date().toISOString(),
          dataSources: prev?.dataSources || [],
          totalPlayers: prev?.totalPlayers || 0,
          activePlayers: prev?.activePlayers || 0,
          questionablePlayers: prev?.questionablePlayers || 0,
          outPlayers: prev?.outPlayers || 0,
          averageSalary: prev?.averageSalary || 0,
          averageProjection: prev?.averageProjection || 0,
          topProjectedPlayer: prev?.topProjectedPlayer || ({} as any),
          topValuePlayer: prev?.topValuePlayer || ({} as any),
        }));
      }

      if (mcpInsightsRes.ok) {
        const insights = await mcpInsightsRes.json();
        setMcpInsights(insights.insights || []);
      }

      if (mcpHealthRes.ok) {
        const health = await mcpHealthRes.json();
        setMcpHealth(health);
      }
    } catch (err) {
      console.warn('MCP data fetch failed:', err);
    }
  };

  // Helper functions
  const getDisplayName = (apiName: string): string => {
    const nameMap: Record<string, string> = {
      nflfastr: 'NFL FastR Data',
      nfl_injuries: 'Injury Reports',
      weather: 'Weather Data',
      odds: 'Vegas Lines',
      draftkings: 'DraftKings API',
      ownership: 'Ownership Data',
    };
    return nameMap[apiName] || apiName;
  };

  const getRelativeTime = (timestamp: string): string => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  // Real-time updates and data fetching
  useEffect(() => {
    fetchDashboardStats(); // Initial fetch
    fetchMcpData(); // Initial MCP fetch

    const interval = setInterval(() => {
      if (nextRefresh > 0) {
        setNextRefresh(prev => prev - 1);
      } else {
        setLastUpdate(new Date());
        setNextRefresh(30);
        fetchDashboardStats(); // Refresh data
        fetchMcpData(); // Refresh MCP data
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [nextRefresh]);

  // Force refresh handler
  const handleForceRefresh = () => {
    setNextRefresh(30);
    fetchDashboardStats();
    fetchMcpData();
  };

  // Convert MCP insights to breaking news format
  const breakingNews = mcpInsights.map((insight: McpInsight, index) => ({
    time: `${index * 5 + 2} min ago`,
    player: insight.title || 'Market Alert',
    news: insight.description || 'No details available',
    impact:
      insight.confidence > 0.85
        ? 'positive'
        : insight.confidence < 0.7
          ? 'negative'
          : 'neutral',
    leverageChange: `${Math.round(insight.confidence * 100)}%`,
  }));

  const leverageOpportunities = [
    {
      player: 'Derrick Henry',
      position: 'RB',
      leverage: 8.7,
      ownership: 12.3,
      reason: 'Low owned, high upside',
    },
    {
      player: 'DeVonta Smith',
      position: 'WR',
      leverage: 7.2,
      ownership: 18.5,
      reason: 'Weather fade opportunity',
    },
    {
      player: 'Justin Tucker',
      position: 'K',
      leverage: 5.9,
      ownership: 8.1,
      reason: 'Contrarian kicker play',
    },
  ];

  const marketMovements = [
    {
      game: 'BUF @ MIA',
      stat: 'Total',
      movement: '+2.5',
      current: '47.5',
      impact: 'Increased passing',
    },
    {
      game: 'SF @ ARI',
      stat: 'Spread',
      movement: '-1.0',
      current: 'SF -3.5',
      impact: 'Closer game script',
    },
    {
      game: 'KC @ DEN',
      stat: 'Total',
      movement: '+1.5',
      current: '44.5',
      impact: 'Weather improved',
    },
  ];

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white'>
      {/* Header */}
      <div className='border-b border-slate-700 bg-slate-900/50 backdrop-blur p-6'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-4'>
            <div className='flex items-center gap-2'>
              <Activity className='w-6 h-6 text-green-400' />
              <h1 className='text-2xl font-bold'>Live Intelligence</h1>
              {isLive && (
                <Badge
                  variant='outline'
                  className='border-green-500 text-green-400 animate-pulse'
                >
                  <div className='w-2 h-2 bg-green-400 rounded-full mr-1' />
                  LIVE
                </Badge>
              )}
            </div>
            <Separator orientation='vertical' className='h-6' />
            <div className='text-sm text-slate-400'>
              Last Update: {lastUpdate.toLocaleTimeString()}
            </div>
          </div>

          <div className='flex items-center gap-4'>
            <div className='flex items-center gap-2 text-sm'>
              <Clock className='w-4 h-4' />
              Next refresh: {nextRefresh}s
            </div>
            <Button
              variant='outline'
              size='sm'
              className='border-slate-600'
              onClick={handleForceRefresh}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Force Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className='p-6 space-y-6'>
        {/* Data Source Status */}
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          <Card className='lg:col-span-2 bg-slate-800/50 border-slate-700'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Activity className='w-5 h-5' />
                Data Source Health
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              {dataSourceStatus.map((source, idx) => (
                <div
                  key={idx}
                  className='flex items-center justify-between p-3 rounded-lg bg-slate-700/30'
                >
                  <div className='flex items-center gap-3'>
                    <div
                      className={`w-3 h-3 rounded-full ${
                        source.status === 'active'
                          ? 'bg-green-400'
                          : source.status === 'warning'
                            ? 'bg-yellow-400'
                            : 'bg-red-400'
                      }`}
                    />
                    <div>
                      <div className='font-medium'>{source.name}</div>
                      <div className='text-sm text-slate-400'>{source.lastUpdate}</div>
                    </div>
                  </div>
                  <div className='text-right'>
                    <div className='text-sm font-medium'>{source.health}%</div>
                    <Progress value={source.health} className='w-20 h-2' />
                  </div>
                </div>
              ))}

              {/* MCP Servers Health */}
              {Object.entries(mcpHealth).map(
                ([serverName, health]: [string, McpHealth], idx) => (
                  <div
                    key={`mcp-${idx}`}
                    className='flex items-center justify-between p-3 rounded-lg bg-blue-700/20 border border-blue-500/30'
                  >
                    <div className='flex items-center gap-3'>
                      <div className='w-3 h-3 rounded-full bg-blue-400' />
                      <div>
                        <div className='font-medium'>
                          {serverName.replace('_', ' ').toUpperCase()}
                        </div>
                        <div className='text-sm text-blue-300'>
                          MCP Server • {health.response_time}ms
                        </div>
                      </div>
                    </div>
                    <div className='text-right'>
                      <div className='text-sm font-medium text-blue-300'>
                        {health.status}
                      </div>
                    </div>
                  </div>
                )
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className='bg-slate-800/50 border-slate-700'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Zap className='w-5 h-5' />
                Live Stats
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              {loading ? (
                <div className='text-center text-slate-400 py-8'>Loading stats...</div>
              ) : error ? (
                <div className='text-center text-red-400 py-8'>{error}</div>
              ) : (
                <>
                  <div className='p-3 rounded-lg bg-gradient-to-r from-blue-500/20 to-purple-500/20'>
                    <div className='flex items-center justify-between'>
                      <div className='text-sm text-slate-300'>Total Players</div>
                      <TrendingUp className='w-4 h-4 text-green-400' />
                    </div>
                    <div className='text-2xl font-bold'>
                      {dashboardStats?.playerCount.toLocaleString() || '0'}
                    </div>
                    <div className='text-xs text-slate-400'>
                      Available in player pool
                    </div>
                  </div>

                  <div className='p-3 rounded-lg bg-gradient-to-r from-green-500/20 to-teal-500/20'>
                    <div className='flex items-center justify-between'>
                      <div className='text-sm text-slate-300'>Generated Lineups</div>
                      <DollarSign className='w-4 h-4 text-green-400' />
                    </div>
                    <div className='text-2xl font-bold'>
                      {dashboardStats?.lineupCount.toLocaleString() || '0'}
                    </div>
                    <div className='text-xs text-slate-400'>
                      Ready for contest entry
                    </div>
                  </div>

                  <div className='p-3 rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20'>
                    <div className='flex items-center justify-between'>
                      <div className='text-sm text-slate-300'>Simulations Run</div>
                      <Users className='w-4 h-4 text-purple-400' />
                    </div>
                    <div className='text-2xl font-bold'>
                      {dashboardStats?.simulationCount || '0'}
                    </div>
                    <div className='text-xs text-slate-400'>Monte Carlo iterations</div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Breaking News & Market Movements */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          <Card className='bg-slate-800/50 border-slate-700'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <AlertTriangle className='w-5 h-5 text-orange-400' />
                AI Market Insights & Alerts
                <Badge variant='outline' className='border-blue-500 text-blue-400 ml-2'>
                  MCP
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-3'>
              {breakingNews.map((news, idx) => (
                <div
                  key={idx}
                  className='p-3 rounded-lg border border-slate-600 bg-slate-700/20'
                >
                  <div className='flex items-start justify-between mb-2'>
                    <div className='font-medium text-sm'>{news.player}</div>
                    <div className='flex items-center gap-2'>
                      <Badge
                        variant='outline'
                        className={`text-xs ${
                          news.impact === 'positive'
                            ? 'border-green-500 text-green-400'
                            : news.impact === 'negative'
                              ? 'border-red-500 text-red-400'
                              : 'border-slate-500 text-slate-400'
                        }`}
                      >
                        {news.leverageChange}
                      </Badge>
                      <div className='text-xs text-slate-500'>{news.time}</div>
                    </div>
                  </div>
                  <div className='text-sm text-slate-300'>{news.news}</div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className='bg-slate-800/50 border-slate-700'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <TrendingUp className='w-5 h-5 text-blue-400' />
                Market Movements
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-3'>
              {marketMovements.map((movement, idx) => (
                <div
                  key={idx}
                  className='p-3 rounded-lg border border-slate-600 bg-slate-700/20'
                >
                  <div className='flex items-center justify-between mb-2'>
                    <div className='font-medium text-sm'>{movement.game}</div>
                    <Badge
                      variant='outline'
                      className={`text-xs ${
                        movement.movement.startsWith('+')
                          ? 'border-green-500 text-green-400'
                          : 'border-red-500 text-red-400'
                      }`}
                    >
                      {movement.movement}
                    </Badge>
                  </div>
                  <div className='flex items-center justify-between'>
                    <div className='text-sm text-slate-300'>
                      {movement.stat}: {movement.current}
                    </div>
                    <div className='text-xs text-slate-400'>{movement.impact}</div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Leverage Opportunities */}
        <Card className='bg-slate-800/50 border-slate-700'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Target className='w-5 h-5 text-purple-400' />
              Top Leverage Opportunities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              {leverageOpportunities.map((opp, idx) => (
                <div
                  key={idx}
                  className='p-4 rounded-lg bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20'
                >
                  <div className='flex items-center justify-between mb-2'>
                    <div className='font-medium'>{opp.player}</div>
                    <Badge variant='secondary' className='text-xs'>
                      {opp.position}
                    </Badge>
                  </div>
                  <div className='space-y-2'>
                    <div className='flex justify-between text-sm'>
                      <span className='text-slate-400'>Leverage Score:</span>
                      <span className='font-bold text-purple-400'>{opp.leverage}</span>
                    </div>
                    <div className='flex justify-between text-sm'>
                      <span className='text-slate-400'>Ownership:</span>
                      <span>{opp.ownership}%</span>
                    </div>
                    <div className='text-xs text-slate-400 pt-2 border-t border-slate-600'>
                      {opp.reason}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
