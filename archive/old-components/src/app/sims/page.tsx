import React, { useState } from 'react';
import {
  ChartBarIcon,
  PlayIcon,
  CpuChipIcon,
  TrophyIcon,
  ClockIcon,
  FireIcon,
} from '@heroicons/react/24/outline';
import { clsx } from 'clsx';

interface SimulationConfig {
  contestType: 'gpp' | 'cash' | 'showdown';
  fieldSize: number;
  iterations: number;
  lineupCount: number;
  useOwnership: boolean;
  useCorrelations: boolean;
  useLatestLineups: boolean;
}

interface SimulationResult {
  id: string;
  config: SimulationConfig;
  results: {
    avgScore: number;
    winRate: number;
    roi: number;
    top1Percent: number;
    top5Percent: number;
    top10Percent: number;
    cashRate: number;
  };
  status: 'pending' | 'running' | 'completed' | 'error';
  progress: number;
  createdAt: Date;
}

export default function SimsPage() {
  const [simConfig, setSimConfig] = useState<SimulationConfig>({
    contestType: 'gpp',
    fieldSize: 10000,
    iterations: 10000,
    lineupCount: 20,
    useOwnership: true,
    useCorrelations: true,
    useLatestLineups: true,
  });

  const [simulations, setSimulations] = useState<SimulationResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runSimulation = () => {
    const newSim: SimulationResult = {
      id: Date.now().toString(),
      config: { ...simConfig },
      results: {
        avgScore: 0,
        winRate: 0,
        roi: 0,
        top1Percent: 0,
        top5Percent: 0,
        top10Percent: 0,
        cashRate: 0,
      },
      status: 'running',
      progress: 0,
      createdAt: new Date(),
    };

    setSimulations(prev => [newSim, ...prev]);
    setIsRunning(true);

    // Simulate progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress >= 100) {
        clearInterval(interval);

        // Generate mock results
        const mockResults = {
          avgScore: 120 + Math.random() * 40,
          winRate: Math.random() * 0.2,
          roi: 0.6 + Math.random() * 0.8,
          top1Percent: Math.random() * 0.02,
          top5Percent: Math.random() * 0.1,
          top10Percent: Math.random() * 0.15,
          cashRate: 0.4 + Math.random() * 0.4,
        };

        setSimulations(prev =>
          prev.map(sim =>
            sim.id === newSim.id
              ? { ...sim, status: 'completed', progress: 100, results: mockResults }
              : sim
          )
        );
        setIsRunning(false);
      } else {
        setSimulations(prev =>
          prev.map(sim => (sim.id === newSim.id ? { ...sim, progress } : sim))
        );
      }
    }, 300);
  };

  const contestTypes = [
    {
      id: 'gpp',
      name: 'GPP Tournament',
      description: 'Large field tournaments',
      icon: TrophyIcon,
    },
    {
      id: 'cash',
      name: 'Cash Games',
      description: '50/50 and double-ups',
      icon: CpuChipIcon,
    },
    {
      id: 'showdown',
      name: 'Showdown',
      description: 'Single-game contests',
      icon: FireIcon,
    },
  ] as const;

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='bg-white shadow rounded-lg p-6'>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-2xl font-bold text-gray-900 mb-2'>
              Tournament Simulations
            </h1>
            <p className='text-gray-600'>
              Simulate tournament performance with field analysis based on
              chanzer0/NFL-DFS-Tools architecture
            </p>
          </div>
          <ChartBarIcon className='h-12 w-12 text-blue-500' />
        </div>
      </div>

      {/* Simulation Configuration */}
      <div className='bg-white shadow rounded-lg p-6'>
        <h3 className='text-lg font-semibold text-gray-900 mb-4'>
          Simulation Configuration
        </h3>

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          {/* Contest Type Selection */}
          <div className='space-y-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-3'>
                Contest Type
              </label>
              <div className='grid grid-cols-1 gap-3'>
                {contestTypes.map(type => (
                  <button
                    key={type.id}
                    onClick={() =>
                      setSimConfig(prev => ({ ...prev, contestType: type.id }))
                    }
                    className={clsx(
                      'p-4 rounded-lg border-2 text-left transition-all',
                      simConfig.contestType === type.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    <div className='flex items-center space-x-3'>
                      <type.icon
                        className={clsx(
                          'h-6 w-6',
                          simConfig.contestType === type.id
                            ? 'text-blue-600'
                            : 'text-gray-500'
                        )}
                      />
                      <div>
                        <div className='font-medium text-gray-900'>{type.name}</div>
                        <div className='text-sm text-gray-500'>{type.description}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className='space-y-3'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Field Size
                </label>
                <select
                  value={simConfig.fieldSize}
                  onChange={e =>
                    setSimConfig(prev => ({
                      ...prev,
                      fieldSize: parseInt(e.target.value),
                    }))
                  }
                  className='w-full border border-gray-300 rounded-md px-3 py-2 text-sm'
                >
                  <option value={100}>100 entries</option>
                  <option value={500}>500 entries</option>
                  <option value={1000}>1,000 entries</option>
                  <option value={5000}>5,000 entries</option>
                  <option value={10000}>10,000 entries</option>
                  <option value={50000}>50,000 entries</option>
                </select>
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Simulation Iterations
                </label>
                <select
                  value={simConfig.iterations}
                  onChange={e =>
                    setSimConfig(prev => ({
                      ...prev,
                      iterations: parseInt(e.target.value),
                    }))
                  }
                  className='w-full border border-gray-300 rounded-md px-3 py-2 text-sm'
                >
                  <option value={1000}>1,000 iterations</option>
                  <option value={5000}>5,000 iterations</option>
                  <option value={10000}>10,000 iterations</option>
                  <option value={20000}>20,000 iterations</option>
                  <option value={50000}>50,000 iterations</option>
                </select>
              </div>
            </div>
          </div>

          {/* Advanced Options */}
          <div className='space-y-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Lineup Count
              </label>
              <input
                type='number'
                min='1'
                max='150'
                value={simConfig.lineupCount}
                onChange={e =>
                  setSimConfig(prev => ({
                    ...prev,
                    lineupCount: parseInt(e.target.value),
                  }))
                }
                className='w-full border border-gray-300 rounded-md px-3 py-2 text-sm'
              />
            </div>

            <div className='space-y-3'>
              <h4 className='font-medium text-gray-900'>Simulation Options</h4>

              <div className='space-y-2'>
                <div className='flex items-center'>
                  <input
                    type='checkbox'
                    checked={simConfig.useOwnership}
                    onChange={e =>
                      setSimConfig(prev => ({
                        ...prev,
                        useOwnership: e.target.checked,
                      }))
                    }
                    className='rounded border-gray-300 mr-3'
                  />
                  <label className='text-sm text-gray-700'>
                    Use ownership projections
                  </label>
                </div>

                <div className='flex items-center'>
                  <input
                    type='checkbox'
                    checked={simConfig.useCorrelations}
                    onChange={e =>
                      setSimConfig(prev => ({
                        ...prev,
                        useCorrelations: e.target.checked,
                      }))
                    }
                    className='rounded border-gray-300 mr-3'
                  />
                  <label className='text-sm text-gray-700'>
                    Model player correlations
                  </label>
                </div>

                <div className='flex items-center'>
                  <input
                    type='checkbox'
                    checked={simConfig.useLatestLineups}
                    onChange={e =>
                      setSimConfig(prev => ({
                        ...prev,
                        useLatestLineups: e.target.checked,
                      }))
                    }
                    className='rounded border-gray-300 mr-3'
                  />
                  <label className='text-sm text-gray-700'>
                    Use latest optimized lineups
                  </label>
                </div>
              </div>
            </div>

            <div className='pt-4 border-t border-gray-200'>
              <button
                onClick={runSimulation}
                disabled={isRunning}
                className={clsx(
                  'w-full py-3 px-4 rounded-lg font-medium transition-colors',
                  isRunning
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                )}
              >
                {isRunning ? (
                  <span className='flex items-center justify-center space-x-2'>
                    <div className='animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full'></div>
                    <span>Running Simulation...</span>
                  </span>
                ) : (
                  <span className='flex items-center justify-center space-x-2'>
                    <PlayIcon className='w-4 h-4' />
                    <span>Run Tournament Simulation</span>
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Simulation Results */}
      {simulations.length > 0 && (
        <div className='bg-white shadow rounded-lg p-6'>
          <h3 className='text-lg font-semibold text-gray-900 mb-4'>
            Simulation Results
          </h3>

          <div className='space-y-4'>
            {simulations.map(sim => (
              <div key={sim.id} className='border border-gray-200 rounded-lg p-6'>
                <div className='flex items-center justify-between mb-4'>
                  <div>
                    <div className='font-medium text-gray-900 capitalize'>
                      {sim.config.contestType} Simulation
                    </div>
                    <div className='text-sm text-gray-500'>
                      {sim.config.fieldSize.toLocaleString()} field •{' '}
                      {sim.config.iterations.toLocaleString()} iterations •{' '}
                      {sim.config.lineupCount} lineups
                    </div>
                  </div>
                  <div className='flex items-center space-x-2'>
                    <span
                      className={clsx(
                        'inline-flex px-2 py-1 rounded-full text-xs font-medium',
                        sim.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : sim.status === 'running'
                            ? 'bg-blue-100 text-blue-800'
                            : sim.status === 'error'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                      )}
                    >
                      {sim.status === 'running'
                        ? `${Math.round(sim.progress)}% Complete`
                        : sim.status}
                    </span>
                    <span className='text-xs text-gray-500'>
                      {sim.createdAt.toLocaleTimeString()}
                    </span>
                  </div>
                </div>

                {sim.status === 'running' && (
                  <div className='w-full bg-gray-200 rounded-full h-2 mb-4'>
                    <div
                      className='bg-blue-600 h-2 rounded-full transition-all duration-200'
                      style={{ width: `${sim.progress}%` }}
                    />
                  </div>
                )}

                {sim.status === 'completed' && (
                  <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                    <div className='bg-green-50 p-4 rounded-lg text-center'>
                      <div className='text-2xl font-bold text-green-600'>
                        {sim.results.avgScore.toFixed(1)}
                      </div>
                      <div className='text-sm text-green-700'>Avg Score</div>
                    </div>

                    <div className='bg-blue-50 p-4 rounded-lg text-center'>
                      <div className='text-2xl font-bold text-blue-600'>
                        {(sim.results.winRate * 100).toFixed(1)}%
                      </div>
                      <div className='text-sm text-blue-700'>Win Rate</div>
                    </div>

                    <div className='bg-yellow-50 p-4 rounded-lg text-center'>
                      <div className='text-2xl font-bold text-yellow-600'>
                        {(sim.results.roi * 100).toFixed(0)}%
                      </div>
                      <div className='text-sm text-yellow-700'>ROI</div>
                    </div>

                    <div className='bg-purple-50 p-4 rounded-lg text-center'>
                      <div className='text-2xl font-bold text-purple-600'>
                        {(sim.results.top5Percent * 100).toFixed(1)}%
                      </div>
                      <div className='text-sm text-purple-700'>Top 5%</div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Simulation Tips */}
      <div className='bg-white shadow rounded-lg p-6'>
        <h3 className='text-lg font-semibold text-gray-900 mb-4'>
          Simulation Strategy
        </h3>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <div className='p-4 border border-green-200 rounded-lg bg-green-50'>
            <TrophyIcon className='h-8 w-8 text-green-600 mb-2' />
            <div className='font-medium text-green-900 mb-2'>GPP Strategy</div>
            <div className='text-sm text-green-700'>
              Large field size (10K+), high variance lineups, ownership contrarian plays
            </div>
          </div>

          <div className='p-4 border border-blue-200 rounded-lg bg-blue-50'>
            <CpuChipIcon className='h-8 w-8 text-blue-600 mb-2' />
            <div className='font-medium text-blue-900 mb-2'>Cash Games</div>
            <div className='text-sm text-blue-700'>
              Smaller fields (100-500), high floor plays, consistent scoring
            </div>
          </div>

          <div className='p-4 border border-orange-200 rounded-lg bg-orange-50'>
            <FireIcon className='h-8 w-8 text-orange-600 mb-2' />
            <div className='font-medium text-orange-900 mb-2'>Showdown</div>
            <div className='text-sm text-orange-700'>
              Single-game, correlation stacking, captain leverage plays
            </div>
          </div>
        </div>

        <div className='mt-6 p-4 bg-gray-50 rounded-lg'>
          <div className='text-sm text-gray-700'>
            <span className='font-medium'>Professional Tip:</span> Run 10,000+
            iterations for reliable results. GPP simulations should use ownership data
            and correlations for accurate field modeling.
          </div>
        </div>
      </div>
    </div>
  );
}
