import React, { useState, useMemo } from 'react';

interface SimulationResult {
  lineupId: string;
  projectedScore: number;
  actualScore: number;
  roi: number;
  percentile: number;
  boomRate: number;
  bustRate: number;
}

interface PlayerOutcome {
  playerId: string;
  playerName: string;
  position: string;
  projectedPoints: number;
  meanOutcome: number;
  p5: number;
  p25: number;
  p50: number;
  p75: number;
  p95: number;
  boomRate: number;
  bustRate: number;
  variance: number;
}

interface SimsTabProps {}

export default function SimsTab({}: SimsTabProps) {
  const [simSettings, setSimSettings] = useState({
    numSimulations: 10000,
    seed: 42,
    useMcpSignals: true,
    applyLateSwap: false,
    distributionType: 'normal' as 'normal' | 'lognormal' | 'empirical',
    correlationStrength: 0.7,
    weatherAdjustments: true,
    injuryAdjustments: true,
  });

  const [isRunning, setIsRunning] = useState(false);
  const [simulationResults, setSimulationResults] = useState<SimulationResult[]>([]);
  const [playerOutcomes, setPlayerOutcomes] = useState<PlayerOutcome[]>([]);

  // Mock simulation results - in real app this would come from simulation engine
  const mockResults = useMemo(() => {
    const results: SimulationResult[] = [];
    for (let i = 0; i < 150; i++) {
      results.push({
        lineupId: `lineup_${i + 1}`,
        projectedScore: 120 + Math.random() * 40,
        actualScore: 115 + Math.random() * 50,
        roi: -0.5 + Math.random() * 3,
        percentile: Math.random() * 100,
        boomRate: Math.random() * 30,
        bustRate: Math.random() * 25,
      });
    }
    return results.sort((a, b) => b.roi - a.roi);
  }, []);

  const mockPlayerOutcomes = useMemo(() => {
    const outcomes: PlayerOutcome[] = [
      {
        playerId: '1',
        playerName: 'Josh Allen',
        position: 'QB',
        projectedPoints: 22.5,
        meanOutcome: 23.1,
        p5: 12.3,
        p25: 18.7,
        p50: 22.8,
        p75: 27.2,
        p95: 35.4,
        boomRate: 28.5,
        bustRate: 15.2,
        variance: 8.4,
      },
      {
        playerId: '2',
        playerName: 'Christian McCaffrey',
        position: 'RB',
        projectedPoints: 18.2,
        meanOutcome: 18.8,
        p5: 6.1,
        p25: 13.4,
        p50: 18.5,
        p75: 23.7,
        p95: 32.1,
        boomRate: 22.3,
        bustRate: 18.7,
        variance: 9.2,
      },
      {
        playerId: '3',
        playerName: 'Tyreek Hill',
        position: 'WR',
        projectedPoints: 16.8,
        meanOutcome: 17.3,
        p5: 4.2,
        p25: 11.1,
        p50: 16.9,
        p75: 22.8,
        p95: 31.5,
        boomRate: 25.1,
        bustRate: 22.4,
        variance: 10.1,
      },
    ];
    return outcomes;
  }, []);

  const handleSettingChange = (key: string, value: number | boolean | string) => {
    setSimSettings(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const runSimulation = async () => {
    setIsRunning(true);

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 3000));

    setSimulationResults(mockResults);
    setPlayerOutcomes(mockPlayerOutcomes);
    setIsRunning(false);
  };

  const getROIColor = (roi: number) => {
    if (roi > 2) return 'text-green-600 font-bold';
    if (roi > 1) return 'text-green-500';
    if (roi > 0) return 'text-blue-500';
    if (roi > -0.5) return 'text-orange-500';
    return 'text-red-500';
  };

  const getPercentileColor = (percentile: number) => {
    if (percentile > 90) return 'bg-green-100 text-green-800';
    if (percentile > 75) return 'bg-blue-100 text-blue-800';
    if (percentile > 50) return 'bg-yellow-100 text-yellow-800';
    if (percentile > 25) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className='bg-white rounded-lg shadow'>
      <div className='px-6 py-4 border-b border-gray-200'>
        <h2 className='text-lg font-medium text-gray-900'>Monte Carlo Simulation</h2>
        <p className='mt-1 text-sm text-gray-500'>
          Run simulations to analyze lineup ROI distributions, player outcomes, and
          tournament strategy
        </p>
      </div>

      <div className='p-6 space-y-8'>
        {/* Simulation Configuration */}
        <div>
          <h3 className='text-md font-medium text-gray-900 mb-4'>
            Simulation Configuration
          </h3>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Number of Simulations
              </label>
              <select
                value={simSettings.numSimulations}
                onChange={e =>
                  handleSettingChange('numSimulations', parseInt(e.target.value))
                }
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              >
                <option value={1000}>1,000 (Fast)</option>
                <option value={10000}>10,000 (Standard)</option>
                <option value={50000}>50,000 (Detailed)</option>
                <option value={100000}>100,000 (Comprehensive)</option>
              </select>
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Random Seed
              </label>
              <input
                type='number'
                value={simSettings.seed}
                onChange={e => handleSettingChange('seed', parseInt(e.target.value))}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                placeholder='42'
              />
              <p className='text-xs text-gray-500 mt-1'>For reproducible results</p>
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Distribution Type
              </label>
              <select
                value={simSettings.distributionType}
                onChange={e => handleSettingChange('distributionType', e.target.value)}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              >
                <option value='normal'>Normal Distribution</option>
                <option value='lognormal'>Log-Normal Distribution</option>
                <option value='empirical'>Empirical (Historical)</option>
              </select>
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Correlation Strength
              </label>
              <input
                type='range'
                min='0'
                max='1'
                step='0.1'
                value={simSettings.correlationStrength}
                onChange={e =>
                  handleSettingChange('correlationStrength', parseFloat(e.target.value))
                }
                className='w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer'
              />
              <div className='flex justify-between text-xs text-gray-500 mt-1'>
                <span>0</span>
                <span>{simSettings.correlationStrength}</span>
                <span>1</span>
              </div>
            </div>
          </div>

          <div className='mt-4 flex items-center space-x-6'>
            <div className='flex items-center space-x-2'>
              <input
                type='checkbox'
                checked={simSettings.useMcpSignals}
                onChange={e => handleSettingChange('useMcpSignals', e.target.checked)}
                className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
              />
              <label className='text-sm text-gray-700'>Use MCP Signals</label>
            </div>

            <div className='flex items-center space-x-2'>
              <input
                type='checkbox'
                checked={simSettings.applyLateSwap}
                onChange={e => handleSettingChange('applyLateSwap', e.target.checked)}
                className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
              />
              <label className='text-sm text-gray-700'>Apply Late Swap</label>
            </div>

            <div className='flex items-center space-x-2'>
              <input
                type='checkbox'
                checked={simSettings.weatherAdjustments}
                onChange={e =>
                  handleSettingChange('weatherAdjustments', e.target.checked)
                }
                className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
              />
              <label className='text-sm text-gray-700'>Weather Adjustments</label>
            </div>

            <div className='flex items-center space-x-2'>
              <input
                type='checkbox'
                checked={simSettings.injuryAdjustments}
                onChange={e =>
                  handleSettingChange('injuryAdjustments', e.target.checked)
                }
                className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
              />
              <label className='text-sm text-gray-700'>Injury Adjustments</label>
            </div>
          </div>
        </div>

        {/* Run Simulation */}
        <div className='flex items-center justify-between p-4 bg-gray-50 rounded-lg'>
          <div>
            <h4 className='text-sm font-medium text-gray-900'>Ready to Simulate</h4>
            <p className='text-sm text-gray-600'>
              {simSettings.numSimulations.toLocaleString()} simulations with{' '}
              {simSettings.distributionType} distribution
            </p>
          </div>
          <button
            onClick={runSimulation}
            disabled={isRunning}
            className={`px-6 py-2 rounded-md text-white font-medium ${
              isRunning
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isRunning ? (
              <div className='flex items-center space-x-2'>
                <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white'></div>
                <span>Running...</span>
              </div>
            ) : (
              'Run Simulation'
            )}
          </button>
        </div>

        {/* Simulation Results */}
        {simulationResults.length > 0 && (
          <>
            {/* ROI Distribution Summary */}
            <div>
              <h3 className='text-md font-medium text-gray-900 mb-4'>
                ROI Distribution Summary
              </h3>
              <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
                <div className='bg-green-50 rounded-lg p-4'>
                  <h4 className='text-sm font-medium text-green-900'>Positive ROI</h4>
                  <p className='text-2xl font-bold text-green-600'>
                    {(
                      (simulationResults.filter(r => r.roi > 0).length /
                        simulationResults.length) *
                      100
                    ).toFixed(1)}
                    %
                  </p>
                  <p className='text-sm text-green-700'>
                    {simulationResults.filter(r => r.roi > 0).length} of{' '}
                    {simulationResults.length} lineups
                  </p>
                </div>

                <div className='bg-blue-50 rounded-lg p-4'>
                  <h4 className='text-sm font-medium text-blue-900'>Mean ROI</h4>
                  <p className='text-2xl font-bold text-blue-600'>
                    {(
                      simulationResults.reduce((sum, r) => sum + r.roi, 0) /
                      simulationResults.length
                    ).toFixed(2)}
                    x
                  </p>
                  <p className='text-sm text-blue-700'>Average across all lineups</p>
                </div>

                <div className='bg-purple-50 rounded-lg p-4'>
                  <h4 className='text-sm font-medium text-purple-900'>Top 10% ROI</h4>
                  <p className='text-2xl font-bold text-purple-600'>
                    {(
                      simulationResults
                        .slice(0, Math.floor(simulationResults.length * 0.1))
                        .reduce((sum, r) => sum + r.roi, 0) /
                      Math.floor(simulationResults.length * 0.1)
                    ).toFixed(2)}
                    x
                  </p>
                  <p className='text-sm text-purple-700'>Best performing lineups</p>
                </div>

                <div className='bg-orange-50 rounded-lg p-4'>
                  <h4 className='text-sm font-medium text-orange-900'>Boom Rate</h4>
                  <p className='text-2xl font-bold text-orange-600'>
                    {(
                      (simulationResults.filter(r => r.boomRate > 20).length /
                        simulationResults.length) *
                      100
                    ).toFixed(1)}
                    %
                  </p>
                  <p className='text-sm text-orange-700'>High-ceiling outcomes</p>
                </div>
              </div>
            </div>

            {/* Top Lineups */}
            <div>
              <h3 className='text-md font-medium text-gray-900 mb-4'>
                Top Performing Lineups
              </h3>
              <div className='overflow-x-auto'>
                <table className='min-w-full divide-y divide-gray-200'>
                  <thead className='bg-gray-50'>
                    <tr>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Lineup
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Projected
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Simulated
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        ROI
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Percentile
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Boom Rate
                      </th>
                    </tr>
                  </thead>
                  <tbody className='bg-white divide-y divide-gray-200'>
                    {simulationResults.slice(0, 10).map((result, index) => (
                      <tr key={result.lineupId} className='hover:bg-gray-50'>
                        <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900'>
                          #{index + 1}
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                          {result.projectedScore.toFixed(1)}
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                          {result.actualScore.toFixed(1)}
                        </td>
                        <td
                          className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${getROIColor(result.roi)}`}
                        >
                          {result.roi.toFixed(2)}x
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap'>
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${getPercentileColor(result.percentile)}`}
                          >
                            {result.percentile.toFixed(1)}%
                          </span>
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                          {result.boomRate.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Player Outcome Analysis */}
            <div>
              <h3 className='text-md font-medium text-gray-900 mb-4'>
                Player Outcome Analysis
              </h3>
              <div className='overflow-x-auto'>
                <table className='min-w-full divide-y divide-gray-200'>
                  <thead className='bg-gray-50'>
                    <tr>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Player
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Projected
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Mean Sim
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Range (P5-P95)
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Boom Rate
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Bust Rate
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Variance
                      </th>
                    </tr>
                  </thead>
                  <tbody className='bg-white divide-y divide-gray-200'>
                    {mockPlayerOutcomes.map(outcome => (
                      <tr key={outcome.playerId} className='hover:bg-gray-50'>
                        <td className='px-6 py-4 whitespace-nowrap'>
                          <div className='text-sm font-medium text-gray-900'>
                            {outcome.playerName}
                          </div>
                          <div className='text-sm text-gray-500'>
                            {outcome.position}
                          </div>
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                          {outcome.projectedPoints.toFixed(1)}
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                          {outcome.meanOutcome.toFixed(1)}
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                          {outcome.p5.toFixed(1)} - {outcome.p95.toFixed(1)}
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm text-green-600'>
                          {outcome.boomRate.toFixed(1)}%
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm text-red-600'>
                          {outcome.bustRate.toFixed(1)}%
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                          {outcome.variance.toFixed(1)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Simulation Summary */}
        <div className='bg-indigo-50 rounded-lg p-4'>
          <h4 className='text-sm font-medium text-indigo-900 mb-2'>
            Simulation Configuration Summary
          </h4>
          <div className='text-sm text-indigo-800 space-y-1'>
            <p>
              • Simulations: {simSettings.numSimulations.toLocaleString()} with seed{' '}
              {simSettings.seed}
            </p>
            <p>
              • Distribution: {simSettings.distributionType} with{' '}
              {(simSettings.correlationStrength * 100).toFixed(0)}% correlation
            </p>
            <p>• MCP signals: {simSettings.useMcpSignals ? 'Enabled' : 'Disabled'}</p>
            <p>
              • Adjustments: Weather ({simSettings.weatherAdjustments ? 'On' : 'Off'}),
              Injuries ({simSettings.injuryAdjustments ? 'On' : 'Off'})
            </p>
            <p>• Late swap: {simSettings.applyLateSwap ? 'Applied' : 'Not applied'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
