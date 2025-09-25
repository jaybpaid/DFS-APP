import React, { useState, useEffect } from 'react';
import ProfessionalSlateSelector from '../../components/ProfessionalSlateSelector';
import { GameStrip } from '../../components/GameStrip';
import EnhancedPlayerPoolTableWithWeather from '../../components/EnhancedPlayerPoolTableWithWeather';
import { useDfsStore } from '../../store/dfs-store';
import { usePlayerPoolStats } from '../../hooks/usePlayerPool';
import { Player } from '../../types';

interface ComprehensiveSlate {
  slate_id: string;
  name: string;
  sport: string;
  site: string;
  start_time: string;
  entry_fee: number;
  total_payouts: number;
  contest_count: number;
  max_entry_fee: number;
  total_entries: number;
  game_type: string;
  search_popularity?: number;
  trending_score?: number;
  risk_analysis?: string;
}

export default function OptimizerPage() {
  const [selectedSlate, setSelectedSlate] = useState<ComprehensiveSlate | null>(null);
  const {
    setCurrentSlate,
    setSelectedSlateId,
    fetchPlayersForSlate,
    getPlayersForSlate,
    getFilteredPlayers,
    isSlateLoading,
    getSlateError,
    selectedSlateId,
    // Game Strip state
    activeGameIds,
    gamesData,
    weatherData,
    gamesLoading,
    toggleGameFilter,
    clearGameFilters,
    fetchGamesData,
  } = useDfsStore();

  // Get players for the currently selected slate
  const slateId = selectedSlate?.slate_id || null;
  const allPlayers = slateId ? getPlayersForSlate(slateId) : [];
  const players = slateId ? getFilteredPlayers(slateId) : [];
  const isLoadingPlayers = slateId ? isSlateLoading(slateId) : false;
  const slateError = slateId ? getSlateError(slateId) : null;

  // Calculate player stats from slate-specific players
  const playerStats = React.useMemo(() => {
    if (!players.length) return null;

    const totalPlayers = players.length;
    const salaryCap = 50000;
    const salaries = players.map(p => ('salary' in p ? p.salary : 0));
    const averageSalary =
      salaries.reduce((sum, salary) => sum + salary, 0) / totalPlayers;
    const teams = new Set(
      players.map(p =>
        'team_abbreviation' in p ? p.team_abbreviation : 'team' in p ? p.team : ''
      )
    ).size;

    const playersByPosition = players.reduce(
      (acc, player) => {
        const position = 'position' in player ? player.position : '';
        acc[position] = (acc[position] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      totalPlayers,
      salaryCap,
      averageSalary: Math.round(averageSalary),
      teams,
      playersByPosition,
      salaryRange: {
        min: Math.min(...salaries),
        max: Math.max(...salaries),
      },
    };
  }, [players]);

  const handleSlateChange = async (slate: ComprehensiveSlate) => {
    setSelectedSlate(slate);

    // Update global store
    setCurrentSlate({
      id: slate.slate_id,
      name: slate.name,
      sport: slate.sport,
      site: slate.site,
      startTime: slate.start_time,
      playerCount: slate.total_entries,
      salaryCap: 50000, // Default DK salary cap
      isLive: true,
    });

    // Set selected slate ID and fetch players and games data
    setSelectedSlateId(slate.slate_id);
    await Promise.all([
      fetchPlayersForSlate(slate.slate_id),
      fetchGamesData(slate.slate_id),
    ]);
  };

  // Handle game strip refresh
  const handleGameStripRefresh = async () => {
    if (slateId) {
      await fetchGamesData(slateId);
    }
  };

  return (
    <div className='space-y-6'>
      {/* Professional Slate Selector (RotoWire Style) */}
      <div className='bg-white shadow rounded-lg p-6'>
        <div className='mb-6'>
          <h1 className='text-2xl font-bold text-gray-900 mb-2'>
            NFL Lineup Optimizer
          </h1>
          <p className='text-gray-600'>
            Build optimal lineups from comprehensive DFS slate data
          </p>
        </div>

        <ProfessionalSlateSelector
          selectedSlateId={selectedSlate?.slate_id}
          onSlateChange={handleSlateChange}
          className='w-full'
        />
      </div>

      {/* Optimizer Controls */}
      {selectedSlate && (
        <div className='bg-white shadow rounded-lg p-6'>
          <div className='flex justify-between items-start mb-6'>
            <div>
              <h2 className='text-lg font-semibold text-gray-900'>
                {selectedSlate.name}
              </h2>
              <div className='flex items-center space-x-4 mt-2 text-sm text-gray-600'>
                <span>{selectedSlate.contest_count.toLocaleString()} contests</span>
                <span>•</span>
                <span>${selectedSlate.entry_fee} entry</span>
                <span>•</span>
                <span>
                  ${(selectedSlate.total_payouts / 1000000).toFixed(1)}M total prizes
                </span>
              </div>
            </div>

            <div className='text-right'>
              <div className='text-2xl font-bold text-green-600'>
                ${(selectedSlate.total_payouts / 1000000).toFixed(1)}M
              </div>
              <div className='text-xs text-gray-500'>Prize Pool</div>
            </div>
          </div>

          {/* Lineup Builder Section */}
          <div className='border-t border-gray-200 pt-6'>
            <div className='text-center py-12'>
              <h3 className='text-lg font-medium text-gray-900 mb-2'>
                Lineup Builder Ready
              </h3>
              <p className='text-gray-600 mb-4'>Selected: {selectedSlate.name}</p>
              <div className='grid grid-cols-2 md:grid-cols-4 gap-4 text-sm'>
                <div className='bg-blue-50 p-3 rounded'>
                  <div className='font-medium text-blue-900'>Contest Type</div>
                  <div className='text-blue-700'>{selectedSlate.game_type}</div>
                </div>
                <div className='bg-green-50 p-3 rounded'>
                  <div className='font-medium text-green-900'>Total Entries</div>
                  <div className='text-green-700'>
                    {selectedSlate.total_entries.toLocaleString()}
                  </div>
                </div>
                <div className='bg-purple-50 p-3 rounded'>
                  <div className='font-medium text-purple-900'>Start Time</div>
                  <div className='text-purple-700'>{selectedSlate.start_time}</div>
                </div>
                <div className='bg-orange-50 p-3 rounded'>
                  <div className='font-medium text-orange-900'>Risk Level</div>
                  <div className='text-orange-700'>
                    {selectedSlate.risk_analysis || 'Medium'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Game Strip - Filter by Games */}
      {selectedSlate && gamesData.length > 0 && (
        <div className='bg-white shadow rounded-lg p-6'>
          <div className='mb-4'>
            <h3 className='text-lg font-semibold text-gray-900 mb-2'>
              Game Selection & Weather
            </h3>
            <p className='text-sm text-gray-600'>
              Click games to filter player pool.{' '}
              {activeGameIds.size > 0 &&
                `${activeGameIds.size} game${activeGameIds.size === 1 ? '' : 's'} selected.`}
            </p>
          </div>

          <GameStrip
            games={gamesData}
            weather={weatherData}
            onToggleGame={toggleGameFilter}
            activeGameIds={activeGameIds}
            loading={gamesLoading}
            onRefresh={handleGameStripRefresh}
            asOf={new Date().toISOString()}
            provenance={['dfs-mcp', 'weather-api']}
          />

          {activeGameIds.size > 0 && (
            <div className='mt-4 flex justify-between items-center'>
              <div className='text-sm text-gray-600'>
                Showing players from {activeGameIds.size} selected game
                {activeGameIds.size === 1 ? '' : 's'}
              </div>
              <button
                onClick={clearGameFilters}
                className='text-sm text-blue-600 hover:text-blue-800 font-medium'
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Player Pool Statistics */}
      {selectedSlate && playerStats && (
        <div className='bg-white shadow rounded-lg p-6'>
          <div className='flex justify-between items-center mb-4'>
            <h3 className='text-lg font-semibold text-gray-900'>
              Player Pool Analytics
            </h3>
            {isLoadingPlayers ? (
              <div className='text-sm text-gray-500'>Loading players...</div>
            ) : (
              <div className='text-sm text-gray-500'>
                {playerStats.totalPlayers} players loaded
              </div>
            )}
          </div>

          <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-6'>
            <div className='bg-blue-50 p-4 rounded-lg'>
              <div className='text-2xl font-bold text-blue-600'>
                {playerStats.totalPlayers}
              </div>
              <div className='text-sm text-blue-700'>Total Players</div>
            </div>
            <div className='bg-green-50 p-4 rounded-lg'>
              <div className='text-2xl font-bold text-green-600'>
                ${playerStats.salaryCap.toLocaleString()}
              </div>
              <div className='text-sm text-green-700'>Salary Cap</div>
            </div>
            <div className='bg-purple-50 p-4 rounded-lg'>
              <div className='text-2xl font-bold text-purple-600'>
                ${playerStats.averageSalary.toLocaleString()}
              </div>
              <div className='text-sm text-purple-700'>Avg Salary</div>
            </div>
            <div className='bg-orange-50 p-4 rounded-lg'>
              <div className='text-2xl font-bold text-orange-600'>
                {playerStats.teams}
              </div>
              <div className='text-sm text-orange-700'>Teams</div>
            </div>
          </div>

          <div className='grid grid-cols-2 gap-6'>
            {/* Position Breakdown */}
            <div>
              <h4 className='font-medium text-gray-900 mb-3'>Players by Position</h4>
              <div className='space-y-2'>
                {Object.entries(playerStats.playersByPosition).map(
                  ([position, count]) => (
                    <div key={position} className='flex justify-between items-center'>
                      <span className='text-sm font-medium text-gray-700'>
                        {position}
                      </span>
                      <span className='text-sm text-gray-600'>{count} players</span>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Salary Range */}
            <div>
              <h4 className='font-medium text-gray-900 mb-3'>Salary Distribution</h4>
              <div className='space-y-2'>
                <div className='flex justify-between items-center'>
                  <span className='text-sm font-medium text-gray-700'>Minimum</span>
                  <span className='text-sm text-gray-600'>
                    ${playerStats.salaryRange.min.toLocaleString()}
                  </span>
                </div>
                <div className='flex justify-between items-center'>
                  <span className='text-sm font-medium text-gray-700'>Maximum</span>
                  <span className='text-sm text-gray-600'>
                    ${playerStats.salaryRange.max.toLocaleString()}
                  </span>
                </div>
                <div className='flex justify-between items-center'>
                  <span className='text-sm font-medium text-gray-700'>Average</span>
                  <span className='text-sm text-gray-600'>
                    ${playerStats.averageSalary.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Player Pool Table */}
      {selectedSlate && (
        <div className='bg-white shadow rounded-lg p-6'>
          <div className='flex justify-between items-center mb-4'>
            <h3 className='text-lg font-semibold text-gray-900'>Player Pool Details</h3>
            {slateError && (
              <div className='text-sm text-red-600'>Error: {slateError}</div>
            )}
          </div>
          <EnhancedPlayerPoolTableWithWeather
            players={players}
            isLoading={isLoadingPlayers}
            showWeatherImpact={weatherData.length > 0}
          />
        </div>
      )}

      {/* Optimization Tools */}
      <div className='bg-white shadow rounded-lg p-6'>
        <h3 className='text-lg font-semibold text-gray-900 mb-4'>
          Optimization Engine
        </h3>

        {selectedSlate && playerStats ? (
          <div className='space-y-6'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div className='space-y-4'>
                <h4 className='font-medium text-gray-900'>Optimization Settings</h4>
                <div className='space-y-3'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Number of Lineups
                    </label>
                    <div className='relative'>
                      <input
                        type='number'
                        min='1'
                        max='10000'
                        defaultValue='20'
                        placeholder='Enter number of lineups (1-10,000)'
                        aria-label='Number of Lineups'
                        className='w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                      />
                      <div className='absolute inset-y-0 right-0 pr-3 flex items-center'>
                        <span className='text-xs text-gray-400'>Max: 10K</span>
                      </div>
                    </div>
                    <div className='text-xs text-gray-500 mt-1'>
                      Professional optimizers support 100s-1000s of lineups. Based on
                      chanzer0/NFL-DFS-Tools architecture.
                    </div>
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Different Players (Uniqueness)
                    </label>
                    <div className='relative'>
                      <input
                        type='number'
                        min='1'
                        max='8'
                        defaultValue='3'
                        placeholder='1-8 different players'
                        aria-label='Number of different players (Uniqueness)'
                        className='w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                      />
                      <div className='absolute inset-y-0 right-0 pr-3 flex items-center'>
                        <span className='text-xs text-gray-400'>1-8</span>
                      </div>
                    </div>
                    <div className='text-xs text-gray-500 mt-1'>
                      <span className='font-medium'>Strategy:</span> 1-2 = Cash games •
                      3-4 = Balanced GPP • 5-8 = Tournament play
                    </div>
                  </div>
                </div>
              </div>

              <div className='space-y-4'>
                <h4 className='font-medium text-gray-900'>Advanced Options</h4>
                <div className='space-y-3'>
                  <div className='flex items-center'>
                    <input
                      type='checkbox'
                      id='use-projections'
                      className='rounded border-gray-300 mr-2'
                      aria-label='Use projections'
                    />
                    <label htmlFor='use-projections' className='text-sm text-gray-700'>
                      Use projections
                    </label>
                  </div>
                  <div className='flex items-center'>
                    <input
                      type='checkbox'
                      id='consider-ownership'
                      className='rounded border-gray-300 mr-2'
                      aria-label='Consider ownership'
                    />
                    <label
                      htmlFor='consider-ownership'
                      className='text-sm text-gray-700'
                    >
                      Consider ownership
                    </label>
                  </div>
                  <div className='flex items-center'>
                    <input
                      type='checkbox'
                      id='stack-correlations'
                      className='rounded border-gray-300 mr-2'
                      aria-label='Stack correlations'
                    />
                    <label
                      htmlFor='stack-correlations'
                      className='text-sm text-gray-700'
                    >
                      Stack correlations
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className='pt-4 border-t border-gray-200'>
              <button
                disabled
                className='w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed'
              >
                Generate Optimal Lineups (Coming Soon)
              </button>
            </div>
          </div>
        ) : (
          <div className='text-center py-8'>
            <p className='text-gray-500'>Select a slate above to begin optimization</p>
          </div>
        )}
      </div>
    </div>
  );
}
