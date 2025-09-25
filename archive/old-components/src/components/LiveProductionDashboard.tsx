import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { optimizationAPI } from '../services/optimization-api';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Alert } from './ui/alert';

interface Player {
  player_id: string;
  display_name: string;
  position: string;
  salary: number;
  team_abbreviation: string;
  opponent: string;
  projection: number;
  ownership: number;
  boom_rate: number;
  bust_rate: number;
  status: string;
}

interface Slate {
  id: string;
  name: string;
  sport: string;
  startTime: string;
  salaryCap: number;
  playerCount: number;
  status: string;
}

interface OptimizedLineup {
  lineupId: string;
  players: Array<{
    playerId: string;
    playerName: string;
    position: string;
    team: string;
    salary: number;
    projectedPoints: number;
    ownership: number;
  }>;
  totalSalary: number;
  projectedScore: number;
  ownership: number;
  leverage: number;
  roi: number;
}

export default function LiveProductionDashboard() {
  const [selectedSlateId, setSelectedSlateId] = useState<string | null>(null);
  const [optimizedLineups, setOptimizedLineups] = useState<OptimizedLineup[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [playerAdjustments, setPlayerAdjustments] = useState<Record<string, number>>(
    {}
  );

  const queryClient = useQueryClient();

  // Fetch available slates with fallback data
  const { data: slatesData, isLoading: slatesLoading } = useQuery({
    queryKey: ['slates'],
    queryFn: async () => {
      try {
        const response = await fetch('http://localhost:8000/api/slates');
        if (!response.ok) throw new Error('Failed to fetch slates');
        return response.json();
      } catch (error) {
        // Fallback to demo data when API is unavailable
        return {
          slates: [
            {
              id: 'nfl_main_demo',
              name: 'NFL Week 3 - Main Slate (Demo)',
              sport: 'NFL',
              startTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
              salaryCap: 50000,
              playerCount: 247,
              status: 'active',
            },
            {
              id: 'nfl_sunday_demo',
              name: 'NFL Sunday Million (Demo)',
              sport: 'NFL',
              startTime: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(),
              salaryCap: 50000,
              playerCount: 189,
              status: 'active',
            },
          ],
        };
      }
    },
    refetchInterval: 30000,
  });

  // Fetch players for selected slate
  const { data: playersData, isLoading: playersLoading } = useQuery({
    queryKey: ['players', selectedSlateId],
    queryFn: async () => {
      if (!selectedSlateId) return null;
      const response = await fetch(
        `http://localhost:8000/api/slates/${selectedSlateId}/players`
      );
      if (!response.ok) throw new Error('Failed to fetch players');
      return response.json();
    },
    enabled: !!selectedSlateId,
  });

  // API health check
  const { data: healthData } = useQuery({
    queryKey: ['health'],
    queryFn: async () => {
      const response = await fetch('http://localhost:8000/api/healthz', {
        headers: {
          'X-API-Key': 'dfs-demo-key',
        },
      });
      if (!response.ok) throw new Error('Health check failed');
      return response.json();
    },
    refetchInterval: 10000,
  });

  // Optimization mutation
  const optimizeMutation = useMutation({
    mutationFn: async () => {
      if (!playersData?.players) throw new Error('No players data available');

      setIsOptimizing(true);
      const request = {
        slateId: selectedSlateId!,
        players: playersData.players.map((p: Player) => ({
          ...p,
          projection: playerAdjustments[p.player_id] ?? p.projection,
        })),
        constraints: {
          numLineups: 20,
          salaryCapMode: 'hard' as const,
          salaryCap: playersData.salary_cap || 50000,
          uniquePlayers: 6,
          minSalary: 49000,
          maxSalary: 50000,
          // Advanced constraint handling for optimization
          constraintValidation: true,
          constraintEnforcement: 'strict',
        },
        stacks: [],
        variance: {
          randomnessLevel: 0.8,
          distributionMode: 'normal' as const,
          weatherAdjustments: true,
        },
        simulation: {
          enabled: true,
          iterations: 10000,
          correlationMatrix: true,
        },
      };

      const response = await fetch('http://localhost:8000/api/optimize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': 'dfs-demo-key',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) throw new Error('Optimization failed');
      return response.json();
    },
    onSuccess: data => {
      setOptimizedLineups(data.lineups || []);
      setIsOptimizing(false);
    },
    onError: error => {
      console.error('Optimization failed:', error);
      setIsOptimizing(false);
    },
  });

  const handleOptimize = () => {
    optimizeMutation.mutate();
  };

  const handleProjectionChange = (playerId: string, newProjection: number) => {
    setPlayerAdjustments(prev => ({
      ...prev,
      [playerId]: newProjection,
    }));
  };

  if (slatesLoading) {
    return (
      <div className='flex items-center justify-center h-screen'>
        <div className='text-lg'>Loading slates...</div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50 p-4'>
      {/* Header */}
      <div className='mb-6'>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-bold text-gray-900'>
              Live DFS Production Dashboard
            </h1>
            <p className='text-gray-600 mt-1'>
              Real-time optimization with MCP integration
            </p>
          </div>

          {/* System Status */}
          <div className='flex items-center space-x-4'>
            <Badge
              variant={healthData?.status === 'healthy' ? 'default' : 'destructive'}
            >
              API: {healthData?.status || 'Unknown'}
            </Badge>
            <Badge variant='outline'>
              MCP Servers:{' '}
              {healthData?.mcp_servers ? Object.keys(healthData.mcp_servers).length : 0}
            </Badge>
          </div>
        </div>
      </div>

      {/* Slate Selection */}
      <Card className='mb-6 p-4'>
        <h2 className='text-xl font-semibold mb-3'>Select Contest</h2>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
          {slatesData?.slates?.map((slate: Slate) => (
            <div
              key={slate.id}
              className={`p-4 border rounded-lg cursor-pointer transition-all ${
                selectedSlateId === slate.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedSlateId(slate.id)}
            >
              <h3 className='font-medium'>{slate.name}</h3>
              <p className='text-sm text-gray-600'>
                {slate.playerCount} players • ${slate.salaryCap.toLocaleString()} cap
              </p>
              <p className='text-xs text-gray-500 mt-1'>
                {new Date(slate.startTime).toLocaleTimeString()}
              </p>
              <Badge variant={slate.status === 'active' ? 'default' : 'secondary'}>
                {slate.status}
              </Badge>
            </div>
          ))}
        </div>
      </Card>

      {selectedSlateId && (
        <div className='grid grid-cols-1 xl:grid-cols-3 gap-6'>
          {/* Player Pool */}
          <div className='xl:col-span-2'>
            <Card className='p-4'>
              <div className='flex items-center justify-between mb-4'>
                <h2 className='text-xl font-semibold'>Player Pool</h2>
                <Button
                  onClick={handleOptimize}
                  disabled={isOptimizing || playersLoading}
                  className='bg-green-600 hover:bg-green-700'
                >
                  {isOptimizing ? 'Optimizing...' : 'Generate Lineups'}
                </Button>
              </div>

              {playersLoading ? (
                <div className='text-center py-8'>Loading players...</div>
              ) : (
                <div className='overflow-auto max-h-96'>
                  <table className='w-full text-sm'>
                    <thead className='sticky top-0 bg-gray-50'>
                      <tr>
                        <th className='text-left p-2'>Player</th>
                        <th className='text-left p-2'>Pos</th>
                        <th className='text-left p-2'>Team</th>
                        <th className='text-left p-2'>Salary</th>
                        <th className='text-left p-2'>Projection</th>
                        <th className='text-left p-2'>Value</th>
                        <th className='text-left p-2'>Own%</th>
                        <th className='text-left p-2'>Boom%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {playersData?.players?.slice(0, 50)?.map((player: Player) => {
                        const currentProjection =
                          playerAdjustments[player.player_id] ?? player.projection;
                        const value = (
                          (currentProjection * 1000) /
                          player.salary
                        ).toFixed(2);

                        return (
                          <tr
                            key={player.player_id}
                            className='border-t hover:bg-gray-50'
                          >
                            <td className='p-2 font-medium'>{player.display_name}</td>
                            <td className='p-2'>{player.position}</td>
                            <td className='p-2'>{player.team_abbreviation}</td>
                            <td className='p-2'>${player.salary.toLocaleString()}</td>
                            <td className='p-2'>
                              <Input
                                type='number'
                                step='0.1'
                                value={currentProjection}
                                onChange={e =>
                                  handleProjectionChange(
                                    player.player_id,
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                className='w-20 text-xs'
                              />
                            </td>
                            <td className='p-2'>
                              <span
                                className={
                                  parseFloat(value) >= 2.5
                                    ? 'text-green-600 font-medium'
                                    : parseFloat(value) >= 2.0
                                      ? 'text-yellow-600'
                                      : 'text-red-600'
                                }
                              >
                                {value}x
                              </span>
                            </td>
                            <td className='p-2'>
                              {(player.ownership * 100).toFixed(1)}%
                            </td>
                            <td className='p-2'>
                              {(player.boom_rate * 100).toFixed(1)}%
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>

          {/* Results Sidebar */}
          <div>
            <Card className='p-4'>
              <h2 className='text-xl font-semibold mb-4'>Optimized Lineups</h2>

              {isOptimizing && (
                <div className='text-center py-8'>
                  <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2'></div>
                  <p>Generating lineups...</p>
                </div>
              )}

              {optimizedLineups.length > 0 && (
                <div className='space-y-3'>
                  <div className='text-sm text-gray-600 mb-3'>
                    Generated {optimizedLineups.length} lineups
                  </div>

                  {optimizedLineups.slice(0, 10).map((lineup, index) => (
                    <div key={lineup.lineupId} className='border rounded-lg p-3'>
                      <div className='flex items-center justify-between mb-2'>
                        <span className='font-medium'>Lineup {index + 1}</span>
                        <div className='flex space-x-2'>
                          <Badge variant='outline'>
                            ROI: {lineup.roi ? `${lineup.roi.toFixed(0)}%` : 'N/A'}
                          </Badge>
                          <Badge variant='secondary'>
                            ${lineup.totalSalary.toLocaleString()}
                          </Badge>
                        </div>
                      </div>

                      <div className='text-xs space-y-1'>
                        {lineup.players.map((player, i) => (
                          <div key={i} className='flex justify-between'>
                            <span>{player.playerName}</span>
                            <span className='text-gray-500'>
                              {player.projectedPoints.toFixed(1)}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className='mt-2 pt-2 border-t text-xs text-gray-600'>
                        Projected: {lineup.projectedScore.toFixed(1)} pts
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {optimizedLineups.length === 0 && !isOptimizing && (
                <Alert>
                  <div className='text-sm'>
                    Select a slate and click "Generate Lineups" to start optimization
                  </div>
                </Alert>
              )}
            </Card>
          </div>
        </div>
      )}

      {!selectedSlateId && (
        <Alert className='mt-6'>
          <div>Select a contest above to begin optimization</div>
        </Alert>
      )}
    </div>
  );
}
