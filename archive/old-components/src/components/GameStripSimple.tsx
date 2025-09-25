/**
 * Simple Game Strip Component - Fallback version without external dependencies
 */

import React from 'react';

interface Game {
  gameId: string;
  away: string;
  home: string;
  kickoff: string;
  spread: number;
  total: number;
}

interface GameStripProps {
  games: Game[];
  weather?: any[];
  onToggleGame: (gameId: string) => void;
  activeGameIds: Set<string>;
  loading?: boolean;
  onRefresh?: () => void;
  asOf?: string;
  provenance?: string[];
}

const GameStripSimple: React.FC<GameStripProps> = ({
  games,
  onToggleGame,
  activeGameIds,
  loading = false,
  onRefresh,
  asOf,
}) => {
  if (loading) {
    return (
      <div className='w-full bg-white border-b shadow-sm'>
        <div className='flex items-center justify-center py-4'>
          <span className='text-sm text-gray-600'>Loading games...</span>
        </div>
      </div>
    );
  }

  return (
    <div className='w-full bg-white border-b shadow-sm'>
      <div className='flex items-center justify-between px-4 py-2 border-b border-gray-100'>
        <h3 className='font-semibold text-gray-900'>Games</h3>
        {asOf && (
          <span className='text-xs text-gray-500'>
            Updated {new Date(asOf).toLocaleTimeString()}
          </span>
        )}
      </div>

      <div className='flex gap-3 p-4 overflow-x-auto'>
        {games.map(game => {
          const isActive = activeGameIds.has(game.gameId);

          return (
            <div
              key={game.gameId}
              className={`flex-shrink-0 w-48 p-3 border rounded-lg cursor-pointer transition-all ${
                isActive
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:shadow-md hover:bg-gray-50'
              }`}
              onClick={() => onToggleGame(game.gameId)}
            >
              <div className='flex items-center justify-between mb-2'>
                <span className='font-semibold text-sm'>{game.away}</span>
                <span className='text-xs text-gray-500'>@</span>
                <span className='font-semibold text-sm'>{game.home}</span>
              </div>

              <div className='text-xs text-center text-gray-600 mb-2'>
                {new Date(game.kickoff).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>

              <div className='flex justify-between text-xs'>
                <div className='text-center'>
                  <div className='text-gray-500'>Spread</div>
                  <div className='font-medium'>
                    {game.spread > 0 ? `+${game.spread}` : game.spread}
                  </div>
                </div>
                <div className='text-center'>
                  <div className='text-gray-500'>Total</div>
                  <div className='font-medium'>{game.total}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {games.length === 0 && (
        <div className='flex items-center justify-center py-8 text-gray-500'>
          <div className='text-center'>
            <div className='text-sm'>No games available</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameStripSimple;
