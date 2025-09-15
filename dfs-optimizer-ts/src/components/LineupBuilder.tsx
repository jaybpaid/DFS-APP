import React, { useState } from 'react';
import { Player, Lineup, OptimizationSettings } from '../data/types';

interface LineupBuilderProps {
  players: Player[];
  lineups: Lineup[];
  onLineupsUpdate: (lineups: Lineup[]) => void;
  settings: OptimizationSettings;
}

const LineupBuilder: React.FC<LineupBuilderProps> = ({ players, lineups, onLineupsUpdate, settings }) => {
  const [isOptimizing, setIsOptimizing] = useState(false);

  const handleOptimize = async () => {
    setIsOptimizing(true);
    
    // Simulate optimization process
    setTimeout(() => {
      const activePlayers = players.filter(p => p.status === 'active');
      if (activePlayers.length === 0) {
        setIsOptimizing(false);
        return;
      }

      // Generate some sample lineups for demonstration
      const generatedLineups: Lineup[] = [];
      for (let i = 0; i < Math.min(settings.maxLineups, 5); i++) {
        const lineupPlayers = [...activePlayers]
          .sort(() => Math.random() - 0.5)
          .slice(0, 9)
          .sort((a, b) => a.positions[0].localeCompare(b.positions[0]));
        
        const totalSalary = lineupPlayers.reduce((sum, p) => sum + p.salary, 0);
        const projectedScore = lineupPlayers.reduce((sum, p) => sum + (p.projection || 0), 0);
        
        generatedLineups.push({
          players: lineupPlayers,
          totalSalary,
          projectedScore,
          simEV: projectedScore * 0.8 + Math.random() * 5,
          constraints: []
        });
      }

      onLineupsUpdate(generatedLineups);
      setIsOptimizing(false);
    }, 2000);
  };

  const handleClearLineups = () => {
    onLineupsUpdate([]);
  };

  return (
    <div>
      <div className="mb-6">
        <button
          onClick={handleOptimize}
          disabled={isOptimizing || players.filter(p => p.status === 'active').length === 0}
          className="bg-blue-600 text-white px-4 py-2 rounded mr-2 disabled:bg-gray-400"
        >
          {isOptimizing ? 'Optimizing...' : 'Generate Lineups'}
        </button>
        
        <button
          onClick={handleClearLineups}
          className="bg-gray-600 text-white px-4 py-2 rounded"
        >
          Clear All
        </button>
      </div>

      {lineups.length > 0 ? (
        <div className="overflow-y-auto" style={{ maxHeight: '400px' }}>
          {lineups.map((lineup, index) => (
            <div key={index} className="mb-4 p-4 border rounded bg-white">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium">Lineup #{index + 1}</h3>
                <div className="text-sm text-gray-600">
                  Salary: ${lineup.totalSalary.toLocaleString()} | 
                  Projection: {lineup.projectedScore.toFixed(1)}
                </div>
              </div>
              
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-1 border text-left">Pos</th>
                    <th className="p-1 border text-left">Player</th>
                    <th className="p-1 border text-left">Team</th>
                    <th className="p-1 border text-left">Salary</th>
                    <th className="p-1 border text-left">Proj</th>
                  </tr>
                </thead>
                <tbody>
                  {lineup.players.map((player, playerIndex) => (
                    <tr key={playerIndex}>
                      <td className="p-1 border">{player.positions.join('/')}</td>
                      <td className="p-1 border">{player.name}</td>
                      <td className="p-1 border">{player.team}</td>
                      <td className="p-1 border">${player.salary.toLocaleString()}</td>
                      <td className="p-1 border">{player.projection?.toFixed(1) || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-500 py-8">
          {players.filter(p => p.status === 'active').length === 0 
            ? 'No active players selected. Select players in the Player Pool first.'
            : 'Click "Generate Lineups" to create optimized lineups.'
          }
        </div>
      )}
    </div>
  );
};

export default LineupBuilder;
