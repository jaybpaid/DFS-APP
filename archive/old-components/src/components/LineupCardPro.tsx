import React from 'react';

interface Player {
  id: string;
  name: string;
  pos: string;
  team: string;
  salary: number;
}

interface Lineup {
  site: string;
  mode: string;
  proj: number;
  totalSalary: number;
  slots: Player[];
}

interface Analytics {
  lineupId: number;
  winProb: number;
  minCashProb: number;
  roi: number;
  dupRisk: number;
  projOwnership: number;
  leverageScore: number;
}

interface LineupCardProProps {
  lineup: Lineup;
  analytics?: Analytics;
  salaryCap: number;
  index: number;
}

export const LineupCardPro: React.FC<LineupCardProProps> = ({
  lineup,
  analytics,
  salaryCap,
  index,
}) => {
  const isOverCap = lineup.totalSalary > salaryCap;
  const salaryUtilization = (lineup.totalSalary / salaryCap) * 100;

  // Color coding for metrics
  const getRoiColor = (roi: number) => {
    if (roi > 0.1) return 'text-green-600 bg-green-50';
    if (roi > 0) return 'text-green-500 bg-green-50';
    if (roi > -0.1) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getDupRiskColor = (risk: number) => {
    if (risk < 0.3) return 'text-green-600 bg-green-50';
    if (risk < 0.6) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getWinProbColor = (prob: number) => {
    if (prob > 0.02) return 'text-green-600 bg-green-50';
    if (prob > 0.01) return 'text-yellow-600 bg-yellow-50';
    return 'text-gray-600 bg-gray-50';
  };

  return (
    <div
      className={`bg-white rounded-lg border-2 p-4 shadow-sm hover:shadow-md transition-shadow ${
        isOverCap ? 'border-red-500 bg-red-50' : 'border-gray-200'
      }`}
    >
      {/* Header */}
      <div className='flex justify-between items-start mb-3'>
        <div className='flex items-center gap-2'>
          <span className='text-lg font-bold text-gray-900'>#{index + 1}</span>
          <div className='flex gap-1'>
            <span className='px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded'>
              {lineup.site}
            </span>
            <span className='px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded'>
              {lineup.mode}
            </span>
          </div>
        </div>

        {/* Salary Badge */}
        <div
          className={`px-3 py-1 rounded-full text-sm font-bold ${
            isOverCap
              ? 'bg-red-100 text-red-800'
              : salaryUtilization >= 98
                ? 'bg-green-100 text-green-800'
                : 'bg-yellow-100 text-yellow-800'
          }`}
        >
          ${lineup.totalSalary.toLocaleString()}
        </div>
      </div>

      {/* Over Cap Warning */}
      {isOverCap && (
        <div className='mb-3 p-2 bg-red-100 border border-red-300 rounded text-red-800 text-sm font-medium'>
          ⚠️ Over Cap — Hidden from Export
        </div>
      )}

      {/* Projection */}
      <div className='mb-3'>
        <div className='text-2xl font-bold text-gray-900'>
          {lineup.proj.toFixed(1)} pts
        </div>
        <div className='text-sm text-gray-500'>Projected Score</div>
      </div>

      {/* Analytics Metrics */}
      {analytics && (
        <div className='grid grid-cols-3 gap-2 mb-4'>
          <div
            className={`px-2 py-1 rounded text-center ${getWinProbColor(analytics.winProb)}`}
          >
            <div className='text-xs font-medium'>Win%</div>
            <div className='text-sm font-bold'>
              {(analytics.winProb * 100).toFixed(1)}%
            </div>
          </div>

          <div className='px-2 py-1 rounded text-center bg-blue-50 text-blue-600'>
            <div className='text-xs font-medium'>Cash%</div>
            <div className='text-sm font-bold'>
              {(analytics.minCashProb * 100).toFixed(1)}%
            </div>
          </div>

          <div
            className={`px-2 py-1 rounded text-center ${getRoiColor(analytics.roi)}`}
          >
            <div className='text-xs font-medium'>ROI</div>
            <div className='text-sm font-bold'>{(analytics.roi * 100).toFixed(0)}%</div>
          </div>
        </div>
      )}

      {/* Progress Bars */}
      {analytics && (
        <div className='space-y-2 mb-4'>
          {/* Duplicate Risk */}
          <div>
            <div className='flex justify-between text-xs text-gray-600 mb-1'>
              <span>Dup Risk</span>
              <span className={getDupRiskColor(analytics.dupRisk).split(' ')[0]}>
                {(analytics.dupRisk * 100).toFixed(0)}%
              </span>
            </div>
            <div className='w-full bg-gray-200 rounded-full h-2'>
              <div
                className={`h-2 rounded-full ${
                  analytics.dupRisk < 0.3
                    ? 'bg-green-500'
                    : analytics.dupRisk < 0.6
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                }`}
                style={{ width: `${analytics.dupRisk * 100}%` }}
              />
            </div>
          </div>

          {/* Leverage */}
          <div>
            <div className='flex justify-between text-xs text-gray-600 mb-1'>
              <span>Leverage</span>
              <span
                className={
                  analytics.leverageScore > 0 ? 'text-green-600' : 'text-red-600'
                }
              >
                {analytics.leverageScore > 0 ? '+' : ''}
                {analytics.leverageScore.toFixed(1)}
              </span>
            </div>
            <div className='w-full bg-gray-200 rounded-full h-2'>
              <div
                className={`h-2 rounded-full ${
                  analytics.leverageScore > 0 ? 'bg-green-500' : 'bg-red-500'
                }`}
                style={{
                  width: `${Math.min(Math.abs(analytics.leverageScore) * 2, 100)}%`,
                  marginLeft: analytics.leverageScore < 0 ? 'auto' : '0',
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Players List */}
      <div className='space-y-1'>
        <div className='text-xs font-medium text-gray-500 mb-2'>ROSTER</div>
        {lineup.slots.map((player, idx) => (
          <div key={idx} className='flex justify-between items-center text-sm'>
            <div className='flex items-center gap-2'>
              <span className='w-8 text-xs font-medium text-gray-500'>
                {player.pos}
              </span>
              <span className='font-medium text-gray-900'>{player.name}</span>
              <span className='text-xs text-gray-500'>{player.team}</span>
            </div>
            <span className='font-medium text-gray-700'>
              ${player.salary.toLocaleString()}
            </span>
          </div>
        ))}
      </div>

      {/* Salary Utilization */}
      <div className='mt-3 pt-3 border-t border-gray-200'>
        <div className='flex justify-between text-xs text-gray-600 mb-1'>
          <span>Salary Usage</span>
          <span>{salaryUtilization.toFixed(1)}%</span>
        </div>
        <div className='w-full bg-gray-200 rounded-full h-2'>
          <div
            className={`h-2 rounded-full ${
              isOverCap
                ? 'bg-red-500'
                : salaryUtilization >= 98
                  ? 'bg-green-500'
                  : 'bg-yellow-500'
            }`}
            style={{ width: `${Math.min(salaryUtilization, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
};
