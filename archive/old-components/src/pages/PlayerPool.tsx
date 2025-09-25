/**
 * PlayerPool page - renders table driven by dk_salaries.json fixture
 * Validates data binding against schema contracts
 */

import React, { useState, useEffect } from 'react';
import { PlayerTable } from '../components/PlayerTable';

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

interface DKSalariesData {
  slateId: string;
  players: Player[];
  metadata: {
    timestamp: string;
    salaryCap: number;
    rosterPositions?: string[];
    contestType?: string;
    lateSwapEnabled?: boolean;
  };
}

export const PlayerPoolPage: React.FC = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [slateData, setSlateData] = useState<DKSalariesData | null>(null);

  useEffect(() => {
    // Load live data from migrated Flask system
    const loadLiveData = async () => {
      try {
        const response = await fetch('/data/monorepo_player_pool.json');
        const data: DKSalariesData = await response.json();

        setSlateData(data);
        setPlayers(data.players);
        setLoading(false);
      } catch (error) {
        console.error('Failed to load player data:', error);
        setLoading(false);
      }
    };

    loadLiveData();
  }, []);

  const handlePlayerSelect = (playerId: string) => {
    setSelectedPlayers(prev =>
      prev.includes(playerId) ? prev.filter(id => id !== playerId) : [...prev, playerId]
    );
  };

  const getPositionCounts = () => {
    const counts = { QB: 0, RB: 0, WR: 0, TE: 0, DST: 0 };
    players.forEach(player => {
      counts[player.position]++;
    });
    return counts;
  };

  const getTotalSalary = () => {
    return selectedPlayers.reduce((total, playerId) => {
      const player = players.find(p => p.id === playerId);
      return total + (player?.salary || 0);
    }, 0);
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-lg'>Loading player pool...</div>
      </div>
    );
  }

  const positionCounts = getPositionCounts();
  const totalSalary = getTotalSalary();
  const salaryCap = slateData?.metadata.salaryCap || 50000;

  return (
    <div className='container mx-auto px-4 py-8'>
      <div className='mb-6'>
        <h1 className='text-3xl font-bold text-gray-900 mb-2'>Player Pool</h1>
        <div className='flex items-center gap-4 text-sm text-gray-600'>
          <span>Slate ID: {slateData?.slateId}</span>
          <span>•</span>
          <span>{players.length} players</span>
          <span>•</span>
          <span>Salary Cap: ${salaryCap.toLocaleString()}</span>
        </div>
      </div>

      {/* Position Summary */}
      <div className='grid grid-cols-5 gap-4 mb-6'>
        <div className='bg-purple-100 p-4 rounded-lg text-center'>
          <div className='text-2xl font-bold text-purple-600'>{positionCounts.QB}</div>
          <div className='text-sm text-purple-800'>Quarterbacks</div>
        </div>
        <div className='bg-green-100 p-4 rounded-lg text-center'>
          <div className='text-2xl font-bold text-green-600'>{positionCounts.RB}</div>
          <div className='text-sm text-green-800'>Running Backs</div>
        </div>
        <div className='bg-blue-100 p-4 rounded-lg text-center'>
          <div className='text-2xl font-bold text-blue-600'>{positionCounts.WR}</div>
          <div className='text-sm text-blue-800'>Wide Receivers</div>
        </div>
        <div className='bg-orange-100 p-4 rounded-lg text-center'>
          <div className='text-2xl font-bold text-orange-600'>{positionCounts.TE}</div>
          <div className='text-sm text-orange-800'>Tight Ends</div>
        </div>
        <div className='bg-red-100 p-4 rounded-lg text-center'>
          <div className='text-2xl font-bold text-red-600'>{positionCounts.DST}</div>
          <div className='text-sm text-red-800'>Defenses</div>
        </div>
      </div>

      {/* Selection Summary */}
      {selectedPlayers.length > 0 && (
        <div className='bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6'>
          <div className='flex justify-between items-center'>
            <div>
              <span className='font-semibold'>
                {selectedPlayers.length} players selected
              </span>
              <span className='text-gray-600 ml-2'>
                Total Salary: ${totalSalary.toLocaleString()}
              </span>
            </div>
            <div
              className={`font-mono ${totalSalary > salaryCap ? 'text-red-600' : 'text-green-600'}`}
            >
              ${(salaryCap - totalSalary).toLocaleString()} remaining
            </div>
          </div>
        </div>
      )}

      {/* Player Table */}
      <PlayerTable
        players={players}
        selectedPlayers={selectedPlayers}
        onPlayerSelect={handlePlayerSelect}
      />
    </div>
  );
};
