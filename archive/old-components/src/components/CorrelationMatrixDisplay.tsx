import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Tooltip } from './ui/tooltip';
import { Button } from './ui/button';
import { Card } from './ui/card';

interface Player {
  id: string;
  name: string;
  position: string;
  team: string;
  salary: number;
}

interface CorrelationData {
  playerId1: string;
  playerId2: string;
  correlation: number;
  type: 'stack' | 'game_script' | 'weather' | 'pace' | 'negative' | 'bring_back';
  strength: 'weak' | 'moderate' | 'strong' | 'very_strong';
  reasoning: string;
  confidence: number;
  gameContext?: string;
}

interface CorrelationMatrixDisplayProps {
  players: Player[];
  correlations: CorrelationData[];
  onCorrelationUpdate?: (correlations: CorrelationData[]) => void;
  liveDataEnabled?: boolean;
}

export default function CorrelationMatrixDisplay({
  players,
  correlations,
  onCorrelationUpdate,
  liveDataEnabled = true,
}: CorrelationMatrixDisplayProps) {
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [heatmapMode, setHeatmapMode] = useState<'grid' | 'network'>('grid');
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(
    null
  );
  const [tooltipData, setTooltipData] = useState<CorrelationData | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Create correlation matrix from data
  const correlationMatrix = useMemo(() => {
    const matrix: number[][] = [];
    const playerMap = new Map(players.map((p, i) => [p.id, i]));

    // Initialize matrix with zeros
    for (let i = 0; i < players.length; i++) {
      matrix[i] = new Array(players.length).fill(0);
      matrix[i][i] = 1; // Self-correlation is 1
    }

    // Fill matrix with correlation data
    correlations.forEach(corr => {
      const idx1 = playerMap.get(corr.playerId1);
      const idx2 = playerMap.get(corr.playerId2);
      if (idx1 !== undefined && idx2 !== undefined) {
        matrix[idx1][idx2] = corr.correlation;
        matrix[idx2][idx1] = corr.correlation; // Symmetric matrix
      }
    });

    return matrix;
  }, [players, correlations]);

  // Filter correlations based on type
  const filteredCorrelations = useMemo(() => {
    if (filterType === 'all') return correlations;
    return correlations.filter(corr => corr.type === filterType);
  }, [correlations, filterType]);

  // Get correlation color
  const getCorrelationColor = (value: number, alpha: number = 1): string => {
    if (value === 0) return `rgba(240, 240, 240, ${alpha})`;
    if (value === 1) return `rgba(59, 130, 246, ${alpha})`; // Self-correlation

    const absValue = Math.abs(value);
    if (value > 0) {
      // Positive correlations: green scale
      const intensity = Math.min(absValue * 255, 255);
      return `rgba(34, 197, 94, ${(intensity / 255) * alpha})`;
    } else {
      // Negative correlations: red scale
      const intensity = Math.min(absValue * 255, 255);
      return `rgba(239, 68, 68, ${(intensity / 255) * alpha})`;
    }
  };

  // Get correlation strength label
  const getStrengthLabel = (value: number): string => {
    const abs = Math.abs(value);
    if (abs === 0) return 'None';
    if (abs === 1) return 'Self';
    if (abs >= 0.7) return 'Very Strong';
    if (abs >= 0.5) return 'Strong';
    if (abs >= 0.3) return 'Moderate';
    return 'Weak';
  };

  // Find correlation data for two players
  const findCorrelation = (
    playerId1: string,
    playerId2: string
  ): CorrelationData | null => {
    return (
      correlations.find(
        c =>
          (c.playerId1 === playerId1 && c.playerId2 === playerId2) ||
          (c.playerId1 === playerId2 && c.playerId2 === playerId1)
      ) || null
    );
  };

  // Handle cell hover
  const handleCellHover = (row: number, col: number, event: React.MouseEvent) => {
    if (row === col) return; // Skip self-correlations

    setHoveredCell({ row, col });
    const correlation = findCorrelation(players[row].id, players[col].id);
    setTooltipData(correlation);
  };

  // Handle cell click
  const handleCellClick = (row: number, col: number) => {
    if (row === col) return;
    setSelectedPlayer(selectedPlayer === players[row].id ? null : players[row].id);
  };

  // Render network visualization
  const renderNetworkVisualization = () => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.35;

    ctx.clearRect(0, 0, width, height);

    // Position players in circle
    const playerPositions = players.map((_, index) => {
      const angle = (index / players.length) * 2 * Math.PI - Math.PI / 2;
      return {
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
      };
    });

    // Draw correlation lines
    correlations.forEach(corr => {
      const idx1 = players.findIndex(p => p.id === corr.playerId1);
      const idx2 = players.findIndex(p => p.id === corr.playerId2);

      if (idx1 !== -1 && idx2 !== -1) {
        const pos1 = playerPositions[idx1];
        const pos2 = playerPositions[idx2];

        ctx.beginPath();
        ctx.moveTo(pos1.x, pos1.y);
        ctx.lineTo(pos2.x, pos2.y);

        const alpha = Math.abs(corr.correlation) * 0.8;
        ctx.strokeStyle = getCorrelationColor(corr.correlation, alpha);
        ctx.lineWidth = Math.abs(corr.correlation) * 5 + 1;
        ctx.stroke();
      }
    });

    // Draw player nodes
    players.forEach((player, index) => {
      const pos = playerPositions[index];

      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 20, 0, 2 * Math.PI);
      ctx.fillStyle = selectedPlayer === player.id ? '#3b82f6' : '#6b7280';
      ctx.fill();
      ctx.strokeStyle = '#374151';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Player name
      ctx.fillStyle = '#ffffff';
      ctx.font = '10px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(player.name.split(' ')[1] || player.name, pos.x, pos.y + 3);
    });
  };

  useEffect(() => {
    if (heatmapMode === 'network') {
      renderNetworkVisualization();
    }
  }, [heatmapMode, correlations, selectedPlayer, players]);

  return (
    <div className='space-y-6'>
      {/* Header Controls */}
      <div className='flex flex-wrap items-center justify-between gap-4'>
        <div>
          <h2 className='text-xl font-semibold text-gray-900'>
            Correlation Matrix Analysis
          </h2>
          <p className='text-sm text-gray-600 mt-1'>
            Interactive visualization of player correlations and relationships
          </p>
        </div>

        <div className='flex items-center space-x-4'>
          {/* Live Data Indicator */}
          {liveDataEnabled && (
            <div className='flex items-center space-x-2 text-sm'>
              <div className='w-2 h-2 bg-green-500 rounded-full animate-pulse'></div>
              <span className='text-green-700'>Live Data</span>
            </div>
          )}

          {/* View Mode Toggle */}
          <div className='flex items-center bg-gray-100 rounded-lg p-1'>
            <button
              onClick={() => setHeatmapMode('grid')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                heatmapMode === 'grid'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Grid View
            </button>
            <button
              onClick={() => setHeatmapMode('network')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                heatmapMode === 'network'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Network View
            </button>
          </div>

          {/* Filter Controls */}
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className='px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
            title='Filter correlation types'
            aria-label='Filter correlation types'
          >
            <option value='all'>All Correlations</option>
            <option value='stack'>Stack Correlations</option>
            <option value='game_script'>Game Script</option>
            <option value='weather'>Weather Impact</option>
            <option value='pace'>Pace Correlations</option>
            <option value='negative'>Negative Correlations</option>
            <option value='bring_back'>Bring-Back Plays</option>
          </select>
        </div>
      </div>

      {/* Main Visualization */}
      {heatmapMode === 'grid' ? (
        <Card className='p-6'>
          <div className='overflow-auto'>
            <div className='min-w-max'>
              {/* Grid Heatmap */}
              <table className='border-collapse'>
                <thead>
                  <tr>
                    <th className='w-32'></th>
                    {players.map((player, index) => (
                      <th
                        key={player.id}
                        className='w-16 h-16 text-xs text-center font-medium text-gray-700 p-1'
                        style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
                      >
                        <div className='truncate' title={player.name}>
                          {player.name.split(' ')[1] || player.name}
                        </div>
                        <div className='text-gray-500 text-xs'>{player.position}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {players.map((player, rowIndex) => (
                    <tr key={player.id}>
                      <td className='w-32 h-16 p-2 text-sm font-medium text-gray-900 border-r border-gray-200'>
                        <div className='truncate' title={player.name}>
                          {player.name}
                        </div>
                        <div className='text-xs text-gray-500'>
                          {player.position} • {player.team}
                        </div>
                      </td>
                      {players.map((_, colIndex) => {
                        const correlation = correlationMatrix[rowIndex][colIndex];
                        const isHovered =
                          hoveredCell?.row === rowIndex &&
                          hoveredCell?.col === colIndex;
                        const isSelected = selectedPlayer === player.id;

                        return (
                          <td
                            key={`${rowIndex}-${colIndex}`}
                            className={`w-16 h-16 border border-gray-200 cursor-pointer relative transition-all duration-200 ${
                              isHovered ? 'ring-2 ring-blue-500 z-10' : ''
                            } ${isSelected ? 'ring-2 ring-purple-500' : ''}`}
                            style={{
                              backgroundColor: getCorrelationColor(
                                correlation,
                                isHovered ? 0.9 : 0.7
                              ),
                            }}
                            onMouseEnter={e => handleCellHover(rowIndex, colIndex, e)}
                            onMouseLeave={() => {
                              setHoveredCell(null);
                              setTooltipData(null);
                            }}
                            onClick={() => handleCellClick(rowIndex, colIndex)}
                          >
                            <div className='absolute inset-0 flex items-center justify-center'>
                              <span
                                className={`text-xs font-medium ${
                                  Math.abs(correlation) > 0.5
                                    ? 'text-white'
                                    : 'text-gray-700'
                                }`}
                              >
                                {correlation === 0 ? '' : correlation.toFixed(2)}
                              </span>
                            </div>

                            {/* Tooltip */}
                            {isHovered && tooltipData && (
                              <div className='absolute z-20 bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg whitespace-nowrap'>
                                <div className='font-medium'>
                                  {players[rowIndex].name} ↔ {players[colIndex].name}
                                </div>
                                <div>Correlation: {correlation.toFixed(3)}</div>
                                <div>Strength: {getStrengthLabel(correlation)}</div>
                                <div>Type: {tooltipData.type.replace('_', ' ')}</div>
                                <div>
                                  Confidence:{' '}
                                  {(tooltipData.confidence * 100).toFixed(0)}%
                                </div>
                                <div className='mt-1 text-gray-300'>
                                  {tooltipData.reasoning}
                                </div>
                                <div className='absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900'></div>
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      ) : (
        /* Network Visualization */
        <Card className='p-6'>
          <div className='flex justify-center'>
            <canvas
              ref={canvasRef}
              width={600}
              height={600}
              className='border border-gray-200 rounded-lg'
            />
          </div>
        </Card>
      )}

      {/* Correlation Legend */}
      <Card className='p-4'>
        <h3 className='text-lg font-medium text-gray-900 mb-4'>Correlation Legend</h3>
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
          <div className='space-y-2'>
            <h4 className='text-sm font-medium text-gray-700'>Strength Scale</h4>
            <div className='space-y-1'>
              {[
                {
                  label: 'Very Strong',
                  range: '±0.70+',
                  color: getCorrelationColor(0.8),
                },
                {
                  label: 'Strong',
                  range: '±0.50-0.69',
                  color: getCorrelationColor(0.6),
                },
                {
                  label: 'Moderate',
                  range: '±0.30-0.49',
                  color: getCorrelationColor(0.4),
                },
                { label: 'Weak', range: '±0.01-0.29', color: getCorrelationColor(0.2) },
              ].map(item => (
                <div key={item.label} className='flex items-center space-x-2 text-xs'>
                  <div
                    className='w-4 h-4 rounded'
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span>
                    {item.label} ({item.range})
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className='space-y-2'>
            <h4 className='text-sm font-medium text-gray-700'>Correlation Types</h4>
            <div className='space-y-1 text-xs text-gray-600'>
              <div>• Stack: QB-WR/TE combinations</div>
              <div>• Game Script: RB + team success</div>
              <div>• Weather: Rain/wind impacts</div>
              <div>• Pace: Fast/slow game effects</div>
              <div>• Negative: Opposing correlations</div>
              <div>• Bring-Back: Hedge strategies</div>
            </div>
          </div>

          <div className='space-y-2'>
            <h4 className='text-sm font-medium text-gray-700'>Interactive Features</h4>
            <div className='space-y-1 text-xs text-gray-600'>
              <div>• Hover: View detailed correlation info</div>
              <div>• Click: Highlight player relationships</div>
              <div>• Filter: Focus on specific correlation types</div>
              <div>• Toggle: Switch between grid and network views</div>
            </div>
          </div>

          <div className='space-y-2'>
            <h4 className='text-sm font-medium text-gray-700'>Statistics</h4>
            <div className='space-y-1 text-xs text-gray-600'>
              <div>• Total Players: {players.length}</div>
              <div>• Correlations: {correlations.length}</div>
              <div>
                • Strong Correlations:{' '}
                {correlations.filter(c => Math.abs(c.correlation) >= 0.5).length}
              </div>
              <div>
                • Negative Correlations:{' '}
                {correlations.filter(c => c.correlation < 0).length}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Advanced Analytics Panel */}
      <Card className='p-6'>
        <h3 className='text-lg font-medium text-gray-900 mb-4'>
          Advanced Analytics Panel with insights correlation
        </h3>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          {/* Top Positive Correlations */}
          <div>
            <h4 className='text-sm font-medium text-gray-700 mb-3'>
              Strongest Positive Correlations
            </h4>
            <div className='space-y-2'>
              {filteredCorrelations
                .filter(c => c.correlation > 0)
                .sort((a, b) => b.correlation - a.correlation)
                .slice(0, 5)
                .map((corr, index) => {
                  const player1 = players.find(p => p.id === corr.playerId1);
                  const player2 = players.find(p => p.id === corr.playerId2);
                  return (
                    <div
                      key={index}
                      className='flex justify-between items-center text-sm'
                    >
                      <div className='truncate'>
                        <span className='font-medium'>{player1?.name}</span> ↔
                        <span className='font-medium'>{player2?.name}</span>
                      </div>
                      <div className='flex items-center space-x-2 ml-2'>
                        <span className='font-bold text-green-600'>
                          {corr.correlation.toFixed(3)}
                        </span>
                        <div
                          className='w-3 h-3 rounded'
                          style={{
                            backgroundColor: getCorrelationColor(corr.correlation),
                          }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Top Negative Correlations */}
          <div>
            <h4 className='text-sm font-medium text-gray-700 mb-3'>
              Strongest Negative Correlations
            </h4>
            <div className='space-y-2'>
              {filteredCorrelations
                .filter(c => c.correlation < 0)
                .sort((a, b) => a.correlation - b.correlation)
                .slice(0, 5)
                .map((corr, index) => {
                  const player1 = players.find(p => p.id === corr.playerId1);
                  const player2 = players.find(p => p.id === corr.playerId2);
                  return (
                    <div
                      key={index}
                      className='flex justify-between items-center text-sm'
                    >
                      <div className='truncate'>
                        <span className='font-medium'>{player1?.name}</span> ↔
                        <span className='font-medium'>{player2?.name}</span>
                      </div>
                      <div className='flex items-center space-x-2 ml-2'>
                        <span className='font-bold text-red-600'>
                          {corr.correlation.toFixed(3)}
                        </span>
                        <div
                          className='w-3 h-3 rounded'
                          style={{
                            backgroundColor: getCorrelationColor(corr.correlation),
                          }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Correlation Insights */}
          <div>
            <h4 className='text-sm font-medium text-gray-700 mb-3'>
              Key Analytics Insights Correlation
            </h4>
            <div className='space-y-2 text-sm text-gray-600'>
              <div className='p-3 bg-blue-50 rounded-lg'>
                <div className='font-medium text-blue-900'>
                  Optimal Stacks Analytics
                </div>
                <div className='text-blue-800'>
                  {
                    correlations.filter(c => c.type === 'stack' && c.correlation > 0.7)
                      .length
                  }{' '}
                  high-value stack opportunities identified with correlation insights
                </div>
              </div>

              <div className='p-3 bg-green-50 rounded-lg'>
                <div className='font-medium text-green-900'>Game Script Analytics</div>
                <div className='text-green-800'>
                  {
                    correlations.filter(
                      c => c.type === 'game_script' && c.correlation > 0.4
                    ).length
                  }{' '}
                  game script correlations with analytics insights
                </div>
              </div>

              <div className='p-3 bg-orange-50 rounded-lg'>
                <div className='font-medium text-orange-900'>Contrarian Analytics</div>
                <div className='text-orange-800'>
                  {correlations.filter(c => c.correlation < -0.3).length} negative
                  correlation insights for contrarian analytics
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
