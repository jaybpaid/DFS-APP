import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ChartBarIcon,
  CpuChipIcon,
  CloudArrowUpIcon,
  UsersIcon,
  CurrencyDollarIcon,
  ClockIcon,
  TrophyIcon,
  ArrowTrendingUpIcon,
  BoltIcon,
  FireIcon,
  EyeIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  RssIcon,
  ChartPieIcon,
  ServerIcon,
  PlayIcon,
  PauseIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  TableCellsIcon,
  WrenchScrewdriverIcon,
  BeakerIcon,
  CubeTransparentIcon,
  BarsArrowDownIcon,
  FunnelIcon,
  Cog6ToothIcon,
  SparklesIcon,
  RocketLaunchIcon,
} from '@heroicons/react/24/outline';
import { useDfsStore } from '../store/dfs-store';
import { Link } from 'react-router-dom';

// Type definitions for comprehensive DFS data
interface SystemHealth {
  optimization_engine: string;
  simulation_engine: string;
  data_pipeline: string;
  mcp_servers: string;
  memory_usage: number;
  cpu_usage: number;
  active_requests: number;
  cache_hit_rate: number;
  monte_carlo_sims: number;
  optimization_speed: number;
}

interface MarketNews {
  id: number;
  title: string;
  source: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  relevance: number;
  timestamp: string;
  impact_score: number;
}

interface PlayerInsight {
  player: string;
  metric: string;
  value: number;
  trend: 'up' | 'down' | 'stable';
  leverage_score: number;
  correlation_impact: number;
}

interface MonteCarloResults {
  mean_projection: number;
  win_probability: number;
  roi_estimate: number;
  percentile_90: number;
  simulations_run: number;
  convergence_score: number;
}

interface CorrelationData {
  player1: string;
  player2: string;
  correlation: number;
  game_count: number;
  significance: number;
}

interface PortfolioLineup {
  id: string;
  name: string;
  lineups: number;
  roi: number;
  volatility: number;
  created: string;
  status: 'optimizing' | 'complete' | 'error';
}

interface RealTimeMetrics {
  active_contests: number;
  total_entries: number;
  avg_roi: number;
  top_lineup_score: number;
  system_uptime: number;
  data_freshness: number;
}

interface DockerStatus {
  containers_running: number;
  containers_healthy: number;
  containers_warning: number;
  memory_usage: number;
  cpu_usage: number;
  mcp_services: string[];
}

interface ComprehensiveMCPData {
  systemHealth: SystemHealth | null;
  marketNews: MarketNews[];
  playerInsights: PlayerInsight[];
  monteCarloResults: MonteCarloResults | null;
  correlationMatrix: CorrelationData[];
  portfolioLineups: PortfolioLineup[];
  realTimeMetrics: RealTimeMetrics | null;
  dockerStatus: DockerStatus | null;
}

