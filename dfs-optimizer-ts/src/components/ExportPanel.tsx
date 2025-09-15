import React from 'react';
import { Lineup, Player, OptimizationSettings } from '../data/types';

interface ExportPanelProps {
  lineups: Lineup[];
  players: Player[];
  settings: OptimizationSettings;
}

const ExportPanel: React.FC<ExportPanelProps> = ({ lineups, players, settings }) => {
  const handleExportCSV = () => {
    if (lineups.length === 0) {
      alert('No lineups to export');
      return;
    }

    // Create CSV content
    const csvContent = lineups.map((lineup, index) => {
      const playersList = lineup.players.map(p => p.name).join(', ');
      return `Lineup ${index + 1},${lineup.totalSalary},${lineup.projectedScore.toFixed(1)},${playersList}`;
    }).join('\n');

    const header = 'Lineup,Salary,Projection,Players\n';
    const fullCSV = header + csvContent;

    // Create download link
    const blob = new Blob([fullCSV], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dfs-lineups-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyToClipboard = () => {
    if (lineups.length === 0) {
      alert('No lineups to copy');
      return;
    }

    const text = lineups.map((lineup, index) => {
      return `Lineup ${index + 1}:\n` +
        lineup.players.map(p => `  ${p.positions.join('/')} - ${p.name} (${p.team}) - $${p.salary}`).join('\n') +
        `\nTotal: $${lineup.totalSalary} | Projection: ${lineup.projectedScore.toFixed(1)}\n`;
    }).join('\n');

    navigator.clipboard.writeText(text).then(() => {
      alert('Lineups copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy: ', err);
      alert('Failed to copy to clipboard');
    });
  };

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">Export Options</h3>
        <div className="space-y-2">
          <button
            onClick={handleExportCSV}
            disabled={lineups.length === 0}
            className="bg-green-600 text-white px-4 py-2 rounded w-full disabled:bg-gray-400"
          >
            Export to CSV
          </button>
          <button
            onClick={handleCopyToClipboard}
            disabled={lineups.length === 0}
            className="bg-blue-600 text-white px-4 py-2 rounded w-full disabled:bg-gray-400"
          >
            Copy to Clipboard
          </button>
        </div>
      </div>

      {lineups.length > 0 && (
        <div>
          <h3 className="text-lg font-medium mb-2">Summary</h3>
          <div className="text-sm space-y-1">
            <div>Total Lineups: {lineups.length}</div>
            <div>Average Salary: ${Math.round(lineups.reduce((sum, l) => sum + l.totalSalary, 0) / lineups.length).toLocaleString()}</div>
            <div>Average Projection: {lineups.reduce((sum, l) => sum + l.projectedScore, 0) / lineups.length}</div>
            <div>Unique Players: {new Set(lineups.flatMap(l => l.players.map(p => p.playerId))).size}</div>
          </div>
        </div>
      )}

      {lineups.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          No lineups generated yet. Generate lineups in the Lineup Builder.
        </div>
      )}
    </div>
  );
};

export default ExportPanel;
