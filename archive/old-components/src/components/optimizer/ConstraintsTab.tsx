import React, { useState } from 'react';

interface ConstraintsTabProps {}

export default function ConstraintsTab({}: ConstraintsTabProps) {
  const [constraints, setConstraints] = useState({
    salaryCap: 50000,
    minSalary: 49000,
    maxFromTeam: 4,
    minGames: 2,
    uniquePlayers: 3,
    rosterRules: {
      QB: { min: 1, max: 1 },
      RB: { min: 2, max: 3 },
      WR: { min: 3, max: 4 },
      TE: { min: 1, max: 2 },
      FLEX: { min: 1, max: 2 },
      DST: { min: 1, max: 1 },
    },
  });

  const handleConstraintChange = (key: string, value: number) => {
    setConstraints(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleRosterRuleChange = (
    position: string,
    type: 'min' | 'max',
    value: number
  ) => {
    setConstraints(prev => ({
      ...prev,
      rosterRules: {
        ...prev.rosterRules,
        [position]: {
          ...prev.rosterRules[position as keyof typeof prev.rosterRules],
          [type]: value,
        },
      },
    }));
  };

  return (
    <div className='bg-white rounded-lg shadow'>
      <div className='px-6 py-4 border-b border-gray-200'>
        <h2 className='text-lg font-medium text-gray-900'>Constraints</h2>
        <p className='mt-1 text-sm text-gray-500'>
          Set global constraints and roster rules for lineup optimization
        </p>
      </div>

      <div className='p-6 space-y-8'>
        {/* Global Constraints */}
        <div>
          <h3 className='text-md font-medium text-gray-900 mb-4'>Global Constraints</h3>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Salary Cap
              </label>
              <input
                type='number'
                value={constraints.salaryCap}
                onChange={e =>
                  handleConstraintChange('salaryCap', parseInt(e.target.value))
                }
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                min='30000'
                max='60000'
                step='100'
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Minimum Salary
              </label>
              <input
                type='number'
                value={constraints.minSalary}
                onChange={e =>
                  handleConstraintChange('minSalary', parseInt(e.target.value))
                }
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                min='30000'
                max={constraints.salaryCap}
                step='100'
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Max Players from Team
              </label>
              <input
                type='number'
                value={constraints.maxFromTeam}
                onChange={e =>
                  handleConstraintChange('maxFromTeam', parseInt(e.target.value))
                }
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                min='1'
                max='9'
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Minimum Games
              </label>
              <input
                type='number'
                value={constraints.minGames}
                onChange={e =>
                  handleConstraintChange('minGames', parseInt(e.target.value))
                }
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                min='1'
                max='16'
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Unique Players (between lineups)
              </label>
              <input
                type='number'
                value={constraints.uniquePlayers}
                onChange={e =>
                  handleConstraintChange('uniquePlayers', parseInt(e.target.value))
                }
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                min='0'
                max='9'
              />
            </div>
          </div>
        </div>

        {/* Roster Rules */}
        <div>
          <h3 className='text-md font-medium text-gray-900 mb-4'>
            Roster Rules (DraftKings Classic)
          </h3>
          <div className='overflow-x-auto'>
            <table className='min-w-full divide-y divide-gray-200'>
              <thead className='bg-gray-50'>
                <tr>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Position
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Minimum
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Maximum
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Description
                  </th>
                </tr>
              </thead>
              <tbody className='bg-white divide-y divide-gray-200'>
                {Object.entries(constraints.rosterRules).map(([position, rules]) => (
                  <tr key={position}>
                    <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900'>
                      {position}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <input
                        type='number'
                        value={rules.min}
                        onChange={e =>
                          handleRosterRuleChange(
                            position,
                            'min',
                            parseInt(e.target.value)
                          )
                        }
                        className='w-16 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                        min='0'
                        max='9'
                      />
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <input
                        type='number'
                        value={rules.max}
                        onChange={e =>
                          handleRosterRuleChange(
                            position,
                            'max',
                            parseInt(e.target.value)
                          )
                        }
                        className='w-16 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                        min={rules.min}
                        max='9'
                      />
                    </td>
                    <td className='px-6 py-4 text-sm text-gray-500'>
                      {position === 'QB' && 'Quarterback'}
                      {position === 'RB' && 'Running Back'}
                      {position === 'WR' && 'Wide Receiver'}
                      {position === 'TE' && 'Tight End'}
                      {position === 'FLEX' && 'RB/WR/TE Flex'}
                      {position === 'DST' && 'Defense/Special Teams'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary */}
        <div className='bg-blue-50 rounded-lg p-4'>
          <h4 className='text-sm font-medium text-blue-900 mb-2'>Constraint Summary</h4>
          <div className='text-sm text-blue-800 space-y-1'>
            <p>
              • Salary range: ${constraints.minSalary.toLocaleString()} - $
              {constraints.salaryCap.toLocaleString()}
            </p>
            <p>• Max {constraints.maxFromTeam} players from same team</p>
            <p>• Minimum {constraints.minGames} games represented</p>
            <p>• {constraints.uniquePlayers} unique players between lineups</p>
            <p>
              • Total roster spots:{' '}
              {Object.values(constraints.rosterRules).reduce(
                (sum, rule) => sum + rule.max,
                0
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
