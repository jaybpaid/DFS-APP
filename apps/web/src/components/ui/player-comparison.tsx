import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  DollarSign,
  Target,
} from 'lucide-react';
import { PlayerWithProjection } from '@shared/schema';

interface PlayerComparisonProps {
  players: PlayerWithProjection[];
  onPlayerSelect?: (player: PlayerWithProjection) => void;
  maxPlayers?: number;
}

export function PlayerComparison({
  players,
  onPlayerSelect,
  maxPlayers = 4,
}: PlayerComparisonProps) {
  const [selectedPlayers, setSelectedPlayers] = useState<PlayerWithProjection[]>([]);
  const [comparisonView, setComparisonView] = useState<'overview' | 'detailed'>(
    'overview'
  );

  const handlePlayerToggle = (player: PlayerWithProjection) => {
    setSelectedPlayers(prev => {
      const isSelected = prev.some(p => p.id === player.id);
      if (isSelected) {
        return prev.filter(p => p.id !== player.id);
      } else if (prev.length < maxPlayers) {
        return [...prev, player];
      }
      return prev;
    });
  };

  const getComparisonColor = (index: number) => {
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500'];
    return colors[index] || 'bg-gray-500';
  };

  const getValueComparison = (
    player: PlayerWithProjection,
    metric: keyof PlayerWithProjection
  ) => {
    if (selectedPlayers.length < 2) return null;

    const values = selectedPlayers.map(p => p[metric] as number);
    const max = Math.max(...values);
    const min = Math.min(...values);
    const current = player[metric] as number;

    if (current === max) return 'highest';
    if (current === min) return 'lowest';
    return 'middle';
  };

  const renderMetricBar = (value: number, max: number, label: string) => {
    const percentage = (value / max) * 100;
    return (
      <div className='space-y-1'>
        <div className='flex justify-between text-xs'>
          <span>{label}</span>
          <span>{value.toFixed(1)}</span>
        </div>
        <Progress value={percentage} className='h-2' />
      </div>
    );
  };

  if (selectedPlayers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Users className='w-5 h-5' />
            Player Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='text-center py-8 text-muted-foreground'>
            <Users className='w-12 h-12 mx-auto mb-4 opacity-50' />
            <p>
              Select players from the projections table to compare them side by side.
            </p>
            <p className='text-sm mt-2'>
              Maximum {maxPlayers} players can be compared at once.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle className='flex items-center gap-2'>
            <Users className='w-5 h-5' />
            Player Comparison ({selectedPlayers.length}/{maxPlayers})
          </CardTitle>
          <Tabs value={comparisonView} onValueChange={v => setComparisonView(v as any)}>
            <TabsList>
              <TabsTrigger value='overview'>Overview</TabsTrigger>
              <TabsTrigger value='detailed'>Detailed</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={comparisonView} className='w-full'>
          <TabsContent value='overview' className='space-y-4'>
            {/* Player Cards Overview */}
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
              {selectedPlayers.map((player, index) => (
                <Card key={player.id} className='relative'>
                  <CardContent className='p-4'>
                    <div className='flex items-center gap-3 mb-3'>
                      <Avatar className={`${getComparisonColor(index)} text-white`}>
                        <AvatarFallback>
                          {player.name
                            .split(' ')
                            .map((n: string) => n[0])
                            .join('')
                            .slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className='flex-1 min-w-0'>
                        <h4 className='font-medium text-sm truncate'>{player.name}</h4>
                        <p className='text-xs text-muted-foreground'>
                          {player.position} • {player.team}
                        </p>
                      </div>
                    </div>

                    <div className='space-y-2'>
                      <div className='flex justify-between items-center'>
                        <span className='text-xs text-muted-foreground'>
                          Projection
                        </span>
                        <span className='font-medium'>
                          {player.projection?.toFixed(1)}
                        </span>
                      </div>
                      <div className='flex justify-between items-center'>
                        <span className='text-xs text-muted-foreground'>Salary</span>
                        <span className='font-medium'>
                          ${player.salary?.toLocaleString()}
                        </span>
                      </div>
                      <div className='flex justify-between items-center'>
                        <span className='text-xs text-muted-foreground'>Value</span>
                        <span className='font-medium text-primary'>
                          {player.value?.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value='detailed' className='space-y-6'>
            {/* Detailed Comparison Table */}
            <div className='overflow-x-auto'>
              <table className='w-full'>
                <thead>
                  <tr className='border-b'>
                    <th className='text-left py-2 px-4 font-medium'>Metric</th>
                    {selectedPlayers.map((player, index) => (
                      <th
                        key={player.id}
                        className='text-center py-2 px-4 font-medium min-w-32'
                      >
                        <div className='flex items-center justify-center gap-2'>
                          <div
                            className={`w-3 h-3 rounded-full ${getComparisonColor(index)}`}
                          />
                          <span className='text-sm'>{player.name.split(' ')[1]}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className='border-b'>
                    <td className='py-3 px-4 font-medium'>Projection</td>
                    {selectedPlayers.map(player => (
                      <td key={player.id} className='text-center py-3 px-4'>
                        <div className='flex items-center justify-center gap-1'>
                          <span className='font-medium'>
                            {player.projection?.toFixed(1)}
                          </span>
                          {(() => {
                            const comparison = getValueComparison(player, 'projection');
                            if (comparison === 'highest')
                              return <TrendingUp className='w-4 h-4 text-green-500' />;
                            if (comparison === 'lowest')
                              return <TrendingDown className='w-4 h-4 text-red-500' />;
                            return <Minus className='w-4 h-4 text-gray-500' />;
                          })()}
                        </div>
                      </td>
                    ))}
                  </tr>
                  <tr className='border-b'>
                    <td className='py-3 px-4 font-medium'>Salary</td>
                    {selectedPlayers.map(player => (
                      <td key={player.id} className='text-center py-3 px-4'>
                        <div className='flex items-center justify-center gap-1'>
                          <span className='font-medium'>
                            ${player.salary?.toLocaleString()}
                          </span>
                          {(() => {
                            const comparison = getValueComparison(player, 'salary');
                            if (comparison === 'lowest')
                              return <TrendingUp className='w-4 h-4 text-green-500' />;
                            if (comparison === 'highest')
                              return <TrendingDown className='w-4 h-4 text-red-500' />;
                            return <Minus className='w-4 h-4 text-gray-500' />;
                          })()}
                        </div>
                      </td>
                    ))}
                  </tr>
                  <tr className='border-b'>
                    <td className='py-3 px-4 font-medium'>Value</td>
                    {selectedPlayers.map(player => (
                      <td key={player.id} className='text-center py-3 px-4'>
                        <div className='flex items-center justify-center gap-1'>
                          <span className='font-medium text-primary'>
                            {player.value?.toFixed(2)}
                          </span>
                          {(() => {
                            const comparison = getValueComparison(player, 'value');
                            if (comparison === 'highest')
                              return <TrendingUp className='w-4 h-4 text-green-500' />;
                            if (comparison === 'lowest')
                              return <TrendingDown className='w-4 h-4 text-red-500' />;
                            return <Minus className='w-4 h-4 text-gray-500' />;
                          })()}
                        </div>
                      </td>
                    ))}
                  </tr>
                  <tr className='border-b'>
                    <td className='py-3 px-4 font-medium'>Ownership %</td>
                    {selectedPlayers.map(player => (
                      <td key={player.id} className='text-center py-3 px-4'>
                        <span className='font-medium'>
                          {((player.ownership || 0) * 100).toFixed(1)}%
                        </span>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className='py-3 px-4 font-medium'>Floor/Ceiling</td>
                    {selectedPlayers.map(player => (
                      <td key={player.id} className='text-center py-3 px-4'>
                        <div className='text-xs'>
                          <div>
                            {player.floor?.toFixed(1)} / {player.ceiling?.toFixed(1)}
                          </div>
                        </div>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Visual Comparison */}
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
              <Card>
                <CardHeader>
                  <CardTitle className='text-sm flex items-center gap-2'>
                    <Target className='w-4 h-4' />
                    Projection Comparison
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-3'>
                  {selectedPlayers.map((player, index) => {
                    const maxProj = Math.max(
                      ...selectedPlayers.map(p => p.projection || 0)
                    );
                    return (
                      <div key={player.id} className='space-y-2'>
                        <div className='flex items-center gap-2'>
                          <div
                            className={`w-3 h-3 rounded-full ${getComparisonColor(index)}`}
                          />
                          <span className='text-sm font-medium'>
                            {player.name.split(' ')[1]}
                          </span>
                          <span className='text-sm text-muted-foreground ml-auto'>
                            {player.projection?.toFixed(1)}
                          </span>
                        </div>
                        {renderMetricBar(player.projection || 0, maxProj, '')}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className='text-sm flex items-center gap-2'>
                    <DollarSign className='w-4 h-4' />
                    Value Comparison
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-3'>
                  {selectedPlayers.map((player, index) => {
                    const maxValue = Math.max(
                      ...selectedPlayers.map(p => p.value || 0)
                    );
                    return (
                      <div key={player.id} className='space-y-2'>
                        <div className='flex items-center gap-2'>
                          <div
                            className={`w-3 h-3 rounded-full ${getComparisonColor(index)}`}
                          />
                          <span className='text-sm font-medium'>
                            {player.name.split(' ')[1]}
                          </span>
                          <span className='text-sm text-muted-foreground ml-auto'>
                            {player.value?.toFixed(2)}
                          </span>
                        </div>
                        {renderMetricBar(player.value || 0, maxValue, '')}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className='flex gap-2 mt-4'>
          <Button variant='outline' size='sm' onClick={() => setSelectedPlayers([])}>
            Clear All
          </Button>
          {selectedPlayers.length > 0 && onPlayerSelect && (
            <Button
              size='sm'
              onClick={() => selectedPlayers.forEach(player => onPlayerSelect(player))}
            >
              Add to Lineup
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
