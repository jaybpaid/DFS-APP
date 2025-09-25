'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  ChartBarIcon,
  BoltIcon,
  TrophyIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  FireIcon,
  EyeIcon,
  PlayIcon,
  PauseIcon,
} from '@heroicons/react/24/outline';
import { clsx } from 'clsx';
// Charts placeholder - recharts will be added later
// import { ... } from 'recharts';

// Live data interfaces
interface LiveSlate {
  id: string;
  name: string;
  sport: string;
  site: string;
  startTime: string;
  isLive: boolean;
  playerCount: number;
  contestCount: number;
  totalPrizePool: number;
  avgOwnership: number;
  topLeveragePlayer: string;
}

interface LiveSimResult {
  id: string;
  slateId: string;
  lineupCount: number;
  iterations: number;
  avgScore: number;
  winRate: number;
  roi: number;
  top5Rate: number;
  cashRate: number;
  createdAt: string;
}

interface LivePlayer {
  id: string;
  name: string;
  position: string;
  team: string;
  salary: number;
  projection: number;
  floor: number;
  ceiling: number;
  ownership: number;
  leverageScore: number;
  roi: number;
  winRate: number;
  isLive: boolean;
}

export default function LiveDashboardPage() {
  const [selectedSlate, setSelectedSlate] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Live slates data
  const { data: liveSlates, isLoading: slatesLoading } = useQuery({
    queryKey: ['live-slates'],
    queryFn: async () => {
      const response = await fetch('/api/live/slates');
      if (!response.ok) throw new Error('Failed to fetch live slates');
      return response.json();
    },
    refetchInterval: autoRefresh ? 30000 : false, // 30 seconds
  });

  // Live simulation results
  const { data: simResults, isLoading: simsLoading } = useQuery({
    queryKey: ['live-simulations', selectedSlate],
    queryFn: async () => {
      if (!selectedSlate) return null;
      const response = await fetch(`/api/live/simulations?slateId=${selectedSlate}`);
      if (!response.ok) throw new Error('Failed to fetch simulations');
      return response.json();
    },
    enabled: !!selectedSlate,
    refetchInterval: autoRefresh ? 60000 : false, // 1 minute
  });

  // Live player data
  const { data: livePlayers, isLoading: playersLoading } = useQuery({
    queryKey: ['live-players', selectedSlate],
    queryFn: async () => {
      if (!selectedSlate) return null;
      const response = await fetch(`/api/live/players?slateId=${selectedSlate}`);
      if (!response.ok) throw new Error('Failed to fetch players');
      return response.json();
    },
    enabled: !!selectedSlate,
    refetchInterval: autoRefresh ? 45000 : false, // 45 seconds
  });

  // Mock data for demonstration (replace with real API calls)
  const mockLiveSlates: LiveSlate[] = [
    {
      id: 'nfl-main-slate',
      name: 'NFL Main Slate',
      sport: 'NFL',
      site: 'DraftKings',
      startTime: '2024-09-15T17:00:00Z',
      isLive: true,
      playerCount: 247,
      contestCount: 1847,
      totalPrizePool: 12500000,
      avgOwnership: 0.234,
      topLeveragePlayer: 'A.J. Brown',
    },
    {
      id: 'nfl-showdown',
      name: 'PHI @ KC Showdown',
      sport: 'NFL',
      site: 'DraftKings',
      startTime: '2024-09-15T20:20:00Z',
      isLive: false,
      playerCount: 12,
      contestCount: 456,
      totalPrizePool: 2100000,
      avgOwnership: 0.187,
      topLeveragePlayer: 'Travis Kelce',
    },
  ];

  const mockSimResults: LiveSimResult[] = [
    {
      id: 'sim-1',
      slateId: 'nfl-main-slate',
      lineupCount: 20,
      iterations: 20000,
      avgScore: 142.6,
      winRate: 0.125,
      roi: 0.87,
      top5Rate: 0.34,
      cashRate: 0.67,
      createdAt: '2024-09-15T16:45:00Z',
    },
  ];

  const mockLivePlayers: LivePlayer[] = [
    {
      id: 'p1',
      name: 'Josh Allen',
      position: 'QB',
      team: 'BUF',
      salary: 8500,
      projection: 22.5,
      floor: 12.8,
      ceiling: 35.2,
      ownership: 0.284,
      leverageScore: 8.6,
      roi: 0.92,
      winRate: 0.156,
      isLive: true,
    },
    {
      id: 'p2',
      name: 'A.J. Brown',
      position: 'WR',
      team: 'PHI',
      salary: 7000,
      projection: 16.8,
      floor: 8.2,
      ceiling: 32.1,
      ownership: 0.084,
      leverageScore: 9.6,
      roi: 1.34,
      winRate: 0.089,
      isLive: true,
    },
  ];

  const roiData = [
    { name: 'GPP', roi: 0.87, winRate: 12.5, color: '#ef4444' },
    { name: 'Cash', roi: 1.23, winRate: 67.3, color: '#22c55e' },
    { name: 'SE', roi: 1.05, winRate: 34.2, color: '#3b82f6' },
  ];

  return (
    <div className='space-y-6'>
      {/* Live Dashboard Header */}
      <div className='bg-gradient-to-r from-green-600 to-blue-600 rounded-lg p-6 text-white'>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-bold'>🔴 LIVE DFS Dashboard</h1>
            <p className='mt-1 text-green-100'>
              Real-time data • Live simulations • ROI tracking • Win% analysis
            </p>
          </div>
          <div className='flex items-center space-x-4'>
            <div className='text-right'>
              <div className='text-sm text-green-200'>Auto Refresh</div>
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={clsx(
                  'flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium',
                  autoRefresh ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-700'
                )}
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
              <div className='text-sm text-green-200'>Last Update</div>
              <div className='text-lg font-bold'>{new Date().toLocaleTimeString()}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Slates Grid */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {mockLiveSlates.map(slate => (
          <div
            key={slate.id}
            className={clsx(
              'card cursor-pointer transition-all duration-200',
              selectedSlate === slate.id
                ? 'ring-2 ring-green-500 border-green-200 bg-green-50'
                : 'hover:border-gray-300 hover:shadow-md'
            )}
            onClick={() => setSelectedSlate(slate.id)}
          >
            <div className='flex items-center justify-between mb-4'>
              <div>
                <h3 className='text-lg font-bold text-gray-900'>{slate.name}</h3>
                <div className='flex items-center space-x-2 text-sm text-gray-500'>
                  <span>{slate.sport}</span>
                  <span>•</span>
                  <span>{slate.site}</span>
                  <span>•</span>
                  <span
                    className={clsx(
                      'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                      slate.isLive
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    )}
                  >
                    {slate.isLive ? '🔴 LIVE' : '⏰ Upcoming'}
                  </span>
                </div>
              </div>
              <div className='text-right'>
                <div className='text-2xl font-bold text-green-600'>
                  ${(slate.totalPrizePool / 1000000).toFixed(1)}M
                </div>
                <div className='text-xs text-gray-500'>Total Prizes</div>
              </div>
            </div>

            <div className='grid grid-cols-4 gap-4 text-center'>
              <div>
                <div className='text-lg font-semibold text-gray-900'>
                  {slate.playerCount}
                </div>
                <div className='text-xs text-gray-500'>Players</div>
              </div>
              <div>
                <div className='text-lg font-semibold text-gray-900'>
                  {slate.contestCount.toLocaleString()}
                </div>
                <div className='text-xs text-gray-500'>Contests</div>
              </div>
              <div>
                <div className='text-lg font-semibold text-gray-900'>
                  {(slate.avgOwnership * 100).toFixed(1)}%
                </div>
                <div className='text-xs text-gray-500'>Avg Own</div>
              </div>
              <div>
                <div className='text-lg font-semibold text-green-600'>
                  {slate.topLeveragePlayer}
                </div>
                <div className='text-xs text-gray-500'>Top Leverage</div>
              </div>
            </div>

            {slate.isLive && (
              <div className='mt-4 pt-4 border-t border-green-200'>
                <div className='flex items-center justify-center space-x-2 text-green-600'>
                  <div className='w-2 h-2 bg-green-500 rounded-full animate-pulse'></div>
                  <span className='text-sm font-medium'>Live Updates Active</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Live Analytics Dashboard */}
      {selectedSlate && (
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          {/* ROI & Win Rate Analysis */}
          <div className='lg:col-span-2 space-y-6'>
            <div className='card'>
              <div className='card-header'>
                <h3 className='text-lg font-medium text-gray-900 flex items-center'>
                  <TrophyIcon className='w-5 h-5 mr-2 text-yellow-500' />
                  Live ROI & Win Rate Analysis
                </h3>
                <p className='text-sm text-gray-500'>Real-time performance metrics</p>
              </div>

              <div className='h-64 flex items-center justify-center bg-gray-50 rounded-lg'>
                <div className='text-center'>
                  <ChartBarIcon className='w-12 h-12 text-gray-400 mx-auto mb-4' />
                  <h3 className='text-lg font-medium text-gray-900 mb-2'>
                    Live ROI Chart
                  </h3>
                  <div className='grid grid-cols-3 gap-4 text-sm'>
                    {roiData.map(item => (
                      <div
                        key={item.name}
                        className='text-center p-3 bg-white rounded border'
                      >
                        <div className='font-medium text-gray-900'>{item.name}</div>
                        <div
                          className='text-lg font-bold'
                          style={{ color: item.color }}
                        >
                          {(item.roi * 100).toFixed(1)}%
                        </div>
                        <div className='text-xs text-gray-500'>
                          Win: {item.winRate.toFixed(1)}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Live Simulation Results */}
            <div className='card'>
              <div className='card-header'>
                <h3 className='text-lg font-medium text-gray-900 flex items-center'>
                  <ChartBarIcon className='w-5 h-5 mr-2 text-blue-500' />
                  Live Simulation Results
                </h3>
                <p className='text-sm text-gray-500'>
                  20,000+ iterations • Updated every minute
                </p>
              </div>

              {mockSimResults.map(sim => (
                <div
                  key={sim.id}
                  className='p-4 bg-blue-50 border border-blue-200 rounded-lg'
                >
                  <div className='grid grid-cols-2 md:grid-cols-5 gap-4 text-center'>
                    <div>
                      <div className='text-2xl font-bold text-blue-600'>
                        {sim.avgScore.toFixed(1)}
                      </div>
                      <div className='text-xs text-blue-800'>Avg Score</div>
                    </div>
                    <div>
                      <div className='text-2xl font-bold text-green-600'>
                        {(sim.winRate * 100).toFixed(1)}%
                      </div>
                      <div className='text-xs text-green-800'>Win Rate</div>
                    </div>
                    <div>
                      <div className='text-2xl font-bold text-yellow-600'>
                        {(sim.roi * 100).toFixed(0)}%
                      </div>
                      <div className='text-xs text-yellow-800'>ROI</div>
                    </div>
                    <div>
                      <div className='text-2xl font-bold text-purple-600'>
                        {(sim.top5Rate * 100).toFixed(1)}%
                      </div>
                      <div className='text-xs text-purple-800'>Top 5%</div>
                    </div>
                    <div>
                      <div className='text-2xl font-bold text-indigo-600'>
                        {(sim.cashRate * 100).toFixed(1)}%
                      </div>
                      <div className='text-xs text-indigo-800'>Cash Rate</div>
                    </div>
                  </div>

                  <div className='mt-4 text-center'>
                    <span className='inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800'>
                      {sim.iterations.toLocaleString()} iterations • {sim.lineupCount}{' '}
                      lineups
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Live Player Rankings */}
          <div className='space-y-6'>
            <div className='card'>
              <div className='card-header'>
                <h3 className='text-lg font-medium text-gray-900 flex items-center'>
                  <BoltIcon className='w-5 h-5 mr-2 text-yellow-500' />
                  Live Leverage Rankings
                </h3>
                <p className='text-sm text-gray-500'>Updated every 30 seconds</p>
              </div>

              <div className='space-y-3'>
                {mockLivePlayers
                  .sort((a, b) => b.leverageScore - a.leverageScore)
                  .map((player, index) => (
                    <div
                      key={player.id}
                      className='p-3 border border-gray-200 rounded-lg'
                    >
                      <div className='flex items-center justify-between'>
                        <div className='flex items-center space-x-3'>
                          <div
                            className={clsx(
                              'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white',
                              index === 0
                                ? 'bg-yellow-500'
                                : index === 1
                                  ? 'bg-gray-400'
                                  : index === 2
                                    ? 'bg-orange-500'
                                    : 'bg-blue-500'
                            )}
                          >
                            {index + 1}
                          </div>
                          <div>
                            <div className='font-medium text-gray-900'>
                              {player.name}
                            </div>
                            <div className='text-sm text-gray-500'>
                              {player.position} • {player.team}
                            </div>
                          </div>
                        </div>
                        <div className='text-right'>
                          <div className='text-lg font-bold text-yellow-600'>
                            {player.leverageScore.toFixed(1)}
                          </div>
                          <div className='text-xs text-gray-500'>Leverage</div>
                        </div>
                      </div>

                      <div className='mt-3 grid grid-cols-3 gap-2 text-center text-xs'>
                        <div className='p-2 bg-red-50 rounded'>
                          <div className='font-medium text-red-700'>Floor</div>
                          <div className='text-red-900'>{player.floor}</div>
                        </div>
                        <div className='p-2 bg-blue-50 rounded'>
                          <div className='font-medium text-blue-700'>Proj</div>
                          <div className='text-blue-900'>{player.projection}</div>
                        </div>
                        <div className='p-2 bg-green-50 rounded'>
                          <div className='font-medium text-green-700'>Ceiling</div>
                          <div className='text-green-900'>{player.ceiling}</div>
                        </div>
                      </div>

                      <div className='mt-3 flex items-center justify-between text-sm'>
                        <span className='text-gray-600'>
                          Own: {(player.ownership * 100).toFixed(1)}%
                        </span>
                        <span className='text-green-600'>
                          ROI: {(player.roi * 100).toFixed(0)}%
                        </span>
                        <span className='text-blue-600'>
                          Win: {(player.winRate * 100).toFixed(1)}%
                        </span>
                      </div>

                      {player.isLive && (
                        <div className='mt-2 flex items-center justify-center'>
                          <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800'>
                            <div className='w-1.5 h-1.5 bg-red-500 rounded-full mr-1 animate-pulse'></div>
                            LIVE
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className='card'>
              <div className='card-header'>
                <h3 className='text-lg font-medium text-gray-900'>Live Actions</h3>
              </div>

              <div className='space-y-3'>
                <button className='w-full btn-primary flex items-center justify-center space-x-2'>
                  <PlayIcon className='w-4 h-4' />
                  <span>Run Live Simulation</span>
                </button>

                <button className='w-full btn-success flex items-center justify-center space-x-2'>
                  <BoltIcon className='w-4 h-4' />
                  <span>Optimize for ROI</span>
                </button>

                <button className='w-full btn-secondary flex items-center justify-center space-x-2'>
                  <EyeIcon className='w-4 h-4' />
                  <span>Track Ownership</span>
                </button>

                <button className='w-full btn-secondary flex items-center justify-center space-x-2'>
                  <ArrowTrendingUpIcon className='w-4 h-4' />
                  <span>Export Lineups</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Live Performance Metrics */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
        <div className='card'>
          <div className='flex items-center'>
            <div className='flex-shrink-0'>
              <TrophyIcon className='h-8 w-8 text-yellow-500' />
            </div>
            <div className='ml-3'>
              <p className='text-sm font-medium text-gray-900'>Live ROI</p>
              <p className='text-2xl font-bold text-yellow-600'>87%</p>
            </div>
          </div>
        </div>

        <div className='card'>
          <div className='flex items-center'>
            <div className='flex-shrink-0'>
              <ChartBarIcon className='h-8 w-8 text-green-500' />
            </div>
            <div className='ml-3'>
              <p className='text-sm font-medium text-gray-900'>Win Rate</p>
              <p className='text-2xl font-bold text-green-600'>12.5%</p>
            </div>
          </div>
        </div>

        <div className='card'>
          <div className='flex items-center'>
            <div className='flex-shrink-0'>
              <FireIcon className='h-8 w-8 text-red-500' />
            </div>
            <div className='ml-3'>
              <p className='text-sm font-medium text-gray-900'>Top 5%</p>
              <p className='text-2xl font-bold text-red-600'>34.2%</p>
            </div>
          </div>
        </div>

        <div className='card'>
          <div className='flex items-center'>
            <div className='flex-shrink-0'>
              <CurrencyDollarIcon className='h-8 w-8 text-blue-500' />
            </div>
            <div className='ml-3'>
              <p className='text-sm font-medium text-gray-900'>Cash Rate</p>
              <p className='text-2xl font-bold text-blue-600'>67.3%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
