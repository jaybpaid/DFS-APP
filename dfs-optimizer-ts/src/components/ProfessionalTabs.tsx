import React, { useState } from 'react';
import { Player, Lineup, SimulationResult, Portfolio } from '../data/types';
import { OptimizerSolver } from '../opt/solver';
import { MonteCarloSimulator, SimulationSettings } from '../sim/monteCarlo';
import PlayerPool from './PlayerPool';
import LineupBuilder from './LineupBuilder';
import ExportPanel from './ExportPanel';

interface ProfessionalTabsProps {
  players: Player[];
  onPlayersUpdate: (players: Player[]) => void;
}

export const ProfessionalTabs: React.FC<ProfessionalTabsProps> = ({
  players,
  onPlayersUpdate
}) => {
  const [activeTab, setActiveTab] = useState<'pool' | 'optimize' | 'simulate' | 'portfolio' | 'export'>('pool');
  const [lineups, setLineups] = useState<Lineup[]>([]);
  const [simulationResults, setSimulationResults] = useState<SimulationResult | null>(null);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);

  const handleOptimize = async () => {
    setIsOptimizing(true);
    try {
      const solver = new OptimizerSolver(players, {
        maxLineups: 20,
        maxExposure: 0.3,
        minSalary: 48000,
        maxSalary: 50000,
        sport: 'NFL'
      });

      const result = await solver.optimize();
      if (result.status === 'optimal' || result.status === 'feasible') {
        setLineups(result.lineups);
        setActiveTab('optimize');
      }
    } catch (error) {
      console.error('Optimization failed:', error);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleSimulate = async () => {
    if (lineups.length === 0) return;
    
    setIsSimulating(true);
    try {
      const simulator = new MonteCarloSimulator(players, lineups, {
        trials: 1000,
        includeCorrelation: true,
        sport: 'NFL',
        contestType: 'GPP'
      });

      const results = await simulator.simulate();
      setSimulationResults(results);
      setActiveTab('simulate');
    } catch (error) {
      console.error('Simulation failed:', error);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleBuildPortfolio = () => {
    if (lineups.length === 0) return;

    const exposures: Record<string, number> = {};
    players.forEach(player => {
      const count = lineups.filter(l => l.players.some(p => p.playerId === player.playerId)).length;
      exposures[player.playerId] = count / lineups.length;
    });

    const totalEV = lineups.reduce((sum, l) => sum + l.simEV, 0) / lineups.length;
    const totalROI = lineups.reduce((sum, l) => sum + (l.expectedROI || 0), 0) / lineups.length;

    const portfolio: Portfolio = {
      lineups,
      exposures,
      uniqueness: calculateUniqueness(lineups),
      totalEV,
      totalROI
    };

    setPortfolio(portfolio);
    setActiveTab('portfolio');
  };

  const calculateUniqueness = (lineups: Lineup[]): number => {
    if (lineups.length <= 1) return 100;
    
    const playerCounts: Record<string, number> = {};
    const totalPlayers = lineups.length * 9;

    lineups.forEach(lineup => {
      lineup.players.forEach(player => {
        playerCounts[player.playerId] = (playerCounts[player.playerId] || 0) + 1;
      });
    });

    const overlap = Object.values(playerCounts).reduce((sum, count) => sum + Math.max(0, count - 1), 0);
    return Math.max(0, 100 - (overlap / totalPlayers) * 100);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'pool':
        return (
          <PlayerPool
            players={players}
            onPlayersUpdate={onPlayersUpdate}
            settings={{
              maxLineups: 20,
              maxExposure: 0.3,
              minSalary: 48000,
              maxSalary: 50000,
              sport: 'NFL'
            }}
          />
        );

      case 'optimize':
        return (
          <div className="optimize-tab">
            <div className="tab-header">
              <h2>Optimized Lineups</h2>
              <div className="tab-actions">
                <button 
                  onClick={handleSimulate}
                  disabled={isSimulating || lineups.length === 0}
                  className="btn btn-primary"
                >
                  {isSimulating ? 'Simulating...' : 'Run Simulation'}
                </button>
                <button 
                  onClick={handleBuildPortfolio}
                  disabled={lineups.length === 0}
                  className="btn btn-secondary"
                >
                  Build Portfolio
                </button>
              </div>
            </div>
            <LineupBuilder 
              players={players}
              lineups={lineups}
              onLineupsUpdate={setLineups}
              settings={{
                maxLineups: 20,
                maxExposure: 0.3,
                minSalary: 48000,
                maxSalary: 50000,
                sport: 'NFL'
              }}
            />
          </div>
        );

      case 'simulate':
        return (
          <div className="simulate-tab">
            <div className="tab-header">
              <h2>Monte Carlo Simulation Results</h2>
              {simulationResults && (
                <div className="simulation-stats">
                  <span>Trials: {simulationResults.trials}</span>
                  <span>Correlation: {simulationResults.correlationApplied ? 'Applied' : 'Disabled'}</span>
                </div>
              )}
            </div>
            {simulationResults && (
              <div className="simulation-results">
                <h3>Lineup Performance</h3>
                <div className="lineup-metrics-grid">
                  {simulationResults.lineupMetrics.map((metrics, index) => (
                    <div key={index} className="lineup-metric-card">
                      <h4>Lineup {index + 1}</h4>
                      <div className="metrics">
                        <div>Score: {metrics.score.toFixed(1)}</div>
                        <div>Optimal%: {(metrics.optimalPercentage * 100).toFixed(1)}%</div>
                        <div>Cash%: {(metrics.cashPercentage * 100).toFixed(1)}%</div>
                        <div>Boom%: {(metrics.boomPercentage * 100).toFixed(1)}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 'portfolio':
        return (
          <div className="portfolio-tab">
            <div className="tab-header">
              <h2>Portfolio Analysis</h2>
              {portfolio && (
                <div className="portfolio-stats">
                  <span>Lineups: {portfolio.lineups.length}</span>
                  <span>Uniqueness: {portfolio.uniqueness.toFixed(1)}%</span>
                  <span>Expected EV: {portfolio.totalEV.toFixed(1)}</span>
                  <span>Expected ROI: {(portfolio.totalROI * 100).toFixed(1)}%</span>
                </div>
              )}
            </div>
            {portfolio && (
              <div className="portfolio-details">
                <h3>Player Exposures</h3>
                <div className="exposure-grid">
                  {Object.entries(portfolio.exposures)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 20)
                    .map(([playerId, exposure]) => {
                      const player = players.find(p => p.playerId === playerId);
                      return player ? (
                        <div key={playerId} className="exposure-item">
                          <span className="player-name">{player.name}</span>
                          <span className="exposure-value">{(exposure * 100).toFixed(1)}%</span>
                        </div>
                      ) : null;
                    })}
                </div>
              </div>
            )}
          </div>
        );

      case 'export':
        return (
          <ExportPanel 
            lineups={lineups} 
            players={players}
            settings={{
              maxLineups: 20,
              maxExposure: 0.3,
              minSalary: 48000,
              maxSalary: 50000,
              sport: 'NFL'
            }}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="professional-tabs">
      <div className="tabs-header">
        <div className="tabs-navigation">
          <button
            className={activeTab === 'pool' ? 'active' : ''}
            onClick={() => setActiveTab('pool')}
          >
            Player Pool
          </button>
          <button
            className={activeTab === 'optimize' ? 'active' : ''}
            onClick={() => setActiveTab('optimize')}
            disabled={players.length === 0}
          >
            Optimize
          </button>
          <button
            className={activeTab === 'simulate' ? 'active' : ''}
            onClick={() => setActiveTab('simulate')}
            disabled={lineups.length === 0}
          >
            Simulate
          </button>
          <button
            className={activeTab === 'portfolio' ? 'active' : ''}
            onClick={() => setActiveTab('portfolio')}
            disabled={lineups.length === 0}
          >
            Portfolio
          </button>
          <button
            className={activeTab === 'export' ? 'active' : ''}
            onClick={() => setActiveTab('export')}
            disabled={lineups.length === 0}
          >
            Export
          </button>
        </div>
      </div>

      <div className="tabs-content">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default ProfessionalTabs;
