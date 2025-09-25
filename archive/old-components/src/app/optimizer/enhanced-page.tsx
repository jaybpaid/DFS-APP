'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  CpuChipIcon,
  PlayIcon,
  AcademicCapIcon,
  LightBulbIcon,
  ChartBarIcon,
  TrophyIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  LockClosedIcon,
  XMarkIcon,
  ArrowTrendingUpIcon,
  FireIcon,
  BoltIcon,
} from '@heroicons/react/24/outline';
import { clsx } from 'clsx';
import { useDfsStore, type Player } from '@/store/dfs-store';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Enhanced player interface with Stokastic-style data
interface EnhancedPlayer extends Player {
  floor: number;
  ceiling: number;
  ownership: number;
  leverageScore: number;
  boomProb: number;
  bustProb: number;
  valueRating: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D';
  playType: 'LEVERAGE' | 'SAFE' | 'CHALK' | 'PUNT' | 'CONTRARIAN';
  gameScript: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  weatherImpact: 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';
}

const OptimizationFormSchema = z.object({
  lineupCount: z.number().min(1).max(150),
  uniqueness: z.number().min(0).max(1),
  contestType: z.enum(['GPP', 'CASH', 'SE']),
  riskTolerance: z.enum(['CONSERVATIVE', 'BALANCED', 'AGGRESSIVE']),
  leverageFocus: z.boolean(),
});

type OptimizationFormData = z.infer<typeof OptimizationFormSchema>;

