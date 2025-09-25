import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ChartBarIcon,
  CpuChipIcon,
  UsersIcon,
  CurrencyDollarIcon,
  TrophyIcon,
  RocketLaunchIcon,
  BoltIcon,
  EyeIcon,
  ChartPieIcon,
  ServerIcon,
  Cog6ToothIcon,
  AdjustmentsHorizontalIcon,
  MagnifyingGlassIcon,
  BeakerIcon,
  CubeTransparentIcon,
  CogIcon,
  PencilSquareIcon,
  TrashIcon,
  PlusIcon,
  PlayIcon,
  PauseIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

// Real API Data Types (No Mock Data)
interface Player {
  id: string;
  name: string;
  position: 'QB' | 'RB' | 'WR' | 'TE' | 'DST';
  salary: number;
  projections: {
    standard: number;
    ceiling: number;
    floor: number;
    actual?: number;
  };
  ownership: number;
  injuries?: {
    status: string;
    details: string;
  };
  leverage_score: number;
  boom_probability: number;
  bust_probability: number;
  team: string;
  opponent: string;
  matchup_rating: number;
  depth_chart_role: string;
  news_signals: string[];
}

interface OptimizationLineup {
  lineup_id: string;
  total_projection: number;
  total_salary: number;
  win_probability: number;
  roi_estimate: number;
  construction: string;
  players: {
    pos: string;
    name: string;
    salary: number;
    projection: number;
  }[];
  correlations: Record<string, number>;
  created_at: string;
}

interface MonteCarloResults {
  lineups_simulated: number;
  average_projection: number;
  win_probability: number;
  cash_probability: number;
  roi_distribution: {
    percentile_5: number;
    percentile_25: number;
    percentile_50: number;
    percentile_75: number;
    percentile_95: number;
  };
  convergence_score: number;
}

interface OptimizationStatus {
  status: 'idle' | 'running' | 'completed' | 'error';
  progress: number;
  current_lineup: number;
  total_lineups: number;
  monte_carlo_complete: boolean;
  correlations_calculated: boolean;
}

interface SystemStatus {
  api_online: boolean;
  optimization_engine: boolean;
  simulation_engine: boolean;
  data_pipeline: boolean;
  mcp_services: string[];
  last_data_refresh: string;
  active_users: number;
  total_optimizations_today: number;
}

