import React, { useState, useMemo } from 'react';
import { EnhancedPlayer } from '../types/player-controls';

interface Constraint {
  id: string;
  type:
    | 'player'
    | 'position'
    | 'team'
    | 'salary'
    | 'stack'
    | 'correlation'
    | 'exposure'
    | 'custom';
  name: string;
  condition:
    | 'must_include'
    | 'must_exclude'
    | 'min_count'
    | 'max_count'
    | 'exactly'
    | 'at_least'
    | 'at_most'
    | 'between'
    | 'correlation_positive'
    | 'correlation_negative';
  targets: string[];
  values: { min?: number; max?: number; value?: number; weight?: number };
  isActive: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
}

interface ConstraintTemplate {
  id: string;
  name: string;
  description: string;
  category: 'basic' | 'advanced' | 'expert' | 'custom';
  constraints: Omit<Constraint, 'id'>[];
}

interface AdvancedConstraintBuilderProps {
  players: EnhancedPlayer[];
  onConstraintsChange: (constraints: Constraint[]) => void;
  isVisible: boolean;
  onClose: () => void;
}

export default function AdvancedConstraintBuilder({
  players,
  onConstraintsChange,
  isVisible,
  onClose,
}: AdvancedConstraintBuilderProps) {
  const [constraints, setConstraints] = useState<Constraint[]>([]);
  const [activeConstraint, setActiveConstraint] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [constraintLibrary, setConstraintLibrary] = useState<ConstraintTemplate[]>([]);
  const [draggedConstraint, setDraggedConstraint] = useState<string | null>(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  const constraintTemplates: ConstraintTemplate[] = [
    {
      id: 'qb_stack',
      name: 'QB Stack Strategy',
      description: 'Quarterback with 2+ pass catchers from same team',
      category: 'basic',
      constraints: [
        {
          type: 'stack',
          name: 'QB + 2 Pass Catchers',
          condition: 'min_count',
          targets: ['QB', 'WR', 'TE'],
          values: { min: 3 },
          isActive: true,
          priority: 'high',
          description: 'Force QB with at least 2 pass catchers from same team',
        },
      ],
    },
    {
      id: 'game_stack',
      name: 'Game Stack Strategy',
      description: 'Players from both teams in high-scoring games',
      category: 'advanced',
      constraints: [
        {
          type: 'stack',
          name: 'Both Teams Represented',
          condition: 'min_count',
          targets: [],
          values: { min: 2 },
          isActive: true,
          priority: 'medium',
          description: 'Include players from both teams in selected games',
        },
      ],
    },
    {
      id: 'contrarian',
      name: 'Contrarian Strategy',
      description: 'Fade high-ownership players, target low-ownership gems',
      category: 'advanced',
      constraints: [
        {
          type: 'exposure',
          name: 'Fade Chalk Players',
          condition: 'max_count',
          targets: [],
          values: { max: 30 },
          isActive: true,
          priority: 'high',
          description: 'Limit high-ownership (>30%) players to 1 per lineup',
        },
        {
          type: 'exposure',
          name: 'Target Low-Owned',
          condition: 'min_count',
          targets: [],
          values: { min: 3 },
          isActive: true,
          priority: 'medium',
          description: 'Include at least 3 low-ownership (<10%) players',
        },
      ],
    },
    {
      id: 'cash_game',
      name: 'Cash Game Strategy',
      description: 'Safe, high-floor plays with consistent scoring',
      category: 'basic',
      constraints: [
        {
          type: 'player',
          name: 'High Floor Players',
          condition: 'min_count',
          targets: [],
          values: { min: 6 },
          isActive: true,
          priority: 'high',
          description: 'Prioritize players with consistent floor scores',
        },
        {
          type: 'salary',
          name: 'Salary Efficiency',
          condition: 'between',
          targets: [],
          values: { min: 49000, max: 50000 },
          isActive: true,
          priority: 'medium',
          description: 'Use 98-100% of salary cap for maximum value',
        },
      ],
    },
    {
      id: 'tournament',
      name: 'Tournament Strategy',
      description: 'High-ceiling plays with boom/bust potential',
      category: 'advanced',
      constraints: [
        {
          type: 'player',
          name: 'High Ceiling Players',
          condition: 'min_count',
          targets: [],
          values: { min: 4 },
          isActive: true,
          priority: 'high',
          description: 'Include at least 4 high-ceiling boom-or-bust players',
        },
        {
          type: 'correlation',
          name: 'Positive Correlations',
          condition: 'correlation_positive',
          targets: [],
          values: { weight: 0.3 },
          isActive: true,
          priority: 'medium',
          description: 'Boost positively correlated player combinations',
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

  const addConstraint = (type: Constraint['type']) => {
    const newConstraint: Constraint = {
      id: `constraint_${Date.now()}`,
      type,
      name: `New ${type} constraint`,
      condition: 'min_count',
      targets: [],
      values: {},
      isActive: true,
      priority: 'medium',
      description: `Custom ${type} constraint`,
    };

    setConstraints([...constraints, newConstraint]);
    setActiveConstraint(newConstraint.id);
  };

  const updateConstraint = (id: string, updates: Partial<Constraint>) => {
    setConstraints(constraints.map(c => (c.id === id ? { ...c, ...updates } : c)));
  };

  const removeConstraint = (id: string) => {
    setConstraints(constraints.filter(c => c.id !== id));
    if (activeConstraint === id) {
      setActiveConstraint(null);
    }
  };

  const applyTemplate = (template: ConstraintTemplate) => {
    const newConstraints = template.constraints.map(c => ({
      ...c,
      id: `constraint_${Date.now()}_${Math.random()}`,
    }));

    setConstraints(newConstraints);
    setSelectedTemplate(template.id);
    setShowTemplateModal(false);
  };

  const saveAsTemplate = () => {
    if (constraints.length === 0) return;

    const template: ConstraintTemplate = {
      id: `custom_${Date.now()}`,
      name: `Custom Template ${constraintLibrary.length + 1}`,
      description: 'User-created constraint template',
      category: 'custom',
      constraints: constraints.map(({ id, ...rest }) => rest),
    };

    setConstraintLibrary([...constraintLibrary, template]);
  };

  const exportConstraints = () => {
    const exportData = {
      constraints,
      templates: constraintLibrary,
      timestamp: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dfs_constraints_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getConstraintIcon = (type: Constraint['type']) => {
    switch (type) {
      case 'player':
        return '👤';
      case 'position':
        return '🏈';
      case 'team':
        return '🏟️';
      case 'salary':
        return '💰';
      case 'stack':
        return '📚';
      case 'correlation':
        return '🔗';
      case 'exposure':
        return '📊';
      case 'custom':
        return '⚙️';
      default:
        return '📋';
    }
  };

  const getPriorityColor = (priority: Constraint['priority']) => {
    switch (priority) {
      case 'critical':
        return 'border-red-500 bg-red-50';
      case 'high':
        return 'border-orange-500 bg-orange-50';
      case 'medium':
        return 'border-blue-500 bg-blue-50';
      case 'low':
        return 'border-gray-500 bg-gray-50';
    }
  };

  const activeConstraintData = constraints.find(c => c.id === activeConstraint);

  if (!isVisible) return null;

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
      <div className='bg-white rounded-lg shadow-xl w-full max-w-7xl h-5/6 overflow-hidden'>
        {/* Header */}
        <div className='flex items-center justify-between p-6 border-b border-gray-200'>
          <div>
            <h2 className='text-2xl font-bold text-gray-900'>
              Advanced Constraint Builder
            </h2>
            <p className='text-gray-600'>
              Build complex optimization constraints with visual tools
            </p>
          </div>
          <div className='flex items-center space-x-3'>
            <button
              onClick={() => setShowTemplateModal(true)}
              className='px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm'
            >
              Templates
            </button>
            <button
              onClick={exportConstraints}
              className='px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm'
            >
              Export
            </button>
            <button
              onClick={() => {
                onConstraintsChange(constraints);
                onClose();
              }}
              className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm'
            >
              Apply Constraints
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
          {/* Constraint Library Sidebar */}
          <div className='w-64 bg-gray-50 border-r border-gray-200 p-4 overflow-y-auto'>
            <h3 className='text-lg font-semibold text-gray-900 mb-4'>
              Constraint Types
            </h3>

            <div className='space-y-2 mb-6'>
              {[
                'player',
                'position',
                'team',
                'salary',
                'stack',
                'correlation',
                'exposure',
                'custom',
              ].map(type => (
                <button
                  key={type}
                  onClick={() => addConstraint(type as Constraint['type'])}
                  className='w-full flex items-center space-x-2 p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-left'
                >
                  <span className='text-lg'>
                    {getConstraintIcon(type as Constraint['type'])}
                  </span>
                  <span className='text-sm font-medium text-gray-700 capitalize'>
                    {type}
                  </span>
                </button>
              ))}
            </div>

            <h4 className='text-md font-medium text-gray-900 mb-3'>Quick Templates</h4>
            <div className='space-y-2'>
              {constraintTemplates.slice(0, 3).map(template => (
                <button
                  key={template.id}
                  onClick={() => applyTemplate(template)}
                  className='w-full p-2 bg-white border border-gray-200 rounded text-left hover:bg-gray-50'
                >
                  <div className='text-sm font-medium text-gray-900'>
                    {template.name}
                  </div>
                  <div className='text-xs text-gray-600'>{template.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Main Constraint Canvas */}
          <div className='flex-1 p-6 overflow-y-auto'>
            <div className='mb-6'>
              <div className='flex items-center justify-between mb-4'>
                <h3 className='text-lg font-semibold text-gray-900'>
                  Active Constraints ({constraints.length})
                </h3>
                <div className='flex items-center space-x-2'>
                  <button
                    onClick={saveAsTemplate}
                    disabled={constraints.length === 0}
                    className='px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 disabled:bg-gray-300'
                  >
                    Save as Template
                  </button>
                  <button
                    onClick={() => setConstraints([])}
                    disabled={constraints.length === 0}
                    className='px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-300'
                  >
                    Clear All
                  </button>
                </div>
              </div>

              {/* Constraint Grid */}
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                {constraints.map(constraint => (
                  <div
                    key={constraint.id}
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      activeConstraint === constraint.id
                        ? 'border-blue-500 bg-blue-50'
                        : getPriorityColor(constraint.priority)
                    } ${!constraint.isActive ? 'opacity-50' : ''}`}
                    onClick={() =>
                      setActiveConstraint(
                        activeConstraint === constraint.id ? null : constraint.id
                      )
                    }
                    draggable
                    onDragStart={() => setDraggedConstraint(constraint.id)}
                    onDragEnd={() => setDraggedConstraint(null)}
                  >
                    <div className='flex items-center justify-between mb-2'>
                      <div className='flex items-center space-x-2'>
                        <span className='text-lg'>
                          {getConstraintIcon(constraint.type)}
                        </span>
                        <span className='font-medium text-gray-900'>
                          {constraint.name}
                        </span>
                      </div>
                      <div className='flex items-center space-x-1'>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            updateConstraint(constraint.id, {
                              isActive: !constraint.isActive,
                            });
                          }}
                          className={`w-4 h-4 rounded-full ${
                            constraint.isActive ? 'bg-green-500' : 'bg-gray-300'
                          }`}
                          title={constraint.isActive ? 'Active' : 'Inactive'}
                        />
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            removeConstraint(constraint.id);
                          }}
                          className='text-red-500 hover:text-red-700 text-sm'
                        >
                          ×
                        </button>
                      </div>
                    </div>

                    <div className='text-sm text-gray-600 mb-2'>
                      {constraint.description}
                    </div>

                    <div className='text-xs text-gray-500'>
                      {constraint.condition.replace('_', ' ').toUpperCase()}
                      {constraint.values.min && ` ≥${constraint.values.min}`}
                      {constraint.values.max && ` ≤${constraint.values.max}`}
                      {constraint.values.value && ` = ${constraint.values.value}`}
                    </div>

                    <div className='mt-2 flex items-center justify-between'>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          constraint.priority === 'critical'
                            ? 'bg-red-100 text-red-800'
                            : constraint.priority === 'high'
                              ? 'bg-orange-100 text-orange-800'
                              : constraint.priority === 'medium'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {constraint.priority.toUpperCase()}
                      </span>
                      <span className='text-xs text-gray-500 capitalize'>
                        {constraint.type}
                      </span>
                    </div>
                  </div>
                ))}

                {/* Add New Constraint Card */}
                <div className='border-2 border-dashed border-gray-300 rounded-lg p-4 flex items-center justify-center hover:border-blue-400 cursor-pointer'>
                  <div className='text-center text-gray-500'>
                    <div className='text-2xl mb-2'>+</div>
                    <div className='text-sm'>Add Constraint</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Constraint Editor Sidebar */}
          {activeConstraintData && (
            <div className='w-80 bg-gray-50 border-l border-gray-200 p-6 overflow-y-auto'>
              <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                Edit Constraint
              </h3>

              <div className='space-y-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Name
                  </label>
                  <input
                    type='text'
                    value={activeConstraintData.name}
                    onChange={e =>
                      updateConstraint(activeConstraintData.id, {
                        name: e.target.value,
                      })
                    }
                    className='w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Description
                  </label>
                  <textarea
                    value={activeConstraintData.description}
                    onChange={e =>
                      updateConstraint(activeConstraintData.id, {
                        description: e.target.value,
                      })
                    }
                    className='w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                    rows={3}
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Condition
                  </label>
                  <select
                    value={activeConstraintData.condition}
                    onChange={e =>
                      updateConstraint(activeConstraintData.id, {
                        condition: e.target.value as any,
                      })
                    }
                    className='w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                  >
                    <option value='must_include'>Must Include</option>
                    <option value='must_exclude'>Must Exclude</option>
                    <option value='min_count'>Minimum Count</option>
                    <option value='max_count'>Maximum Count</option>
                    <option value='exactly'>Exactly</option>
                    <option value='between'>Between</option>
                    <option value='correlation_positive'>Positive Correlation</option>
                    <option value='correlation_negative'>Negative Correlation</option>
                  </select>
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Priority
                  </label>
                  <select
                    value={activeConstraintData.priority}
                    onChange={e =>
                      updateConstraint(activeConstraintData.id, {
                        priority: e.target.value as any,
                      })
                    }
                    className='w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                  >
                    <option value='low'>Low</option>
                    <option value='medium'>Medium</option>
                    <option value='high'>High</option>
                    <option value='critical'>Critical</option>
                  </select>
                </div>

                {/* Value inputs based on condition */}
                {['min_count', 'max_count', 'exactly'].includes(
                  activeConstraintData.condition
                ) && (
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Value
                    </label>
                    <input
                      type='number'
                      value={activeConstraintData.values.value || ''}
                      onChange={e =>
                        updateConstraint(activeConstraintData.id, {
                          values: {
                            ...activeConstraintData.values,
                            value: parseInt(e.target.value) || 0,
                          },
                        })
                      }
                      className='w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                    />
                  </div>
                )}

                {activeConstraintData.condition === 'between' && (
                  <div className='grid grid-cols-2 gap-2'>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>
                        Min
                      </label>
                      <input
                        type='number'
                        value={activeConstraintData.values.min || ''}
                        onChange={e =>
                          updateConstraint(activeConstraintData.id, {
                            values: {
                              ...activeConstraintData.values,
                              min: parseInt(e.target.value) || 0,
                            },
                          })
                        }
                        className='w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                      />
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>
                        Max
                      </label>
                      <input
                        type='number'
                        value={activeConstraintData.values.max || ''}
                        onChange={e =>
                          updateConstraint(activeConstraintData.id, {
                            values: {
                              ...activeConstraintData.values,
                              max: parseInt(e.target.value) || 0,
                            },
                          })
                        }
                        className='w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                      />
                    </div>
                  </div>
                )}

                {/* Target selection based on constraint type */}
                {activeConstraintData.type === 'position' && (
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Positions
                    </label>
                    <div className='space-y-1 max-h-32 overflow-y-auto'>
                      {positions.map(position => (
                        <label key={position} className='flex items-center'>
                          <input
                            type='checkbox'
                            checked={activeConstraintData.targets.includes(position)}
                            onChange={e => {
                              const newTargets = e.target.checked
                                ? [...activeConstraintData.targets, position]
                                : activeConstraintData.targets.filter(
                                    t => t !== position
                                  );
                              updateConstraint(activeConstraintData.id, {
                                targets: newTargets,
                              });
                            }}
                            className='mr-2'
                          />
                          <span className='text-sm'>{position}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {activeConstraintData.type === 'team' && (
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Teams
                    </label>
                    <div className='space-y-1 max-h-32 overflow-y-auto'>
                      {teams.map(team => (
                        <label key={team} className='flex items-center'>
                          <input
                            type='checkbox'
                            checked={activeConstraintData.targets.includes(team)}
                            onChange={e => {
                              const newTargets = e.target.checked
                                ? [...activeConstraintData.targets, team]
                                : activeConstraintData.targets.filter(t => t !== team);
                              updateConstraint(activeConstraintData.id, {
                                targets: newTargets,
                              });
                            }}
                            className='mr-2'
                          />
                          <span className='text-sm'>{team}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div className='pt-4 border-t border-gray-200'>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm text-gray-600'>Active</span>
                    <button
                      onClick={() =>
                        updateConstraint(activeConstraintData.id, {
                          isActive: !activeConstraintData.isActive,
                        })
                      }
                      className={`w-12 h-6 rounded-full flex items-center ${
                        activeConstraintData.isActive ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                          activeConstraintData.isActive
                            ? 'translate-x-6'
                            : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Template Modal */}
        {showTemplateModal && (
          <div className='absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
            <div className='bg-white rounded-lg shadow-xl w-full max-w-4xl h-4/5 overflow-hidden'>
              <div className='flex items-center justify-between p-6 border-b border-gray-200'>
                <h3 className='text-xl font-bold text-gray-900'>
                  Constraint Templates
                </h3>
                <button
                  onClick={() => setShowTemplateModal(false)}
                  className='text-gray-400 hover:text-gray-600 text-xl font-bold'
                >
                  ×
                </button>
              </div>
              <div className='p-6 overflow-y-auto'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  {constraintTemplates.map(template => (
                    <div
                      key={template.id}
                      className='border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer'
                      onClick={() => applyTemplate(template)}
                    >
                      <div className='flex items-center justify-between mb-2'>
                        <h4 className='font-semibold text-gray-900'>{template.name}</h4>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            template.category === 'basic'
                              ? 'bg-green-100 text-green-800'
                              : template.category === 'advanced'
                                ? 'bg-blue-100 text-blue-800'
                                : template.category === 'expert'
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {template.category}
                        </span>
                      </div>
                      <p className='text-sm text-gray-600 mb-3'>
                        {template.description}
                      </p>
                      <div className='text-xs text-gray-500'>
                        {template.constraints.length} constraint
                        {template.constraints.length !== 1 ? 's' : ''}
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
