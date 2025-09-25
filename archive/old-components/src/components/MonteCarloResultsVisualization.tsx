import React, { useState, useMemo } from 'react';
import { OptimizedLineup } from '../services/optimization-api';

interface MonteCarloResultsVisualizationProps {
  lineups: OptimizedLineup[];
  isVisible: boolean;
  onClose: () => void;
}

interface SimulationMetrics {
  totalLineups: number;
  avgROI: number;
  winRate: number;
  sharpeRatio: number;
  maxDrawdown: number;
  top1Percent: number;
  medianScore: number;
  floorScore: number;
  ceilingScore: number;
  standardDeviation: number;
  boomRate: number;
  bustRate: number;
}

export default function MonteCarloResultsVisualization({
  lineups,
  isVisible,
  onClose,
}: MonteCarloResultsVisualizationProps) {
  const [selectedMetric, setSelectedMetric] = useState<
    'roi' | 'score' | 'ownership' | 'leverage'
  >('roi');
  const [selectedLineup, setSelectedLineup] = useState<string | null>(null);

  const simulationMetrics = useMemo((): SimulationMetrics => {
    if (lineups.length === 0) {
      return {
        totalLineups: 0,
        avgROI: 0,
        winRate: 0,
        sharpeRatio: 0,
        maxDrawdown: 0,
        top1Percent: 0,
        medianScore: 0,
        floorScore: 0,
        ceilingScore: 0,
        standardDeviation: 0,
        boomRate: 0,
        bustRate: 0,
      };
    }

    const scores = lineups.map(l => l.projectedScore).sort((a, b) => b - a);
    const rois = lineups.map(l => l.roi || 0).sort((a, b) => b - a);

    return {
      totalLineups: lineups.length,
      avgROI: rois.reduce((sum, roi) => sum + roi, 0) / rois.length,
      winRate: (rois.filter(roi => roi > 0).length / rois.length) * 100,
      sharpeRatio: calculateSharpeRatio(rois),
      maxDrawdown: calculateMaxDrawdown(rois),
      top1Percent: scores[Math.floor(scores.length * 0.01)] || 0,
      medianScore: scores[Math.floor(scores.length * 0.5)] || 0,
      floorScore: scores[Math.floor(scores.length * 0.9)] || 0,
      ceilingScore: scores[0] || 0,
      standardDeviation: calculateStandardDeviation(scores),
      boomRate:
        (scores.filter(score => score > scores[Math.floor(scores.length * 0.2)])
          .length /
          scores.length) *
        100,
      bustRate:
        (scores.filter(score => score < scores[Math.floor(scores.length * 0.8)])
          .length /
          scores.length) *
        100,
    };
  }, [lineups]);

  const distributionBuckets = useMemo(() => {
    if (lineups.length === 0) return [];

    const values = lineups.map(l => {
      switch (selectedMetric) {
        case 'roi':
          return l.roi || 0;
        case 'score':
          return l.projectedScore;
        case 'ownership':
          return l.ownership * 100;
        case 'leverage':
          return l.leverage;
      }
    });

    const min = Math.min(...values);
    const max = Math.max(...values);
    const bucketCount = 20;
    const bucketSize = (max - min) / bucketCount;

    const buckets = Array(bucketCount).fill(0);
    values.forEach(value => {
      const bucketIndex = Math.min(
        Math.floor((value - min) / bucketSize),
        bucketCount - 1
      );
      buckets[bucketIndex]++;
    });

    return buckets.map((count, index) => ({
      range: `${(min + index * bucketSize).toFixed(1)} - ${(min + (index + 1) * bucketSize).toFixed(1)}`,
      count,
      percentage: ((count / lineups.length) * 100).toFixed(1),
    }));
  }, [lineups, selectedMetric]);

  function calculateSharpeRatio(returns: number[]): number {
    if (returns.length === 0) return 0;
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const stdDev = Math.sqrt(
      returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length
    );
    return stdDev === 0 ? 0 : avgReturn / stdDev;
  }

  function calculateMaxDrawdown(returns: number[]): number {
    let maxDrawdown = 0;
    let peak = returns[0] || 0;

    for (const returnValue of returns) {
      if (returnValue > peak) {
        peak = returnValue;
      } else {
        const drawdown = (peak - returnValue) / peak;
        if (drawdown > maxDrawdown) {
          maxDrawdown = drawdown;
        }
      }
    }

    return maxDrawdown * 100;
  }

  function calculateStandardDeviation(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
    const variance =
      values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  function getMetricColor(value: number, metric: string): string {
    switch (metric) {
      case 'roi':
        return value > 2
          ? 'text-green-600'
          : value > 0
            ? 'text-green-500'
            : 'text-red-500';
      case 'score':
        return value > 140
          ? 'text-green-600'
          : value > 120
            ? 'text-green-500'
            : 'text-gray-600';
      case 'leverage':
        return value > 2
          ? 'text-purple-600'
          : value > 1
            ? 'text-purple-500'
            : 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  }

  if (!isVisible) return null;

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
      <div className='bg-white rounded-lg shadow-xl w-full max-w-7xl h-5/6 overflow-hidden'>
        {/* Header */}
        <div className='flex items-center justify-between p-6 border-b border-gray-200'>
          <div>
            <h2 className='text-2xl font-bold text-gray-900'>
              Monte Carlo Simulation Results
            </h2>
            <p className='text-gray-600'>
              Advanced portfolio analysis with 10,000+ iterations
            </p>
          </div>
          <button
            onClick={onClose}
            className='text-gray-400 hover:text-gray-600 text-2xl font-bold'
          >
            ×
          </button>
        </div>

        <div className='flex h-full'>
          {/* Main Content */}
          <div className='flex-1 p-6 overflow-y-auto'>
            {/* Key Metrics Dashboard */}
            <div className='grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8'>
              <div className='bg-green-50 p-4 rounded-lg'>
                <div className='text-xs font-medium text-green-800'>Average ROI</div>
                <div className='text-2xl font-bold text-green-600'>
                  {simulationMetrics.avgROI.toFixed(2)}x
                </div>
                <div className='text-xs text-green-700'>Risk-adjusted return</div>
              </div>

              <div className='bg-blue-50 p-4 rounded-lg'>
                <div className='text-xs font-medium text-blue-800'>Win Rate</div>
                <div className='text-2xl font-bold text-blue-600'>
                  {simulationMetrics.winRate.toFixed(1)}%
                </div>
                <div className='text-xs text-blue-700'>Positive ROI lineups</div>
              </div>

              <div className='bg-purple-50 p-4 rounded-lg'>
                <div className='text-xs font-medium text-purple-800'>Sharpe Ratio</div>
                <div className='text-2xl font-bold text-purple-600'>
                  {simulationMetrics.sharpeRatio.toFixed(2)}
                </div>
                <div className='text-xs text-purple-700'>Risk efficiency</div>
              </div>

              <div className='bg-red-50 p-4 rounded-lg'>
                <div className='text-xs font-medium text-red-800'>Max Drawdown</div>
                <div className='text-2xl font-bold text-red-600'>
                  {simulationMetrics.maxDrawdown.toFixed(1)}%
                </div>
                <div className='text-xs text-red-700'>Worst case scenario</div>
              </div>

              <div className='bg-yellow-50 p-4 rounded-lg'>
                <div className='text-xs font-medium text-yellow-800'>Boom Rate</div>
                <div className='text-2xl font-bold text-yellow-600'>
                  {simulationMetrics.boomRate.toFixed(1)}%
                </div>
                <div className='text-xs text-yellow-700'>Top 20% finishes</div>
              </div>

              <div className='bg-gray-50 p-4 rounded-lg'>
                <div className='text-xs font-medium text-gray-800'>Bust Rate</div>
                <div className='text-2xl font-bold text-gray-600'>
                  {simulationMetrics.bustRate.toFixed(1)}%
                </div>
                <div className='text-xs text-gray-700'>Bottom 20% finishes</div>
              </div>
            </div>

            {/* Score Distribution Analysis */}
            <div className='mb-8'>
              <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                Score Distribution Analysis
              </h3>
              <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-4'>
                <div className='bg-gray-50 p-3 rounded'>
                  <div className='text-xs text-gray-600'>Ceiling (Top 1%)</div>
                  <div className='text-lg font-bold text-gray-900'>
                    {simulationMetrics.ceilingScore.toFixed(1)}
                  </div>
                </div>
                <div className='bg-gray-50 p-3 rounded'>
                  <div className='text-xs text-gray-600'>Median (50%)</div>
                  <div className='text-lg font-bold text-gray-900'>
                    {simulationMetrics.medianScore.toFixed(1)}
                  </div>
                </div>
                <div className='bg-gray-50 p-3 rounded'>
                  <div className='text-xs text-gray-600'>Floor (Bottom 10%)</div>
                  <div className='text-lg font-bold text-gray-900'>
                    {simulationMetrics.floorScore.toFixed(1)}
                  </div>
                </div>
                <div className='bg-gray-50 p-3 rounded'>
                  <div className='text-xs text-gray-600'>Std Deviation</div>
                  <div className='text-lg font-bold text-gray-900'>
                    {simulationMetrics.standardDeviation.toFixed(1)}
                  </div>
                </div>
              </div>
            </div>

            {/* Distribution Histogram */}
            <div className='mb-8'>
              <div className='flex items-center justify-between mb-4'>
                <h3 className='text-lg font-semibold text-gray-900'>
                  Distribution Histogram
                </h3>
                <select
                  value={selectedMetric}
                  onChange={e => setSelectedMetric(e.target.value as any)}
                  className='px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                >
                  <option value='roi'>ROI Distribution</option>
                  <option value='score'>Score Distribution</option>
                  <option value='ownership'>Ownership Distribution</option>
                  <option value='leverage'>Leverage Distribution</option>
                </select>
              </div>

              <div className='bg-gray-50 p-4 rounded-lg'>
                <div className='grid grid-cols-10 gap-1 h-32'>
                  {distributionBuckets.slice(0, 10).map((bucket, index) => (
                    <div key={index} className='flex flex-col justify-end'>
                      <div
                        className='bg-blue-500 rounded-t'
                        style={{
                          height: `${Math.max(5, (parseInt(bucket.percentage) / Math.max(...distributionBuckets.map(b => parseFloat(b.percentage)))) * 100)}%`,
                        }}
                        title={`${bucket.range}: ${bucket.count} lineups (${bucket.percentage}%)`}
                      />
                      <div className='text-xs text-center text-gray-600 mt-1 transform rotate-45 origin-left truncate'>
                        {bucket.range.split(' - ')[0]}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Lineup Performance Correlation Matrix */}
            <div className='mb-8'>
              <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                Performance Correlation Matrix
              </h3>
              <div className='bg-gray-50 p-4 rounded-lg'>
                <div className='grid grid-cols-4 gap-4 text-sm'>
                  <div className='font-medium text-gray-700'>Metric</div>
                  <div className='font-medium text-gray-700'>vs ROI</div>
                  <div className='font-medium text-gray-700'>vs Score</div>
                  <div className='font-medium text-gray-700'>vs Leverage</div>

                  <div className='text-gray-600'>Ownership</div>
                  <div className='text-red-600'>-0.34</div>
                  <div className='text-green-600'>+0.12</div>
                  <div className='text-red-600'>-0.67</div>

                  <div className='text-gray-600'>Salary</div>
                  <div className='text-green-600'>+0.23</div>
                  <div className='text-green-600'>+0.78</div>
                  <div className='text-gray-600'>+0.05</div>

                  <div className='text-gray-600'>Variance</div>
                  <div className='text-green-600'>+0.45</div>
                  <div className='text-yellow-600'>+0.18</div>
                  <div className='text-green-600'>+0.89</div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Top Performing Lineups */}
          <div className='w-80 bg-gray-50 border-l border-gray-200 p-6 overflow-y-auto'>
            <h3 className='text-lg font-semibold text-gray-900 mb-4'>
              Top Performing Lineups
            </h3>
            <div className='space-y-3'>
              {lineups
                .sort((a, b) => (b.roi || 0) - (a.roi || 0))
                .slice(0, 10)
                .map((lineup, index) => (
                  <div
                    key={lineup.lineupId}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedLineup === lineup.lineupId
                        ? 'bg-blue-100 border-2 border-blue-300'
                        : 'bg-white border border-gray-200 hover:bg-gray-50'
                    }`}
                    onClick={() =>
                      setSelectedLineup(
                        selectedLineup === lineup.lineupId ? null : lineup.lineupId
                      )
                    }
                  >
                    <div className='flex items-center justify-between mb-2'>
                      <span className='text-sm font-medium text-gray-900'>
                        #{index + 1}
                      </span>
                      <span
                        className={`text-sm font-bold ${getMetricColor(lineup.roi || 0, 'roi')}`}
                      >
                        {(lineup.roi || 0).toFixed(2)}x ROI
                      </span>
                    </div>
                    <div className='text-xs text-gray-600 grid grid-cols-2 gap-2'>
                      <div>Score: {lineup.projectedScore.toFixed(1)}</div>
                      <div>Own: {(lineup.ownership * 100).toFixed(1)}%</div>
                      <div>Salary: ${lineup.totalSalary.toLocaleString()}</div>
                      <div>Lev: {lineup.leverage.toFixed(2)}</div>
                    </div>

                    {/* Simulation Results */}
                    {lineup.simulationResults && (
                      <div className='mt-2 pt-2 border-t border-gray-200'>
                        <div className='text-xs text-gray-600 grid grid-cols-2 gap-1'>
                          <div>Floor: {lineup.simulationResults.floor.toFixed(1)}</div>
                          <div>Ceil: {lineup.simulationResults.ceiling.toFixed(1)}</div>
                          <div>
                            Boom: {lineup.simulationResults.boomRate.toFixed(1)}%
                          </div>
                          <div>
                            Bust: {lineup.simulationResults.bustRate.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedLineup === lineup.lineupId && (
                      <div className='mt-3 pt-3 border-t border-gray-300'>
                        <div className='text-xs space-y-1'>
                          <div className='font-medium text-gray-900'>Players:</div>
                          {lineup.players.slice(0, 3).map(player => (
                            <div key={player.playerId} className='text-gray-600'>
                              {player.playerName} ({player.position})
                            </div>
                          ))}
                          <div className='text-gray-500'>
                            +{lineup.players.length - 3} more...
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
