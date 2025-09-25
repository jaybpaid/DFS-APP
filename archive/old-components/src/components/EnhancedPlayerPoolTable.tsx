import React, { useState, useMemo } from 'react';
import { EnhancedPlayer, PlayerControls } from '../types/player-controls';

interface EnhancedPlayerPoolTableProps {
  players: EnhancedPlayer[];
  isLoading: boolean;
  onPlayerUpdate: (playerId: string, controls: Partial<PlayerControls>) => void;
  onBulkUpdate: (playerIds: string[], controls: Partial<PlayerControls>) => void;
}

type SortKey =
  | 'name'
  | 'position'
  | 'team'
  | 'salary'
  | 'projectedPoints'
  | 'ownership'
  | 'leverageScore';

export default function EnhancedPlayerPoolTable({
  players,
  isLoading,
  onPlayerUpdate,
  onBulkUpdate,
}: EnhancedPlayerPoolTableProps) {
  const [sortConfig, setSortConfig] = useState<{
    key: SortKey;
    direction: 'asc' | 'desc';
  } | null>(null);
  const [selectedPlayers, setSelectedPlayers] = useState<Set<string>>(new Set());
  const [expandedPlayer, setExpandedPlayer] = useState<string | null>(null);
  const [filterPosition, setFilterPosition] = useState<string>('all');
  const [filterTeam, setFilterTeam] = useState<string>('all');

  const sortedPlayers = useMemo(() => {
    if (!Array.isArray(players)) return [];

    let filtered = players.filter(player => {
      if (filterPosition !== 'all' && player.position !== filterPosition) return false;
      if (filterTeam !== 'all' && player.team !== filterTeam) return false;
      return true;
    });

    if (sortConfig) {
      filtered.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        if (sortConfig.key === 'leverageScore') {
          aValue = a.mcpSignals?.leverage || 0;
          bValue = b.mcpSignals?.leverage || 0;
        } else {
          aValue = a[sortConfig.key as keyof EnhancedPlayer];
          bValue = b[sortConfig.key as keyof EnhancedPlayer];
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [players, sortConfig, filterPosition, filterTeam]);

  const positions = useMemo(() => {
    const posSet = new Set(players.map(p => p.position));
    return Array.from(posSet).sort();
  }, [players]);

  const teams = useMemo(() => {
    const teamSet = new Set(players.map(p => p.team));
    return Array.from(teamSet).sort();
  }, [players]);

  const handleSort = (key: SortKey) => {
    setSortConfig(prev => ({
      key,
      direction: prev?.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handlePlayerSelect = (playerId: string, selected: boolean) => {
    const newSelected = new Set(selectedPlayers);
    if (selected) {
      newSelected.add(playerId);
    } else {
      newSelected.delete(playerId);
    }
    setSelectedPlayers(newSelected);
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedPlayers(new Set(sortedPlayers.map(p => p.id)));
    } else {
      setSelectedPlayers(new Set());
    }
  };

  const handleBulkAction = (action: string, value?: any) => {
    if (selectedPlayers.size === 0) return;

    const updates: Partial<PlayerControls> = {};

    switch (action) {
      case 'lock':
        updates.locked = true;
        break;
      case 'unlock':
        updates.locked = false;
        break;
      case 'ban':
        updates.banned = true;
        break;
      case 'unban':
        updates.banned = false;
        break;
      case 'setExposure':
        updates.minExposure = value.min;
        updates.maxExposure = value.max;
        break;
      case 'setPriority':
        updates.priorityTag = value;
        break;
    }

    onBulkUpdate(Array.from(selectedPlayers), updates);
    setSelectedPlayers(new Set());
  };

  const getSortIcon = (key: SortKey) => {
    if (!sortConfig || sortConfig.key !== key) return '↕️';
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  const getStatusBadge = (player: EnhancedPlayer) => {
    const { controls, mcpSignals } = player;

    if (controls.locked)
      return (
        <span className='px-2 py-1 text-xs bg-green-100 text-green-800 rounded'>
          LOCKED
        </span>
      );
    if (controls.banned)
      return (
        <span className='px-2 py-1 text-xs bg-red-100 text-red-800 rounded'>
          BANNED
        </span>
      );
    if (controls.injuryTag !== 'ACTIVE')
      return (
        <span className='px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded'>
          {controls.injuryTag}
        </span>
      );
    if (mcpSignals?.news)
      return (
        <span className='px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded'>
          NEWS
        </span>
      );

    return null;
  };

  const getLeverageColor = (leverage?: number) => {
    if (!leverage) return 'text-gray-500';
    if (leverage > 2) return 'text-green-600 font-bold';
    if (leverage > 1) return 'text-green-500';
    if (leverage < -1) return 'text-red-500';
    return 'text-gray-700';
  };

  if (isLoading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
        <span className='ml-3 text-gray-600'>Loading enhanced player data...</span>
      </div>
    );
  }

  if (!players || players.length === 0) {
    return (
      <div className='text-center py-8 text-gray-500'>
        No players available for this slate.
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      {/* Filters and Bulk Actions */}
      <div className='flex flex-wrap items-center justify-between gap-4 p-4 bg-gray-50 rounded-lg'>
        <div className='flex items-center space-x-4'>
          <select
            value={filterPosition}
            onChange={e => setFilterPosition(e.target.value)}
            className='px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
            aria-label='Filter by position'
            title='Filter players by position'
          >
            <option value='all'>All Positions</option>
            {positions.map(pos => (
              <option key={pos} value={pos}>
                {pos}
              </option>
            ))}
          </select>

          <select
            value={filterTeam}
            onChange={e => setFilterTeam(e.target.value)}
            className='px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
            aria-label='Filter by team'
            title='Filter players by team'
          >
            <option value='all'>All Teams</option>
            {teams.map(team => (
              <option key={team} value={team}>
                {team}
              </option>
            ))}
          </select>

          <span className='text-sm text-gray-600'>
            {sortedPlayers.length} players ({selectedPlayers.size} selected)
          </span>
        </div>

        {selectedPlayers.size > 0 && (
          <div className='flex items-center space-x-2'>
            <button
              onClick={() => handleBulkAction('lock')}
              className='px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700'
            >
              Lock ({selectedPlayers.size})
            </button>
            <button
              onClick={() => handleBulkAction('ban')}
              className='px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700'
            >
              Ban ({selectedPlayers.size})
            </button>
            <button
              onClick={() => handleBulkAction('setPriority', 'core')}
              className='px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700'
            >
              Mark Core
            </button>
          </div>
        )}
      </div>

      {/* Enhanced Player Table */}
      <div className='overflow-x-auto border border-gray-200 rounded-lg'>
        <table className='min-w-full divide-y divide-gray-200'>
          <thead className='bg-gray-50'>
            <tr>
              <th className='px-4 py-3 text-left'>
                <input
                  type='checkbox'
                  checked={
                    selectedPlayers.size === sortedPlayers.length &&
                    sortedPlayers.length > 0
                  }
                  onChange={e => handleSelectAll(e.target.checked)}
                  className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
                />
              </th>
              <th
                className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100'
                onClick={() => handleSort('name')}
              >
                Player {getSortIcon('name')}
              </th>
              <th
                className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100'
                onClick={() => handleSort('position')}
              >
                Pos {getSortIcon('position')}
              </th>
              <th
                className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100'
                onClick={() => handleSort('team')}
              >
                Team {getSortIcon('team')}
              </th>
              <th
                className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100'
                onClick={() => handleSort('salary')}
              >
                Salary {getSortIcon('salary')}
              </th>
              <th
                className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100'
                onClick={() => handleSort('projectedPoints')}
              >
                Proj {getSortIcon('projectedPoints')}
              </th>
              <th
                className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100'
                onClick={() => handleSort('ownership')}
              >
                Own% {getSortIcon('ownership')}
              </th>
              <th
                className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100'
                onClick={() => handleSort('leverageScore')}
              >
                Leverage {getSortIcon('leverageScore')}
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Controls
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Status
              </th>
            </tr>
          </thead>
          <tbody className='bg-white divide-y divide-gray-200'>
            {sortedPlayers.map(player => (
              <React.Fragment key={player.id}>
                <tr
                  className={`hover:bg-gray-50 ${selectedPlayers.has(player.id) ? 'bg-blue-50' : ''}`}
                >
                  <td className='px-4 py-4'>
                    <input
                      type='checkbox'
                      checked={selectedPlayers.has(player.id)}
                      onChange={e => handlePlayerSelect(player.id, e.target.checked)}
                      className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
                    />
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <div className='flex items-center'>
                      <button
                        onClick={() =>
                          setExpandedPlayer(
                            expandedPlayer === player.id ? null : player.id
                          )
                        }
                        className='mr-2 text-gray-400 hover:text-gray-600'
                      >
                        {expandedPlayer === player.id ? '▼' : '▶'}
                      </button>
                      <div>
                        <div className='text-sm font-medium text-gray-900'>
                          {player.name}
                        </div>
                        {player.mcpSignals?.news && (
                          <div
                            className='text-xs text-blue-600 truncate max-w-32'
                            title={player.mcpSignals.news}
                          >
                            {player.mcpSignals.news}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                    {player.position}
                    {player.controls.multiPosEligibility.length > 1 && (
                      <span className='text-xs text-gray-500'>
                        /{player.controls.multiPosEligibility.join('/')}
                      </span>
                    )}
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                    {player.team}
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                    $
                    {(player.controls.salaryOverride || player.salary).toLocaleString()}
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                    {(
                      player.controls.customProjection || player.projectedPoints
                    ).toFixed(1)}
                    {player.controls.projectionBoost !== 0 && (
                      <span
                        className={`text-xs ml-1 ${player.controls.projectionBoost > 0 ? 'text-green-600' : 'text-red-600'}`}
                      >
                        ({player.controls.projectionBoost > 0 ? '+' : ''}
                        {player.controls.projectionBoost}%)
                      </span>
                    )}
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                    {(
                      (player.controls.ownershipOverride || player.ownership) * 100
                    ).toFixed(1)}
                    %
                  </td>
                  <td
                    className={`px-6 py-4 whitespace-nowrap text-sm ${getLeverageColor(player.mcpSignals?.leverage)}`}
                  >
                    {player.mcpSignals?.leverage?.toFixed(2) || 'N/A'}
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <div className='flex items-center space-x-1'>
                      <button
                        onClick={() =>
                          onPlayerUpdate(player.id, { locked: !player.controls.locked })
                        }
                        className={`px-2 py-1 text-xs rounded ${
                          player.controls.locked
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {player.controls.locked ? '🔒' : '🔓'}
                      </button>
                      <button
                        onClick={() =>
                          onPlayerUpdate(player.id, { banned: !player.controls.banned })
                        }
                        className={`px-2 py-1 text-xs rounded ${
                          player.controls.banned
                            ? 'bg-red-100 text-red-800 hover:bg-red-200'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {player.controls.banned ? '❌' : '⭕'}
                      </button>
                    </div>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <div className='flex items-center space-x-1'>
                      {getStatusBadge(player)}
                      {player.controls.priorityTag !== 'none' && (
                        <span
                          className={`px-2 py-1 text-xs rounded ${
                            player.controls.priorityTag === 'core'
                              ? 'bg-purple-100 text-purple-800'
                              : player.controls.priorityTag === 'contrarian'
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {player.controls.priorityTag.toUpperCase()}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>

                {/* Expanded Controls Row - ALL 26 CONTROLS */}
                {expandedPlayer === player.id && (
                  <tr className='bg-gray-50'>
                    <td colSpan={10} className='px-6 py-4'>
                      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
                        {/* Core Controls (1-4) */}
                        <div className='space-y-3 border-r border-gray-200 pr-4'>
                          <h4 className='text-sm font-bold text-gray-900 border-b pb-1'>
                            Core Controls
                          </h4>
                          <div className='space-y-2'>
                            <div className='flex items-center space-x-2'>
                              <input
                                type='checkbox'
                                id={`locked-${player.id}`}
                                checked={player.controls.locked}
                                onChange={e =>
                                  onPlayerUpdate(player.id, {
                                    locked: e.target.checked,
                                  })
                                }
                                className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
                              />
                              <label
                                htmlFor={`locked-${player.id}`}
                                className='text-xs text-gray-700'
                              >
                                Locked
                              </label>
                            </div>
                            <div className='flex items-center space-x-2'>
                              <input
                                type='checkbox'
                                id={`banned-${player.id}`}
                                checked={player.controls.banned}
                                onChange={e =>
                                  onPlayerUpdate(player.id, {
                                    banned: e.target.checked,
                                  })
                                }
                                className='h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded'
                              />
                              <label
                                htmlFor={`banned-${player.id}`}
                                className='text-xs text-gray-700'
                              >
                                Banned
                              </label>
                            </div>
                            <div className='flex items-center space-x-2'>
                              <label className='text-xs text-gray-600'>
                                Min Exposure:
                              </label>
                              <input
                                type='number'
                                min='0'
                                max='100'
                                value={player.controls.minExposure}
                                onChange={e =>
                                  onPlayerUpdate(player.id, {
                                    minExposure: parseInt(e.target.value),
                                  })
                                }
                                className='w-16 px-2 py-1 text-xs border border-gray-300 rounded'
                              />
                              <span className='text-xs text-gray-500'>%</span>
                            </div>
                            <div className='flex items-center space-x-2'>
                              <label className='text-xs text-gray-600'>
                                Max Exposure:
                              </label>
                              <input
                                type='number'
                                min='0'
                                max='100'
                                value={player.controls.maxExposure}
                                onChange={e =>
                                  onPlayerUpdate(player.id, {
                                    maxExposure: parseInt(e.target.value),
                                  })
                                }
                                className='w-16 px-2 py-1 text-xs border border-gray-300 rounded'
                              />
                              <span className='text-xs text-gray-500'>%</span>
                            </div>
                          </div>
                        </div>

                        {/* Projection Controls (5-7) */}
                        <div className='space-y-3 border-r border-gray-200 pr-4'>
                          <h4 className='text-sm font-bold text-gray-900 border-b pb-1'>
                            Projection Controls
                          </h4>
                          <div className='space-y-2'>
                            <div className='flex items-center space-x-2'>
                              <label className='text-xs text-gray-600'>
                                Custom Proj:
                              </label>
                              <input
                                type='number'
                                step='0.1'
                                placeholder={player.projectedPoints.toFixed(1)}
                                value={player.controls.customProjection || ''}
                                onChange={e =>
                                  onPlayerUpdate(player.id, {
                                    customProjection: e.target.value
                                      ? parseFloat(e.target.value)
                                      : undefined,
                                  })
                                }
                                className='w-20 px-2 py-1 text-xs border border-gray-300 rounded'
                              />
                            </div>
                            <div className='flex items-center space-x-2'>
                              <label className='text-xs text-gray-600'>
                                Proj Boost:
                              </label>
                              <input
                                type='number'
                                step='1'
                                value={player.controls.projectionBoost}
                                onChange={e =>
                                  onPlayerUpdate(player.id, {
                                    projectionBoost: parseInt(e.target.value),
                                  })
                                }
                                className='w-16 px-2 py-1 text-xs border border-gray-300 rounded'
                              />
                              <span className='text-xs text-gray-500'>%</span>
                            </div>
                            <div className='flex items-center space-x-2'>
                              <label className='text-xs text-gray-600'>
                                Own Override:
                              </label>
                              <input
                                type='number'
                                step='0.01'
                                placeholder={(player.ownership * 100).toFixed(1)}
                                value={player.controls.ownershipOverride || ''}
                                onChange={e =>
                                  onPlayerUpdate(player.id, {
                                    ownershipOverride: e.target.value
                                      ? parseFloat(e.target.value)
                                      : undefined,
                                  })
                                }
                                className='w-20 px-2 py-1 text-xs border border-gray-300 rounded'
                              />
                              <span className='text-xs text-gray-500'>%</span>
                            </div>
                          </div>
                        </div>

                        {/* Advanced Controls (8-12) */}
                        <div className='space-y-3 border-r border-gray-200 pr-4'>
                          <h4 className='text-sm font-bold text-gray-900 border-b pb-1'>
                            Advanced Controls
                          </h4>
                          <div className='space-y-2'>
                            <div className='flex items-center space-x-2'>
                              <input
                                type='checkbox'
                                id={`ownershipFade-${player.id}`}
                                checked={player.controls.ownershipFadeBoost}
                                onChange={e =>
                                  onPlayerUpdate(player.id, {
                                    ownershipFadeBoost: e.target.checked,
                                  })
                                }
                                className='h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded'
                              />
                              <label
                                htmlFor={`ownershipFade-${player.id}`}
                                className='text-xs text-gray-700'
                              >
                                Ownership Fade
                              </label>
                            </div>
                            <div className='flex items-center space-x-2'>
                              <label className='text-xs text-gray-600'>
                                Randomness:
                              </label>
                              <input
                                type='number'
                                step='0.1'
                                min='0'
                                max='100'
                                value={player.controls.randomnessDeviation}
                                onChange={e =>
                                  onPlayerUpdate(player.id, {
                                    randomnessDeviation: parseFloat(e.target.value),
                                  })
                                }
                                className='w-16 px-2 py-1 text-xs border border-gray-300 rounded'
                              />
                            </div>
                            <div className='flex items-center space-x-2'>
                              <label className='text-xs text-gray-600'>Mode:</label>
                              <select
                                value={player.controls.ceilingFloorToggle}
                                onChange={e =>
                                  onPlayerUpdate(player.id, {
                                    ceilingFloorToggle: e.target.value as any,
                                  })
                                }
                                className='w-20 px-2 py-1 text-xs border border-gray-300 rounded'
                                aria-label='Projection mode'
                                title='Select projection mode: ceiling, floor, or projection'
                              >
                                <option value='projection'>Proj</option>
                                <option value='ceiling'>Ceil</option>
                                <option value='floor'>Floor</option>
                              </select>
                            </div>
                            <div className='flex items-center space-x-2'>
                              <label className='text-xs text-gray-600'>
                                Salary Override:
                              </label>
                              <input
                                type='number'
                                placeholder={`$${player.salary}`}
                                value={player.controls.salaryOverride || ''}
                                onChange={e =>
                                  onPlayerUpdate(player.id, {
                                    salaryOverride: e.target.value
                                      ? parseInt(e.target.value)
                                      : undefined,
                                  })
                                }
                                className='w-20 px-2 py-1 text-xs border border-gray-300 rounded'
                              />
                            </div>
                          </div>
                        </div>

                        {/* Group & Stack Controls (13-14) */}
                        <div className='space-y-3 border-r border-gray-200 pr-4'>
                          <h4 className='text-sm font-bold text-gray-900 border-b pb-1'>
                            Group & Stack
                          </h4>
                          <div className='space-y-2'>
                            <div>
                              <label className='text-xs text-gray-600'>Groups:</label>
                              <div className='flex flex-wrap gap-1 mt-1'>
                                {player.controls.groupMemberships.map((group, idx) => (
                                  <span
                                    key={idx}
                                    className='px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full'
                                  >
                                    {group}
                                    <button
                                      onClick={() => {
                                        const newGroups =
                                          player.controls.groupMemberships.filter(
                                            (_, i) => i !== idx
                                          );
                                        onPlayerUpdate(player.id, {
                                          groupMemberships: newGroups,
                                        });
                                      }}
                                      className='ml-1 text-blue-600 hover:text-blue-800'
                                    >
                                      ×
                                    </button>
                                  </span>
                                ))}
                                <input
                                  type='text'
                                  placeholder='Add group...'
                                  className='w-20 px-2 py-1 text-xs border border-gray-300 rounded'
                                  onKeyPress={e => {
                                    const target = e.target as HTMLInputElement;
                                    if (e.key === 'Enter' && target.value.trim()) {
                                      const newGroups = [
                                        ...player.controls.groupMemberships,
                                        target.value.trim(),
                                      ];
                                      onPlayerUpdate(player.id, {
                                        groupMemberships: newGroups,
                                      });
                                      target.value = '';
                                    }
                                  }}
                                />
                              </div>
                            </div>
                            <div className='flex items-center space-x-2'>
                              <label className='text-xs text-gray-600'>
                                Stack Role:
                              </label>
                              <select
                                value={player.controls.stackRole}
                                onChange={e =>
                                  onPlayerUpdate(player.id, {
                                    stackRole: e.target.value as any,
                                  })
                                }
                                className='w-24 px-2 py-1 text-xs border border-gray-300 rounded'
                                aria-label='Stack role'
                                title="Select player's stack role"
                              >
                                <option value='none'>None</option>
                                <option value='qb_stack'>QB Stack</option>
                                <option value='bring_back'>Bring Back</option>
                                <option value='punt'>Punt</option>
                                <option value='contrarian'>Contrarian</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* Status & Signals (15-18) */}
                        <div className='space-y-3 border-r border-gray-200 pr-4'>
                          <h4 className='text-sm font-bold text-gray-900 border-b pb-1'>
                            Status & Signals
                          </h4>
                          <div className='space-y-2'>
                            <div className='flex items-center space-x-2'>
                              <label className='text-xs text-gray-600'>Injury:</label>
                              <select
                                value={player.controls.injuryTag}
                                onChange={e =>
                                  onPlayerUpdate(player.id, {
                                    injuryTag: e.target.value as any,
                                  })
                                }
                                className='w-16 px-2 py-1 text-xs border border-gray-300 rounded'
                                aria-label='Injury status'
                                title="Select player's injury status"
                              >
                                <option value='ACTIVE'>ACTIVE</option>
                                <option value='Q'>Q</option>
                                <option value='D'>D</option>
                                <option value='O'>O</option>
                                <option value='NIR'>NIR</option>
                              </select>
                            </div>
                            <div className='flex items-center space-x-2'>
                              <label className='text-xs text-gray-600'>
                                News Badge:
                              </label>
                              <input
                                type='text'
                                placeholder='News signal...'
                                value={player.controls.newsSignalBadge || ''}
                                onChange={e =>
                                  onPlayerUpdate(player.id, {
                                    newsSignalBadge: e.target.value || undefined,
                                  })
                                }
                                className='w-24 px-2 py-1 text-xs border border-gray-300 rounded'
                              />
                            </div>
                            <div className='flex items-center space-x-2'>
                              <label className='text-xs text-gray-600'>Boom %:</label>
                              <input
                                type='number'
                                step='0.1'
                                min='0'
                                max='100'
                                value={player.controls.boomPercentage || ''}
                                onChange={e =>
                                  onPlayerUpdate(player.id, {
                                    boomPercentage: e.target.value
                                      ? parseFloat(e.target.value)
                                      : undefined,
                                  })
                                }
                                className='w-16 px-2 py-1 text-xs border border-gray-300 rounded'
                              />
                            </div>
                            <div className='flex items-center space-x-2'>
                              <label className='text-xs text-gray-600'>Bust %:</label>
                              <input
                                type='number'
                                step='0.1'
                                min='0'
                                max='100'
                                value={player.controls.bustPercentage || ''}
                                onChange={e =>
                                  onPlayerUpdate(player.id, {
                                    bustPercentage: e.target.value
                                      ? parseFloat(e.target.value)
                                      : undefined,
                                  })
                                }
                                className='w-16 px-2 py-1 text-xs border border-gray-300 rounded'
                              />
                            </div>
                          </div>
                        </div>

                        {/* Analytics (19-22) */}
                        <div className='space-y-3 border-r border-gray-200 pr-4'>
                          <h4 className='text-sm font-bold text-gray-900 border-b pb-1'>
                            Analytics
                          </h4>
                          <div className='space-y-2'>
                            <div className='flex items-center space-x-2'>
                              <label className='text-xs text-gray-600'>Leverage:</label>
                              <input
                                type='number'
                                step='0.01'
                                value={
                                  player.controls.leverageScore ||
                                  player.mcpSignals?.leverage ||
                                  ''
                                }
                                onChange={e =>
                                  onPlayerUpdate(player.id, {
                                    leverageScore: e.target.value
                                      ? parseFloat(e.target.value)
                                      : undefined,
                                  })
                                }
                                className='w-16 px-2 py-1 text-xs border border-gray-300 rounded'
                                placeholder='Auto'
                                readOnly={!player.controls.leverageScore}
                              />
                            </div>
                            <div className='flex items-center space-x-2'>
                              <label className='text-xs text-gray-600'>Matchup:</label>
                              <input
                                type='number'
                                step='0.1'
                                min='0'
                                max='10'
                                value={player.controls.matchupScore || ''}
                                onChange={e =>
                                  onPlayerUpdate(player.id, {
                                    matchupScore: e.target.value
                                      ? parseFloat(e.target.value)
                                      : undefined,
                                  })
                                }
                                className='w-16 px-2 py-1 text-xs border border-gray-300 rounded'
                              />
                            </div>
                            <div className='flex items-center space-x-2'>
                              <label className='text-xs text-gray-600'>Depth:</label>
                              <select
                                value={player.controls.depthChartRole}
                                onChange={e =>
                                  onPlayerUpdate(player.id, {
                                    depthChartRole: e.target.value as any,
                                  })
                                }
                                className='w-20 px-2 py-1 text-xs border border-gray-300 rounded'
                                aria-label='Depth chart role'
                                title="Select player's depth chart role"
                              >
                                <option value='starter'>Starter</option>
                                <option value='backup'>Backup</option>
                                <option value='rotation'>Rotation</option>
                                <option value='injury_fill'>Injury Fill</option>
                              </select>
                            </div>
                            <div className='flex items-center space-x-2'>
                              <label className='text-xs text-gray-600'>Hype:</label>
                              <input
                                type='number'
                                step='0.1'
                                min='0'
                                max='10'
                                value={player.controls.hypeScore || ''}
                                onChange={e =>
                                  onPlayerUpdate(player.id, {
                                    hypeScore: e.target.value
                                      ? parseFloat(e.target.value)
                                      : undefined,
                                  })
                                }
                                className='w-16 px-2 py-1 text-xs border border-gray-300 rounded'
                              />
                            </div>
                          </div>
                        </div>

                        {/* Advanced Features (23-26) */}
                        <div className='space-y-3'>
                          <h4 className='text-sm font-bold text-gray-900 border-b pb-1'>
                            Advanced Features
                          </h4>
                          <div className='space-y-2'>
                            <div className='flex items-center space-x-2'>
                              <input
                                type='checkbox'
                                id={`lateSwap-${player.id}`}
                                checked={player.controls.lateSwapEligible}
                                onChange={e =>
                                  onPlayerUpdate(player.id, {
                                    lateSwapEligible: e.target.checked,
                                  })
                                }
                                className='h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded'
                              />
                              <label
                                htmlFor={`lateSwap-${player.id}`}
                                className='text-xs text-gray-700'
                              >
                                Late Swap
                              </label>
                            </div>
                            <div className='flex items-center space-x-2'>
                              <label className='text-xs text-gray-600'>Priority:</label>
                              <select
                                value={player.controls.priorityTag}
                                onChange={e =>
                                  onPlayerUpdate(player.id, {
                                    priorityTag: e.target.value as any,
                                  })
                                }
                                className='w-20 px-2 py-1 text-xs border border-gray-300 rounded'
                                aria-label='Priority tag'
                                title="Select player's priority tag"
                              >
                                <option value='none'>None</option>
                                <option value='core'>Core</option>
                                <option value='contrarian'>Contrarian</option>
                                <option value='gpp_only'>GPP Only</option>
                                <option value='cash_only'>Cash Only</option>
                              </select>
                            </div>
                            <div className='flex items-center space-x-2'>
                              <label className='text-xs text-gray-600'>
                                Dupe Risk:
                              </label>
                              <input
                                type='number'
                                step='0.01'
                                min='0'
                                max='1'
                                value={player.controls.duplicationRisk || ''}
                                onChange={e =>
                                  onPlayerUpdate(player.id, {
                                    duplicationRisk: e.target.value
                                      ? parseFloat(e.target.value)
                                      : undefined,
                                  })
                                }
                                className='w-16 px-2 py-1 text-xs border border-gray-300 rounded'
                              />
                            </div>
                            <div>
                              <label className='text-xs text-gray-600'>
                                Advanced Notes:
                              </label>
                              <textarea
                                value={player.controls.advancedNotes}
                                onChange={e =>
                                  onPlayerUpdate(player.id, {
                                    advancedNotes: e.target.value,
                                  })
                                }
                                placeholder='Advanced notes and strategies...'
                                className='w-full px-2 py-1 text-xs border border-gray-300 rounded resize-none mt-1'
                                rows={2}
                              />
                            </div>
                          </div>
                        </div>

                        {/* MCP Live Signals */}
                        <div className='space-y-3 col-span-full border-t pt-4'>
                          <h4 className='text-sm font-bold text-gray-900'>
                            🔴 LIVE MCP SIGNALS
                          </h4>
                          <div className='grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-xs'>
                            <div className='bg-green-50 p-2 rounded'>
                              <div className='font-medium text-green-800'>
                                Boom Rate
                              </div>
                              <div className='text-lg font-bold text-green-600'>
                                {player.mcpSignals?.boom?.toFixed(1) ||
                                  player.controls.boomPercentage?.toFixed(1) ||
                                  'N/A'}
                                %
                              </div>
                            </div>
                            <div className='bg-red-50 p-2 rounded'>
                              <div className='font-medium text-red-800'>Bust Rate</div>
                              <div className='text-lg font-bold text-red-600'>
                                {player.mcpSignals?.bust?.toFixed(1) ||
                                  player.controls.bustPercentage?.toFixed(1) ||
                                  'N/A'}
                                %
                              </div>
                            </div>
                            <div className='bg-blue-50 p-2 rounded'>
                              <div className='font-medium text-blue-800'>Leverage</div>
                              <div className='text-lg font-bold text-blue-600'>
                                {player.mcpSignals?.leverage?.toFixed(2) ||
                                  player.controls.leverageScore?.toFixed(2) ||
                                  'N/A'}
                              </div>
                            </div>
                            <div className='bg-purple-50 p-2 rounded'>
                              <div className='font-medium text-purple-800'>Matchup</div>
                              <div className='text-lg font-bold text-purple-600'>
                                {player.mcpSignals?.matchup?.toFixed(1) ||
                                  player.controls.matchupScore?.toFixed(1) ||
                                  'N/A'}
                              </div>
                            </div>
                            <div className='bg-orange-50 p-2 rounded'>
                              <div className='font-medium text-orange-800'>
                                Hype Score
                              </div>
                              <div className='text-lg font-bold text-orange-600'>
                                {player.mcpSignals?.hype?.toFixed(1) ||
                                  player.controls.hypeScore?.toFixed(1) ||
                                  'N/A'}
                              </div>
                            </div>
                            <div className='bg-gray-50 p-2 rounded'>
                              <div className='font-medium text-gray-800'>Weather</div>
                              <div className='text-lg font-bold text-gray-600'>
                                {player.mcpSignals?.weather?.toFixed(1) || 'N/A'}
                              </div>
                            </div>
                          </div>
                          {player.mcpSignals?.news && (
                            <div className='bg-yellow-50 p-2 rounded border-l-4 border-yellow-400'>
                              <div className='font-medium text-yellow-800'>
                                Breaking News
                              </div>
                              <div className='text-yellow-700 text-xs'>
                                {player.mcpSignals.news}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
