import React, { useState } from 'react';
import { Player, DraftKingsPlayer } from '../types';

interface PlayerPoolTableProps {
  players: (Player | DraftKingsPlayer)[];
  isLoading: boolean;
}

type SortKey =
  | 'name'
  | 'position'
  | 'team'
  | 'salary'
  | 'projectedPoints'
  | 'ownership';

// Helper function to normalize player data
const normalizePlayer = (player: Player | DraftKingsPlayer) => {
  if ('display_name' in player) {
    // DraftKingsPlayer
    return {
      id: player.player_id,
      name: player.display_name,
      position: player.position,
      team: player.team_abbreviation,
      salary: player.salary,
      projectedPoints: 0, // Will be enhanced with MCP data later
      ownership: 0, // Will be enhanced with MCP data later
      status: player.status,
      opponent: player.opponent,
    };
  } else {
    // Player
    return {
      id: player.id,
      name: player.name,
      position: player.position,
      team: player.team,
      salary: player.salary,
      projectedPoints: player.projectedPoints,
      ownership: player.ownership,
      status: 'ACTIVE',
      opponent: 'TBD',
    };
  }
};

export default function PlayerPoolTable({ players, isLoading }: PlayerPoolTableProps) {
  const [sortConfig, setSortConfig] = useState<{
    key: SortKey;
    direction: 'ascending' | 'descending';
  } | null>(null);

  const normalizedPlayers = React.useMemo(() => {
    if (!Array.isArray(players)) {
      return [];
    }
    return players.map(normalizePlayer);
  }, [players]);

  const sortedPlayers = React.useMemo(() => {
    if (!Array.isArray(normalizedPlayers)) {
      return [];
    }

    let sortablePlayers = [...normalizedPlayers];
    if (sortConfig !== null) {
      sortablePlayers.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortablePlayers;
  }, [normalizedPlayers, sortConfig]);

  const requestSort = (key: SortKey) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: SortKey) => {
    if (!sortConfig || sortConfig.key !== key) {
      return null;
    }
    return sortConfig.direction === 'ascending' ? ' ▲' : ' ▼';
  };

  if (isLoading) {
    return <div className='text-center py-8 text-gray-500'>Loading player data...</div>;
  }

  if (!players || players.length === 0) {
    return (
      <div className='text-center py-8 text-gray-500'>
        No players available for this slate.
      </div>
    );
  }

  return (
    <div className='overflow-x-auto'>
      <table className='min-w-full divide-y divide-gray-200'>
        <thead className='bg-gray-50'>
          <tr>
            <th
              scope='col'
              className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer'
              onClick={() => requestSort('name')}
            >
              Player {getSortIcon('name')}
            </th>
            <th
              scope='col'
              className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer'
              onClick={() => requestSort('position')}
            >
              Pos {getSortIcon('position')}
            </th>
            <th
              scope='col'
              className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer'
              onClick={() => requestSort('team')}
            >
              Team {getSortIcon('team')}
            </th>
            <th
              scope='col'
              className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer'
              onClick={() => requestSort('salary')}
            >
              Salary {getSortIcon('salary')}
            </th>
            <th
              scope='col'
              className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer'
              onClick={() => requestSort('projectedPoints')}
            >
              Proj. Pts {getSortIcon('projectedPoints')}
            </th>
            <th
              scope='col'
              className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer'
              onClick={() => requestSort('ownership')}
            >
              Ownership {getSortIcon('ownership')}
            </th>
          </tr>
        </thead>
        <tbody className='bg-white divide-y divide-gray-200'>
          {sortedPlayers.map(player => (
            <tr key={player.id}>
              <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900'>
                {player.name}
              </td>
              <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                {player.position}
              </td>
              <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                {player.team}
              </td>
              <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                ${player.salary.toLocaleString()}
              </td>
              <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                {player.projectedPoints.toFixed(2)}
              </td>
              <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                {(player.ownership * 100).toFixed(1)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