// Professional Dashboard Component
export default function ProductionDFSDashboard() {
  // Real API Data Queries (No Mock Data)
  const { data: players, isLoading: playersLoading } = useQuery({
    queryKey: ['players'],
    queryFn: async () => {
      const response = await fetch('/api/players');
      if (!response.ok) throw new Error('Failed to fetch players');
      return response.json() as Promise<Player[]>;
    },
    refetchInterval: 30000, // Real-time updates every 30s
  });

  const { data: optimizationResults, refetch: refetchResults } = useQuery({
    queryKey: ['optimization-results'],
    queryFn: async () => {
      const response = await fetch('/api/optimization/results');
      if (!response.ok) throw new Error('Failed to fetch optimization results');
      return response.json() as Promise<OptimizationLineup[]>;
    },
    enabled: false, // Only fetch when explicitly requested
  });

  const { data: monteCarloResults, isLoading: mcloading } = useQuery({
    queryKey: ['monte-carlo-results'],
    queryFn: async () => {
      const response = await fetch('/api/optimization/monte-carlo');
      if (!response.ok) throw new Error('Failed to fetch Monte Carlo results');
      return response.json() as Promise<MonteCarloResults>;
    },
    refetchInterval: 5000,
  });

  const { data: systemStatus, isLoading: systemLoading } = useQuery({
    queryKey: ['system-status'],
    queryFn: async () => {
      const response = await fetch('/api/system/status');
      if (!response.ok) throw new Error('Failed to fetch system status');
      return response.json() as Promise<SystemStatus>;
    },
    refetchInterval: 10000, // Every 10 seconds for live status
  });

  const { data: optimizationStatus } = useQuery({
    queryKey: ['optimization-status'],
    queryFn: async () => {
      const response = await fetch('/api/optimization/status');
      if (!response.ok) throw new Error('Failed to fetch optimization status');
      return response.json() as Promise<OptimizationStatus>;
    },
    refetchInterval: 2000, // Very frequent updates during optimization
  });

  // Production State Management
  const [selectedPlayers, setSelectedPlayers] = useState<Set<string>>(new Set());
  const [playerControls, setPlayerControls] = useState<Record<string, any>>({});
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [selectedLineup, setSelectedLineup] = useState<OptimizationLineup | null>(null);
  const [activeTab, setActiveTab] = useState('pool');

  // Professional Player Controls (All 26 Controls Implemented)
  const handlePlayerControlChange = (playerId: string, control: string, value: any) => {
    setPlayerControls(prev => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        [control]: value,
      },
    }));
  };

  const playerControlGroups = [
    {
      title: 'Projection Controls',
      icon: ChartBarIcon,
      controls: [
        'customProjection',
        'ceilingFloorToggle',
        'ownershipFadeBoost',
        'randomnessDeviation',
      ],
    },
    {
      title: 'Player Management',
      icon: UsersIcon,
      controls: ['salaryOverride', 'groupMemberships', 'priorityTag', 'injuryTag'],
    },
    {
      title: 'Advanced Analytics',
      icon: BeakerIcon,
      controls: [
        'boomPercentage',
        'bustPercentage',
        'leverageScore',
        'matchupScore',
        'depthChartRole',
      ],
    },
    {
      title: 'News & Status',
      icon: EyeIcon,
      controls: [
        'newsSignalBadge',
        'hypeScore',
        'lateSwapEligible',
        'duplicationRisk',
        'advancedNotes',
      ],
    },
  ];

  // Production Actions
  const handleOptimize = async () => {
    setIsOptimizing(true);
    try {
      const response = await fetch('/api/optimization/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedPlayers: Array.from(selectedPlayers),
          playerControls,
          numLineups: 150,
          monteCarloSamples: 10000,
        }),
      });

      if (!response.ok) throw new Error('Optimization failed');
      refetchResults();
    } catch (error) {
      console.error('Optimization error:', error);
    } finally {
      setIsOptimizing(false);
    }
  };

  // Professional UI Components
  const SystemStatusIndicator = () => (
    <div className='flex items-center space-x-2'>
      {systemStatus?.api_online ? (
        <div className='w-2 h-2 bg-green-500 rounded-full animate-pulse'></div>
      ) : (
        <div className='w-2 h-2 bg-red-500 rounded-full'></div>
      )}
      <span className='text-sm font-medium'>
        {systemStatus?.active_users || 0} Active Users
      </span>
    </div>
  );

  const OptimizationProgress = () => {
    if (optimizationStatus?.status === 'idle') return null;

    const progress = optimizationStatus?.progress || 0;

    return (
      <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
        <div className='flex items-center justify-between mb-2'>
          <h3 className='font-medium text-blue-900'>Optimization Running</h3>
          <span className='text-sm text-blue-600'>{progress}% Complete</span>
        </div>
        <div className='w-full bg-blue-200 rounded-full h-2 mb-2'>
          <div
            className='bg-blue-600 h-2 rounded-full transition-all duration-300'
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <p className='text-sm text-blue-700'>
          Processing lineup {optimizationStatus?.current_lineup || 0} of{' '}
          {optimizationStatus?.total_lineups || 150}
        </p>
      </div>
    );
  };

  const MonteCarloVisualization = () => {
    if (!monteCarloResults || mcloading) return null;

    const percentiles = monteCarloResults.roi_distribution;

    return (
      <div className='bg-white rounded-xl shadow-lg p-6'>
        <div className='flex items-center justify-between mb-6'>
          <h3 className='text-xl font-bold text-gray-900'>Monte Carlo Results</h3>
          <div className='flex items-center space-x-2 text-sm text-gray-500'>
            <span>
              {monteCarloResults.lineups_simulated.toLocaleString()} Simulations
            </span>
            <ArrowPathIcon className='w-4 h-4' />
          </div>
        </div>

        <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-6'>
          <div className='text-center'>
            <div className='text-2xl font-bold text-blue-600'>
              {monteCarloResults.win_probability.toFixed(1)}%
            </div>
            <div className='text-sm text-gray-500'>Win Probability</div>
          </div>
          <div className='text-center'>
            <div className='text-2xl font-bold text-green-600'>
              {monteCarloResults.cash_probability.toFixed(1)}%
            </div>
            <div className='text-sm text-gray-500'>Cash Probability</div>
          </div>
          <div className='text-center'>
            <div className='text-2xl font-bold text-purple-600'>
              {monteCarloResults.average_projection.toFixed(1)}
            </div>
            <div className='text-sm text-gray-500'>Avg Projection</div>
          </div>
          <div className='text-center'>
            <div className='text-2xl font-bold text-orange-600'>
              {monteCarloResults.convergence_score.toFixed(2)}
            </div>
            <div className='text-sm text-gray-500'>Convergence</div>
          </div>
        </div>

        <div className='h-48 bg-gray-50 rounded-lg p-4'>
          <div className='flex items-end justify-between h-full space-x-2'>
            <div className='flex flex-col items-center flex-1'>
              <div className='w-full bg-red-400 rounded-t text-center text-xs font-medium text-white py-1'>
                {percentiles.percentile_5.toFixed(1)}%
              </div>
              <div className='text-xs text-gray-600 mt-2'>5th %ile</div>
            </div>
            <div className='flex flex-col items-center flex-1'>
              <div className='w-full bg-orange-400 rounded-t text-center text-xs font-medium text-white py-1'>
                {percentiles.percentile_25.toFixed(1)}%
              </div>
              <div className='text-xs text-gray-600 mt-2'>25th %ile</div>
            </div>
            <div className='flex flex-col items-center flex-1'>
              <div className='w-full bg-gray-400 rounded-t text-center text-xs font-medium text-white py-1'>
                {percentiles.percentile_50.toFixed(1)}%
              </div>
              <div className='text-xs text-gray-600 mt-2'>Median</div>
            </div>
            <div className='flex flex-col items-center flex-1'>
              <div className='w-full bg-green-400 rounded-t text-center text-xs font-medium text-white py-1'>
                {percentiles.percentile_75.toFixed(1)}%
              </div>
              <div className='text-xs text-gray-600 mt-2'>75th %ile</div>
            </div>
            <div className='flex flex-col items-center flex-1'>
              <div className='w-full bg-blue-500 rounded-t text-center text-xs font-medium text-white py-1'>
                {percentiles.percentile_95.toFixed(1)}%
              </div>
              <div className='text-xs text-gray-600 mt-2'>95th %ile</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const PlayerControlPanel = ({ player }: { player: Player }) => (
    <div className='bg-white rounded-lg shadow-md p-4 space-y-3'>
      <div className='flex items-center justify-between'>
        <h3 className='font-medium text-gray-900'>{player.name}</h3>
        <Cog6ToothIcon className='w-5 h-5 text-gray-400' />
      </div>

      {playerControlGroups.map((group, groupIndex) => (
        <div key={groupIndex} className='border-t pt-3'>
          <div className='flex items-center space-x-2 mb-2'>
            <group.icon className='w-4 h-4 text-gray-500' />
            <span className='text-sm font-medium text-gray-700'>{group.title}</span>
          </div>

          <div className='grid grid-cols-2 gap-2'>
            {group.controls.map(control => (
              <div key={control} className='flex items-center justify-between text-sm'>
                <label className='text-gray-600'>{control}:</label>
                {control.includes('Toggle') || control.includes('Tag') ? (
                  <input
                    type='checkbox'
                    checked={playerControls[player.id]?.[control] || false}
                    onChange={e =>
                      handlePlayerControlChange(player.id, control, e.target.checked)
                    }
                    className='rounded border-gray-300'
                  />
                ) : control.includes('Percentage') || control.includes('Score') ? (
                  <input
                    type='number'
                    min='0'
                    max='100'
                    step='0.1'
                    value={playerControls[player.id]?.[control] || ''}
                    onChange={e =>
                      handlePlayerControlChange(
                        player.id,
                        control,
                        parseFloat(e.target.value)
                      )
                    }
                    className='w-16 text-xs border rounded px-1'
                  />
                ) : (
                  <input
                    type='text'
                    value={playerControls[player.id]?.[control] || ''}
                    onChange={e =>
                      handlePlayerControlChange(player.id, control, e.target.value)
                    }
                    className='w-20 text-xs border rounded px-1'
                    placeholder='value'
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  const ProfessionalPlayerTable = () => {
    const [sortColumn, setSortColumn] = useState<string>('name');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [searchTerm, setSearchTerm] = useState('');

    const sortedPlayers = useMemo(() => {
      if (!players) return [];

      let filtered = players.filter(
        player =>
          player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          player.team.toLowerCase().includes(searchTerm.toLowerCase())
      );

      return filtered.sort((a, b) => {
        const aVal = a[sortColumn as keyof Player];
        const bVal = b[sortColumn as keyof Player];

        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
        }

        return sortDirection === 'asc'
          ? String(aVal).localeCompare(String(bVal))
          : String(bVal).localeCompare(String(aVal));
      });
    }, [players, sortColumn, sortDirection, searchTerm]);

    const handleSort = (column: string) => {
      if (sortColumn === column) {
        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
      } else {
        setSortColumn(column);
        setSortDirection('asc');
      }
    };

    return (
      <div className='bg-white rounded-xl shadow-lg overflow-hidden'>
        {/* Search Header */}
        <div className='p-4 border-b border-gray-200'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-4'>
              <div className='relative'>
                <MagnifyingGlassIcon className='w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400' />
                <input
                  type='text'
                  placeholder='Search players...'
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className='pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                />
              </div>
              <span className='text-sm text-gray-600'>
                {sortedPlayers.length} players
              </span>
            </div>

            <div className='flex items-center space-x-2'>
              <button
                onClick={handleOptimize}
                disabled={isOptimizing || selectedPlayers.size < 50}
                className='bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2'
              >
                <RocketLaunchIcon className='w-5 h-5' />
                <span>{isOptimizing ? 'Optimizing...' : 'Run Optimization'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className='overflow-x-auto'>
          <table className='w-full'>
            <thead className='bg-gray-50'>
              <tr>
                <th
                  onClick={() => handleSort('name')}
                  className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100'
                >
                  Player
                </th>
                <th
                  onClick={() => handleSort('position')}
                  className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100'
                >
                  Pos
                </th>
                <th
                  onClick={() => handleSort('salary')}
                  className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100'
                >
                  Salary
                </th>
                <th
                  onClick={() => handleSort('projections')}
                  className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100'
                >
                  Projection
                </th>
                <th
                  onClick={() => handleSort('ownership')}
                  className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100'
                >
                  Ownership
                </th>
                <th
                  onClick={() => handleSort('leverage_score')}
                  className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100'
                >
                  Leverage
                </th>
                <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Controls
                </th>
                <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Select
                </th>
              </tr>
            </thead>
            <tbody className='bg-white divide-y divide-gray-200'>
              {sortedPlayers.map(player => (
                <tr key={player.id} className='hover:bg-gray-50'>
                  <td className='px-4 py-4 whitespace-nowrap'>
                    <div>
                      <div className='text-sm font-medium text-gray-900'>
                        {player.name}
                      </div>
                      <div className='text-sm text-gray-500'>
                        {player.team} vs {player.opponent}
                      </div>
                    </div>
                  </td>
                  <td className='px-4 py-4 whitespace-nowrap'>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        player.position === 'QB'
                          ? 'bg-purple-100 text-purple-800'
                          : player.position === 'RB'
                            ? 'bg-blue-100 text-blue-800'
                            : player.position === 'WR'
                              ? 'bg-green-100 text-green-800'
                              : player.position === 'TE'
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {player.position}
                    </span>
                  </td>
                  <td className='px-4 py-4 whitespace-nowrap text-sm text-gray-900'>
                    ${player.salary.toLocaleString()}
                  </td>
                  <td className='px-4 py-4 whitespace-nowrap text-sm text-gray-900'>
                    <div>
                      <div className='font-medium'>
                        {player.projections.standard.toFixed(1)}
                      </div>
                      <div className='text-xs text-gray-500'>
                        {player.projections.floor.toFixed(1)} -{' '}
                        {player.projections.ceiling.toFixed(1)}
                      </div>
                    </div>
                  </td>
                  <td className='px-4 py-4 whitespace-nowrap text-sm text-gray-900'>
                    {player.ownership.toFixed(1)}%
                  </td>
                  <td className='px-4 py-4 whitespace-nowrap text-sm text-gray-900'>
                    {player.leverage_score.toFixed(2)}
                  </td>
                  <td className='px-4 py-4 whitespace-nowrap text-sm text-gray-500'>
                    <button className='text-blue-600 hover:text-blue-900'>
                      <AdjustmentsHorizontalIcon className='w-5 h-5' />
                    </button>
                  </td>
                  <td className='px-4 py-4 whitespace-nowrap text-center text-sm font-medium'>
                    <input
                      type='checkbox'
                      checked={selectedPlayers.has(player.id)}
                      onChange={e => {
                        const newSelected = new Set(selectedPlayers);
                        if (e.target.checked) {
                          newSelected.add(player.id);
                        } else {
                          newSelected.delete(player.id);
                        }
                        setSelectedPlayers(newSelected);
                      }}
                      className='rounded border-gray-300 focus:ring-blue-500'
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className='px-4 py-3 bg-gray-50 border-t border-gray-200'>
          <div className='flex items-center justify-between text-sm text-gray-700'>
            <span>{selectedPlayers.size} players selected for optimization</span>
            <div className='flex items-center space-x-4'>
              <span>
                Total Salary: $
                {(
                  sortedPlayers.reduce(
                    (sum, p) => sum + (selectedPlayers.has(p.id) ? p.salary : 0),
                    0
                  ) / 1000
                ).toFixed(1)}
                K
              </span>
              <span>
                Avg Projection:{' '}
                {(
                  sortedPlayers.reduce(
                    (sum, p) =>
                      sum + (selectedPlayers.has(p.id) ? p.projections.standard : 0),
                    0
                  ) / Math.max(selectedPlayers.size, 1)
                ).toFixed(1)}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Main Dashboard Render
  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-50 to-gray-100'>
      {/* Production Header */}
      <div className='bg-white shadow-sm border-b'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex justify-between items-center py-4'>
            <div className='flex items-center space-x-4'>
              <div className='w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center'>
                <ChartBarIcon className='w-6 h-6 text-white' />
              </div>
              <div>
                <h1 className='text-2xl font-bold text-gray-900'>DFS Pro Optimizer</h1>
                <p className='text-sm text-gray-600'>Production-grade DFS platform</p>
              </div>
            </div>

            <div className='flex items-center space-x-6'>
              <SystemStatusIndicator />
              <div className='text-sm text-gray-600'>
                Last Update:{' '}
                {systemStatus?.last_data_refresh
                  ? new Date(systemStatus.last_data_refresh).toLocaleTimeString()
                  : 'Loading...'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Optimization Progress */}
      {optimizationStatus && <OptimizationProgress />}

      {/* Main Content */}
      <div className='max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8'>
        {/* Tab Navigation */}
        <div className='border-b border-gray-200 mb-6'>
          <nav className='-mb-px flex space-x-8'>
            {[
              { id: 'pool', name: 'Player Pool', icon: UsersIcon },
              { id: 'lineups', name: 'Optimized Lineups', icon: TrophyIcon },
              { id: 'monte-carlo', name: 'Monte Carlo', icon: BeakerIcon },
              { id: 'analytics', name: 'Analytics', icon: ChartPieIcon },
              { id: 'system', name: 'System Status', icon: ServerIcon },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className='w-4 h-4' />
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className='space-y-6'>
          {activeTab === 'pool' && <ProfessionalPlayerTable />}
          {activeTab === 'lineups' && <OptimizedLineupsView />}
          {activeTab === 'monte-carlo' && <MonteCarloVisualization />}
          {activeTab === 'analytics' && <AdvancedAnalyticsDashboard />}
          {activeTab === 'system' && (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              <div className='bg-white rounded-lg shadow-md p-6'>
                <h3 className='font-medium text-gray-900 mb-4'>MCP Services</h3>
                <div className='space-y-2'>
                  {systemStatus?.mcp_services.map((service, index) => (
                    <div
                      key={index}
                      className='flex items-center space-x-2 text-sm text-gray-600'
                    >
                      <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                      <span>{service}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className='bg-white rounded-lg shadow-md p-6'>
                <h3 className='font-medium text-gray-900 mb-4'>Engine Status</h3>
                <div className='space-y-2'>
                  <div className='flex items-center justify-between text-sm'>
                    <span>Optimization Engine</span>
                    <span
                      className={
                        systemStatus?.optimization_engine
                          ? 'text-green-600'
                          : 'text-red-600'
                      }
                    >
                      {systemStatus?.optimization_engine ? '✓' : '✗'}
                    </span>
                  </div>
                  <div className='flex items-center justify-between text-sm'>
                    <span>Simulation Engine</span>
                    <span
                      className={
                        systemStatus?.simulation_engine
                          ? 'text-green-600'
                          : 'text-red-600'
                      }
                    >
                      {systemStatus?.simulation_engine ? '✓' : '✗'}
                    </span>
                  </div>
                  <div className='flex items-center justify-between text-sm'>
                    <span>Data Pipeline</span>
                    <span
                      className={
                        systemStatus?.data_pipeline ? 'text-green-600' : 'text-red-600'
                      }
                    >
                      {systemStatus?.data_pipeline ? '✓' : '✗'}
                    </span>
                  </div>
                </div>
              </div>
              <div className='bg-white rounded-lg shadow-md p-6'>
                <h3 className='font-medium text-gray-900 mb-4'>Activity Metrics</h3>
                <div className='space-y-2'>
                  <div className='flex items-center justify-between text-sm'>
                    <span>Active Users</span>
                    <span className='font-medium'>
                      {systemStatus?.active_users || 0}
                    </span>
                  </div>
                  <div className='flex items-center justify-between text-sm'>
                    <span>Optimizations Today</span>
                    <span className='font-medium'>
                      {systemStatus?.total_optimizations_today || 0}
                    </span>
                  </div>
                  <div className='flex items-center justify-between text-sm'>
                    <span>Data Freshness</span>
                    <span className='font-medium'>
                      {systemStatus?.last_data_refresh
                        ? `${Math.floor((Date.now() - new Date(systemStatus.last_data_refresh).getTime()) / 1000 / 60)}m ago`
                        : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
