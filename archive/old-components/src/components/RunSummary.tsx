import React from 'react';

interface RunSummaryProps {
  lineups: any[];
  analytics: any[];
  salaryCap: number;
  site: string;
  mode: string;
}

export const RunSummary: React.FC<RunSummaryProps> = ({
  lineups,
  analytics,
  salaryCap,
  site,
  mode,
}) => {
  if (!lineups.length) return null;

  // Calculate summary statistics
  const totalLineups = lineups.length;
  const avgSalary = lineups.reduce((sum, l) => sum + l.totalSalary, 0) / totalLineups;
  const avgProjection = lineups.reduce((sum, l) => sum + l.proj, 0) / totalLineups;
  const capCompliance =
    lineups.filter(l => l.totalSalary <= salaryCap).length / totalLineups;

  const avgWinProb = analytics.length
    ? analytics.reduce((sum, a) => sum + a.winProb, 0) / analytics.length
    : 0;
  const avgRoi = analytics.length
    ? analytics.reduce((sum, a) => sum + a.roi, 0) / analytics.length
    : 0;

  const summaryTiles = [
    {
      title: 'Lineups Generated',
      value: totalLineups.toString(),
      subtitle: `${site} ${mode}`,
      color: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    {
      title: 'Avg Salary',
      value: `$${Math.round(avgSalary).toLocaleString()}`,
      subtitle: `${((avgSalary / salaryCap) * 100).toFixed(1)}% usage`,
      color: 'bg-green-50 text-green-700 border-green-200',
    },
    {
      title: 'Avg Projection',
      value: `${avgProjection.toFixed(1)} pts`,
      subtitle: 'Expected score',
      color: 'bg-purple-50 text-purple-700 border-purple-200',
    },
    {
      title: 'Avg Win%',
      value: `${(avgWinProb * 100).toFixed(2)}%`,
      subtitle: 'Tournament upside',
      color: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    },
    {
      title: 'Avg ROI',
      value: `${(avgRoi * 100).toFixed(0)}%`,
      subtitle: 'Expected return',
      color:
        avgRoi > 0
          ? 'bg-green-50 text-green-700 border-green-200'
          : 'bg-red-50 text-red-700 border-red-200',
    },
    {
      title: 'Cap Compliance',
      value: `${(capCompliance * 100).toFixed(0)}%`,
      subtitle: `≤ $${salaryCap.toLocaleString()}`,
      color:
        capCompliance === 1
          ? 'bg-green-50 text-green-700 border-green-200'
          : 'bg-red-50 text-red-700 border-red-200',
    },
  ];

  return (
    <div className='mb-6'>
      <div className='flex items-center justify-between mb-4'>
        <h2 className='text-xl font-bold text-gray-900'>Run Summary</h2>
        <div className='flex items-center gap-2'>
          <div className='px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium'>
            ${salaryCap.toLocaleString()} Cap
          </div>
          {capCompliance < 1 && (
            <div className='px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium'>
              {totalLineups - Math.round(capCompliance * totalLineups)} Over Cap
            </div>
          )}
        </div>
      </div>

      <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4'>
        {summaryTiles.map((tile, index) => (
          <div key={index} className={`p-4 rounded-lg border-2 ${tile.color}`}>
            <div className='text-2xl font-bold mb-1'>{tile.value}</div>
            <div className='text-sm font-medium mb-1'>{tile.title}</div>
            <div className='text-xs opacity-75'>{tile.subtitle}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
