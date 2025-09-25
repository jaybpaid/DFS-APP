import React, { useState, useMemo, useRef } from 'react';
import { EnhancedPlayer } from '../types/player-controls';

interface StackRule {
  id: string;
  name: string;
  type: 'qb_stack' | 'game_stack' | 'rb_wr_stack' | 'bring_back' | 'custom';
  positions: string[];
  teams: string[];
  minPlayers: number;
  maxPlayers: number;
  isActive: boolean;
  priority: number;
  description: string;
  correlation: number;
  constraints: StackConstraint[];
}

interface StackConstraint {
  type:
    | 'same_team'
    | 'same_game'
    | 'different_team'
    | 'salary_range'
    | 'ownership_range';
  value: any;
}

interface StackTemplate {
  id: string;
  name: string;
  description: string;
  category: 'basic' | 'advanced' | 'expert';
  rules: Omit<StackRule, 'id'>[];
}

interface StackBuilderInterfaceProps {
  players: EnhancedPlayer[];
  onStacksChange: (stacks: StackRule[]) => void;
  isVisible: boolean;
  onClose: () => void;
}

export default function StackBuilderInterface({
  players,
  onStacksChange,
  isVisible,
  onClose,
}: StackBuilderInterfaceProps) {
  const [stacks, setStacks] = useState<StackRule[]>([]);
  const [activeStack, setActiveStack] = useState<string | null>(null);
  const [draggedPlayer, setDraggedPlayer] = useState<string | null>(null);
  const [draggedStack, setDraggedStack] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [stackValidation, setStackValidation] = useState<any>({});

  const dropZoneRef = useRef<HTMLDivElement>(null);

  const stackTemplates: StackTemplate[] = [
    {
      id: 'qb_wr_te',
      name: 'QB + 2 Pass Catchers',
      description: 'Quarterback with WR and TE from same team',
      category: 'basic',
      rules: [
        {
          name: 'QB + WR + TE Stack',
          type: 'qb_stack',
          positions: ['QB', 'WR', 'TE'],
          teams: [],
          minPlayers: 3,
          maxPlayers: 3,
          isActive: true,
          priority: 1,
          description: 'Force QB with exactly 2 pass catchers from same team',
          correlation: 0.8,
          constraints: [{ type: 'same_team', value: true }],
        },
      ],
    },
    {
      id: 'game_stack',
      name: 'Game Stack',
      description: 'Players from both teams in high-scoring games',
      category: 'advanced',
      rules: [
        {
          name: 'Both Teams Game Stack',
          type: 'game_stack',
          positions: ['QB', 'WR', 'RB', 'TE'],
          teams: [],
          minPlayers: 4,
          maxPlayers: 6,
          isActive: true,
          priority: 2,
          description: 'Include players from both teams in selected games',
          correlation: 0.6,
          constraints: [{ type: 'same_game', value: true }],
        },
      ],
    },
    {
      id: 'rb_wr_stack',
      name: 'RB + WR Stack',
      description: 'Running back and wide receiver from same team',
      category: 'basic',
      rules: [
        {
          name: 'RB + WR Same Team',
          type: 'rb_wr_stack',
          positions: ['RB', 'WR'],
          teams: [],
          minPlayers: 2,
          maxPlayers: 2,
          isActive: true,
          priority: 3,
          description: 'Pair RB and WR from same team for game script correlation',
          correlation: 0.4,
          constraints: [{ type: 'same_team', value: true }],
        },
      ],
    },
    {
      id: 'bring_back',
      name: 'Bring Back Stack',
      description: 'Opposing QB/WR to counter your stack',
      category: 'advanced',
      rules: [
        {
          name: 'Opposing QB Bring Back',
          type: 'bring_back',
          positions: ['QB', 'WR'],
          teams: [],
          minPlayers: 2,
          maxPlayers: 3,
          isActive: true,
          priority: 4,
          description: 'Include opposing QB/WR to hedge your primary stack',
          correlation: -0.2,
          constraints: [{ type: 'different_team', value: true }],
        },
      ],
    },
  ];

  const positions = useMemo(() => {
    const posSet = new Set(players.map(p => p.position));
    return Array.from(posSet).sort();
  }, [players]);

  const teams = useMemo(() => {
    const teamSet = new Set(players.map(p => p.team));
    return Array.from(teamSet).sort();
  }, [players]);

  const games = useMemo(() => {
    const gameMap = new Map();
    players.forEach(player => {
      // Create a simple game key from team, assuming matchups will be determined later
      const gameKey = `${player.team}_game`;
      if (!gameMap.has(gameKey)) {
        gameMap.set(gameKey, {
          teams: [player.team],
          players: [],
        });
      }
      gameMap.get(gameKey).players.push(player);
    });
    return Array.from(gameMap.entries());
  }, [players]);

  const addStack = (template?: StackTemplate) => {
    const newStack: StackRule = template
      ? { ...template.rules[0], id: `stack_${Date.now()}` }
      : {
          id: `stack_${Date.now()}`,
          name: 'Custom Stack',
          type: 'custom',
          positions: [],
          teams: [],
          minPlayers: 2,
          maxPlayers: 4,
          isActive: true,
          priority: stacks.length + 1,
          description: 'Custom stack rule',
          correlation: 0.5,
          constraints: [],
        };

    setStacks([...stacks, newStack]);
    setActiveStack(newStack.id);
  };

  const updateStack = (id: string, updates: Partial<StackRule>) => {
    setStacks(stacks.map(s => (s.id === id ? { ...s, ...updates } : s)));
  };

  const removeStack = (id: string) => {
    setStacks(stacks.filter(s => s.id !== id));
    if (activeStack === id) {
      setActiveStack(null);
    }
  };

  const validateStacks = () => {
    const validation: any = {};

    stacks.forEach(stack => {
      const issues = [];

      if (stack.positions.length === 0) {
        issues.push('No positions selected');
      }

      if (stack.minPlayers > stack.maxPlayers) {
        issues.push('Min players cannot exceed max players');
      }

      if (stack.type === 'qb_stack' && !stack.positions.includes('QB')) {
        issues.push('QB stack must include QB position');
      }

      const availablePlayers = players.filter(
        p =>
          stack.positions.includes(p.position) &&
          (stack.teams.length === 0 || stack.teams.includes(p.team))
      );

      if (availablePlayers.length < stack.minPlayers) {
        issues.push(
          `Not enough players available (${availablePlayers.length} < ${stack.minPlayers})`
        );
      }

      validation[stack.id] = {
        isValid: issues.length === 0,
        issues,
        availablePlayers: availablePlayers.length,
      };
    });

    setStackValidation(validation);
    return validation;
  };

  const previewStackCombinations = (stackId: string) => {
    const stack = stacks.find(s => s.id === stackId);
    if (!stack) return [];

    const eligiblePlayers = players.filter(
      p =>
        stack.positions.includes(p.position) &&
        (stack.teams.length === 0 || stack.teams.includes(p.team))
    );

    // Generate sample combinations
    const combinations = [];
    for (let i = 0; i < Math.min(10, eligiblePlayers.length); i++) {
      const combo = eligiblePlayers.slice(i, i + stack.minPlayers);
      if (combo.length === stack.minPlayers) {
        combinations.push({
          players: combo,
          totalSalary: combo.reduce((sum, p) => sum + p.salary, 0),
          totalProjection: combo.reduce((sum, p) => sum + p.projectedPoints, 0),
          avgOwnership: combo.reduce((sum, p) => sum + p.ownership, 0) / combo.length,
        });
      }
    }

    return combinations.sort((a, b) => b.totalProjection - a.totalProjection);
  };

  const getStackIcon = (type: StackRule['type']) => {
    switch (type) {
      case 'qb_stack':
        return '🎯';
      case 'game_stack':
        return '🏟️';
      case 'rb_wr_stack':
        return '🤝';
      case 'bring_back':
        return '↩️';
      case 'custom':
        return '⚙️';
      default:
        return '📚';
    }
  };

  const getPriorityColor = (priority: number) => {
    if (priority === 1) return 'border-red-500 bg-red-50';
    if (priority <= 3) return 'border-orange-500 bg-orange-50';
    if (priority <= 5) return 'border-blue-500 bg-blue-50';
    return 'border-gray-500 bg-gray-50';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, stackId: string) => {
    e.preventDefault();

    if (draggedPlayer) {
      const player = players.find(p => p.id === draggedPlayer);
      const stack = stacks.find(s => s.id === stackId);

      if (player && stack) {
        // Add player's position and team to stack if not already included
        const updatedPositions = stack.positions.includes(player.position)
          ? stack.positions
          : [...stack.positions, player.position];

        const updatedTeams = stack.teams.includes(player.team)
          ? stack.teams
          : [...stack.teams, player.team];

        updateStack(stackId, {
          positions: updatedPositions,
          teams: updatedTeams,
        });
      }
    }
  };

  const activeStackData = stacks.find(s => s.id === activeStack);

  if (!isVisible) return null;

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
      <div className='bg-white rounded-lg shadow-xl w-full max-w-7xl h-5/6 overflow-hidden'>
        {/* Header */}
        <div className='flex items-center justify-between p-6 border-b border-gray-200'>
          <div>
            <h2 className='text-2xl font-bold text-gray-900'>
              Stack Builder Interface
            </h2>
            <p className='text-gray-600'>
              Create and manage player stacking strategies with drag-and-drop
            </p>
          </div>
          <div className='flex items-center space-x-3'>
            <button
              onClick={() => setShowTemplates(true)}
              className='px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm'
            >
              Templates
            </button>
            <button
              onClick={() => setPreviewMode(!previewMode)}
              className={`px-4 py-2 rounded-md text-sm ${
                previewMode
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-600 text-white hover:bg-gray-700'
              }`}
            >
              {previewMode ? 'Exit Preview' : 'Preview'}
            </button>
            <button
              onClick={validateStacks}
              className='px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 text-sm'
            >
              Validate
            </button>
            <button
              onClick={() => {
                onStacksChange(stacks);
                onClose();
              }}
              className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm'
            >
              Apply Stacks
            </button>
            <button
              onClick={onClose}
              className='text-gray-400 hover:text-gray-600 text-2xl font-bold'
            >
              ×
            </button>
          </div>
        </div>

        <div className='flex h-full'>
          {/* Stack Templates Sidebar */}
          <div className='w-64 bg-gray-50 border-r border-gray-200 p-4 overflow-y-auto'>
            <h3 className='text-lg font-semibold text-gray-900 mb-4'>Stack Types</h3>

            <div className='space-y-2 mb-6'>
              {stackTemplates.map(template => (
                <button
                  key={template.id}
                  onClick={() => addStack(template)}
                  className='w-full flex items-center space-x-2 p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-left'
                >
                  <span className='text-lg'>
                    {getStackIcon(template.rules[0].type)}
                  </span>
                  <div>
                    <div className='text-sm font-medium text-gray-700'>
                      {template.name}
                    </div>
                    <div className='text-xs text-gray-500'>{template.category}</div>
                  </div>
                </button>
              ))}

              <button
                onClick={() => addStack()}
                className='w-full flex items-center space-x-2 p-3 bg-white border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 text-left'
              >
                <span className='text-lg'>⚙️</span>
                <div>
                  <div className='text-sm font-medium text-gray-700'>Custom Stack</div>
                  <div className='text-xs text-gray-500'>Build from scratch</div>
                </div>
              </button>
            </div>

            {/* Player Pool for Dragging */}
            <h4 className='text-md font-medium text-gray-900 mb-3'>Player Pool</h4>
            <div className='space-y-1 max-h-96 overflow-y-auto'>
              {positions.map(position => (
                <details key={position} className='group'>
                  <summary className='flex items-center justify-between p-2 bg-white border border-gray-200 rounded cursor-pointer hover:bg-gray-50'>
                    <span className='text-sm font-medium text-gray-700'>
                      {position}
                    </span>
                    <span className='text-xs text-gray-500'>
                      {players.filter(p => p.position === position).length}
                    </span>
                  </summary>
                  <div className='mt-1 space-y-1 pl-2'>
                    {players
                      .filter(p => p.position === position)
                      .slice(0, 10) // Show top 10 by projection
                      .sort((a, b) => b.projectedPoints - a.projectedPoints)
                      .map(player => (
                        <div
                          key={player.id}
                          draggable
                          onDragStart={() => setDraggedPlayer(player.id)}
                          onDragEnd={() => setDraggedPlayer(null)}
                          className={`p-2 bg-white border border-gray-200 rounded text-xs cursor-grab hover:bg-blue-50 ${
                            draggedPlayer === player.id ? 'bg-blue-100 shadow-md' : ''
                          }`}
                        >
                          <div className='font-medium text-gray-900'>{player.name}</div>
                          <div className='text-gray-500'>
                            {player.team} | ${player.salary} |{' '}
                            {player.projectedPoints.toFixed(1)}
                          </div>
                        </div>
                      ))}
                  </div>
                </details>
              ))}
            </div>
          </div>

          {/* Main Stack Canvas */}
          <div className='flex-1 p-6 overflow-y-auto'>
            <div className='mb-6'>
              <div className='flex items-center justify-between mb-4'>
                <h3 className='text-lg font-semibold text-gray-900'>
                  Active Stacks ({stacks.length})
                </h3>
                <div className='flex items-center space-x-2'>
                  <button
                    onClick={() => setStacks([])}
                    disabled={stacks.length === 0}
                    className='px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-300'
                  >
                    Clear All
                  </button>
                </div>
              </div>

              {/* Stack Cards */}
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                {stacks.map(stack => (
                  <div
                    key={stack.id}
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      activeStack === stack.id
                        ? 'border-blue-500 bg-blue-50'
                        : getPriorityColor(stack.priority)
                    } ${!stack.isActive ? 'opacity-50' : ''}`}
                    onClick={() =>
                      setActiveStack(activeStack === stack.id ? null : stack.id)
                    }
                    onDragOver={handleDragOver}
                    onDrop={e => handleDrop(e, stack.id)}
                  >
                    <div className='flex items-center justify-between mb-2'>
                      <div className='flex items-center space-x-2'>
                        <span className='text-lg'>{getStackIcon(stack.type)}</span>
                        <span className='font-medium text-gray-900'>{stack.name}</span>
                      </div>
                      <div className='flex items-center space-x-1'>
                        <span className='px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded'>
                          #{stack.priority}
                        </span>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            updateStack(stack.id, { isActive: !stack.isActive });
                          }}
                          className={`w-4 h-4 rounded-full ${
                            stack.isActive ? 'bg-green-500' : 'bg-gray-300'
                          }`}
                          title={stack.isActive ? 'Active' : 'Inactive'}
                        />
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            removeStack(stack.id);
                          }}
                          className='text-red-500 hover:text-red-700 text-sm'
                        >
                          ×
                        </button>
                      </div>
                    </div>

                    <div className='text-sm text-gray-600 mb-2'>
                      {stack.description}
                    </div>

                    <div className='text-xs text-gray-500 mb-2'>
                      Positions: {stack.positions.join(', ') || 'None'}
                    </div>

                    <div className='text-xs text-gray-500 mb-2'>
                      Teams: {stack.teams.length > 0 ? stack.teams.join(', ') : 'Any'}
                    </div>

                    <div className='flex items-center justify-between text-xs'>
                      <span>
                        Players: {stack.minPlayers}-{stack.maxPlayers}
                      </span>
                      <span>Correlation: {(stack.correlation * 100).toFixed(0)}%</span>
                    </div>

                    {/* Validation Status */}
                    {stackValidation[stack.id] && (
                      <div
                        className={`mt-2 p-2 rounded text-xs ${
                          stackValidation[stack.id].isValid
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {stackValidation[stack.id].isValid
                          ? `✓ Valid (${stackValidation[stack.id].availablePlayers} players available)`
                          : `⚠ ${stackValidation[stack.id].issues.join(', ')}`}
                      </div>
                    )}

                    {/* Drop Zone Indicator */}
                    {draggedPlayer && (
                      <div className='mt-2 border-2 border-dashed border-blue-400 bg-blue-50 p-2 rounded text-center text-xs text-blue-700'>
                        Drop player here to add to stack
                      </div>
                    )}
                  </div>
                ))}

                {/* Add New Stack Card */}
                <div
                  className='border-2 border-dashed border-gray-300 rounded-lg p-4 flex items-center justify-center hover:border-blue-400 cursor-pointer'
                  onClick={() => addStack()}
                >
                  <div className='text-center text-gray-500'>
                    <div className='text-2xl mb-2'>+</div>
                    <div className='text-sm'>Add Stack</div>
                  </div>
                </div>
              </div>

              {/* Preview Mode */}
              {previewMode && activeStack && (
                <div className='mt-6 bg-gray-50 rounded-lg p-4'>
                  <h4 className='text-md font-medium text-gray-900 mb-3'>
                    Stack Preview: {activeStackData?.name}
                  </h4>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    {previewStackCombinations(activeStack)
                      .slice(0, 6)
                      .map((combo, index) => (
                        <div
                          key={index}
                          className='bg-white border border-gray-200 rounded p-3'
                        >
                          <div className='flex items-center justify-between mb-2'>
                            <span className='text-sm font-medium text-gray-900'>
                              Combo #{index + 1}
                            </span>
                            <span className='text-xs text-gray-600'>
                              {combo.totalProjection.toFixed(1)} pts
                            </span>
                          </div>
                          <div className='space-y-1'>
                            {combo.players.map(player => (
                              <div
                                key={player.id}
                                className='flex items-center justify-between text-xs'
                              >
                                <span className='text-gray-700'>
                                  {player.name} ({player.position})
                                </span>
                                <span className='text-gray-500'>
                                  ${player.salary} | {player.projectedPoints.toFixed(1)}
                                </span>
                              </div>
                            ))}
                          </div>
                          <div className='mt-2 pt-2 border-t border-gray-200 text-xs text-gray-600'>
                            Total: ${combo.totalSalary.toLocaleString()} | Own:{' '}
                            {(combo.avgOwnership * 100).toFixed(1)}%
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Stack Editor Sidebar */}
          {activeStackData && (
            <div className='w-80 bg-gray-50 border-l border-gray-200 p-6 overflow-y-auto'>
              <h3 className='text-lg font-semibold text-gray-900 mb-4'>Edit Stack</h3>

              <div className='space-y-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Name
                  </label>
                  <input
                    type='text'
                    value={activeStackData.name}
                    onChange={e =>
                      updateStack(activeStackData.id, { name: e.target.value })
                    }
                    className='w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Description
                  </label>
                  <textarea
                    value={activeStackData.description}
                    onChange={e =>
                      updateStack(activeStackData.id, { description: e.target.value })
                    }
                    className='w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                    rows={3}
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Type
                  </label>
                  <select
                    value={activeStackData.type}
                    onChange={e =>
                      updateStack(activeStackData.id, { type: e.target.value as any })
                    }
                    className='w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                  >
                    <option value='qb_stack'>QB Stack</option>
                    <option value='game_stack'>Game Stack</option>
                    <option value='rb_wr_stack'>RB + WR Stack</option>
                    <option value='bring_back'>Bring Back</option>
                    <option value='custom'>Custom</option>
                  </select>
                </div>

                <div className='grid grid-cols-2 gap-2'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Min Players
                    </label>
                    <input
                      type='number'
                      min='1'
                      max='9'
                      value={activeStackData.minPlayers}
                      onChange={e =>
                        updateStack(activeStackData.id, {
                          minPlayers: parseInt(e.target.value),
                        })
                      }
                      className='w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Max Players
                    </label>
                    <input
                      type='number'
                      min='1'
                      max='9'
                      value={activeStackData.maxPlayers}
                      onChange={e =>
                        updateStack(activeStackData.id, {
                          maxPlayers: parseInt(e.target.value),
                        })
                      }
                      className='w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                    />
                  </div>
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Priority
                  </label>
                  <input
                    type='number'
                    min='1'
                    max='10'
                    value={activeStackData.priority}
                    onChange={e =>
                      updateStack(activeStackData.id, {
                        priority: parseInt(e.target.value),
                      })
                    }
                    className='w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Correlation ({(activeStackData.correlation * 100).toFixed(0)}%)
                  </label>
                  <input
                    type='range'
                    min='-1'
                    max='1'
                    step='0.1'
                    value={activeStackData.correlation}
                    onChange={e =>
                      updateStack(activeStackData.id, {
                        correlation: parseFloat(e.target.value),
                      })
                    }
                    className='w-full'
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Positions
                  </label>
                  <div className='space-y-1 max-h-32 overflow-y-auto'>
                    {positions.map(position => (
                      <label key={position} className='flex items-center'>
                        <input
                          type='checkbox'
                          checked={activeStackData.positions.includes(position)}
                          onChange={e => {
                            const newPositions = e.target.checked
                              ? [...activeStackData.positions, position]
                              : activeStackData.positions.filter(p => p !== position);
                            updateStack(activeStackData.id, {
                              positions: newPositions,
                            });
                          }}
                          className='mr-2'
                        />
                        <span className='text-sm'>{position}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Teams
                  </label>
                  <div className='space-y-1 max-h-32 overflow-y-auto'>
                    {teams.map(team => (
                      <label key={team} className='flex items-center'>
                        <input
                          type='checkbox'
                          checked={activeStackData.teams.includes(team)}
                          onChange={e => {
                            const newTeams = e.target.checked
                              ? [...activeStackData.teams, team]
                              : activeStackData.teams.filter(t => t !== team);
                            updateStack(activeStackData.id, { teams: newTeams });
                          }}
                          className='mr-2'
                        />
                        <span className='text-sm'>{team}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className='pt-4 border-t border-gray-200'>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm text-gray-600'>Active</span>
                    <button
                      onClick={() =>
                        updateStack(activeStackData.id, {
                          isActive: !activeStackData.isActive,
                        })
                      }
                      className={`w-12 h-6 rounded-full flex items-center ${
                        activeStackData.isActive ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                          activeStackData.isActive ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Templates Modal */}
        {showTemplates && (
          <div className='absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
            <div className='bg-white rounded-lg shadow-xl w-full max-w-4xl h-4/5 overflow-hidden'>
              <div className='flex items-center justify-between p-6 border-b border-gray-200'>
                <h3 className='text-xl font-bold text-gray-900'>Stack Templates</h3>
                <button
                  onClick={() => setShowTemplates(false)}
                  className='text-gray-400 hover:text-gray-600 text-xl font-bold'
                >
                  ×
                </button>
              </div>
              <div className='p-6 overflow-y-auto'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  {stackTemplates.map(template => (
                    <div
                      key={template.id}
                      className='border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer'
                      onClick={() => {
                        addStack(template);
                        setShowTemplates(false);
                      }}
                    >
                      <div className='flex items-center justify-between mb-2'>
                        <h4 className='font-semibold text-gray-900'>{template.name}</h4>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            template.category === 'basic'
                              ? 'bg-green-100 text-green-800'
                              : template.category === 'advanced'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          {template.category}
                        </span>
                      </div>
                      <p className='text-sm text-gray-600 mb-3'>
                        {template.description}
                      </p>
                      <div className='text-xs text-gray-500'>
                        {template.rules.length} rule
                        {template.rules.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
