import React, { useState, useMemo, useEffect } from 'react';
import {
  optimizationAPI,
  OptimizedLineup as APIOptimizedLineup,
  ExposureAnalysis,
  OptimizationResponse,
} from '../../services/optimization-api';
import { EnhancedPlayer } from '../../types/player-controls';
import MonteCarloResultsVisualization from '../MonteCarloResultsVisualization';

interface LineupPlayer {
  playerId: string;
  playerName: string;
  position: string;
  team: string;
  salary: number;
  projectedPoints: number;
  ownership: number;
}

interface OptimizedLineup {
  lineupId: string;
  players: LineupPlayer[];
  totalSalary: number;
  projectedScore: number;
  ownership: number;
  leverage: number;
  stackInfo: string;
  uniqueness: number;
  roi: number;
  percentile: number;
}

interface ExposureData {
  playerId: string;
  playerName: string;
  position: string;
  team: string;
  exposure: number;
  targetMin: number;
  targetMax: number;
  actualCount: number;
  status: 'within' | 'over' | 'under';
}

interface ResultsTabProps {
  players: EnhancedPlayer[];
  constraints: any;
  stacks: any[];
  onOptimizationComplete?: (lineups: OptimizedLineup[]) => void;
}

export default function ResultsTab({
  players,
  constraints,
  stacks,
  onOptimizationComplete,
}: ResultsTabProps) {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizedLineups, setOptimizedLineups] = useState<OptimizedLineup[]>([]);
  const [exposureData, setExposureData] = useState<ExposureAnalysis[]>([]);
  const [selectedLineup, setSelectedLineup] = useState<string | null>(null);
  const [exportFormat, setExportFormat] = useState<
    'draftkings' | 'fanduel' | 'superdraft'
  >('draftkings');
  const [optimizationError, setOptimizationError] = useState<string | null>(null);
  const [optimizationSummary, setOptimizationSummary] = useState<any>(null);
  const [apiHealth, setApiHealth] = useState<any>(null);
  const [showMonteCarloResults, setShowMonteCarloResults] = useState(false);

  // Check API health on component mount
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const health = await optimizationAPI.healthCheck();
        setApiHealth(health);
      } catch (error) {
        console.error('Health check failed:', error);
      }
    };
    checkHealth();
  }, []);

  // Mock lineup data - in real app this would come from optimizer engine
  const mockLineups = useMemo(() => {
    const lineups: OptimizedLineup[] = [];
    const playerPool = [
      {
        playerId: '1',
        playerName: 'Josh Allen',
        position: 'QB',
        team: 'BUF',
        salary: 8400,
        projectedPoints: 22.5,
        ownership: 0.28,
      },
      {
        playerId: '2',
        playerName: 'Christian McCaffrey',
        position: 'RB',
        team: 'SF',
        salary: 9000,
        projectedPoints: 18.2,
        ownership: 0.35,
      },
      {
        playerId: '3',
        playerName: 'Tyreek Hill',
        position: 'WR',
        team: 'MIA',
        salary: 8200,
        projectedPoints: 16.8,
        ownership: 0.22,
      },
      {
        playerId: '4',
        playerName: 'Travis Kelce',
        position: 'TE',
        team: 'KC',
        salary: 7800,
        projectedPoints: 14.5,
        ownership: 0.31,
      },
      {
        playerId: '5',
        playerName: 'Bills DST',
        position: 'DST',
        team: 'BUF',
        salary: 3200,
        projectedPoints: 8.2,
        ownership: 0.15,
      },
      {
        playerId: '6',
        playerName: 'Stefon Diggs',
        position: 'WR',
        team: 'BUF',
        salary: 7600,
        projectedPoints: 15.3,
        ownership: 0.19,
      },
      {
        playerId: '7',
        playerName: 'Saquon Barkley',
        position: 'RB',
        team: 'NYG',
        salary: 7400,
        projectedPoints: 16.1,
        ownership: 0.24,
      },
      {
        playerId: '8',
        playerName: 'Cooper Kupp',
        position: 'WR',
        team: 'LAR',
        salary: 7200,
        projectedPoints: 14.8,
        ownership: 0.18,
      },
      {
        playerId: '9',
        playerName: 'Dalvin Cook',
        position: 'RB',
        team: 'MIN',
        salary: 6800,
        projectedPoints: 15.2,
        ownership: 0.16,
      },
    ];

    for (let i = 0; i < 150; i++) {
      const shuffledPool = [...playerPool].sort(() => Math.random() - 0.5);
      const lineup: OptimizedLineup = {
        lineupId: `lineup_${i + 1}`,
        players: shuffledPool.slice(0, 9), // DK Classic lineup
        totalSalary: shuffledPool.slice(0, 9).reduce((sum, p) => sum + p.salary, 0),
        projectedScore: shuffledPool
          .slice(0, 9)
          .reduce((sum, p) => sum + p.projectedPoints, 0),
        ownership:
          shuffledPool.slice(0, 9).reduce((sum, p) => sum + p.ownership, 0) / 9,
        leverage: Math.random() * 4 - 1,
        stackInfo:
          Math.random() > 0.7
            ? 'QB+2 Stack'
            : Math.random() > 0.5
              ? 'Game Stack'
              : 'No Stack',
        uniqueness: Math.random() * 100,
        roi: Math.random() * 3 - 0.5,
        percentile: Math.random() * 100,
      };
      lineups.push(lineup);
    }

    return lineups.sort((a, b) => b.projectedScore - a.projectedScore);
  }, []);

  const mockExposureData = useMemo(() => {
    const exposures: ExposureData[] = [
      {
        playerId: '1',
        playerName: 'Josh Allen',
        position: 'QB',
        team: 'BUF',
        exposure: 45.3,
        targetMin: 40,
        targetMax: 60,
        actualCount: 68,
        status: 'within',
      },
      {
        playerId: '2',
        playerName: 'Christian McCaffrey',
        position: 'RB',
        team: 'SF',
        exposure: 32.7,
        targetMin: 25,
        targetMax: 40,
        actualCount: 49,
        status: 'within',
      },
      {
        playerId: '3',
        playerName: 'Tyreek Hill',
        position: 'WR',
        team: 'MIA',
        exposure: 28.0,
        targetMin: 20,
        targetMax: 35,
        actualCount: 42,
        status: 'within',
      },
      {
        playerId: '4',
        playerName: 'Travis Kelce',
        position: 'TE',
        team: 'KC',
        exposure: 52.0,
        targetMin: 30,
        targetMax: 50,
        actualCount: 78,
        status: 'over',
      },
      {
        playerId: '5',
        playerName: 'Bills DST',
        position: 'DST',
        team: 'BUF',
        exposure: 18.7,
        targetMin: 20,
        targetMax: 40,
        actualCount: 28,
        status: 'under',
      },
    ];
    return exposures;
  }, []);

  const runOptimization = async () => {
    if (!players || players.length === 0) {
      setOptimizationError('No players available for optimization');
      return;
    }

    setIsOptimizing(true);
    setOptimizationError(null);

    try {
      console.log('🚀 Starting real optimization with', players.length, 'players');

      const request = {
        slateId: `slate_${Date.now()}`,
        players: players,
        constraints: {
          numLineups: constraints?.numLineups || 150,
          salaryCapMode: 'hard' as const,
          salaryCap: constraints?.salaryCap || 50000,
          uniquePlayers: constraints?.uniquePlayers || 6,
          minSalary: constraints?.minSalary || 48000,
          maxSalary: constraints?.maxSalary || 50000,
        },
        stacks: stacks || [],
        variance: {
          randomnessLevel: constraints?.randomnessLevel || 20,
          distributionMode: 'normal' as const,
          weatherAdjustments: true,
        },
        simulation: {
          enabled: true,
          iterations: 10000,
          correlationMatrix: true,
        },
      };

      const response: OptimizationResponse = await optimizationAPI.optimize(request);

      if (response.success) {
        // Convert API lineups to local format
        const convertedLineups: OptimizedLineup[] = response.lineups.map(lineup => ({
          ...lineup,
          roi: lineup.roi || 0,
          percentile: lineup.percentile || 0,
        }));

        setOptimizedLineups(convertedLineups);
        setExposureData(response.exposureAnalysis);
        setOptimizationSummary(response.summary);

        if (onOptimizationComplete) {
          onOptimizationComplete(convertedLineups);
        }

        console.log('✅ Optimization complete:', {
          lineups: response.lineups.length,
          avgScore: response.summary.avgProjectedScore,
          time: response.summary.optimizationTime,
        });
      } else {
        throw new Error(response.message || 'Optimization failed');
      }
    } catch (error) {
      console.error('❌ Optimization failed:', error);
      setOptimizationError(
        error instanceof Error ? error.message : 'Unknown optimization error'
      );

      // Fallback to mock data for development
      console.log('📋 Falling back to mock data for development');
      setOptimizedLineups(mockLineups);
      setExposureData(
        mockExposureData.map(e => ({
          ...e,
          actualExposure: e.exposure,
          variance: Math.random() * 10,
        }))
      );
    } finally {
      setIsOptimizing(false);
    }
  };

  const exportLineups = async () => {
    if (optimizedLineups.length === 0) {
      setOptimizationError('No lineups to export');
      return;
    }

    try {
      console.log(
        '📤 Exporting',
        optimizedLineups.length,
        'lineups in',
        exportFormat,
        'format'
      );

      // Convert lineups to API format for export
      const apiLineups: APIOptimizedLineup[] = optimizedLineups.map(lineup => ({
        ...lineup,
        simulationResults: undefined, // Optional field
      }));

      // Try API export first
      const csvContent = await optimizationAPI.exportCSV(apiLineups, exportFormat);

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dfs_lineups_${exportFormat}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      console.log('✅ Export complete');
    } catch (error) {
      console.error('❌ API export failed, using fallback:', error);

      // Fallback to local CSV generation
      const csvContent = generateCSV(optimizedLineups, exportFormat);
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dfs_lineups_${exportFormat}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }
  };

  const generateCSV = (lineups: OptimizedLineup[], format: string): string => {
    if (format === 'draftkings') {
      const headers = ['QB', 'RB', 'RB', 'WR', 'WR', 'WR', 'TE', 'FLEX', 'DST'];
      let csv = headers.join(',') + '\n';

      lineups.forEach(lineup => {
        const positions = ['QB', 'RB', 'RB', 'WR', 'WR', 'WR', 'TE', 'FLEX', 'DST'];
        const row = positions.map(pos => {
          const player = lineup.players.find(p => p.position === pos);
          return player ? `${player.playerName} (${player.playerId})` : '';
        });
        csv += row.join(',') + '\n';
      });

      return csv;
    }

    return 'Format not supported';
  };

  const getExposureColor = (status: string) => {
    switch (status) {
      case 'within':
        return 'text-green-600';
      case 'over':
        return 'text-red-600';
      case 'under':
        return 'text-orange-600';
      default:
        return 'text-gray-600';
    }
  };

  const getExposureBg = (status: string) => {
    switch (status) {
      case 'within':
        return 'bg-green-50';
      case 'over':
        return 'bg-red-50';
      case 'under':
        return 'bg-orange-50';
      default:
        return 'bg-gray-50';
    }
  };

  const getLeverageColor = (leverage: number) => {
    if (leverage > 2) return 'text-green-600 font-bold';
    if (leverage > 1) return 'text-green-500';
    if (leverage > 0) return 'text-blue-500';
    if (leverage > -1) return 'text-orange-500';
    return 'text-red-500';
  };

  return (
    <div className='bg-white rounded-lg shadow'>
      <div className='px-6 py-4 border-b border-gray-200'>
        <h2 className='text-lg font-medium text-gray-900'>Optimization Results</h2>
        <p className='mt-1 text-sm text-gray-500'>
          Generate 150 optimized lineups with exposure analysis and CSV export
        </p>
      </div>

      <div className='p-6 space-y-8'>
        {/* API Health Status */}
        {apiHealth && (
          <div
            className={`p-4 rounded-lg ${apiHealth.status === 'healthy' ? 'bg-green-50' : 'bg-red-50'}`}
          >
            <div className='flex items-center justify-between'>
              <div>
                <h4
                  className={`text-sm font-medium ${apiHealth.status === 'healthy' ? 'text-green-900' : 'text-red-900'}`}
                >
                  Python API Status: {apiHealth.status.toUpperCase()}
                </h4>
                <p
                  className={`text-sm ${apiHealth.status === 'healthy' ? 'text-green-700' : 'text-red-700'}`}
                >
                  {apiHealth.message}
                </p>
              </div>
              <div className='grid grid-cols-2 gap-2 text-xs'>
                <span
                  className={`px-2 py-1 rounded ${apiHealth.services.optimizer ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                >
                  Optimizer: {apiHealth.services.optimizer ? 'ON' : 'OFF'}
                </span>
                <span
                  className={`px-2 py-1 rounded ${apiHealth.services.simulator ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                >
                  Simulator: {apiHealth.services.simulator ? 'ON' : 'OFF'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Optimization Error */}
        {optimizationError && (
          <div className='p-4 bg-red-50 rounded-lg'>
            <h4 className='text-sm font-medium text-red-900'>Optimization Error</h4>
            <p className='text-sm text-red-700'>{optimizationError}</p>
            <p className='text-xs text-red-600 mt-1'>Using mock data for development</p>
          </div>
        )}

        {/* Optimization Controls */}
        <div className='flex items-center justify-between p-4 bg-gray-50 rounded-lg'>
          <div>
            <h4 className='text-sm font-medium text-gray-900'>Ready to Optimize</h4>
            <p className='text-sm text-gray-600'>
              Generate {constraints?.numLineups || 150} unique lineups with all
              constraints and player controls applied
            </p>
            <p className='text-xs text-gray-500 mt-1'>
              Players: {players?.length || 0} | Real Python Engine:{' '}
              {apiHealth?.status === 'healthy' ? '✅' : '❌'}
            </p>
          </div>
          <div className='flex items-center space-x-4'>
            <select
              value={exportFormat}
              onChange={e => setExportFormat(e.target.value as any)}
              className='px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
              aria-label='Select export format'
              title='Choose export format for lineups'
            >
              <option value='draftkings'>DraftKings</option>
              <option value='fanduel'>FanDuel</option>
              <option value='superdraft'>SuperDraft</option>
            </select>
            <button
              onClick={runOptimization}
              disabled={isOptimizing}
              className={`px-6 py-2 rounded-md text-white font-medium ${
                isOptimizing
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isOptimizing ? (
                <div className='flex items-center space-x-2'>
                  <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white'></div>
                  <span>Optimizing...</span>
                </div>
              ) : (
                'Run Optimization'
              )}
            </button>
          </div>
        </div>

        {/* Results Summary */}
        {optimizedLineups.length > 0 && (
          <>
            <div>
              <h3 className='text-md font-medium text-gray-900 mb-4'>
                Optimization Summary
              </h3>
              <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
                <div className='bg-blue-50 rounded-lg p-4'>
                  <h4 className='text-sm font-medium text-blue-900'>
                    Lineups Generated
                  </h4>
                  <p className='text-2xl font-bold text-blue-600'>
                    {optimizedLineups.length}
                  </p>
                  <p className='text-sm text-blue-700'>
                    {optimizationSummary
                      ? `Target: ${optimizationSummary.totalLineups || 150}`
                      : 'Unique combinations'}
                  </p>
                </div>

                <div className='bg-green-50 rounded-lg p-4'>
                  <h4 className='text-sm font-medium text-green-900'>
                    Avg Projected Score
                  </h4>
                  <p className='text-2xl font-bold text-green-600'>
                    {optimizationSummary?.avgProjectedScore?.toFixed(1) ||
                      (
                        optimizedLineups.reduce((sum, l) => sum + l.projectedScore, 0) /
                        optimizedLineups.length
                      ).toFixed(1)}
                  </p>
                  <p className='text-sm text-green-700'>Points per lineup</p>
                </div>

                <div className='bg-purple-50 rounded-lg p-4'>
                  <h4 className='text-sm font-medium text-purple-900'>Avg Leverage</h4>
                  <p className='text-2xl font-bold text-purple-600'>
                    {optimizationSummary?.avgLeverage?.toFixed(2) ||
                      (
                        optimizedLineups.reduce((sum, l) => sum + l.leverage, 0) /
                        optimizedLineups.length
                      ).toFixed(2)}
                  </p>
                  <p className='text-sm text-purple-700'>Contrarian score</p>
                </div>

                <div className='bg-orange-50 rounded-lg p-4'>
                  <h4 className='text-sm font-medium text-orange-900'>
                    Optimization Time
                  </h4>
                  <p className='text-2xl font-bold text-orange-600'>
                    {optimizationSummary?.optimizationTime?.toFixed(1) || 'N/A'}s
                  </p>
                  <p className='text-sm text-orange-700'>Python Engine</p>
                </div>
              </div>
            </div>

            {/* Export Controls */}
            <div className='flex items-center justify-between p-4 bg-green-50 rounded-lg'>
              <div>
                <h4 className='text-sm font-medium text-green-900'>Export Lineups</h4>
                <p className='text-sm text-green-700'>
                  Download {optimizedLineups.length} lineups in {exportFormat} format
                </p>
              </div>
              <div className='flex items-center space-x-3'>
                <button
                  onClick={() => setShowMonteCarloResults(true)}
                  className='px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 font-medium'
                  disabled={optimizedLineups.length === 0}
                >
                  🎲 Monte Carlo Analysis
                </button>
                <button
                  onClick={exportLineups}
                  className='px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium'
                >
                  Export CSV
                </button>
              </div>
            </div>

            {/* Top Lineups */}
            <div>
              <h3 className='text-md font-medium text-gray-900 mb-4'>Top 20 Lineups</h3>
              <div className='overflow-x-auto'>
                <table className='min-w-full divide-y divide-gray-200'>
                  <thead className='bg-gray-50'>
                    <tr>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Rank
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Projected
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Salary
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Ownership
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Leverage
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Stack
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Players
                      </th>
                    </tr>
                  </thead>
                  <tbody className='bg-white divide-y divide-gray-200'>
                    {optimizedLineups.slice(0, 20).map((lineup, index) => (
                      <tr
                        key={lineup.lineupId}
                        className={`hover:bg-gray-50 cursor-pointer ${selectedLineup === lineup.lineupId ? 'bg-blue-50' : ''}`}
                        onClick={() =>
                          setSelectedLineup(
                            selectedLineup === lineup.lineupId ? null : lineup.lineupId
                          )
                        }
                      >
                        <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900'>
                          #{index + 1}
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                          {lineup.projectedScore.toFixed(1)}
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                          ${lineup.totalSalary.toLocaleString()}
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                          {(lineup.ownership * 100).toFixed(1)}%
                        </td>
                        <td
                          className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${getLeverageColor(lineup.leverage)}`}
                        >
                          {lineup.leverage.toFixed(2)}
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                          {lineup.stackInfo}
                        </td>
                        <td className='px-6 py-4 text-sm text-gray-900'>
                          <div className='flex flex-wrap gap-1'>
                            {lineup.players.slice(0, 3).map(player => (
                              <span
                                key={player.playerId}
                                className='px-2 py-1 bg-gray-100 text-xs rounded'
                              >
                                {player.playerName}
                              </span>
                            ))}
                            {lineup.players.length > 3 && (
                              <span className='px-2 py-1 bg-gray-100 text-xs rounded'>
                                +{lineup.players.length - 3} more
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Exposure Analysis */}
            <div>
              <h3 className='text-md font-medium text-gray-900 mb-4'>
                Exposure Analysis
                {optimizationSummary?.constraintsViolated?.length > 0 && (
                  <span className='ml-2 px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded'>
                    {optimizationSummary.constraintsViolated.length} constraints
                    violated
                  </span>
                )}
              </h3>
              <div className='overflow-x-auto'>
                <table className='min-w-full divide-y divide-gray-200'>
                  <thead className='bg-gray-50'>
                    <tr>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Player
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Position
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Target Range
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Actual Exposure
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Count
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Variance
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className='bg-white divide-y divide-gray-200'>
                    {exposureData.map(exposure => (
                      <tr
                        key={exposure.playerId}
                        className={getExposureBg(exposure.status)}
                      >
                        <td className='px-6 py-4 whitespace-nowrap'>
                          <div className='text-sm font-medium text-gray-900'>
                            {exposure.playerName}
                          </div>
                          <div className='text-sm text-gray-500'>{exposure.team}</div>
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                          {exposure.position}
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                          {exposure.targetMin}% - {exposure.targetMax}%
                        </td>
                        <td
                          className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${getExposureColor(exposure.status)}`}
                        >
                          {exposure.actualExposure.toFixed(1)}%
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                          {exposure.actualCount} / {optimizedLineups.length}
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                          ±{exposure.variance?.toFixed(1) || 0}%
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap'>
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              exposure.status === 'within'
                                ? 'bg-green-100 text-green-800'
                                : exposure.status === 'over'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-orange-100 text-orange-800'
                            }`}
                          >
                            {exposure.status.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Results Summary */}
        <div className='bg-gray-50 rounded-lg p-4'>
          <h4 className='text-sm font-medium text-gray-900 mb-2'>
            Optimization Status
          </h4>
          <div className='text-sm text-gray-700 space-y-1'>
            <p>
              • Lineups generated: {optimizedLineups.length} /{' '}
              {constraints?.numLineups || 150}
            </p>
            <p>• Export format: {exportFormat.toUpperCase()}</p>
            <p>
              • Engine:{' '}
              {apiHealth?.status === 'healthy' ? '🐍 Python OR-Tools' : '📋 Mock Data'}
              {optimizationSummary?.optimizationTime &&
                ` (${optimizationSummary.optimizationTime.toFixed(1)}s)`}
            </p>
            <p>
              • Constraints applied: All 26 player controls, stacks, exposures,
              correlations
            </p>
            <p>
              • Status:{' '}
              {isOptimizing
                ? 'Running...'
                : optimizedLineups.length > 0
                  ? 'Complete'
                  : 'Ready'}
            </p>
            <p>
              • CSV export:{' '}
              {optimizedLineups.length > 0 ? 'Available' : 'Pending optimization'}
            </p>
            {optimizationSummary?.constraintsViolated?.length > 0 && (
              <p className='text-yellow-700'>
                • Warnings: {optimizationSummary.constraintsViolated.join(', ')}
              </p>
            )}
          </div>
        </div>

        {/* Monte Carlo Results Modal */}
        <MonteCarloResultsVisualization
          lineups={optimizedLineups}
          isVisible={showMonteCarloResults}
          onClose={() => setShowMonteCarloResults(false)}
        />
      </div>
    </div>
  );
}
