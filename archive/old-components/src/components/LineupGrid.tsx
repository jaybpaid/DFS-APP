import React, { useState, useMemo } from 'react';
import { LineupCardPro } from './LineupCardPro';

interface LineupGridProps {
  lineups: any[];
  analytics: any[];
  salaryCap: number;
  hideOverCap?: boolean;
}

type SortOption =
  | 'proj'
  | 'roi'
  | 'winProb'
  | 'dupRisk'
  | 'leverageScore'
  | 'totalSalary';

export const LineupGrid: React.FC<LineupGridProps> = ({
  lineups,
  analytics,
  salaryCap,
  hideOverCap = true,
}) => {
  const [sortBy, setSortBy] = useState<SortOption>('proj');
  const [sortDesc, setSortDesc] = useState(true);
  const [showOverCap, setShowOverCap] = useState(!hideOverCap);

  // Filter and sort lineups
  const processedLineups = useMemo(() => {
    let filtered = lineups;

    // Filter out over-cap lineups if hideOverCap is enabled
    if (!showOverCap) {
      filtered = lineups.filter(lineup => lineup.totalSalary <= salaryCap);
    }

    // Sort lineups
    const sorted = [...filtered].sort((a, b) => {
      let aValue: number, bValue: number;

      if (sortBy === 'proj' || sortBy === 'totalSalary') {
        aValue = a[sortBy] || 0;
        bValue = b[sortBy] || 0;
      } else {
        // Analytics-based sorting
        const aAnalytics = analytics.find(an => an.lineupId === lineups.indexOf(a) + 1);
        const bAnalytics = analytics.find(an => an.lineupId === lineups.indexOf(b) + 1);
        aValue = aAnalytics?.[sortBy] || 0;
        bValue = bAnalytics?.[sortBy] || 0;
      }

      return sortDesc ? bValue - aValue : aValue - bValue;
    });

    return sorted;
  }, [lineups, analytics, sortBy, sortDesc, showOverCap, salaryCap]);

  const handleSort = (option: SortOption) => {
    if (sortBy === option) {
      setSortDesc(!sortDesc);
    } else {
      setSortBy(option);
      setSortDesc(true);
    }
  };

  const exportToCSV = () => {
    // Filter out over-cap lineups for export
    const exportLineups = lineups.filter(lineup => lineup.totalSalary <= salaryCap);

    if (exportLineups.length === 0) {
      alert('No valid lineups to export (all exceed salary cap)');
      return;
    }

    // Create CSV headers
    const headers = [
      'Lineup',
      'Site',
      'Mode',
      'Projection',
      'Total Salary',
      'Win%',
      'Cash%',
      'ROI',
      'Dup Risk',
      'Leverage',
      'QB',
      'RB1',
      'RB2',
      'WR1',
      'WR2',
      'WR3',
      'TE',
      'FLEX',
      'DST',
    ];

    // Create CSV rows
    const rows = exportLineups.map((lineup, index) => {
      const analytics_data = analytics.find(
        a => a.lineupId === lineups.indexOf(lineup) + 1
      );
      const players = lineup.slots || [];

      return [
        index + 1,
        lineup.site,
        lineup.mode,
        lineup.proj?.toFixed(1) || '0.0',
        lineup.totalSalary,
        analytics_data ? (analytics_data.winProb * 100).toFixed(2) + '%' : '0.00%',
        analytics_data ? (analytics_data.minCashProb * 100).toFixed(2) + '%' : '0.00%',
        analytics_data ? (analytics_data.roi * 100).toFixed(0) + '%' : '0%',
        analytics_data ? (analytics_data.dupRisk * 100).toFixed(0) + '%' : '0%',
        analytics_data ? analytics_data.leverageScore.toFixed(1) : '0.0',
        ...players.slice(0, 9).map(p => `${p.name} (${p.team})`),
      ];
    });

    // Convert to CSV string
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    // Add footer with exclusion count
    const excludedCount = lineups.length - exportLineups.length;
    const footer = excludedCount > 0 ? `\n\n"excluded_over_cap:${excludedCount}"` : '';

    // Download CSV
    const blob = new Blob([csvContent + footer], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dfs_lineups_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    console.log(
      `✅ CSV Export: ${exportLineups.length} lineups exported, ${excludedCount} over-cap excluded`
    );
  };

  const overCapCount = lineups.filter(l => l.totalSalary > salaryCap).length;

  return (
    <div>
      {/* Controls */}
      <div className='flex flex-wrap items-center justify-between gap-4 mb-6'>
        <div className='flex flex-wrap items-center gap-2'>
          <span className='text-sm font-medium text-gray-700'>Sort by:</span>
          {[
            { key: 'proj', label: 'Projection' },
            { key: 'roi', label: 'ROI' },
            { key: 'winProb', label: 'Win%' },
            { key: 'dupRisk', label: 'Dup Risk' },
            { key: 'leverageScore', label: 'Leverage' },
            { key: 'totalSalary', label: 'Salary' },
          ].map(option => (
            <button
              key={option.key}
              onClick={() => handleSort(option.key as SortOption)}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                sortBy === option.key
                  ? 'bg-blue-100 text-blue-800 font-medium'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {option.label}
              {sortBy === option.key && (
                <span className='ml-1'>{sortDesc ? '↓' : '↑'}</span>
              )}
            </button>
          ))}
        </div>

        <div className='flex items-center gap-3'>
          {overCapCount > 0 && (
            <label className='flex items-center gap-2 text-sm'>
              <input
                type='checkbox'
                checked={showOverCap}
                onChange={e => setShowOverCap(e.target.checked)}
                className='rounded'
              />
              Show over-cap ({overCapCount})
            </label>
          )}

          <button
            onClick={exportToCSV}
            className='px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium'
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Results Count */}
      <div className='mb-4 text-sm text-gray-600'>
        Showing {processedLineups.length} of {lineups.length} lineups
        {!showOverCap && overCapCount > 0 && (
          <span className='text-red-600 ml-2'>({overCapCount} over-cap hidden)</span>
        )}
      </div>

      {/* Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {processedLineups.map((lineup, index) => {
          const originalIndex = lineups.indexOf(lineup);
          const lineupAnalytics = analytics.find(a => a.lineupId === originalIndex + 1);

          return (
            <LineupCardPro
              key={originalIndex}
              lineup={lineup}
              analytics={lineupAnalytics}
              salaryCap={salaryCap}
              index={originalIndex}
            />
          );
        })}
      </div>

      {processedLineups.length === 0 && (
        <div className='text-center py-12 text-gray-500'>
          <div className='text-lg font-medium mb-2'>No lineups to display</div>
          <div className='text-sm'>
            {overCapCount > 0 && !showOverCap
              ? 'All lineups exceed salary cap. Enable "Show over-cap" to view them.'
              : 'No lineups have been generated yet.'}
          </div>
        </div>
      )}
    </div>
  );
};
