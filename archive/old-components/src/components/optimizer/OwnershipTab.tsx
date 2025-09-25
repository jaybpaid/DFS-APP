import React, { useState } from 'react';

interface PlayerExposure {
  playerId: string;
  playerName: string;
  position: string;
  team: string;
  minExposure: number;
  maxExposure: number;
  locked: boolean;
}

interface OwnershipTabProps {}

export default function OwnershipTab({}: OwnershipTabProps) {
  const [ownershipSettings, setOwnershipSettings] = useState({
    globalFade: 0,
    globalBoost: 0,
    fadeThreshold: 20,
    boostThreshold: 5,
    applyToHighOwned: true,
    applyToLowOwned: true,
    maxExposureDefault: 25,
    minExposureDefault: 0,
  });

  const [playerExposures, setPlayerExposures] = useState<PlayerExposure[]>([
    {
      playerId: '1',
      playerName: 'Josh Allen',
      position: 'QB',
      team: 'BUF',
      minExposure: 15,
      maxExposure: 30,
      locked: false,
    },
    {
      playerId: '2',
      playerName: 'Christian McCaffrey',
      position: 'RB',
      team: 'SF',
      minExposure: 0,
      maxExposure: 20,
      locked: false,
    },
  ]);

  const handleGlobalChange = (key: string, value: number | boolean) => {
    setOwnershipSettings(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const updatePlayerExposure = (
    playerId: string,
    field: keyof PlayerExposure,
    value: number | boolean | string
  ) => {
    setPlayerExposures(prev =>
      prev.map(player =>
        player.playerId === playerId ? { ...player, [field]: value } : player
      )
    );
  };

  const addPlayerExposure = () => {
    const newPlayer: PlayerExposure = {
      playerId: Date.now().toString(),
      playerName: 'New Player',
      position: 'QB',
      team: 'TBD',
      minExposure: ownershipSettings.minExposureDefault,
      maxExposure: ownershipSettings.maxExposureDefault,
      locked: false,
    };
    setPlayerExposures([...playerExposures, newPlayer]);
  };

  const removePlayerExposure = (playerId: string) => {
    setPlayerExposures(prev => prev.filter(p => p.playerId !== playerId));
  };

  return (
    <div className='bg-white rounded-lg shadow'>
      <div className='px-6 py-4 border-b border-gray-200'>
        <h2 className='text-lg font-medium text-gray-900'>Ownership & Exposure</h2>
        <p className='mt-1 text-sm text-gray-500'>
          Configure global ownership adjustments and player-specific exposure limits
        </p>
      </div>

      <div className='p-6 space-y-8'>
        {/* Global Ownership Settings */}
        <div>
          <h3 className='text-md font-medium text-gray-900 mb-4'>
            Global Ownership Adjustments
          </h3>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Global Fade (%)
              </label>
              <div className='flex items-center space-x-4'>
                <input
                  type='range'
                  min='-50'
                  max='0'
                  value={ownershipSettings.globalFade}
                  onChange={e =>
                    handleGlobalChange('globalFade', parseInt(e.target.value))
                  }
                  className='flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer'
                />
                <span className='text-sm font-medium text-gray-900 w-12'>
                  {ownershipSettings.globalFade}%
                </span>
              </div>
              <p className='mt-1 text-xs text-gray-500'>
                Reduce exposure to high-owned players (negative values fade)
              </p>
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Global Boost (%)
              </label>
              <div className='flex items-center space-x-4'>
                <input
                  type='range'
                  min='0'
                  max='50'
                  value={ownershipSettings.globalBoost}
                  onChange={e =>
                    handleGlobalChange('globalBoost', parseInt(e.target.value))
                  }
                  className='flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer'
                />
                <span className='text-sm font-medium text-gray-900 w-12'>
                  {ownershipSettings.globalBoost}%
                </span>
              </div>
              <p className='mt-1 text-xs text-gray-500'>
                Increase exposure to low-owned players (positive values boost)
              </p>
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                High Ownership Threshold (%)
              </label>
              <input
                type='number'
                value={ownershipSettings.fadeThreshold}
                onChange={e =>
                  handleGlobalChange('fadeThreshold', parseInt(e.target.value))
                }
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                min='5'
                max='50'
              />
              <p className='mt-1 text-xs text-gray-500'>
                Players above this ownership % are considered "high-owned"
              </p>
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Low Ownership Threshold (%)
              </label>
              <input
                type='number'
                value={ownershipSettings.boostThreshold}
                onChange={e =>
                  handleGlobalChange('boostThreshold', parseInt(e.target.value))
                }
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                min='1'
                max='20'
              />
              <p className='mt-1 text-xs text-gray-500'>
                Players below this ownership % are considered "low-owned"
              </p>
            </div>
          </div>

          <div className='mt-4 flex items-center space-x-6'>
            <div className='flex items-center space-x-2'>
              <input
                type='checkbox'
                checked={ownershipSettings.applyToHighOwned}
                onChange={e => handleGlobalChange('applyToHighOwned', e.target.checked)}
                className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
              />
              <label className='text-sm text-gray-700'>
                Apply fade to high-owned players
              </label>
            </div>

            <div className='flex items-center space-x-2'>
              <input
                type='checkbox'
                checked={ownershipSettings.applyToLowOwned}
                onChange={e => handleGlobalChange('applyToLowOwned', e.target.checked)}
                className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
              />
              <label className='text-sm text-gray-700'>
                Apply boost to low-owned players
              </label>
            </div>
          </div>
        </div>

        {/* Default Exposure Settings */}
        <div>
          <h3 className='text-md font-medium text-gray-900 mb-4'>
            Default Exposure Limits
          </h3>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Default Max Exposure (%)
              </label>
              <input
                type='number'
                value={ownershipSettings.maxExposureDefault}
                onChange={e =>
                  handleGlobalChange('maxExposureDefault', parseInt(e.target.value))
                }
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                min='1'
                max='100'
              />
              <p className='mt-1 text-xs text-gray-500'>
                Maximum exposure for players without specific limits
              </p>
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Default Min Exposure (%)
              </label>
              <input
                type='number'
                value={ownershipSettings.minExposureDefault}
                onChange={e =>
                  handleGlobalChange('minExposureDefault', parseInt(e.target.value))
                }
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                min='0'
                max='50'
              />
              <p className='mt-1 text-xs text-gray-500'>
                Minimum exposure for players without specific limits
              </p>
            </div>
          </div>
        </div>

        {/* Player-Specific Exposures */}
        <div>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='text-md font-medium text-gray-900'>
              Player-Specific Exposures
            </h3>
            <button
              onClick={addPlayerExposure}
              className='px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors'
            >
              Add Player
            </button>
          </div>

          <div className='overflow-x-auto'>
            <table className='min-w-full divide-y divide-gray-200'>
              <thead className='bg-gray-50'>
                <tr>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Player
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Position
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Team
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Min %
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Max %
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Locked
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className='bg-white divide-y divide-gray-200'>
                {playerExposures.map(player => (
                  <tr key={player.playerId}>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <input
                        type='text'
                        value={player.playerName}
                        onChange={e =>
                          updatePlayerExposure(
                            player.playerId,
                            'playerName',
                            e.target.value
                          )
                        }
                        className='text-sm font-medium text-gray-900 border-none bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1'
                      />
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                      <select
                        value={player.position}
                        onChange={e =>
                          updatePlayerExposure(
                            player.playerId,
                            'position',
                            e.target.value
                          )
                        }
                        className='text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500'
                      >
                        <option value='QB'>QB</option>
                        <option value='RB'>RB</option>
                        <option value='WR'>WR</option>
                        <option value='TE'>TE</option>
                        <option value='DST'>DST</option>
                      </select>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <input
                        type='text'
                        value={player.team}
                        onChange={e =>
                          updatePlayerExposure(player.playerId, 'team', e.target.value)
                        }
                        className='text-sm text-gray-500 border-none bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1 w-16'
                      />
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <input
                        type='number'
                        value={player.minExposure}
                        onChange={e =>
                          updatePlayerExposure(
                            player.playerId,
                            'minExposure',
                            parseInt(e.target.value)
                          )
                        }
                        className='w-16 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                        min='0'
                        max='100'
                      />
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <input
                        type='number'
                        value={player.maxExposure}
                        onChange={e =>
                          updatePlayerExposure(
                            player.playerId,
                            'maxExposure',
                            parseInt(e.target.value)
                          )
                        }
                        className='w-16 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                        min={player.minExposure}
                        max='100'
                      />
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <input
                        type='checkbox'
                        checked={player.locked}
                        onChange={e =>
                          updatePlayerExposure(
                            player.playerId,
                            'locked',
                            e.target.checked
                          )
                        }
                        className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
                      />
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <button
                        onClick={() => removePlayerExposure(player.playerId)}
                        className='text-red-600 hover:text-red-800 text-sm'
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {playerExposures.length === 0 && (
              <div className='text-center py-8 text-gray-500'>
                No player-specific exposures configured. Click "Add Player" to set
                custom limits.
              </div>
            )}
          </div>
        </div>

        {/* Ownership Summary */}
        <div className='bg-orange-50 rounded-lg p-4'>
          <h4 className='text-sm font-medium text-orange-900 mb-2'>
            Ownership Strategy Summary
          </h4>
          <div className='text-sm text-orange-800 space-y-1'>
            <p>
              • Global fade: {ownershipSettings.globalFade}% (players ≥
              {ownershipSettings.fadeThreshold}% owned)
            </p>
            <p>
              • Global boost: {ownershipSettings.globalBoost}% (players ≤
              {ownershipSettings.boostThreshold}% owned)
            </p>
            <p>
              • Default exposure range: {ownershipSettings.minExposureDefault}% -{' '}
              {ownershipSettings.maxExposureDefault}%
            </p>
            <p>• Custom exposures: {playerExposures.length} players configured</p>
            <p>
              • Locked players: {playerExposures.filter(p => p.locked).length} (will
              appear in 100% of lineups)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
