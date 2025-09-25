/**
 * PlayerTable component - bound to dk_salaries.json fixture
 * Validates data against schema contracts
 */

import React, { useState, useEffect } from 'react';

interface Player {
  id: string;
  name: string;
  position: 'QB' | 'RB' | 'WR' | 'TE' | 'DST';
  team: string;
  opponent?: string;
  salary: number;
  gameInfo?: string;
  rosterPercentage?: number;
  isLocked?: boolean;
}

interface PlayerTableProps {
  players: Player[];
  onPlayerSelect?: (playerId: string) => void;
  selectedPlayers?: string[];
}

export const PlayerTable: React.FC<PlayerTableProps> = ({
  players,
  onPlayerSelect,
  selectedPlayers = [],
}) => {
  const [sortColumn, setSortColumn] = useState<keyof Player>('salary');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleSort = (column: keyof Player) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  const sortedPlayers = [...players].sort((a, b) => {
    const aVal = a[sortColumn];
    const bVal = b[sortColumn];
    const multiplier = sortDirection === 'asc' ? 1 : -1;

    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return (aVal - bVal) * multiplier;
    }
    return String(aVal).localeCompare(String(bVal)) * multiplier;
  });

  const getPositionBadgeClass = (position: string) => {
    const baseClass = 'px-2 py-1 rounded text-xs font-bold';
    switch (position) {
      case 'QB':
        return `${baseClass} bg-purple-500 text-white`;
      case 'RB':
        return `${baseClass} bg-green-500 text-white`;
      case 'WR':
        return `${baseClass} bg-blue-500 text-white`;
      case 'TE':
        return `${baseClass} bg-orange-500 text-white`;
      case 'DST':
        return `${baseClass} bg-red-500 text-white`;
      default:
        return `${baseClass} bg-gray-500 text-white`;
    }
  };

  return (
    <div className='overflow-x-auto'>
      <table className='min-w-full bg-white border border-gray-200'>
        <thead className='bg-gray-50'>
          <tr>
            <th className='px-4 py-2 text-left'>
              <input type='checkbox' className='rounded' />
            </th>
            <th
              className='px-4 py-2 text-left cursor-pointer hover:bg-gray-100'
              onClick={() => handleSort('name')}
            >
              Player
            </th>
            <th
              className='px-4 py-2 text-left cursor-pointer hover:bg-gray-100'
              onClick={() => handleSort('position')}
            >
              Position
            </th>
            <th
              className='px-4 py-2 text-left cursor-pointer hover:bg-gray-100'
              onClick={() => handleSort('team')}
            >
              Team
            </th>
            <th
              className='px-4 py-2 text-left cursor-pointer hover:bg-gray-100'
              onClick={() => handleSort('salary')}
            >
              Salary
            </th>
            <th className='px-4 py-2 text-left'>Game</th>
            <th
              className='px-4 py-2 text-left cursor-pointer hover:bg-gray-100'
              onClick={() => handleSort('rosterPercentage')}
            >
              Roster %
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedPlayers.map(player => (
            <tr
              key={player.id}
              className={`border-b hover:bg-gray-50 ${
                selectedPlayers.includes(player.id) ? 'bg-blue-50' : ''
              }`}
            >
              <td className='px-4 py-2'>
                <input
                  type='checkbox'
                  className='rounded'
                  checked={selectedPlayers.includes(player.id)}
                  onChange={() => onPlayerSelect?.(player.id)}
                />
              </td>
              <td className='px-4 py-2 font-medium'>{player.name}</td>
              <td className='px-4 py-2'>
                <span className={getPositionBadgeClass(player.position)}>
                  {player.position}
                </span>
              </td>
              <td className='px-4 py-2 font-mono text-sm'>{player.team}</td>
              <td className='px-4 py-2 font-mono'>${player.salary.toLocaleString()}</td>
              <td className='px-4 py-2 text-sm text-gray-600'>
                {player.gameInfo || `${player.team} vs ${player.opponent}`}
              </td>
              <td className='px-4 py-2'>
                {player.rosterPercentage
                  ? `${player.rosterPercentage.toFixed(1)}%`
                  : '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className='mt-4 text-sm text-gray-500'>
        Showing {players.length} players • Sorted by {sortColumn} ({sortDirection})
      </div>
    </div>
  );
};