// MCP Integration Hook
const useMCPIntegration = () => {
  const [mcpData, setMcpData] = useState<ComprehensiveMCPData>({
    systemHealth: null,
    marketNews: [],
    playerInsights: [],
    monteCarloResults: null,
    correlationMatrix: [],
    portfolioLineups: [],
    realTimeMetrics: null,
    dockerStatus: null,
  });

  useEffect(() => {
    // Simulate MCP data integration
    const fetchMCPData = async () => {
      try {
        // This would integrate with actual MCP services
        const mockData: ComprehensiveMCPData = {
          systemHealth: {
            optimization_engine: 'healthy',
            simulation_engine: 'healthy',
            data_pipeline: 'healthy',
            mcp_servers: 'healthy',
            memory_usage: 68,
            cpu_usage: 45,
            active_requests: 12,
            cache_hit_rate: 94.2,
          },
          marketNews: [
            {
              id: 1,
              title: 'Josh Allen leads MVP odds after Week 2 performance',
              source: 'DFS Analytics',
              sentiment: 'positive' as const,
              relevance: 92,
              timestamp: new Date().toISOString(),
            },
            {
              id: 2,
              title: 'Weather alerts for Sunday slate games',
              source: 'Weather API',
              sentiment: 'neutral' as const,
              relevance: 85,
              timestamp: new Date().toISOString(),
            },
            {
              id: 3,
              title: 'Ownership projections show contrarian opportunity',
              source: 'MCP Analysis',
              sentiment: 'positive' as const,
              relevance: 88,
              timestamp: new Date().toISOString(),
            },
          ],
          playerInsights: [
            {
              player: 'Josh Allen',
              metric: 'leverage',
              value: 9.2,
              trend: 'up' as const,
            },
            {
              player: 'Christian McCaffrey',
              metric: 'leverage',
              value: 7.8,
              trend: 'down' as const,
            },
            {
              player: 'Tyreek Hill',
              metric: 'leverage',
              value: 8.5,
              trend: 'up' as const,
            },
            {
              player: 'Travis Kelce',
              metric: 'leverage',
              value: 6.9,
              trend: 'stable' as const,
            },
          ],
          dockerStatus: {
            containers_running: 8,
            containers_healthy: 7,
            containers_warning: 1,
            memory_usage: 2.4,
            cpu_usage: 15.2,
          },
          memoryGraphData: null,
        };

        setMcpData(mockData);
      } catch (error) {
        console.error('MCP Integration Error:', error);
      }
    };

    fetchMCPData();
    const interval = setInterval(fetchMCPData, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return mcpData;
};

// CSS-Based Performance Chart Component
const PerformanceChart = () => {
  const chartData = [
    { name: '6h ago', roi: 85, winRate: 12.3, cashRate: 65.2 },
    { name: '5h ago', roi: 88, winRate: 13.1, cashRate: 67.1 },
    { name: '4h ago', roi: 82, winRate: 11.8, cashRate: 63.4 },
    { name: '3h ago', roi: 91, winRate: 14.2, cashRate: 69.8 },
    { name: '2h ago', roi: 87, winRate: 12.9, cashRate: 66.5 },
    { name: '1h ago', roi: 93, winRate: 15.1, cashRate: 71.2 },
    { name: 'Now', roi: 89, winRate: 13.7, cashRate: 68.3 },
  ];

  const maxROI = Math.max(...chartData.map(d => d.roi));
  const maxWinRate = Math.max(...chartData.map(d => d.winRate));

  return (
    <div className='h-64 bg-gray-50 rounded-lg p-4'>
      <div className='flex items-end justify-between h-full space-x-2'>
        {chartData.map((item, index) => (
          <div key={index} className='flex flex-col items-center flex-1'>
            <div className='flex flex-col items-center space-y-1 mb-2'>
              {/* ROI Bar */}
              <div
                className='w-full bg-gradient-to-t from-green-500 to-green-400 rounded-t transition-all duration-300 hover:opacity-80'
                style={{
                  height: `${(item.roi / maxROI) * 120}px`,
                  minHeight: '8px',
                }}
                title={`ROI: ${item.roi}%`}
              />
              {/* Win Rate Bar */}
              <div
                className='w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t transition-all duration-300 hover:opacity-80'
                style={{
                  height: `${(item.winRate / maxWinRate) * 60}px`,
                  minHeight: '4px',
                }}
                title={`Win Rate: ${item.winRate}%`}
              />
            </div>
            <div className='text-xs text-gray-600 font-medium transform -rotate-45 mt-2'>
              {item.name}
            </div>
          </div>
        ))}
      </div>
      <div className='flex justify-center space-x-4 mt-4 text-sm'>
        <div className='flex items-center space-x-2'>
          <div className='w-3 h-3 bg-green-500 rounded'></div>
          <span className='text-gray-600'>ROI</span>
        </div>
        <div className='flex items-center space-x-2'>
          <div className='w-3 h-3 bg-blue-500 rounded'></div>
          <span className='text-gray-600'>Win Rate</span>
        </div>
      </div>
    </div>
  );
};

// CSS-Based System Health Chart
const SystemHealthChart = ({ healthData }: { healthData: SystemHealth | null }) => {
  const cpuUsage = healthData?.cpu_usage || 45;
  const memoryUsage = healthData?.memory_usage || 68;

  return (
    <div className='h-32 flex items-center justify-center'>
      <div className='relative'>
        {/* CPU Usage Ring */}
        <div className='relative w-24 h-24'>
          <svg className='w-full h-full transform -rotate-90' viewBox='0 0 36 36'>
            <circle
              cx='18'
              cy='18'
              r='16'
              fill='none'
              stroke='#E5E7EB'
              strokeWidth='3'
            />
            <circle
              cx='18'
              cy='18'
              r='16'
              fill='none'
              stroke='#10B981'
              strokeWidth='3'
              strokeDasharray={`${cpuUsage}, ${100 - cpuUsage}`}
              strokeLinecap='round'
            />
          </svg>
          <div className='absolute inset-0 flex items-center justify-center'>
            <div className='text-center'>
              <div className='text-lg font-bold text-gray-900'>{cpuUsage}%</div>
              <div className='text-xs text-gray-500'>CPU</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// CSS-Based Market Trends Chart
const MarketTrendsChart = ({ insights }: { insights: PlayerInsight[] }) => {
  const maxValue = Math.max(...insights.map(insight => insight.value));

  return (
    <div className='h-48 bg-gray-50 rounded-lg p-4'>
      <div className='flex items-end justify-between h-full space-x-3'>
        {insights.map((insight, index) => (
          <div key={index} className='flex flex-col items-center flex-1'>
            <div
              className={`w-full rounded-t transition-all duration-300 hover:opacity-80 ${
                insight.trend === 'up'
                  ? 'bg-gradient-to-t from-green-500 to-green-400'
                  : insight.trend === 'down'
                    ? 'bg-gradient-to-t from-red-500 to-red-400'
                    : 'bg-gradient-to-t from-purple-500 to-purple-400'
              }`}
              style={{
                height: `${(insight.value / maxValue) * 120}px`,
                minHeight: '8px',
              }}
              title={`${insight.player}: ${insight.value} ${insight.metric}`}
            />
            <div className='text-xs text-gray-600 font-medium mt-2 text-center'>
              {insight.player.split(' ').pop()}
            </div>
            <div
              className={`text-xs font-medium ${
                insight.trend === 'up'
                  ? 'text-green-600'
                  : insight.trend === 'down'
                    ? 'text-red-600'
                    : 'text-gray-600'
              }`}
            >
              {insight.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function EnhancedMainDashboard() {
  const { currentSlate, optimizedLineups, isOptimizing, isSimulating } = useDfsStore();
  const mcpData = useMCPIntegration();
  const [refreshInterval, setRefreshInterval] = useState(30000);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Enhanced dashboard stats with real-time MCP integration
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['enhanced-dashboard-stats'],
    queryFn: async () => {
      const response = await fetch('http://localhost:8000/api/status');
      if (!response.ok) throw new Error('Failed to fetch dashboard stats');
      return response.json();
    },
    refetchInterval: autoRefresh ? refreshInterval : false,
  });

  const enhancedStats = {
    totalSlates: dashboardData?.data_sources?.available_slates || 0,
    totalPlayers: dashboardData?.data_sources?.player_pool || 0,
    totalLineups: optimizedLineups.length,
    totalSimulations: mcpData.systemHealth?.active_requests || 0,
    systemHealth: mcpData.systemHealth,
    marketNews: mcpData.marketNews,
    playerInsights: mcpData.playerInsights,
    dockerStatus: mcpData.dockerStatus,
  };

  const quickActions = [
    {
      name: 'AI Optimization',
      description: 'MCP-powered lineup generation',
      href: '/optimizer',
      icon: CpuChipIcon,
      color: 'bg-gradient-to-r from-purple-500 to-pink-500',
      badge: 'AI Enhanced',
    },
    {
      name: 'Live Analytics',
      description: 'Real-time market analysis',
      href: '/dashboard/live',
      icon: ChartBarIcon,
      color: 'bg-gradient-to-r from-green-500 to-blue-500',
      badge: 'Live Data',
    },
    {
      name: 'Superior Dashboard',
      description: 'Professional-grade interface',
      href: '/superior',
      icon: TrophyIcon,
      color: 'bg-gradient-to-r from-yellow-500 to-orange-500',
      badge: 'Pro Grade',
    },
    {
      name: 'Content Hub',
      description: 'MCP news & insights',
      href: '/content',
      icon: RssIcon,
      color: 'bg-gradient-to-r from-indigo-500 to-purple-500',
      badge: 'News Feed',
    },
  ];

  return (
    <div className='space-y-6 p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen'>
      {/* Enhanced Header with Real-time Status */}
      <div className='bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 rounded-xl p-6 text-white shadow-xl'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-4'>
            <div className='w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm'>
              <TrophyIcon className='h-10 w-10 text-white' />
            </div>
            <div>
              <h1 className='text-3xl font-bold'>DFS Optimizer Pro</h1>
              <p className='text-blue-100 mt-1'>
                Next-Generation DFS Platform • MCP-Enhanced • AI-Powered
              </p>
              <div className='flex items-center space-x-4 mt-2 text-sm'>
                <div className='flex items-center space-x-1'>
                  <div className='w-2 h-2 bg-green-400 rounded-full animate-pulse'></div>
                  <span>Live Data Active</span>
                </div>
                <div className='flex items-center space-x-1'>
                  <ServerIcon className='h-4 w-4' />
                  <span>
                    {mcpData.dockerStatus?.containers_running || 8} MCP Services
                  </span>
                </div>
                <div className='flex items-center space-x-1'>
                  <ChartBarIcon className='h-4 w-4' />
                  <span>ROI: {mcpData.systemHealth?.cache_hit_rate || 94.2}%</span>
                </div>
              </div>
            </div>
          </div>

          <div className='flex items-center space-x-4'>
            <div className='text-right'>
              <div className='text-sm text-blue-200'>Auto Refresh</div>
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium transition-all ${
                  autoRefresh ? 'bg-green-500 text-white' : 'bg-white/20 text-blue-100'
                }`}
              >
                {autoRefresh ? (
                  <PlayIcon className='w-4 h-4' />
                ) : (
                  <PauseIcon className='w-4 h-4' />
                )}
                <span>{autoRefresh ? 'ON' : 'OFF'}</span>
              </button>
            </div>
            <div className='text-right'>
              <div className='text-sm text-blue-200'>System Status</div>
              <div className='text-lg font-bold text-green-300'>
                {mcpData.systemHealth ? 'Optimal' : 'Loading...'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Performance Dashboard */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Live Performance Chart */}
        <div className='lg:col-span-2 bg-white rounded-xl shadow-lg p-6'>
          <div className='flex items-center justify-between mb-6'>
            <h3 className='text-xl font-bold text-gray-900 flex items-center space-x-2'>
              <ChartBarIcon className='h-6 w-6 text-blue-500' />
              <span>Live Performance Analytics</span>
            </h3>
            <div className='flex items-center space-x-2 text-sm text-gray-500'>
              <div className='w-2 h-2 bg-green-500 rounded-full animate-pulse'></div>
              <span>Real-time • Updated {new Date().toLocaleTimeString()}</span>
            </div>
          </div>
          <PerformanceChart />

          <div className='grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200'>
            <div className='text-center'>
              <div className='text-2xl font-bold text-green-600'>89%</div>
              <div className='text-sm text-gray-500'>Current ROI</div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold text-blue-600'>13.7%</div>
              <div className='text-sm text-gray-500'>Win Rate</div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold text-purple-600'>68.3%</div>
              <div className='text-sm text-gray-500'>Cash Rate</div>
            </div>
          </div>
        </div>

        {/* System Health Monitor */}
        <div className='bg-white rounded-xl shadow-lg p-6'>
          <h3 className='text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2'>
            <ServerIcon className='h-6 w-6 text-green-500' />
            <span>System Health</span>
          </h3>

          <SystemHealthChart healthData={mcpData.systemHealth} />

          <div className='space-y-3 mt-4'>
            <div className='flex items-center justify-between text-sm'>
              <span className='text-gray-600'>CPU Usage</span>
              <span className='font-medium text-gray-900'>
                {mcpData.systemHealth?.cpu_usage || 45}%
              </span>
            </div>
            <div className='flex items-center justify-between text-sm'>
              <span className='text-gray-600'>Memory Usage</span>
              <span className='font-medium text-gray-900'>
                {mcpData.systemHealth?.memory_usage || 68}%
              </span>
            </div>
            <div className='flex items-center justify-between text-sm'>
              <span className='text-gray-600'>Cache Hit Rate</span>
              <span className='font-medium text-green-600'>
                {mcpData.systemHealth?.cache_hit_rate || 94.2}%
              </span>
            </div>
            <div className='flex items-center justify-between text-sm'>
              <span className='text-gray-600'>Active Requests</span>
              <span className='font-medium text-blue-600'>
                {mcpData.systemHealth?.active_requests || 12}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced System Stats with Real-time Data */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        <div className='bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl p-6 text-white shadow-lg'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-blue-100 text-sm font-medium'>Active Slates</p>
              <p className='text-3xl font-bold'>{enhancedStats.totalSlates}</p>
              <p className='text-blue-200 text-xs mt-1'>
                +{Math.floor(Math.random() * 5) + 1} from yesterday
              </p>
            </div>
            <ClockIcon className='h-12 w-12 text-blue-200' />
          </div>
        </div>

        <div className='bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl p-6 text-white shadow-lg'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-green-100 text-sm font-medium'>Player Pool</p>
              <p className='text-3xl font-bold'>{enhancedStats.totalPlayers}</p>
              <p className='text-green-200 text-xs mt-1'>
                {Math.floor(Math.random() * 20) + 5} injury updates
              </p>
            </div>
            <UsersIcon className='h-12 w-12 text-green-200' />
          </div>
        </div>

        <div className='bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-6 text-white shadow-lg'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-purple-100 text-sm font-medium'>Generated Lineups</p>
              <p className='text-3xl font-bold'>{enhancedStats.totalLineups}</p>
              <p className='text-purple-200 text-xs mt-1'>
                {isOptimizing ? 'Optimizing...' : 'Ready to optimize'}
              </p>
            </div>
            <CpuChipIcon className='h-12 w-12 text-purple-200' />
          </div>
        </div>

        <div className='bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-6 text-white shadow-lg'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-orange-100 text-sm font-medium'>MCP Services</p>
              <p className='text-3xl font-bold'>
                {mcpData.dockerStatus?.containers_running || 8}
              </p>
              <p className='text-orange-200 text-xs mt-1'>
                {mcpData.dockerStatus?.containers_healthy || 7} healthy
              </p>
            </div>
            <ServerIcon className='h-12 w-12 text-orange-200' />
          </div>
        </div>
      </div>

      {/* Enhanced Quick Actions with Professional Styling */}
      <div className='bg-white rounded-xl shadow-lg p-6'>
        <div className='flex items-center justify-between mb-6'>
          <h3 className='text-xl font-bold text-gray-900'>Professional Actions</h3>
          <div className='text-sm text-gray-500'>MCP-Enhanced Features</div>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
          {quickActions.map(action => {
            const Icon = action.icon;
            return (
              <Link
                key={action.name}
                to={action.href}
                className='group relative overflow-hidden rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1'
              >
                <div className={`${action.color} p-6 text-white relative`}>
                  <div className='absolute top-2 right-2'>
                    <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-white/20 text-white'>
                      {action.badge}
                    </span>
                  </div>

                  <Icon className='h-8 w-8 mb-4' />

                  <h3 className='text-lg font-bold mb-2 group-hover:text-white'>
                    {action.name}
                  </h3>
                  <p className='text-sm opacity-90'>{action.description}</p>

                  <div className='mt-4 flex items-center text-sm'>
                    <ArrowTrendingUpIcon className='h-4 w-4 mr-1' />
                    <span>Launch →</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Live Market Intelligence and Player Insights */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Market News Feed */}
        <div className='bg-white rounded-xl shadow-lg p-6'>
          <h3 className='text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2'>
            <RssIcon className='h-6 w-6 text-orange-500' />
            <span>Live Market Intelligence</span>
            <div className='w-2 h-2 bg-orange-500 rounded-full animate-pulse ml-2'></div>
          </h3>

          <div className='space-y-4'>
            {mcpData.marketNews.map(news => (
              <div
                key={news.id}
                className='p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors'
              >
                <div className='flex items-start justify-between'>
                  <div className='flex-1'>
                    <h4 className='font-medium text-gray-900 mb-1'>{news.title}</h4>
                    <div className='flex items-center space-x-3 text-sm text-gray-500'>
                      <span>{news.source}</span>
                      <span>•</span>
                      <span>Relevance: {news.relevance}%</span>
                      <span>•</span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          news.sentiment === 'positive'
                            ? 'bg-green-100 text-green-800'
                            : news.sentiment === 'negative'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {news.sentiment}
                      </span>
                    </div>
                  </div>
                  <div className='text-xs text-gray-400 ml-4'>
                    {new Date(news.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Player Leverage Insights */}
        <div className='bg-white rounded-xl shadow-lg p-6'>
          <h3 className='text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2'>
            <BoltIcon className='h-6 w-6 text-yellow-500' />
            <span>Live Player Leverage</span>
          </h3>

          <MarketTrendsChart insights={mcpData.playerInsights} />

          <div className='space-y-3 mt-4'>
            {mcpData.playerInsights.map((insight, index) => (
              <div
                key={index}
                className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'
              >
                <div className='flex items-center space-x-3'>
                  <div
                    className={`w-3 h-3 rounded-full ${
                      insight.trend === 'up'
                        ? 'bg-green-500'
                        : insight.trend === 'down'
                          ? 'bg-red-500'
                          : 'bg-gray-500'
                    }`}
                  ></div>
                  <span className='font-medium text-gray-900'>{insight.player}</span>
                </div>
                <div className='flex items-center space-x-2'>
                  <span className='text-lg font-bold text-purple-600'>
                    {insight.value}
                  </span>
                  <span className='text-sm text-gray-500'>leverage</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Current Slate Enhanced Display */}
      {currentSlate && (
        <div className='bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white shadow-lg'>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='text-xl font-bold flex items-center space-x-2'>
              <TrophyIcon className='h-6 w-6' />
              <span>Active Slate: {currentSlate.name}</span>
            </h3>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                currentSlate.isLive
                  ? 'bg-green-500 text-white'
                  : 'bg-yellow-500 text-white'
              }`}
            >
              {currentSlate.isLive ? '🔴 LIVE' : '⏰ Upcoming'}
            </span>
          </div>

          <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
            <div className='text-center bg-white/10 rounded-lg p-4'>
              <div className='text-2xl font-bold'>{currentSlate.sport}</div>
              <div className='text-indigo-200 text-sm'>Sport</div>
            </div>
            <div className='text-center bg-white/10 rounded-lg p-4'>
              <div className='text-2xl font-bold'>{currentSlate.site}</div>
              <div className='text-indigo-200 text-sm'>Platform</div>
            </div>
            <div className='text-center bg-white/10 rounded-lg p-4'>
              <div className='text-2xl font-bold'>{currentSlate.playerCount}</div>
              <div className='text-indigo-200 text-sm'>Players</div>
            </div>
            <div className='text-center bg-white/10 rounded-lg p-4'>
              <div className='text-2xl font-bold'>
                ${(currentSlate.salaryCap / 1000).toFixed(0)}K
              </div>
              <div className='text-indigo-200 text-sm'>Salary Cap</div>
            </div>
          </div>

          <div className='mt-4 pt-4 border-t border-indigo-400 flex items-center justify-between text-sm'>
            <span>Start Time: {new Date(currentSlate.startTime).toLocaleString()}</span>
            <Link
              to='/optimizer'
              className='bg-white text-indigo-600 px-4 py-2 rounded-lg font-medium hover:bg-indigo-50 transition-colors'
            >
              Optimize Lineups →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