export default function EnhancedOptimizerPage() {
  const {
    currentSlate,
    optimizationSettings,
    updateOptimizationSettings,
    isOptimizing,
    setOptimizing,
    optimizedLineups,
  } = useDfsStore();

  const [activeView, setActiveView] = useState<
    'overview' | 'players' | 'leverage' | 'education'
  >('overview');
  const [selectedPlayer, setSelectedPlayer] = useState<EnhancedPlayer | null>(null);

  // Form handling with enhanced validation
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<OptimizationFormData>({
    resolver: zodResolver(OptimizationFormSchema),
    defaultValues: {
      lineupCount: 20,
      uniqueness: 0.7,
      contestType: 'GPP',
      riskTolerance: 'BALANCED',
      leverageFocus: true,
    },
  });

  const contestType = watch('contestType');
  const riskTolerance = watch('riskTolerance');

  // Mock enhanced player data (in production, this comes from MCP server)
  const enhancedPlayers: EnhancedPlayer[] = [
    {
      id: 'p1',
      name: 'Josh Allen',
      position: 'QB',
      salary: 8500,
      team: 'BUF',
      dkPlayerId: 11191,
      projection: 22.5,
      floor: 12.8,
      ceiling: 35.2,
      ownership: 0.284,
      leverageScore: 8.6,
      boomProb: 0.32,
      bustProb: 0.08,
      valueRating: 'A',
      playType: 'LEVERAGE',
      gameScript: 'POSITIVE',
      weatherImpact: 'LOW',
    },
    {
      id: 'p2',
      name: 'A.J. Brown',
      position: 'WR',
      salary: 7000,
      team: 'PHI',
      dkPlayerId: 11192,
      projection: 16.8,
      floor: 8.2,
      ceiling: 32.1,
      ownership: 0.084,
      leverageScore: 9.6,
      boomProb: 0.28,
      bustProb: 0.15,
      valueRating: 'A+',
      playType: 'CONTRARIAN',
      gameScript: 'POSITIVE',
      weatherImpact: 'NONE',
    },
    {
      id: 'p3',
      name: 'Christian McCaffrey',
      position: 'RB',
      salary: 9000,
      team: 'SF',
      dkPlayerId: 11193,
      projection: 20.1,
      floor: 14.5,
      ceiling: 28.9,
      ownership: 0.456,
      leverageScore: 3.2,
      boomProb: 0.22,
      bustProb: 0.05,
      valueRating: 'B+',
      playType: 'CHALK',
      gameScript: 'POSITIVE',
      weatherImpact: 'NONE',
    },
  ];

  const getLeverageColor = (score: number) => {
    if (score >= 9) return 'text-green-600 bg-green-100';
    if (score >= 7) return 'text-yellow-600 bg-yellow-100';
    if (score >= 5) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getPlayTypeIcon = (playType: string) => {
    switch (playType) {
      case 'LEVERAGE':
        return <BoltIcon className='w-4 h-4 text-yellow-500' />;
      case 'CONTRARIAN':
        return <FireIcon className='w-4 h-4 text-red-500' />;
      case 'CHALK':
        return <TrophyIcon className='w-4 h-4 text-blue-500' />;
      case 'SAFE':
        return <CheckCircleIcon className='w-4 h-4 text-green-500' />;
      default:
        return <ChartBarIcon className='w-4 h-4 text-gray-500' />;
    }
  };

  if (!currentSlate) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='text-center'>
          <CpuChipIcon className='mx-auto h-12 w-12 text-gray-400' />
          <h3 className='mt-2 text-sm font-medium text-gray-900'>No slate selected</h3>
          <p className='mt-1 text-sm text-gray-500'>
            Please select a slate from the Slates page to start optimizing
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Enhanced Header with Contest Type Awareness */}
      <div className='bg-gradient-to-r from-primary-600 to-primary-800 rounded-lg p-6 text-white'>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-2xl font-bold'>🏆 Elite DFS Optimizer</h1>
            <p className='mt-1 text-primary-100'>
              Stokastic-Style Simulation-Driven Optimization for{' '}
              {currentSlate.displayName}
            </p>
          </div>
          <div className='text-right'>
            <div className='text-sm text-primary-200'>Contest Strategy</div>
            <div className='text-xl font-bold'>{contestType} Focused</div>
          </div>
        </div>
      </div>

      {/* Educational Workflow Guide (Stokastic Style) */}
      <div className='card bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200'>
        <div className='flex items-start space-x-4'>
          <AcademicCapIcon className='w-8 h-8 text-blue-600 flex-shrink-0 mt-1' />
          <div>
            <h3 className='text-lg font-semibold text-blue-900'>
              🎓 How To Use Elite Simulations
            </h3>
            <div className='mt-3 grid grid-cols-1 md:grid-cols-5 gap-4 text-sm'>
              <div className='flex items-center space-x-2'>
                <span className='w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold'>
                  1
                </span>
                <span className='text-blue-800'>Select contest type</span>
              </div>
              <div className='flex items-center space-x-2'>
                <span className='w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold'>
                  2
                </span>
                <span className='text-blue-800'>Find leverage players</span>
              </div>
              <div className='flex items-center space-x-2'>
                <span className='w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold'>
                  3
                </span>
                <span className='text-blue-800'>Build around leverage</span>
              </div>
              <div className='flex items-center space-x-2'>
                <span className='w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold'>
                  4
                </span>
                <span className='text-blue-800'>Avoid chalk players</span>
              </div>
              <div className='flex items-center space-x-2'>
                <span className='w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold'>
                  5
                </span>
                <span className='text-blue-800'>Export & submit</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* View Tabs */}
      <div className='border-b border-gray-200'>
        <nav className='-mb-px flex space-x-8'>
          {[
            { id: 'overview', name: 'Overview', icon: ChartBarIcon },
            { id: 'players', name: 'Player Pool', icon: CpuChipIcon },
            { id: 'leverage', name: 'Leverage Plays', icon: BoltIcon },
            { id: 'education', name: 'Strategy Guide', icon: AcademicCapIcon },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id as any)}
                className={clsx(
                  'flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm',
                  activeView === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                )}
              >
                <Icon className='w-4 h-4' />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeView === 'overview' && (
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          {/* Optimization Settings */}
          <div className='lg:col-span-2 space-y-6'>
            <div className='card'>
              <div className='card-header'>
                <h3 className='text-lg font-medium text-gray-900'>
                  Contest-Aware Settings
                </h3>
                <p className='text-sm text-gray-500'>
                  Optimized for {contestType} strategy
                </p>
              </div>

              <form className='space-y-6'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <div>
                    <label className='form-label'>Contest Type</label>
                    <select {...register('contestType')} className='form-input'>
                      <option value='GPP'>GPP (Tournaments)</option>
                      <option value='CASH'>Cash Games</option>
                      <option value='SE'>Single Entry</option>
                    </select>
                    <p className='text-xs text-gray-500 mt-1'>
                      {contestType === 'GPP' &&
                        'High variance, leverage-focused strategy'}
                      {contestType === 'CASH' && 'Safe, high-floor player strategy'}
                      {contestType === 'SE' && 'Balanced approach with upside'}
                    </p>
                  </div>

                  <div>
                    <label className='form-label'>Risk Tolerance</label>
                    <select {...register('riskTolerance')} className='form-input'>
                      <option value='CONSERVATIVE'>Conservative</option>
                      <option value='BALANCED'>Balanced</option>
                      <option value='AGGRESSIVE'>Aggressive</option>
                    </select>
                    <p className='text-xs text-gray-500 mt-1'>
                      {riskTolerance === 'AGGRESSIVE' &&
                        'High ceiling, boom/bust players'}
                      {riskTolerance === 'BALANCED' && 'Mix of safe and upside plays'}
                      {riskTolerance === 'CONSERVATIVE' &&
                        'High floor, consistent players'}
                    </p>
                  </div>

                  <div>
                    <label className='form-label'>Number of Lineups</label>
                    <input
                      type='number'
                      {...register('lineupCount', { valueAsNumber: true })}
                      className='form-input'
                      min='1'
                      max='150'
                    />
                  </div>

                  <div>
                    <label className='form-label'>Uniqueness</label>
                    <input
                      type='number'
                      step='0.1'
                      {...register('uniqueness', { valueAsNumber: true })}
                      className='form-input'
                      min='0'
                      max='1'
                    />
                  </div>
                </div>

                <div className='flex items-center space-x-3'>
                  <input
                    type='checkbox'
                    {...register('leverageFocus')}
                    className='rounded border-gray-300 text-primary-600 focus:ring-primary-500'
                  />
                  <label className='text-sm font-medium text-gray-700'>
                    Focus on leverage plays (Stokastic-style)
                  </label>
                </div>
              </form>
            </div>

            {/* Strategy Insights */}
            <div className='card'>
              <div className='card-header'>
                <h3 className='text-lg font-medium text-gray-900 flex items-center'>
                  <LightBulbIcon className='w-5 h-5 mr-2 text-yellow-500' />
                  Strategy Insights
                </h3>
              </div>

              <div className='space-y-4'>
                {contestType === 'GPP' && (
                  <div className='p-4 bg-yellow-50 border border-yellow-200 rounded-lg'>
                    <h4 className='font-medium text-yellow-900'>
                      🏆 GPP Tournament Strategy
                    </h4>
                    <p className='text-sm text-yellow-800 mt-1'>
                      Focus on <strong>high-leverage players</strong> with low ownership
                      and high ceiling. A.J. Brown (8.4% ownership, 32.1 ceiling) = MAX
                      LEVERAGE play.
                    </p>
                  </div>
                )}

                {contestType === 'CASH' && (
                  <div className='p-4 bg-green-50 border border-green-200 rounded-lg'>
                    <h4 className='font-medium text-green-900'>
                      💰 Cash Game Strategy
                    </h4>
                    <p className='text-sm text-green-800 mt-1'>
                      Prioritize <strong>high-floor players</strong> with consistent
                      production. Avoid boom/bust players - focus on 15+ point floors.
                    </p>
                  </div>
                )}

                <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                  <div className='text-center p-3 bg-gray-50 rounded-lg'>
                    <div className='text-2xl font-bold text-primary-600'>
                      {enhancedPlayers.filter(p => p.leverageScore >= 8).length}
                    </div>
                    <div className='text-xs text-gray-600'>High Leverage</div>
                  </div>
                  <div className='text-center p-3 bg-gray-50 rounded-lg'>
                    <div className='text-2xl font-bold text-green-600'>
                      {enhancedPlayers.filter(p => p.ownership < 0.15).length}
                    </div>
                    <div className='text-xs text-gray-600'>Low Owned</div>
                  </div>
                  <div className='text-center p-3 bg-gray-50 rounded-lg'>
                    <div className='text-2xl font-bold text-yellow-600'>
                      {enhancedPlayers.filter(p => p.boomProb > 0.25).length}
                    </div>
                    <div className='text-xs text-gray-600'>Boom Potential</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar - Top Leverage Plays */}
          <div className='space-y-6'>
            <div className='card'>
              <div className='card-header'>
                <h3 className='text-lg font-medium text-gray-900 flex items-center'>
                  <BoltIcon className='w-5 h-5 mr-2 text-yellow-500' />
                  Top Leverage Plays
                </h3>
                <p className='text-sm text-gray-500'>High ceiling + Low ownership</p>
              </div>

              <div className='space-y-3'>
                {enhancedPlayers
                  .sort((a, b) => b.leverageScore - a.leverageScore)
                  .slice(0, 5)
                  .map(player => (
                    <div
                      key={player.id}
                      className='p-3 border border-gray-200 rounded-lg hover:border-primary-300 cursor-pointer transition-colors'
                      onClick={() => setSelectedPlayer(player)}
                    >
                      <div className='flex items-center justify-between'>
                        <div className='flex items-center space-x-2'>
                          {getPlayTypeIcon(player.playType)}
                          <div>
                            <div className='font-medium text-gray-900'>
                              {player.name}
                            </div>
                            <div className='text-xs text-gray-500'>
                              {player.position} • {player.team}
                            </div>
                          </div>
                        </div>
                        <div
                          className={clsx(
                            'px-2 py-1 rounded-full text-xs font-bold',
                            getLeverageColor(player.leverageScore)
                          )}
                        >
                          {player.leverageScore.toFixed(1)}
                        </div>
                      </div>

                      {/* Stokastic-Style Range Display */}
                      <div className='mt-3 space-y-2'>
                        <div className='flex justify-between text-xs'>
                          <span className='text-red-600'>Floor: {player.floor}</span>
                          <span className='font-medium'>Proj: {player.projection}</span>
                          <span className='text-green-600'>
                            Ceiling: {player.ceiling}
                          </span>
                        </div>

                        <div className='relative h-2 bg-gray-200 rounded-full'>
                          <div
                            className='absolute left-0 h-2 bg-gradient-to-r from-red-400 via-yellow-400 to-green-400 rounded-full'
                            style={{ width: '100%' }}
                          />
                          <div
                            className='absolute w-1 h-4 bg-gray-800 rounded-full -mt-1'
                            style={{
                              left: `${((player.projection - player.floor) / (player.ceiling - player.floor)) * 100}%`,
                            }}
                          />
                        </div>

                        <div className='flex justify-between text-xs'>
                          <span className='text-gray-600'>
                            Own: {(player.ownership * 100).toFixed(1)}%
                          </span>
                          <span className='text-gray-600'>
                            Boom: {(player.boomProb * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>

                      {/* Leverage Explanation */}
                      <div className='mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs'>
                        <strong>Why Leverage:</strong> Ceiling of {player.ceiling} with
                        only {(player.ownership * 100).toFixed(1)}% ownership makes this
                        a high-leverage {contestType} play.
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className='card'>
              <div className='card-header'>
                <h3 className='text-lg font-medium text-gray-900'>Quick Actions</h3>
              </div>

              <div className='space-y-3'>
                <button className='w-full btn-primary flex items-center justify-center space-x-2'>
                  <PlayIcon className='w-4 h-4' />
                  <span>Optimize for {contestType}</span>
                </button>

                <button className='w-full btn-secondary flex items-center justify-center space-x-2'>
                  <BoltIcon className='w-4 h-4' />
                  <span>Find Leverage Plays</span>
                </button>

                <button className='w-full btn-secondary flex items-center justify-center space-x-2'>
                  <ChartBarIcon className='w-4 h-4' />
                  <span>Run Simulations</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Player Pool Tab */}
      {activeView === 'players' && (
        <div className='card'>
          <div className='card-header'>
            <h3 className='text-lg font-medium text-gray-900'>
              Enhanced Player Pool ({enhancedPlayers.length} players)
            </h3>
            <p className='text-sm text-gray-500'>
              Stokastic-style projections with floor/ceiling ranges and leverage
              analysis
            </p>
          </div>

          <div className='overflow-x-auto'>
            <table className='table'>
              <thead className='table-header'>
                <tr>
                  <th className='table-header-cell'>Player</th>
                  <th className='table-header-cell'>Salary</th>
                  <th className='table-header-cell'>Projections</th>
                  <th className='table-header-cell'>Ownership</th>
                  <th className='table-header-cell'>Leverage</th>
                  <th className='table-header-cell'>Play Type</th>
                  <th className='table-header-cell'>Actions</th>
                </tr>
              </thead>
              <tbody className='table-body'>
                {enhancedPlayers.map(player => (
                  <tr key={player.id} className='hover:bg-gray-50'>
                    <td className='table-cell'>
                      <div className='flex items-center space-x-3'>
                        <div>
                          <div className='font-medium text-gray-900'>{player.name}</div>
                          <div className='text-sm text-gray-500'>
                            {player.position} • {player.team}
                          </div>
                        </div>
                        <span
                          className={clsx(
                            'px-2 py-1 rounded text-xs font-medium',
                            player.valueRating.startsWith('A')
                              ? 'bg-green-100 text-green-800'
                              : player.valueRating.startsWith('B')
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                          )}
                        >
                          {player.valueRating}
                        </span>
                      </div>
                    </td>
                    <td className='table-cell'>
                      <div className='font-medium'>
                        ${player.salary.toLocaleString()}
                      </div>
                      <div className='text-xs text-gray-500'>
                        {((player.projection / player.salary) * 1000).toFixed(2)} pts/K
                      </div>
                    </td>
                    <td className='table-cell'>
                      <div className='space-y-1'>
                        <div className='flex justify-between text-xs'>
                          <span className='text-red-600'>F: {player.floor}</span>
                          <span className='font-medium'>P: {player.projection}</span>
                          <span className='text-green-600'>C: {player.ceiling}</span>
                        </div>
                        <div className='relative h-1.5 bg-gray-200 rounded-full'>
                          <div className='absolute left-0 h-1.5 bg-gradient-to-r from-red-400 via-yellow-400 to-green-400 rounded-full w-full' />
                          <div
                            className='absolute w-0.5 h-3 bg-gray-800 rounded-full -mt-0.5'
                            style={{
                              left: `${((player.projection - player.floor) / (player.ceiling - player.floor)) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className='table-cell'>
                      <div className='font-medium'>
                        {(player.ownership * 100).toFixed(1)}%
                      </div>
                      <div
                        className={clsx(
                          'text-xs',
                          player.ownership < 0.15
                            ? 'text-green-600'
                            : player.ownership < 0.25
                              ? 'text-yellow-600'
                              : 'text-red-600'
                        )}
                      >
                        {player.ownership < 0.15
                          ? 'LOW'
                          : player.ownership < 0.25
                            ? 'MEDIUM'
                            : 'HIGH'}
                      </div>
                    </td>
                    <td className='table-cell'>
                      <div
                        className={clsx(
                          'px-2 py-1 rounded-full text-xs font-bold text-center',
                          getLeverageColor(player.leverageScore)
                        )}
                      >
                        {player.leverageScore.toFixed(1)}
                      </div>
                      <div className='text-xs text-gray-500 mt-1'>
                        Boom: {(player.boomProb * 100).toFixed(0)}%
                      </div>
                    </td>
                    <td className='table-cell'>
                      <div className='flex items-center space-x-1'>
                        {getPlayTypeIcon(player.playType)}
                        <span className='text-xs font-medium'>{player.playType}</span>
                      </div>
                    </td>
                    <td className='table-cell'>
                      <div className='flex items-center space-x-2'>
                        <button
                          className='text-success-600 hover:text-success-800'
                          title='Lock player'
                        >
                          <LockClosedIcon className='w-4 h-4' />
                        </button>
                        <button
                          className='text-danger-600 hover:text-danger-800'
                          title='Ban player'
                        >
                          <XMarkIcon className='w-4 h-4' />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Leverage Analysis Tab */}
      {activeView === 'leverage' && (
        <div className='space-y-6'>
          <div className='card'>
            <div className='card-header'>
              <h3 className='text-lg font-medium text-gray-900 flex items-center'>
                <BoltIcon className='w-5 h-5 mr-2 text-yellow-500' />
                Leverage Play Analysis
              </h3>
              <p className='text-sm text-gray-500'>
                Players with the highest leverage scores for {contestType} contests
              </p>
            </div>

            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
              {enhancedPlayers
                .filter(p => p.leverageScore >= 7)
                .map(player => (
                  <div
                    key={player.id}
                    className='p-4 border border-gray-200 rounded-lg'
                  >
                    <div className='flex items-center justify-between mb-3'>
                      <div className='flex items-center space-x-2'>
                        {getPlayTypeIcon(player.playType)}
                        <div>
                          <div className='font-medium text-gray-900'>{player.name}</div>
                          <div className='text-sm text-gray-500'>
                            {player.position} • {player.team} • $
                            {player.salary.toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div
                        className={clsx(
                          'px-3 py-1 rounded-full text-sm font-bold',
                          getLeverageColor(player.leverageScore)
                        )}
                      >
                        {player.leverageScore.toFixed(1)}/10
                      </div>
                    </div>

                    {/* Detailed Analysis */}
                    <div className='space-y-3'>
                      <div className='grid grid-cols-3 gap-2 text-center text-xs'>
                        <div className='p-2 bg-red-50 rounded'>
                          <div className='font-medium text-red-700'>Floor</div>
                          <div className='text-red-900'>{player.floor}</div>
                        </div>
                        <div className='p-2 bg-blue-50 rounded'>
                          <div className='font-medium text-blue-700'>Projection</div>
                          <div className='text-blue-900'>{player.projection}</div>
                        </div>
                        <div className='p-2 bg-green-50 rounded'>
                          <div className='font-medium text-green-700'>Ceiling</div>
                          <div className='text-green-900'>{player.ceiling}</div>
                        </div>
                      </div>

                      <div className='p-3 bg-yellow-50 border border-yellow-200 rounded'>
                        <h4 className='font-medium text-yellow-900 text-sm'>
                          🧠 Leverage Analysis
                        </h4>
                        <p className='text-xs text-yellow-800 mt-1'>
                          <strong>{player.name}</strong> has a ceiling of{' '}
                          <strong>{player.ceiling} points</strong> with only{' '}
                          <strong>
                            {(player.ownership * 100).toFixed(1)}% ownership
                          </strong>
                          . This creates massive leverage in {contestType} contests.
                        </p>
                        <div className='mt-2 flex items-center justify-between text-xs'>
                          <span>
                            Boom Probability:{' '}
                            <strong>{(player.boomProb * 100).toFixed(0)}%</strong>
                          </span>
                          <span>
                            Bust Risk:{' '}
                            <strong>{(player.bustProb * 100).toFixed(0)}%</strong>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Education Tab */}
      {activeView === 'education' && (
        <div className='space-y-6'>
          <div className='card'>
            <div className='card-header'>
              <h3 className='text-lg font-medium text-gray-900 flex items-center'>
                <AcademicCapIcon className='w-5 h-5 mr-2 text-blue-500' />
                DFS Strategy Guide
              </h3>
              <p className='text-sm text-gray-500'>
                Learn how to use simulations like the pros
              </p>
            </div>

            <div className='space-y-6'>
              <div className='p-4 bg-blue-50 border border-blue-200 rounded-lg'>
                <h4 className='font-medium text-blue-900'>
                  🎯 What Are Leverage Plays?
                </h4>
                <p className='text-sm text-blue-800 mt-2'>
                  Leverage plays are players with{' '}
                  <strong>high ceiling potential</strong> but{' '}
                  <strong>low projected ownership</strong>. When these players hit their
                  ceiling, you gain a massive advantage over the field because few
                  people own them.
                </p>
              </div>

              <div className='p-4 bg-green-50 border border-green-200 rounded-lg'>
                <h4 className='font-medium text-green-900'>📊 How Simulations Work</h4>
                <p className='text-sm text-green-800 mt-2'>
                  We run <strong>20,000+ simulations</strong> of each slate to model
                  every possible outcome. This reveals which players have the best
                  combination of upside and low ownership - the key to tournament
                  success.
                </p>
              </div>

              <div className='p-4 bg-purple-50 border border-purple-200 rounded-lg'>
                <h4 className='font-medium text-purple-900'>🏆 Contest Strategy</h4>
                <div className='mt-2 space-y-2 text-sm text-purple-800'>
                  <div>
                    <strong>GPP/Tournaments:</strong> Focus on leverage and ceiling.
                    Accept higher bust risk for massive upside.
                  </div>
                  <div>
                    <strong>Cash Games:</strong> Prioritize floor and consistency. Avoid
                    boom/bust players.
                  </div>
                  <div>
                    <strong>Single Entry:</strong> Balanced approach with some leverage
                    but safer foundation.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
