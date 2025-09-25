import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
} from 'recharts';
import {
  TrendingUp,
  Users,
  DollarSign,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
} from 'lucide-react';
import { PlayerWithProjection } from '@shared/schema';

interface SlateAnalysisDashboardProps {
  players: PlayerWithProjection[];
  sport: 'nfl' | 'nba';
  site: 'dk' | 'fd';
}

export function SlateAnalysisDashboard({
  players,
  sport,
  site,
}: SlateAnalysisDashboardProps) {
  const [analysisView, setAnalysisView] = useState<
    'overview' | 'correlations' | 'stacking' | 'value'
  >('overview');

  // Calculate slate metrics
  const totalSalary = site === 'dk' ? 50000 : 60000;
  const usedSalary = players.reduce((sum, p) => sum + (p.salary || 0), 0);
  const salaryUtilization = (usedSalary / totalSalary) * 100;

  const avgProjection =
    players.reduce((sum, p) => sum + (p.projection || 0), 0) / players.length;
  const avgValue = players.reduce((sum, p) => sum + (p.value || 0), 0) / players.length;

  // Position distribution
  const positionData = players.reduce(
    (acc, player) => {
      acc[player.position] = (acc[player.position] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const positionChartData = Object.entries(positionData).map(([position, count]) => ({
    position,
    count,
    percentage: ((count / players.length) * 100).toFixed(1),
  }));

  // Salary distribution
  const salaryRanges = [
    { range: '$0-5K', min: 0, max: 5000, color: '#ef4444' },
    { range: '$5K-10K', min: 5000, max: 10000, color: '#f97316' },
    { range: '$10K-15K', min: 10000, max: 15000, color: '#eab308' },
    { range: '$15K-20K', min: 15000, max: 20000, color: '#22c55e' },
    { range: '$20K+', min: 20000, max: Infinity, color: '#3b82f6' },
  ];

  const salaryDistribution = salaryRanges.map(range => ({
    range: range.range,
    count: players.filter(
      p => (p.salary || 0) >= range.min && (p.salary || 0) < range.max
    ).length,
    color: range.color,
  }));

  // Value vs Salary scatter plot
  const scatterData = players.map(player => ({
    salary: player.salary || 0,
    value: player.value || 0,
    projection: player.projection || 0,
    name: player.name.split(' ')[1],
    position: player.position,
  }));

  // Correlation analysis
  const correlations = players.reduce(
    (acc, player) => {
      const team = player.team;
      if (!acc[team]) acc[team] = [];
      acc[team].push(player);
      return acc;
    },
    {} as Record<string, PlayerWithProjection[]>
  );

  const teamCorrelationData = Object.entries(correlations)
    .map(([team, teamPlayers]) => ({
      team,
      players: (teamPlayers as PlayerWithProjection[]).length,
      avgProjection:
        (teamPlayers as PlayerWithProjection[]).reduce(
          (sum, p) => sum + (p.projection || 0),
          0
        ) / (teamPlayers as PlayerWithProjection[]).length,
      totalSalary: (teamPlayers as PlayerWithProjection[]).reduce(
        (sum, p) => sum + (p.salary || 0),
        0
      ),
    }))
    .sort((a, b) => b.avgProjection - a.avgProjection)
    .slice(0, 10);

  const renderMetricCard = (
    title: string,
    value: string | number,
    icon: React.ReactNode,
    trend?: 'up' | 'down' | 'neutral'
  ) => (
    <Card>
      <CardContent className='p-4'>
        <div className='flex items-center justify-between'>
          <div>
            <p className='text-sm text-muted-foreground'>{title}</p>
            <p className='text-2xl font-bold'>{value}</p>
          </div>
          <div className='flex items-center gap-2'>
            {icon}
            {trend && (
              <div
                className={`text-xs ${
                  trend === 'up'
                    ? 'text-green-500'
                    : trend === 'down'
                      ? 'text-red-500'
                      : 'text-gray-500'
                }`}
              >
                {trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→'}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className='space-y-6'>
      {/* Key Metrics Overview */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        {renderMetricCard(
          'Total Players',
          players.length,
          <Users className='w-5 h-5 text-blue-500' />
        )}
        {renderMetricCard(
          'Avg Projection',
          avgProjection.toFixed(1),
          <Target className='w-5 h-5 text-green-500' />
        )}
        {renderMetricCard(
          'Avg Value',
          avgValue.toFixed(2),
          <DollarSign className='w-5 h-5 text-purple-500' />
        )}
        {renderMetricCard(
          'Salary Used',
          `${salaryUtilization.toFixed(1)}%`,
          <TrendingUp className='w-5 h-5 text-orange-500' />
        )}
      </div>

      {/* Analysis Tabs */}
      <Tabs value={analysisView} onValueChange={v => setAnalysisView(v as any)}>
        <TabsList className='grid w-full grid-cols-4'>
          <TabsTrigger value='overview'>Overview</TabsTrigger>
          <TabsTrigger value='correlations'>Correlations</TabsTrigger>
          <TabsTrigger value='stacking'>Stacking</TabsTrigger>
          <TabsTrigger value='value'>Value Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value='overview' className='space-y-6'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            {/* Position Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Position Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width='100%' height={300}>
                  <PieChart>
                    <Pie
                      data={positionChartData}
                      cx='50%'
                      cy='50%'
                      outerRadius={80}
                      dataKey='count'
                      label={({ position, percentage }) =>
                        `${position}: ${percentage}%`
                      }
                    >
                      {positionChartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={`hsl(${index * 45}, 70%, 50%)`}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Salary Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Salary Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width='100%' height={300}>
                  <BarChart data={salaryDistribution}>
                    <CartesianGrid strokeDasharray='3 3' />
                    <XAxis dataKey='range' />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey='count' fill='#3b82f6' />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Salary vs Value Scatter */}
          <Card>
            <CardHeader>
              <CardTitle>Salary vs Value Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width='100%' height={400}>
                <ScatterChart data={scatterData}>
                  <CartesianGrid strokeDasharray='3 3' />
                  <XAxis
                    type='number'
                    dataKey='salary'
                    name='Salary'
                    domain={['dataMin', 'dataMax']}
                  />
                  <YAxis
                    type='number'
                    dataKey='value'
                    name='Value'
                    domain={['dataMin', 'dataMax']}
                  />
                  <Tooltip
                    cursor={{ strokeDasharray: '3 3' }}
                    formatter={(value, name) => [value, name]}
                    labelFormatter={label => `Player: ${label}`}
                  />
                  <Scatter dataKey='value' fill='#3b82f6' />
                </ScatterChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='correlations' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle>Team Correlations</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width='100%' height={400}>
                <BarChart data={teamCorrelationData} layout='horizontal'>
                  <CartesianGrid strokeDasharray='3 3' />
                  <XAxis type='number' />
                  <YAxis dataKey='team' type='category' width={60} />
                  <Tooltip />
                  <Bar dataKey='avgProjection' fill='#10b981' />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Team Stack Opportunities */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            {teamCorrelationData.slice(0, 6).map(team => (
              <Card key={team.team}>
                <CardHeader>
                  <CardTitle className='text-lg'>{team.team}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='space-y-2'>
                    <div className='flex justify-between'>
                      <span>Players Available:</span>
                      <Badge>{team.players}</Badge>
                    </div>
                    <div className='flex justify-between'>
                      <span>Avg Projection:</span>
                      <span className='font-medium'>
                        {team.avgProjection.toFixed(1)}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span>Total Salary:</span>
                      <span className='font-medium'>
                        ${team.totalSalary.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value='stacking' className='space-y-6'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            {/* NFL Stacking Analysis */}
            {sport === 'nfl' && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>QB-Pass Catcher Stacks</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='space-y-4'>
                      {players
                        .filter(p => p.position === 'QB')
                        .slice(0, 5)
                        .map(qb => {
                          const passCatchers = players.filter(
                            p => ['WR', 'TE'].includes(p.position) && p.team === qb.team
                          );
                          return (
                            <div key={qb.id} className='border rounded-lg p-3'>
                              <div className='flex items-center justify-between mb-2'>
                                <span className='font-medium'>{qb.name}</span>
                                <Badge>{passCatchers.length} options</Badge>
                              </div>
                              <div className='text-sm text-muted-foreground'>
                                {passCatchers
                                  .slice(0, 3)
                                  .map(pc => pc.name.split(' ')[1])
                                  .join(', ')}
                                {passCatchers.length > 3 && '...'}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>RB-DST Stacks</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='space-y-4'>
                      {players
                        .filter(p => p.position === 'RB')
                        .slice(0, 5)
                        .map(rb => {
                          const dst = players.find(
                            p => p.position === 'DST' && p.team === rb.team
                          );
                          return (
                            <div key={rb.id} className='border rounded-lg p-3'>
                              <div className='flex items-center justify-between mb-2'>
                                <span className='font-medium'>{rb.name}</span>
                                {dst ? (
                                  <CheckCircle className='w-4 h-4 text-green-500' />
                                ) : (
                                  <AlertTriangle className='w-4 h-4 text-yellow-500' />
                                )}
                              </div>
                              <div className='text-sm text-muted-foreground'>
                                DST: {dst ? dst.name : 'Not available'}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {/* NBA Stacking Analysis */}
            {sport === 'nba' && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Guard-Forward Stacks</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className='text-muted-foreground'>
                      NBA stacking analysis coming soon...
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Big Man Combinations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className='text-muted-foreground'>
                      NBA stacking analysis coming soon...
                    </p>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </TabsContent>

        <TabsContent value='value' className='space-y-6'>
          {/* Value Leaders */}
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            <Card>
              <CardHeader>
                <CardTitle>Top Value Plays</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-3'>
                  {players
                    .sort((a, b) => (b.value || 0) - (a.value || 0))
                    .slice(0, 10)
                    .map((player, index) => (
                      <div
                        key={player.id}
                        className='flex items-center justify-between p-2 border rounded'
                      >
                        <div className='flex items-center gap-3'>
                          <Badge variant='outline'>{index + 1}</Badge>
                          <div>
                            <div className='font-medium text-sm'>{player.name}</div>
                            <div className='text-xs text-muted-foreground'>
                              {player.position} • {player.team}
                            </div>
                          </div>
                        </div>
                        <div className='text-right'>
                          <div className='font-medium text-primary'>
                            {player.value?.toFixed(2)}
                          </div>
                          <div className='text-xs text-muted-foreground'>
                            ${player.salary?.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Projection Leaders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-3'>
                  {players
                    .sort((a, b) => (b.projection || 0) - (a.projection || 0))
                    .slice(0, 10)
                    .map((player, index) => (
                      <div
                        key={player.id}
                        className='flex items-center justify-between p-2 border rounded'
                      >
                        <div className='flex items-center gap-3'>
                          <Badge variant='outline'>{index + 1}</Badge>
                          <div>
                            <div className='font-medium text-sm'>{player.name}</div>
                            <div className='text-xs text-muted-foreground'>
                              {player.position} • {player.team}
                            </div>
                          </div>
                        </div>
                        <div className='text-right'>
                          <div className='font-medium'>
                            {player.projection?.toFixed(1)}
                          </div>
                          <div className='text-xs text-muted-foreground'>
                            ${player.salary?.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Value Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Value Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width='100%' height={300}>
                <BarChart
                  data={players
                    .sort((a, b) => (b.value || 0) - (a.value || 0))
                    .slice(0, 20)}
                >
                  <CartesianGrid strokeDasharray='3 3' />
                  <XAxis
                    dataKey='name'
                    angle={-45}
                    textAnchor='end'
                    height={80}
                    interval={0}
                    fontSize={10}
                  />
                  <YAxis />
                  <Tooltip
                    formatter={value => [value, 'Value']}
                    labelFormatter={label => `Player: ${label}`}
                  />
                  <Bar dataKey='value' fill='#10b981' />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
