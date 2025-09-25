import React, { useState } from 'react';
import { Player, OptimizationSettings } from '../data/types';

interface PlayerPoolProps {
  players: Player[];
  onPlayersUpdate: (players: Player[]) => void;
  settings: OptimizationSettings;
}

const PlayerPool: React.FC<PlayerPoolProps> = ({
  players,
  onPlayersUpdate,
  settings,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPosition, setFilterPosition] = useState('');

  const filteredPlayers = players.filter(player => {
    const matchesSearch = player.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPosition =
      filterPosition === '' || player.positions.includes(filterPosition);
    return matchesSearch && matchesPosition;
  });

  const handlePlayerToggle = (playerId: string, selected: boolean) => {
    const updatedPlayers = players.map(player =>
      player.playerId === playerId
        ? { ...player, status: selected ? 'active' : undefined }
        : player
    );
    onPlayersUpdate(updatedPlayers);
  };

  const positions = Array.from(new Set(players.flatMap(p => p.positions)));

  return (
    <div>
      <div className='mb-4'>
        <input
          type='text'
          placeholder='Search players...'
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className='w-full p-2 border rounded'
        />
      </div>

      <div className='mb-4'>
        <select
          value={filterPosition}
          onChange={e => setFilterPosition(e.target.value)}
          className='w-full p-2 border rounded'
        >
          <option value=''>All Positions</option>
          {positions.map(pos => (
            <option key={pos} value={pos}>
              {pos}
            </option>
          ))}
        </select>
      </div>

      <div className='overflow-y-auto' style={{ maxHeight: '400px' }}>
        <table className='w-full border-collapse'>
          <thead>
            <tr className='bg-gray-100'>
              <th className='p-2 border text-left'>Include</th>
              <th className='p-2 border text-left'>Name</th>
              <th className='p-2 border text-left'>Position</th>
              <th className='p-2 border text-left'>Team</th>
              <th className='p-2 border text-left'>Salary</th>
              <th className='p-2 border text-left'>Projection</th>
            </tr>
          </thead>
          <tbody>
            {filteredPlayers.map(player => (
              <tr key={player.playerId} className='hover:bg-gray-50'>
                <td className='p-2 border'>
                  <input
                    type='checkbox'
                    checked={player.status === 'active'}
                    onChange={e =>
                      handlePlayerToggle(player.playerId, e.target.checked)
                    }
                  />
                </td>
                <td className='p-2 border'>{player.name}</td>
                <td className='p-2 border'>{player.positions.join('/')}</td>
                <td className='p-2 border'>{player.team}</td>
                <td className='p-2 border'>${player.salary.toLocaleString()}</td>
                <td className='p-2 border'>{player.projection?.toFixed(1) || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className='mt-4 text-sm text-gray-600'>
        {players.filter(p => p.status === 'active').length} players selected
      </div>
    </div>
  );
};

export default PlayerPool;
