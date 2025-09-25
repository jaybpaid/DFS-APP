import React, { useState } from 'react';

interface Stack {
  id: string;
  type: 'QB+2' | 'QB+3' | 'RB+DST' | 'custom';
  team: string;
  positions: string[];
  bringBack: number;
  minFromStack: number;
  maxFromStack: number;
  enabled: boolean;
}

interface StacksTabProps {}

export default function StacksTab({}: StacksTabProps) {
  const [stacks, setStacks] = useState<Stack[]>([
    {
      id: '1',
      type: 'QB+2',
      team: '*',
      positions: ['QB', 'WR', 'TE'],
      bringBack: 1,
      minFromStack: 3,
      maxFromStack: 3,
      enabled: true,
    },
  ]);

  const [customGroups, setCustomGroups] = useState([
    {
      id: '1',
      name: 'High-Value RBs',
      players: [],
      minFromGroup: 1,
      maxFromGroup: 2,
      enabled: false,
    },
  ]);

  const addStack = () => {
    const newStack: Stack = {
      id: Date.now().toString(),
      type: 'QB+2',
      team: '*',
      positions: ['QB', 'WR', 'TE'],
      bringBack: 0,
      minFromStack: 2,
      maxFromStack: 3,
      enabled: true,
    };
    setStacks([...stacks, newStack]);
  };

  const updateStack = (id: string, updates: Partial<Stack>) => {
    setStacks(
      stacks.map(stack => (stack.id === id ? { ...stack, ...updates } : stack))
    );
  };

  const removeStack = (id: string) => {
    setStacks(stacks.filter(stack => stack.id !== id));
  };

  const addCustomGroup = () => {
    const newGroup = {
      id: Date.now().toString(),
      name: `Custom Group ${customGroups.length + 1}`,
      players: [],
      minFromGroup: 0,
      maxFromGroup: 1,
      enabled: false,
    };
    setCustomGroups([...customGroups, newGroup]);
  };

  return (
    <div className='bg-white rounded-lg shadow'>
      <div className='px-6 py-4 border-b border-gray-200'>
        <h2 className='text-lg font-medium text-gray-900'>Stacks & Groups</h2>
        <p className='mt-1 text-sm text-gray-500'>
          Configure team stacks, bring-back rules, and custom player groups
        </p>
      </div>

      <div className='p-6 space-y-8'>
        {/* Team Stacks */}
        <div>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='text-md font-medium text-gray-900'>Team Stacks</h3>
            <button
              onClick={addStack}
              className='px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors'
            >
              Add Stack
            </button>
          </div>

          <div className='space-y-4'>
            {stacks.map(stack => (
              <div key={stack.id} className='border border-gray-200 rounded-lg p-4'>
                <div className='flex items-center justify-between mb-4'>
                  <div className='flex items-center space-x-3'>
                    <input
                      type='checkbox'
                      checked={stack.enabled}
                      onChange={e =>
                        updateStack(stack.id, { enabled: e.target.checked })
                      }
                      className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
                    />
                    <select
                      value={stack.type}
                      onChange={e =>
                        updateStack(stack.id, { type: e.target.value as Stack['type'] })
                      }
                      className='px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                    >
                      <option value='QB+2'>QB + 2 Pass Catchers</option>
                      <option value='QB+3'>QB + 3 Pass Catchers</option>
                      <option value='RB+DST'>RB + DST</option>
                      <option value='custom'>Custom Stack</option>
                    </select>
                  </div>
                  <button
                    onClick={() => removeStack(stack.id)}
                    className='text-red-600 hover:text-red-800 text-sm'
                  >
                    Remove
                  </button>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Team
                    </label>
                    <select
                      value={stack.team}
                      onChange={e => updateStack(stack.id, { team: e.target.value })}
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                    >
                      <option value='*'>Any Team</option>
                      <option value='KC'>Kansas City Chiefs</option>
                      <option value='BUF'>Buffalo Bills</option>
                      <option value='DAL'>Dallas Cowboys</option>
                      <option value='SF'>San Francisco 49ers</option>
                    </select>
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Bring-Back Players
                    </label>
                    <input
                      type='number'
                      value={stack.bringBack}
                      onChange={e =>
                        updateStack(stack.id, { bringBack: parseInt(e.target.value) })
                      }
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                      min='0'
                      max='3'
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Min from Stack
                    </label>
                    <input
                      type='number'
                      value={stack.minFromStack}
                      onChange={e =>
                        updateStack(stack.id, {
                          minFromStack: parseInt(e.target.value),
                        })
                      }
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                      min='2'
                      max='6'
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Max from Stack
                    </label>
                    <input
                      type='number'
                      value={stack.maxFromStack}
                      onChange={e =>
                        updateStack(stack.id, {
                          maxFromStack: parseInt(e.target.value),
                        })
                      }
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                      min={stack.minFromStack}
                      max='6'
                    />
                  </div>
                </div>

                {stack.type === 'QB+2' && (
                  <div className='mt-3 p-3 bg-blue-50 rounded-md'>
                    <p className='text-sm text-blue-800'>
                      <strong>QB+2 Stack:</strong> Quarterback + 2 pass catchers (WR/TE)
                      from same team
                      {stack.bringBack > 0 &&
                        ` + ${stack.bringBack} player(s) from opposing team`}
                    </p>
                  </div>
                )}

                {stack.type === 'RB+DST' && (
                  <div className='mt-3 p-3 bg-green-50 rounded-md'>
                    <p className='text-sm text-green-800'>
                      <strong>RB+DST Stack:</strong> Running back + Defense from same
                      team (negative correlation hedge)
                    </p>
                  </div>
                )}
              </div>
            ))}

            {stacks.length === 0 && (
              <div className='text-center py-8 text-gray-500'>
                No stacks configured. Click "Add Stack" to create team stacks.
              </div>
            )}
          </div>
        </div>

        {/* Custom Groups */}
        <div>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='text-md font-medium text-gray-900'>Custom Groups</h3>
            <button
              onClick={addCustomGroup}
              className='px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors'
            >
              Add Group
            </button>
          </div>

          <div className='space-y-4'>
            {customGroups.map(group => (
              <div key={group.id} className='border border-gray-200 rounded-lg p-4'>
                <div className='flex items-center justify-between mb-4'>
                  <div className='flex items-center space-x-3'>
                    <input
                      type='checkbox'
                      checked={group.enabled}
                      onChange={e => {
                        setCustomGroups(
                          customGroups.map(g =>
                            g.id === group.id ? { ...g, enabled: e.target.checked } : g
                          )
                        );
                      }}
                      className='h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded'
                    />
                    <input
                      type='text'
                      value={group.name}
                      onChange={e => {
                        setCustomGroups(
                          customGroups.map(g =>
                            g.id === group.id ? { ...g, name: e.target.value } : g
                          )
                        );
                      }}
                      className='px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500'
                      placeholder='Group name'
                    />
                  </div>
                  <button
                    onClick={() =>
                      setCustomGroups(customGroups.filter(g => g.id !== group.id))
                    }
                    className='text-red-600 hover:text-red-800 text-sm'
                  >
                    Remove
                  </button>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Min from Group
                    </label>
                    <input
                      type='number'
                      value={group.minFromGroup}
                      onChange={e => {
                        setCustomGroups(
                          customGroups.map(g =>
                            g.id === group.id
                              ? { ...g, minFromGroup: parseInt(e.target.value) }
                              : g
                          )
                        );
                      }}
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500'
                      min='0'
                      max='9'
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Max from Group
                    </label>
                    <input
                      type='number'
                      value={group.maxFromGroup}
                      onChange={e => {
                        setCustomGroups(
                          customGroups.map(g =>
                            g.id === group.id
                              ? { ...g, maxFromGroup: parseInt(e.target.value) }
                              : g
                          )
                        );
                      }}
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500'
                      min={group.minFromGroup}
                      max='9'
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Players ({group.players.length})
                    </label>
                    <button className='w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-600 hover:bg-gray-50 transition-colors'>
                      Select Players
                    </button>
                  </div>
                </div>

                <div className='mt-3 p-3 bg-gray-50 rounded-md'>
                  <p className='text-sm text-gray-600'>
                    Custom groups allow you to set min/max constraints on specific sets
                    of players. Use for high-value plays, contrarian pivots, or
                    correlation groups.
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stack Summary */}
        <div className='bg-purple-50 rounded-lg p-4'>
          <h4 className='text-sm font-medium text-purple-900 mb-2'>
            Stack Configuration Summary
          </h4>
          <div className='text-sm text-purple-800 space-y-1'>
            <p>• {stacks.filter(s => s.enabled).length} active team stacks</p>
            <p>• {customGroups.filter(g => g.enabled).length} active custom groups</p>
            {stacks.some(s => s.enabled && s.bringBack > 0) && (
              <p>• Bring-back rules configured for game stacks</p>
            )}
            <p>
              • Stack diversity will be enforced across{' '}
              {stacks.filter(s => s.enabled).length > 0 ? '150' : '0'} lineups
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
